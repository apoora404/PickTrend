"""규칙 기반 키워드 매칭 분류기"""
from .base_classifier import BaseClassifier, ClassificationResult
from .keywords import KEYWORDS, CATEGORY_PRIORITY


class RuleBasedClassifier(BaseClassifier):
    """
    키워드 매칭 기반 분류기 (무료)

    - 키워드 매칭으로 카테고리 결정
    - 신뢰도 = 매칭된 키워드 수 기반
    - 동점 시 CATEGORY_PRIORITY 순서로 선택
    - 매칭 없으면 "issue"로 분류
    """

    def __init__(self, confidence_threshold: float = 0.1):
        """
        Args:
            confidence_threshold: 이 값 미만이면 "uncertain"으로 분류
        """
        self.keywords = KEYWORDS
        self.confidence_threshold = confidence_threshold

    def classify(self, title: str, content: str | None = None) -> ClassificationResult:
        """키워드 매칭으로 분류"""
        text = title.lower()
        if content:
            text += " " + content.lower()

        scores = {}
        matched = {}

        for category, keywords in self.keywords.items():
            category_matched = []
            for keyword in keywords:
                if keyword.lower() in text:
                    category_matched.append(keyword)

            scores[category] = len(category_matched)
            matched[category] = category_matched

        # 가장 많이 매칭된 카테고리 선택
        max_score = max(scores.values()) if scores else 0

        if max_score == 0:
            # 어떤 카테고리에도 매칭 안 되면 issue로 분류
            return ClassificationResult(
                category="issue",
                confidence=0.3,  # 낮은 신뢰도
                matched_keywords=[]
            )

        # 동점인 카테고리들 중 우선순위가 높은 것 선택
        tied_categories = [c for c, s in scores.items() if s == max_score]

        best_category = tied_categories[0]  # 기본값
        for priority_cat in CATEGORY_PRIORITY:
            if priority_cat in tied_categories:
                best_category = priority_cat
                break

        # 신뢰도 계산 (매칭 키워드 수 기반, 최대 1.0)
        # 3개 이상 매칭되면 높은 신뢰도
        confidence = min(1.0, max_score / 3)

        # 신뢰도가 낮으면 issue로 분류
        if confidence < self.confidence_threshold:
            return ClassificationResult(
                category="issue",
                confidence=confidence,
                matched_keywords=matched[best_category]
            )

        return ClassificationResult(
            category=best_category,
            confidence=confidence,
            matched_keywords=matched[best_category]
        )

    def summarize(self, title: str, content: str | None = None) -> str:
        """
        규칙 기반에서는 요약 불가 - 제목 반환

        실제 요약은 LLM 기반 분류기에서 구현
        """
        return title


def classify_posts(posts: list[dict], confidence_threshold: float = 0.1) -> tuple[list[dict], list[dict]]:
    """
    게시글 분류 실행

    Args:
        posts: 크롤링된 게시글 리스트
        confidence_threshold: 신뢰도 임계값

    Returns:
        (classified_posts, uncertain_posts)
        - classified_posts: 분류 완료된 게시글
        - uncertain_posts: 신뢰도 낮은 게시글 (수동 분류 필요)
    """
    classifier = RuleBasedClassifier(confidence_threshold)
    classified = classifier.classify_batch(posts)

    certain = []
    uncertain = []

    for post in classified:
        if post["confidence"] >= confidence_threshold:
            certain.append(post)
        else:
            uncertain.append(post)

    return certain, uncertain
