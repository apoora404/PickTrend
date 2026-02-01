"""인벤 뉴스/이슈 크롤러"""
import re
from .base_scraper import BaseScraper


class InvenScraper(BaseScraper):
    """인벤 뉴스 크롤러"""

    @property
    def source_name(self) -> str:
        return "inven"

    @property
    def base_url(self) -> str:
        return "https://www.inven.co.kr"

    def scrape(self, page: int = 1) -> list[dict]:
        """뉴스 페이지 크롤링"""
        # 인벤 뉴스 메인 페이지
        url = f"{self.base_url}/webzine/news/"

        soup = self.fetch_page(url)
        if not soup:
            return []

        posts = []

        # 기사 링크 패턴: /webzine/news/?news=숫자
        article_links = soup.find_all("a", href=re.compile(r"/webzine/news/\?news=\d+"))

        seen_urls = set()  # 중복 제거용

        for link in article_links:
            try:
                href = link.get("href", "")

                # 중복 URL 스킵
                if href in seen_urls:
                    continue
                seen_urls.add(href)

                title = link.get_text(strip=True)
                if not title or len(title) < 5:
                    continue

                # 댓글 수 제거 (예: "[기사제목][3]" -> "[기사제목]")
                title = re.sub(r'\[\d+\]$', '', title).strip()
                # 카테고리 태그 정리 (유지하되 불필요 공백 제거)
                title = re.sub(r'\s+', ' ', title)

                # 전체 URL 생성
                if href.startswith("//"):
                    post_url = f"https:{href}"
                elif href.startswith("/"):
                    post_url = f"{self.base_url}{href}"
                elif href.startswith("http"):
                    post_url = href
                else:
                    post_url = f"{self.base_url}/{href}"

                # 인벤 뉴스는 조회수/추천수가 목록에 표시되지 않음
                # 뉴스 기사 날짜는 별도 파싱 필요 (목록에서 추출 어려움)
                # 뉴스 페이지라 보통 당일 기사이므로 오늘 날짜 사용
                from datetime import date
                post_date = f"{date.today().isoformat()}T00:00:00"

                posts.append(self.format_post(
                    title=title,
                    url=post_url,
                    views=0,
                    likes=0,
                    post_date=post_date,
                ))

            except Exception as e:
                print(f"[{self.source_name}] 파싱 오류: {e}")
                continue

        return posts


if __name__ == "__main__":
    scraper = InvenScraper()
    results = scraper.scrape()
    print(f"총 {len(results)}개 게시글 수집")
    for i, post in enumerate(results[:5], 1):
        print(f"{i}. {post['title'][:50]}... (조회: {post['views']}, 추천: {post['likes']})")
