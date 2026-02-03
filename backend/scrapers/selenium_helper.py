"""Selenium 브라우저 자동화 헬퍼

봇 감지를 우회하기 위한 Selenium WebDriver 유틸리티.
Chrome headless 모드로 JS 렌더링이 필요한 사이트 크롤링 지원.
"""
import time
from typing import Optional


class SeleniumHelper:
    """Selenium WebDriver 헬퍼 클래스"""

    def __init__(self, headless: bool = True, timeout: int = 15):
        """
        Args:
            headless: 헤드리스 모드 여부 (기본: True)
            timeout: 페이지 로드 타임아웃 (초)
        """
        try:
            from selenium import webdriver
            from selenium.webdriver.chrome.options import Options
            from selenium.webdriver.chrome.service import Service
            from webdriver_manager.chrome import ChromeDriverManager
        except ImportError:
            raise ImportError(
                "selenium 패키지가 필요합니다:\n"
                "  pip install selenium webdriver-manager"
            )

        options = Options()

        if headless:
            options.add_argument("--headless=new")

        # 봇 감지 우회 옵션
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-gpu")
        options.add_argument("--disable-infobars")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--start-maximized")
        options.add_argument("--lang=ko-KR")

        # User-Agent 설정
        options.add_argument(
            "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/121.0.0.0 Safari/537.36"
        )

        # WebDriver 자동 감지 비활성화
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)

        # ChromeDriver 자동 설치 및 초기화
        service = Service(ChromeDriverManager().install())
        self.driver = webdriver.Chrome(service=service, options=options)
        self.driver.set_page_load_timeout(timeout)

        # navigator.webdriver 숨기기 (CDP 명령)
        self.driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument",
            {
                "source": """
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                });
                """
            }
        )

    def get_page(self, url: str, wait_time: float = 2.0) -> str:
        """
        페이지 로드 후 HTML 반환

        Args:
            url: 요청 URL
            wait_time: 페이지 로드 후 대기 시간 (초)

        Returns:
            페이지 HTML 소스
        """
        self.driver.get(url)
        time.sleep(wait_time)  # JS 렌더링 대기
        return self.driver.page_source

    def scroll_to_bottom(self, pause_time: float = 1.0):
        """
        페이지 끝까지 스크롤 (lazy loading 콘텐츠 로드)

        Args:
            pause_time: 스크롤 후 대기 시간 (초)
        """
        last_height = self.driver.execute_script("return document.body.scrollHeight")

        while True:
            self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(pause_time)
            new_height = self.driver.execute_script("return document.body.scrollHeight")

            if new_height == last_height:
                break
            last_height = new_height

    def wait_for_element(self, selector: str, timeout: int = 10) -> Optional[object]:
        """
        특정 요소가 나타날 때까지 대기

        Args:
            selector: CSS 선택자
            timeout: 대기 타임아웃 (초)

        Returns:
            WebElement 또는 None
        """
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC

        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            return element
        except Exception:
            return None

    def close(self):
        """WebDriver 종료"""
        if self.driver:
            self.driver.quit()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()
