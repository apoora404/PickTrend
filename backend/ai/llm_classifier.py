"""Claude Haiku 기반 LLM 분류기"""
import json
import os
from typing import Optional

from .base_classifier import BaseClassifier, ClassificationResult, CATEGORIES


class LLMClassifier(BaseClassifier):
    """Claude Haiku를 사용한 게시글 분류기"""

    def __init__(self, model: str = "claude-3-haiku-20240307"):
        """
        Args:
            model: Claude 모델 ID (기본: Haiku)
        """
        try:
            import anthropic
            self.client = anthropic.Anthropic(
                api_key=os.getenv("ANTHROPIC_API_KEY")
            )
        except ImportError:
            raise ImportError("anthropic 패키지가 필요합니다: pip install anthropic>=0.18.0")

        if not os.getenv("ANTHROPIC_API_KEY"):
            raise ValueError("ANTHROPIC_API_KEY 환경변수가 필요합니다")

        self.model = model
        self._categories_str = ", ".join(CATEGORIES)

    def classify(self, title: str, content: Optional[str] = None) -> ClassificationResult:
        """
        게시글을 Claude Haiku로 분류

        Args:
            title: 게시글 제목
            content: 게시글 본문 (선택, 최대 500자)

        Returns:
            ClassificationResult
        """
        # 프롬프트 구성
        content_part = ""
        if content:
            content_part = f"\n본문: {content[:500]}"

        prompt = f"""한국어 커뮤니티 게시글을 분류해줘.

카테고리 설명:
- politics: 정치, 대통령, 국회, 선거, 정당
- sports: 스포츠, 축구, 야구, 농구, 선수, 리그
- celebrity: 연예인, 아이돌, 배우, 가수, 드라마
- stock: 주식, 코인, 경제, 기업, 투자
- game: 게임, e스포츠, 만화, 애니메이션
- issue: 위 카테고리에 해당하지 않는 일반 이슈

제목: {title}{content_part}

JSON 형식으로만 답변 (다른 텍스트 없이):
{{"category": "카테고리명", "confidence": 0.0-1.0, "reason": "분류 이유 한 줄"}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}]
            )

            # JSON 파싱
            response_text = response.content[0].text.strip()

            # JSON 블록만 추출 (혹시 다른 텍스트가 있을 경우)
            if "{" in response_text and "}" in response_text:
                json_start = response_text.index("{")
                json_end = response_text.rindex("}") + 1
                response_text = response_text[json_start:json_end]

            result = json.loads(response_text)

            category = result.get("category", "issue")
            if category not in CATEGORIES:
                category = "issue"

            confidence = float(result.get("confidence", 0.5))
            confidence = max(0.0, min(1.0, confidence))

            reason = result.get("reason", "")

            return ClassificationResult(
                category=category,
                confidence=confidence,
                matched_keywords=[reason] if reason else []
            )

        except json.JSONDecodeError as e:
            print(f"[LLM] JSON 파싱 실패: {e}")
            return ClassificationResult(
                category="issue",
                confidence=0.3,
                matched_keywords=["JSON 파싱 실패"]
            )
        except Exception as e:
            print(f"[LLM] API 호출 실패: {e}")
            return ClassificationResult(
                category="issue",
                confidence=0.1,
                matched_keywords=[str(e)]
            )

    def summarize(self, title: str, content: Optional[str] = None) -> str:
        """
        게시글 3줄 요약 생성

        Args:
            title: 게시글 제목
            content: 게시글 본문 (선택)

        Returns:
            요약 텍스트
        """
        content_part = ""
        if content:
            content_part = f"\n본문: {content[:1000]}"

        prompt = f"""다음 게시글을 MZ세대 말투로 3줄 요약해줘.
- 이모지 1-2개 사용
- 핵심만 간결하게
- 재미있고 가볍게

제목: {title}{content_part}

요약:"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=200,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text.strip()

        except Exception as e:
            print(f"[LLM] 요약 실패: {e}")
            return title

    def classify_batch(self, posts: list[dict]) -> list[dict]:
        """
        여러 게시글 일괄 분류 (진행 상황 출력)

        Args:
            posts: [{"title": str, "content": str|None, ...}, ...]

        Returns:
            분류된 게시글 리스트
        """
        results = []
        total = len(posts)

        for i, post in enumerate(posts, 1):
            if i % 10 == 0 or i == total:
                print(f"  [LLM] 분류 진행: {i}/{total}")

            result = self.classify(post.get("title", ""), post.get("content"))
            post_copy = post.copy()
            post_copy["category"] = result.category
            post_copy["confidence"] = result.confidence
            post_copy["matched_keywords"] = result.matched_keywords
            results.append(post_copy)

        return results


def classify_posts_llm(posts: list[dict], model: str = "claude-3-haiku-20240307") -> list[dict]:
    """
    LLM으로 게시글 분류 (편의 함수)

    Args:
        posts: 게시글 리스트
        model: Claude 모델 ID

    Returns:
        분류된 게시글 리스트
    """
    classifier = LLMClassifier(model=model)
    return classifier.classify_batch(posts)
