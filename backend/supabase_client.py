"""Supabase 클라이언트 모듈"""
import os
import uuid
import hashlib
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()


def get_client() -> Client:
    """Supabase 클라이언트 인스턴스 반환"""
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")

    if not url or not key:
        raise ValueError("SUPABASE_URL과 SUPABASE_KEY 환경변수가 필요합니다.")

    return create_client(url, key)


def generate_uuid_from_string(source: str, title: str) -> str:
    """
    문자열 기반으로 결정론적 UUID 생성 (중복 방지용)
    같은 source + title이면 항상 같은 UUID 반환
    """
    text = f"{source}:{title}"
    hash_bytes = hashlib.md5(text.encode()).digest()
    return str(uuid.UUID(bytes=hash_bytes, version=3))


def generate_uuid_from_url(url: str) -> str:
    """
    URL 기반으로 결정론적 UUID 생성 (중복 방지용)
    같은 URL이면 항상 같은 UUID 반환
    """
    if not url:
        return str(uuid.uuid4())
    hash_bytes = hashlib.md5(url.encode()).digest()
    return str(uuid.UUID(bytes=hash_bytes, version=3))


def deduplicate_by_id(items: list[dict]) -> list[dict]:
    """ID 기준으로 중복 제거 (마지막 것 유지)"""
    seen = {}
    for item in items:
        item_id = item.get("id")
        if item_id:
            seen[item_id] = item
    return list(seen.values())


def insert_raw_posts(posts: list[dict]) -> dict:
    """원본 게시글 저장 (중복 시 업데이트)

    URL 기반으로 UUID를 생성하여 같은 URL의 게시글은 업데이트됨
    """
    client = get_client()

    # UUID 형식 ID 추가 (URL 기반 - 더 정확한 중복 방지)
    for post in posts:
        if "id" not in post:
            url = post.get("url")
            if url:
                post["id"] = generate_uuid_from_url(url)
            else:
                # URL이 없으면 기존 방식 사용
                post["id"] = generate_uuid_from_string(
                    post.get("source", "unknown"),
                    post.get("title", "")
                )

    # 배치 내 중복 제거
    posts = deduplicate_by_id(posts)

    # Upsert (중복 시 업데이트)
    result = client.table("raw_posts").upsert(
        posts,
        on_conflict="id"
    ).execute()
    return result.data


def get_raw_posts(source: str = None, limit: int = 100) -> list[dict]:
    """원본 게시글 조회"""
    client = get_client()
    query = client.table("raw_posts").select("*").order("scraped_at", desc=True).limit(limit)

    if source:
        query = query.eq("source", source)

    result = query.execute()
    return result.data


def upsert_rankings(rankings: list[dict]) -> dict:
    """
    순위 데이터 Upsert (중복 방지)
    - keyword + category를 기준으로 UUID 생성
    """
    client = get_client()

    now = datetime.utcnow().isoformat()

    for ranking in rankings:
        # UUID 형식 ID 생성
        if "id" not in ranking:
            ranking["id"] = generate_uuid_from_string(
                ranking.get("category", "general"),
                ranking.get("keyword", "")
            )
        ranking["updated_at"] = now
        if "created_at" not in ranking:
            ranking["created_at"] = now

        # popularity_score 기본값
        if "popularity_score" not in ranking:
            ranking["popularity_score"] = ranking.get("views", 0) + ranking.get("likes", 0) * 10

        # source_urls를 문자열 배열로 보장
        if "source_urls" in ranking:
            if isinstance(ranking["source_urls"], str):
                ranking["source_urls"] = [ranking["source_urls"]]
            elif ranking["source_urls"] is None:
                ranking["source_urls"] = []

    # 배치 내 중복 제거
    rankings = deduplicate_by_id(rankings)

    # Upsert 실행
    result = client.table("rankings").upsert(
        rankings,
        on_conflict="id"
    ).execute()

    return result.data


def insert_rankings(rankings: list[dict]) -> dict:
    """순위 데이터 저장 (기존 호환용)"""
    return upsert_rankings(rankings)


def get_rankings(category: str = None, limit: int = 20) -> list[dict]:
    """순위 데이터 조회"""
    client = get_client()
    query = client.table("rankings").select("*").order("popularity_score", desc=True).limit(limit)

    if category:
        query = query.eq("category", category)

    result = query.execute()
    return result.data


def delete_old_rankings(days: int = 7) -> int:
    """오래된 순위 데이터 삭제"""
    from datetime import timedelta

    client = get_client()
    cutoff = (datetime.utcnow() - timedelta(days=days)).isoformat()

    result = client.table("rankings").delete().lt("updated_at", cutoff).execute()
    return len(result.data) if result.data else 0


if __name__ == "__main__":
    # 연결 테스트
    try:
        client = get_client()
        print("Supabase 연결 성공!")

        # 테이블 확인
        rankings = get_rankings(limit=5)
        print(f"rankings 테이블: {len(rankings)}개 데이터")

    except Exception as e:
        print(f"연결 실패: {e}")
