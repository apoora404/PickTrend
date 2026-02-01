"""크롤러 모듈"""
from .base_scraper import BaseScraper
from .fmkorea import FmkoreaScraper
from .dcinside import DcinsideScraper
from .theqoo import TheqooScraper
from .ruliweb import RuliwebScraper
from .ppomppu import PpomppuScraper
from .inven import InvenScraper

__all__ = [
    "BaseScraper",
    "FmkoreaScraper",
    "DcinsideScraper",
    "TheqooScraper",
    "RuliwebScraper",
    "PpomppuScraper",
    "InvenScraper",
]
