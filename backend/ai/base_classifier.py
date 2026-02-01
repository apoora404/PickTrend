"""분류기 추상 클래스"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class ClassificationResult:
    """분류 결과"""
    category: str
    confidence: float  # 0.0 ~ 1.0
    matched_keywords: list[str]


CATEGORIES = ["politics", "sports", "celebrity", "stock", "general"]


class BaseClassifier(ABC):
    """분류기 기본 클래스 (확장 가능)"""

    @abstractmethod
    def classify(self, title: str, content: str | None = None) -> ClassificationResult:
        """
        게시글을 카테고리로 분류

        Args:
            title: 게시글 제목
            content: 게시글 본문 (선택)

        Returns:
            ClassificationResult: (category, confidence, matched_keywords)
        """
        pass

    @abstractmethod
    def summarize(self, title: str, content: str | None = None) -> str:
        """
        게시글 3줄 요약 생성

        Args:
            title: 게시글 제목
            content: 게시글 본문 (선택)

        Returns:
            str: 요약 텍스트
        """
        pass

    def classify_batch(self, posts: list[dict]) -> list[dict]:
        """
        여러 게시글 일괄 분류

        Args:
            posts: [{"title": str, "content": str|None, ...}, ...]

        Returns:
            posts with added "category", "confidence", "matched_keywords"
        """
        results = []
        for post in posts:
            result = self.classify(post.get("title", ""), post.get("content"))
            post_copy = post.copy()
            post_copy["category"] = result.category
            post_copy["confidence"] = result.confidence
            post_copy["matched_keywords"] = result.matched_keywords
            results.append(post_copy)
        return results
