"""에펨코리아 포텐 게시판 크롤러

⚠️ 현재 비활성화: 봇 차단 (430 에러)
   - 모바일/데스크톱 버전 모두 봇 감지로 차단됨
   - Selenium/Playwright 등 브라우저 자동화 필요
"""
import re
from .base_scraper import BaseScraper


class FmkoreaScraper(BaseScraper):
    """에펨코리아 포텐 크롤러"""

    @property
    def source_name(self) -> str:
        return "fmkorea"

    @property
    def base_url(self) -> str:
        return "https://www.fmkorea.com"

    def scrape(self, page: int = 1) -> list[dict]:
        """포텐 게시판 크롤링 - 모바일 버전 우선 시도"""
        posts = []

        # 1차: 모바일 버전 시도 (JS 의존도 낮음)
        mobile_url = f"https://m.fmkorea.com/best?page={page}"
        soup = self.fetch_page(mobile_url)

        if soup:
            posts = self._parse_mobile(soup)

        # 2차: 데스크톱 버전 시도
        if not posts:
            desktop_url = f"{self.base_url}/index.php?mid=best&page={page}"
            soup = self.fetch_page(desktop_url, delay=False)
            if soup:
                posts = self._parse_desktop(soup)

        return posts

    def _parse_mobile(self, soup) -> list[dict]:
        """모바일 버전 파싱"""
        posts = []
        # 모바일 셀렉터
        rows = soup.select("li.li, div.li, ul.bd_lst li")

        for row in rows:
            try:
                # 제목 추출 (여러 셀렉터 시도)
                title_elem = (
                    row.select_one("a.title") or
                    row.select_one("h3.title a") or
                    row.select_one("a[href*='document']")
                )
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                if not title:
                    continue

                href = title_elem.get("href", "")

                # 전체 URL 생성
                if href.startswith("/"):
                    post_url = f"{self.base_url}{href}"
                elif href.startswith("http"):
                    post_url = href
                else:
                    post_url = f"{self.base_url}/{href}"

                # 조회수 추출
                views = 0
                view_elem = row.select_one("span.count, span.view")
                if view_elem:
                    view_text = view_elem.get_text(strip=True)
                    view_match = re.search(r"(\d+)", view_text.replace(",", ""))
                    if view_match:
                        views = int(view_match.group(1))

                # 추천수 추출
                likes = 0
                like_elem = row.select_one("span.vote, span.recom")
                if like_elem:
                    like_text = like_elem.get_text(strip=True)
                    like_match = re.search(r"(\d+)", like_text.replace(",", ""))
                    if like_match:
                        likes = int(like_match.group(1))

                posts.append(self.format_post(
                    title=title,
                    url=post_url,
                    views=views,
                    likes=likes,
                ))

            except Exception as e:
                print(f"[{self.source_name}] 모바일 파싱 오류: {e}")
                continue

        return posts

    def _parse_desktop(self, soup) -> list[dict]:
        """데스크톱 버전 파싱"""
        posts = []
        rows = soup.select("li.li")

        for row in rows:
            try:
                title_elem = row.select_one("h3.title a")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                href = title_elem.get("href", "")

                if href.startswith("/"):
                    post_url = f"{self.base_url}{href}"
                elif href.startswith("http"):
                    post_url = href
                else:
                    post_url = f"{self.base_url}/{href}"

                views = 0
                view_elem = row.select_one("span.count")
                if view_elem:
                    view_text = view_elem.get_text(strip=True)
                    view_match = re.search(r"(\d+)", view_text.replace(",", ""))
                    if view_match:
                        views = int(view_match.group(1))

                likes = 0
                like_elem = row.select_one("span.vote")
                if like_elem:
                    like_text = like_elem.get_text(strip=True)
                    like_match = re.search(r"(\d+)", like_text.replace(",", ""))
                    if like_match:
                        likes = int(like_match.group(1))

                posts.append(self.format_post(
                    title=title,
                    url=post_url,
                    views=views,
                    likes=likes,
                ))

            except Exception as e:
                print(f"[{self.source_name}] 데스크톱 파싱 오류: {e}")
                continue

        return posts


if __name__ == "__main__":
    scraper = FmkoreaScraper()
    results = scraper.scrape()
    print(f"총 {len(results)}개 게시글 수집")
    for i, post in enumerate(results[:5], 1):
        print(f"{i}. {post['title'][:50]}... (조회: {post['views']}, 추천: {post['likes']})")
