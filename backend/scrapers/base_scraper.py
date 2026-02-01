"""기본 스크래퍼 클래스"""
import time
import random
from abc import ABC, abstractmethod
from typing import Optional
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup


class BaseScraper(ABC):
    """모든 스크래퍼의 기본 클래스"""

    def __init__(self, encoding: str = "utf-8"):
        self.encoding = encoding
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Cache-Control": "max-age=0",
        })

    @property
    @abstractmethod
    def source_name(self) -> str:
        """크롤링 소스 이름"""
        pass

    @property
    @abstractmethod
    def base_url(self) -> str:
        """기본 URL"""
        pass

    def fetch_page(self, url: str, delay: bool = True, encoding: str = None, referer: str = None) -> Optional[BeautifulSoup]:
        """페이지 HTML 가져오기

        Args:
            url: 요청 URL
            delay: 요청 간 딜레이 적용 여부
            encoding: 문자 인코딩 (기본값: self.encoding)
            referer: Referer 헤더 (None이면 설정하지 않음)
        """
        try:
            # 요청 간 랜덤 딜레이 (봇 감지 우회)
            if delay:
                time.sleep(random.uniform(0.5, 1.5))

            # 요청 헤더
            headers = {}
            if referer:
                headers["Referer"] = referer

            response = self.session.get(url, timeout=15, headers=headers if headers else None)
            response.raise_for_status()

            # 인코딩 설정
            use_encoding = encoding or self.encoding
            if use_encoding.lower() != "utf-8":
                response.encoding = use_encoding

            return BeautifulSoup(response.text, "lxml")
        except requests.RequestException as e:
            print(f"[{self.source_name}] 페이지 로드 실패: {e}")
            return None

    @abstractmethod
    def scrape(self) -> list[dict]:
        """게시글 목록 크롤링"""
        pass

    def format_post(
        self,
        title: str,
        url: str,
        views: int = 0,
        likes: int = 0,
        content: str = None,
        post_date: str = None,
    ) -> dict:
        """게시글 데이터 포맷

        Args:
            title: 게시글 제목
            url: 게시글 URL
            views: 조회수
            likes: 추천수
            content: 본문 내용 (선택)
            post_date: 원본 게시글 작성일 (ISO 8601 형식, 선택)
        """
        return {
            "source": self.source_name,
            "title": title.strip() if title else "",
            "url": url,
            "views": views,
            "likes": likes,
            "content": content,
            "post_date": post_date,
        }

    def _parse_date(self, date_str: str) -> str | None:
        """날짜 문자열을 ISO 8601 형식으로 변환

        지원 형식:
        - "2026-02-01 12:34:56" → 그대로
        - "2026.02.01" → "2026-02-01"
        - "02.01" 또는 "02-01" → 올해 날짜로 변환
        - "12:34" → 오늘 날짜 + 시간

        Args:
            date_str: 원본 날짜 문자열

        Returns:
            ISO 8601 형식 문자열 또는 None
        """
        from datetime import datetime, date
        import re

        if not date_str:
            return None

        date_str = date_str.strip()

        try:
            # 형식 1: 전체 날짜시간 "2026-02-01 12:34:56"
            if re.match(r'\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}', date_str):
                dt = datetime.strptime(date_str[:16], '%Y-%m-%d %H:%M')
                return dt.isoformat()

            # 형식 2: 전체 날짜시간 (점 구분) "2026.02.01 12:34:56"
            if re.match(r'\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}', date_str):
                dt = datetime.strptime(date_str[:16], '%Y.%m.%d %H:%M')
                return dt.isoformat()

            # 형식 3: 날짜만 "2026-02-01" 또는 "2026.02.01"
            if re.match(r'\d{4}[-./]\d{2}[-./]\d{2}$', date_str):
                date_str = date_str.replace('.', '-').replace('/', '-')
                return f"{date_str}T00:00:00"

            # 형식 4: 월.일만 "02.01" 또는 "02-01" 또는 "02/01"
            month_day_match = re.match(r'(\d{2})[-./](\d{2})$', date_str)
            if month_day_match:
                month, day = month_day_match.groups()
                year = date.today().year
                return f"{year}-{month}-{day}T00:00:00"

            # 형식 5: 시간만 "12:34" → 오늘 날짜
            if re.match(r'\d{2}:\d{2}(:\d{2})?$', date_str):
                today = date.today()
                return f"{today.isoformat()}T{date_str[:5]}:00"

            return None

        except Exception:
            return None
