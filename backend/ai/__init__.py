"""AI 분류 모듈"""
from .base_classifier import BaseClassifier, ClassificationResult, CATEGORIES
from .rule_classifier import RuleBasedClassifier, classify_posts
from .exporter import export_uncertain_posts, parse_classified_file
from .keywords import KEYWORDS

# LLM 분류기는 anthropic 패키지가 있을 때만 import
try:
    from .llm_classifier import LLMClassifier, classify_posts_llm
    _HAS_LLM = True
except ImportError:
    _HAS_LLM = False
    LLMClassifier = None
    classify_posts_llm = None

__all__ = [
    "BaseClassifier",
    "ClassificationResult",
    "CATEGORIES",
    "RuleBasedClassifier",
    "classify_posts",
    "export_uncertain_posts",
    "parse_classified_file",
    "KEYWORDS",
    "LLMClassifier",
    "classify_posts_llm",
]
