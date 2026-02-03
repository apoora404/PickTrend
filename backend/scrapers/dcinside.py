"""디시인사이드 개념글 크롤러"""
import re
from datetime import datetime
from .base_scraper import BaseScraper


class DcinsideScraper(BaseScraper):
    """디시인사이드 개념글 크롤러"""

    def __init__(self):
        super().__init__()
        # 디시인사이드 봇 감지 우회를 위한 추가 헤더
        self.session.headers.update({
            "Referer": "https://gall.dcinside.com/",
            "Origin": "https://gall.dcinside.com",
            "DNT": "1",
            "Pragma": "no-cache",
            "Sec-Ch-Ua": '"Not A(Brand";v="8", "Chromium";v="121", "Google Chrome";v="121"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
        })

    @property
    def source_name(self) -> str:
        return "dcinside"

    @property
    def base_url(self) -> str:
        return "https://gall.dcinside.com"

    def scrape(self, page: int = 1) -> list[dict]:
        """실시간 인기글 크롤링 (DC Best)"""
        # hit 갤러리는 명예의 전당(과거 인기글)이므로 dcbest 사용
        url = f"{self.base_url}/board/lists?id=dcbest&page={page}"

        # Referer 설정
        soup = self.fetch_page(url, referer="https://gall.dcinside.com/board/lists?id=dcbest")
        if not soup:
            return []

        posts = []
        # 게시글 목록 선택자
        rows = soup.select("tr.ub-content")

        for row in rows:
            try:
                # 공지사항 제외 (class에 notice 포함)
                row_classes = row.get("class", [])
                if any("notice" in c.lower() for c in row_classes):
                    continue

                # data-type에 notice 포함 시 제외 (icon_notice 등)
                data_type = row.get("data-type", "")
                if "notice" in data_type.lower():
                    continue

                # 글번호가 숫자가 아닌 경우 제외 (설정, 공지 등)
                num_elem = row.select_one("td.gall_num")
                if num_elem:
                    num_text = num_elem.get_text(strip=True)
                    if not num_text.isdigit():
                        continue

                # 제목 추출
                title_elem = row.select_one("td.gall_tit a:not(.reply_numbox)")
                if not title_elem:
                    continue

                title = title_elem.get_text(strip=True)
                href = title_elem.get("href", "")

                # 유효하지 않은 URL 제외 (javascript:;, # 등)
                if not href or href.startswith("javascript:") or href == "#":
                    continue

                # 전체 URL 생성
                if href.startswith("/"):
                    post_url = f"https://gall.dcinside.com{href}"
                elif href.startswith("http"):
                    post_url = href
                else:
                    post_url = f"{self.base_url}/{href}"

                # 조회수 추출
                views = 0
                view_elem = row.select_one("td.gall_count")
                if view_elem:
                    view_text = view_elem.get_text(strip=True)
                    if view_text.isdigit():
                        views = int(view_text)

                # 추천수 추출
                likes = 0
                like_elem = row.select_one("td.gall_recommend")
                if like_elem:
                    like_text = like_elem.get_text(strip=True)
                    if like_text.isdigit():
                        likes = int(like_text)

                # 작성일 추출
                post_date = None
                date_elem = row.select_one("td.gall_date")
                if date_elem:
                    # title 속성에 전체 날짜시간이 있음: "2026-02-01 12:34:56"
                    # 없으면 텍스트에서 시간만: "12:34" 또는 "26/02/02" (YY/MM/DD)
                    date_str = date_elem.get("title") or date_elem.get_text(strip=True)
                    post_date = self._parse_date(date_str)

                # 날짜가 None이면 오늘 날짜로 설정 (최신 글로 간주)
                if post_date is None:
                    post_date = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')

                # 썸네일 추출 (제목 옆 이미지 아이콘 또는 목록 이미지)
                thumbnail_url = self.extract_thumbnail(row, [
                    "td.gall_tit img",
                    "img.icon_pic",
                    "img[src*='thumb']",
                ])

                posts.append(self.format_post(
                    title=title,
                    url=post_url,
                    views=views,
                    likes=likes,
                    post_date=post_date,
                    thumbnail_url=thumbnail_url,
                ))

            except Exception as e:
                print(f"[{self.source_name}] 파싱 오류: {e}")
                continue

        return posts


if __name__ == "__main__":
    scraper = DcinsideScraper()
    results = scraper.scrape()
    print(f"총 {len(results)}개 게시글 수집")
    for i, post in enumerate(results[:5], 1):
        print(f"{i}. {post['title'][:50]}... (조회: {post['views']}, 추천: {post['likes']})")
