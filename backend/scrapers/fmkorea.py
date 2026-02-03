"""에펨코리아 포텐 게시판 크롤러

Selenium을 사용하여 봇 차단(430 에러)을 우회합니다.
"""
import re
from typing import Optional
from bs4 import BeautifulSoup
from .base_scraper import BaseScraper


class FmkoreaScraper(BaseScraper):
    """에펨코리아 포텐 크롤러 (Selenium 기반)"""

    def __init__(self, use_selenium: bool = True, encoding: str = "utf-8"):
        """
        Args:
            use_selenium: Selenium 사용 여부 (기본: True)
            encoding: 문자 인코딩
        """
        super().__init__(encoding)
        self.use_selenium = use_selenium
        self._selenium_helper = None

    @property
    def source_name(self) -> str:
        return "fmkorea"

    @property
    def base_url(self) -> str:
        return "https://www.fmkorea.com"

    def _get_selenium_helper(self):
        """Selenium 헬퍼 싱글톤"""
        if self._selenium_helper is None:
            try:
                from .selenium_helper import SeleniumHelper
                self._selenium_helper = SeleniumHelper(headless=True)
            except ImportError as e:
                print(f"[{self.source_name}] Selenium 로드 실패: {e}")
                raise
        return self._selenium_helper

    def _fetch_with_selenium(self, url: str) -> Optional[BeautifulSoup]:
        """Selenium으로 페이지 로드"""
        try:
            helper = self._get_selenium_helper()
            html = helper.get_page(url, wait_time=3.0)
            return BeautifulSoup(html, "lxml")
        except Exception as e:
            print(f"[{self.source_name}] Selenium 페이지 로드 실패: {e}")
            return None

    def scrape(self, page: int = 1) -> list[dict]:
        """포텐 게시판 크롤링

        Selenium으로 봇 차단 우회 후 파싱.
        """
        posts = []

        # 베스트 게시판 URL
        url = f"{self.base_url}/index.php?mid=best&page={page}"

        if self.use_selenium:
            soup = self._fetch_with_selenium(url)
        else:
            # requests fallback (봇 차단 가능성 있음)
            soup = self.fetch_page(url)

        if not soup:
            return posts

        # 게시글 목록 파싱
        posts = self._parse_list(soup)

        return posts

    def _parse_list(self, soup: BeautifulSoup) -> list[dict]:
        """게시글 목록 파싱"""
        posts = []

        # 메인 게시글 리스트 선택자들
        selectors = [
            "li.li",                    # 기본 리스트
            "tr.li",                    # 테이블 형식
            "div.fm_best_widget li",    # 위젯
            "ul.bd_lst li",             # 다른 형식
        ]

        rows = []
        for selector in selectors:
            rows = soup.select(selector)
            if rows:
                break

        if not rows:
            print(f"[{self.source_name}] 게시글 목록을 찾을 수 없음")
            return posts

        for row in rows:
            try:
                post = self._parse_row(row)
                if post:
                    posts.append(post)
            except Exception as e:
                print(f"[{self.source_name}] 파싱 오류: {e}")
                continue

        return posts

    def _parse_row(self, row) -> Optional[dict]:
        """개별 게시글 행 파싱"""
        # 제목 추출
        title_elem = (
            row.select_one("h3.title a") or
            row.select_one("a.title") or
            row.select_one("td.title a") or
            row.select_one("a[href*='/document_srl']") or
            row.select_one("a[href*='/index.php']")
        )

        if not title_elem:
            return None

        title = title_elem.get_text(strip=True)
        if not title:
            return None

        # 공지사항 필터링
        if row.select_one(".notice") or "공지" in title:
            return None

        # URL 추출
        href = title_elem.get("href", "")
        if href.startswith("/"):
            post_url = f"{self.base_url}{href}"
        elif href.startswith("http"):
            post_url = href
        else:
            post_url = f"{self.base_url}/{href}"

        # 조회수 추출
        views = 0
        view_selectors = ["span.count", "span.m_no", ".count", "td.m_no"]
        for sel in view_selectors:
            view_elem = row.select_one(sel)
            if view_elem:
                view_text = view_elem.get_text(strip=True).replace(",", "")
                match = re.search(r"(\d+)", view_text)
                if match:
                    views = int(match.group(1))
                    break

        # 추천수 추출
        likes = 0
        like_selectors = ["span.vote", "span.voted_count", ".vote", ".vr"]
        for sel in like_selectors:
            like_elem = row.select_one(sel)
            if like_elem:
                like_text = like_elem.get_text(strip=True).replace(",", "")
                match = re.search(r"(\d+)", like_text)
                if match:
                    likes = int(match.group(1))
                    break

        # 날짜 추출
        post_date = None
        date_selectors = ["span.date", "td.time", ".regdate", ".time"]
        for sel in date_selectors:
            date_elem = row.select_one(sel)
            if date_elem:
                date_text = date_elem.get_text(strip=True)
                post_date = self._parse_date(date_text)
                if post_date:
                    break

        # 썸네일 추출
        thumbnail = self.extract_thumbnail(row, [
            "img.thumb",
            "img.it",
            ".thum img",
            ".thumb img",
        ])

        return self.format_post(
            title=title,
            url=post_url,
            views=views,
            likes=likes,
            post_date=post_date,
            thumbnail_url=thumbnail,
        )

    def close(self):
        """리소스 정리"""
        if self._selenium_helper:
            self._selenium_helper.close()
            self._selenium_helper = None

    def __del__(self):
        self.close()


if __name__ == "__main__":
    print("에펨코리아 크롤러 테스트 (Selenium)")
    print("-" * 50)

    scraper = FmkoreaScraper(use_selenium=True)
    try:
        results = scraper.scrape(page=1)
        print(f"\n총 {len(results)}개 게시글 수집")

        for i, post in enumerate(results[:10], 1):
            title = post['title'][:40] + "..." if len(post['title']) > 40 else post['title']
            print(f"{i:2}. {title}")
            print(f"    조회: {post['views']}, 추천: {post['likes']}")
            if post.get('thumbnail_url'):
                print(f"    썸네일: {post['thumbnail_url'][:50]}...")
    finally:
        scraper.close()
