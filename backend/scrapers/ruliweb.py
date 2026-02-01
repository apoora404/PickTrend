"""루리웹 베스트 게시판 크롤러"""
import re
from .base_scraper import BaseScraper


class RuliwebScraper(BaseScraper):
    """루리웹 베스트 크롤러"""

    @property
    def source_name(self) -> str:
        return "ruliweb"

    @property
    def base_url(self) -> str:
        return "https://bbs.ruliweb.com"

    def scrape(self, page: int = 1) -> list[dict]:
        """베스트 게시판 크롤링"""
        url = f"{self.base_url}/best/selection?page={page}"

        soup = self.fetch_page(url)
        if not soup:
            return []

        posts = []
        # 게시글 목록 선택자 - 테이블 구조
        rows = soup.select("tr.table_body")

        for row in rows:
            try:
                # 제목 추출 (subject_link 클래스)
                title_elem = row.select_one("a.subject_link") or row.select_one("td.subject a")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                # 댓글 수 제거 (예: "제목(59)" -> "제목")
                title = re.sub(r'\s*\(\d+\)\s*$', '', title).strip()

                href = title_elem.get("href", "")

                # 전체 URL 생성
                if href.startswith("//"):
                    post_url = f"https:{href}"
                elif href.startswith("/"):
                    post_url = f"https://bbs.ruliweb.com{href}"
                elif href.startswith("http"):
                    post_url = href
                else:
                    post_url = f"{self.base_url}/{href}"

                # 조회수 추출 (td.hit)
                views = 0
                view_elem = row.select_one("td.hit")
                if view_elem:
                    view_text = view_elem.get_text(strip=True)
                    view_match = re.search(r"(\d+)", view_text.replace(",", ""))
                    if view_match:
                        views = int(view_match.group(1))

                # 추천수 추출 (td.recomd)
                likes = 0
                like_elem = row.select_one("td.recomd")
                if like_elem:
                    like_text = like_elem.get_text(strip=True)
                    like_match = re.search(r"(\d+)", like_text.replace(",", ""))
                    if like_match:
                        likes = int(like_match.group(1))

                # 작성일 추출 (td.time)
                post_date = None
                date_elem = row.select_one("td.time")
                if date_elem:
                    date_str = date_elem.get_text(strip=True)
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
    scraper = RuliwebScraper()
    results = scraper.scrape()
    print(f"총 {len(results)}개 게시글 수집")
    for i, post in enumerate(results[:5], 1):
        print(f"{i}. {post['title'][:50]}... (조회: {post['views']}, 추천: {post['likes']})")
