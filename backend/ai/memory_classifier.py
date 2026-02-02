"""
Memory MCP 연동 분류기

Claude Code의 Memory MCP를 활용하여 키워드-카테고리 관계를 학습합니다.
이 모듈은 Claude Code 세션에서 Memory MCP와 상호작용할 때 사용되는
데이터 구조와 유틸리티를 제공합니다.

Memory MCP 지식 그래프 구조:
- Entity: 키워드, 카테고리, 게시글
- Relation: 키워드 → 카테고리 매핑
- Observation: 분류 결과, 신뢰도, 컨텍스트

사용법:
    Claude Code에서 Memory MCP 도구를 직접 호출하여 학습/조회합니다.
    이 모듈은 데이터 구조 정의와 변환 유틸리티를 제공합니다.
"""
from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class KeywordEntity:
    """키워드 엔티티 (Memory MCP용)"""
    name: str
    entity_type: str = "keyword"
    observations: list[str] = None

    def __post_init__(self):
        if self.observations is None:
            self.observations = []

    def to_mcp_format(self) -> dict:
        """Memory MCP create_entities 형식으로 변환"""
        return {
            "name": self.name,
            "entityType": self.entity_type,
            "observations": self.observations
        }


@dataclass
class CategoryEntity:
    """카테고리 엔티티 (Memory MCP용)"""
    name: str
    entity_type: str = "category"
    description: str = ""
    observations: list[str] = None

    def __post_init__(self):
        if self.observations is None:
            self.observations = []

    def to_mcp_format(self) -> dict:
        return {
            "name": self.name,
            "entityType": self.entity_type,
            "observations": [self.description] + self.observations if self.description else self.observations
        }


@dataclass
class KeywordRelation:
    """키워드-카테고리 관계 (Memory MCP용)"""
    keyword: str
    category: str
    relation_type: str = "belongs_to"

    def to_mcp_format(self) -> dict:
        """Memory MCP create_relations 형식으로 변환"""
        return {
            "from": self.keyword,
            "to": self.category,
            "relationType": self.relation_type
        }


@dataclass
class ClassificationObservation:
    """분류 결과 관찰 (Memory MCP용)"""
    keyword: str
    category: str
    confidence: float
    context: Optional[str] = None

    def to_observation_string(self) -> str:
        """관찰 문자열로 변환"""
        base = f"'{self.category}'로 분류됨 (신뢰도: {self.confidence:.2f})"
        if self.context:
            base += f" - 컨텍스트: {self.context}"
        return base


# 카테고리 정보 (Memory 초기화용)
CATEGORY_DEFINITIONS = {
    "politics": CategoryEntity(
        name="politics",
        description="정치 관련 게시글 - 정당, 정치인, 정책, 선거 등",
        observations=["한국 정치 관련 키워드 포함", "정당명, 정치인 이름이 주요 지표"]
    ),
    "sports": CategoryEntity(
        name="sports",
        description="스포츠 관련 게시글 - 야구, 축구, 농구, 선수, 경기 등",
        observations=["스포츠 종목, 선수 이름이 주요 지표", "리그명, 대회명도 중요"]
    ),
    "celebrity": CategoryEntity(
        name="celebrity",
        description="연예 관련 게시글 - 아이돌, 배우, 가수, 드라마, 영화 등",
        observations=["연예인 이름, 그룹명이 주요 지표", "소속사, 활동 관련 키워드도 중요"]
    ),
    "stock": CategoryEntity(
        name="stock",
        description="경제/주식 관련 게시글 - 주식, 코인, 경제지표 등",
        observations=["주식 전문 용어가 주요 지표", "종목명, 시장 관련 키워드 중요"]
    ),
    "game": CategoryEntity(
        name="game",
        description="게임 관련 게시글 - PC/모바일 게임, e스포츠 등",
        observations=["게임 타이틀이 주요 지표", "플랫폼, 게임 용어도 중요"]
    ),
    "issue": CategoryEntity(
        name="issue",
        description="일반 이슈 게시글 - 유머, 생활, IT 등 기타 주제",
        observations=["다른 카테고리에 해당하지 않는 일반 게시글", "기본 분류 카테고리"]
    ),
}


def generate_memory_init_commands() -> dict:
    """
    Memory MCP 초기화 명령 생성

    Returns:
        dict: Memory MCP에 전달할 엔티티/관계 데이터
    """
    entities = [cat.to_mcp_format() for cat in CATEGORY_DEFINITIONS.values()]
    return {"entities": entities}


def create_keyword_learning_data(
    keyword: str,
    category: str,
    confidence: float,
    observations: list[str] = None
) -> dict:
    """
    키워드 학습 데이터 생성

    Claude Code에서 Memory MCP를 호출할 때 사용할 데이터 구조를 생성합니다.

    Args:
        keyword: 학습할 키워드
        category: 분류된 카테고리
        confidence: 분류 신뢰도
        observations: 추가 관찰 사항

    Returns:
        dict: Memory MCP 호출용 데이터
    """
    obs = observations or []
    obs.append(f"'{category}'로 분류됨 (신뢰도: {confidence:.2f})")

    entity = KeywordEntity(
        name=keyword,
        observations=obs
    )

    relation = KeywordRelation(
        keyword=keyword,
        category=category
    )

    return {
        "entity": entity.to_mcp_format(),
        "relation": relation.to_mcp_format()
    }


def create_ambiguous_keyword_data(
    keyword: str,
    possible_categories: list[tuple[str, str]]
) -> dict:
    """
    애매한 키워드 데이터 생성

    여러 카테고리에 해당할 수 있는 키워드의 컨텍스트 정보를 저장합니다.

    Args:
        keyword: 애매한 키워드
        possible_categories: [(category, context), ...] 리스트
            예: [("sports", "축구 컨텍스트일 때"), ("celebrity", "연예계 컨텍스트일 때")]

    Returns:
        dict: Memory MCP 호출용 데이터
    """
    observations = []
    for category, context in possible_categories:
        observations.append(f"{context} → '{category}'로 분류")

    entity = KeywordEntity(
        name=keyword,
        entity_type="ambiguous_keyword",
        observations=observations
    )

    return {"entity": entity.to_mcp_format()}


# 애매한 키워드 예시 (Memory에 저장할 데이터)
AMBIGUOUS_KEYWORDS = {
    "이적": [
        ("sports", "축구/야구 선수 이적"),
        ("celebrity", "소속사 이적"),
    ],
    "은퇴": [
        ("sports", "선수 은퇴"),
        ("celebrity", "연예인 은퇴"),
        ("politics", "정치인 은퇴"),
    ],
    "팬": [
        ("sports", "스포츠 팬"),
        ("celebrity", "아이돌 팬"),
    ],
    "논란": [
        ("politics", "정치 논란"),
        ("celebrity", "연예인 논란"),
        ("game", "게임 논란"),
    ],
}


def get_ambiguous_keywords_for_memory() -> list[dict]:
    """Memory에 저장할 애매한 키워드 리스트 반환"""
    return [
        create_ambiguous_keyword_data(keyword, categories)
        for keyword, categories in AMBIGUOUS_KEYWORDS.items()
    ]
