"""뽐뿌 핫딜 게시판 크롤러"""
import re
from .base_scraper import BaseScraper


class PpomppuScraper(BaseScraper):
    """뽐뿌 핫딜 크롤러"""

    def __init__(self):
        # 뽐뿌는 EUC-KR 인코딩 사용
        super().__init__(encoding="euc-kr")

    @property
    def source_name(self) -> str:
        return "ppomppu"

    @property
    def base_url(self) -> str:
        return "https://www.ppomppu.co.kr"

    def scrape(self, page: int = 1) -> list[dict]:
        """핫딜 게시판 크롤링"""
        url = f"{self.base_url}/zboard/zboard.php?id=ppomppu&page={page}"

        soup = self.fetch_page(url)
        if not soup:
            return []

        posts = []
        # 메인 테이블에서 게시글 행 선택 (baseList 클래스)
        main_table = soup.select_one("#revolution_main_table")
        if not main_table:
            return []

        rows = main_table.select("tr.baseList")

        for row in rows:
            try:
                # 제목 링크 (두번째 a[href*='view.php']가 제목)
                title_links = row.select("a[href*='view.php']")
                if len(title_links) < 2:
                    continue

                title_elem = title_links[1]  # 두번째가 제목 링크
                title = title_elem.get_text(strip=True)

                # 빈 제목 스킵
                if not title or len(title) < 2:
                    continue

                href = title_elem.get("href", "")

                # 전체 URL 생성
                if href.startswith("/"):
                    post_url = f"{self.base_url}{href}"
                elif href.startswith("http"):
                    post_url = href
                else:
                    post_url = f"{self.base_url}/zboard/{href}"

                # td 구조: 0=번호, 1=제목, 2=작성자, 3=날짜, 4=추천, 5=조회수
                tds = row.select("td")

                # 조회수 추출 (6번째 td, 인덱스 5)
                views = 0
                if len(tds) >= 6:
                    view_text = tds[5].get_text(strip=True)
                    view_match = re.search(r"(\d+)", view_text.replace(",", ""))
                    if view_match:
                        views = int(view_match.group(1))

                # 추천수 추출 (5번째 td, 인덱스 4) - "추천 - 비추천" 형태
                likes = 0
                if len(tds) >= 5:
                    like_text = tds[4].get_text(strip=True)
                    like_match = re.search(r"^(\d+)", like_text.replace(",", ""))
                    if like_match:
                        likes = int(like_match.group(1))

                # 작성일 추출 (4번째 td, 인덱스 3)
                post_date = None
                if len(tds) >= 4:
                    date_str = tds[3].get_text(strip=True)
                    post_date = self._parse_date(date_str)

                posts.append(self.format_post(
                    title=title,
                    url=post_url,
                    views=views,
                    likes=likes,
                    post_date=post_date,
                ))

            except Exception as e:
                print(f"[{self.source_name}] 파싱 오류: {e}")
                continue

        return posts


if __name__ == "__main__":
    scraper = PpomppuScraper()
    results = scraper.scrape()
    print(f"총 {len(results)}개 게시글 수집")
    for i, post in enumerate(results[:5], 1):
        print(f"{i}. {post['title'][:50]}... (조회: {post['views']}, 추천: {post['likes']})")
