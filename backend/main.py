"""크롤링 메인 스크립트"""
import sys
import io
from datetime import datetime, timedelta

# Windows 콘솔 UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from scrapers import (
    DcinsideScraper,
    RuliwebScraper,
    PpomppuScraper,
    InvenScraper,
)
from supabase_client import insert_raw_posts, upsert_rankings, delete_old_rankings, generate_uuid_from_string, deduplicate_by_id
from ai import classify_posts, export_uncertain_posts


def filter_old_posts(posts: list[dict], max_age_days: int = 7) -> list[dict]:
    """7일 이상 된 글 제외

    Args:
        posts: 게시글 리스트
        max_age_days: 최대 허용 일수 (기본 7일)

    Returns:
        필터링된 게시글 리스트
    """
    cutoff = datetime.now() - timedelta(days=max_age_days)
    filtered = []
    excluded = 0

    for post in posts:
        post_date_str = post.get("post_date")

        # post_date가 없으면 포함 (최근 글로 간주)
        if not post_date_str:
            filtered.append(post)
            continue

        try:
            # ISO 8601 형식 파싱
            post_date = datetime.fromisoformat(post_date_str.replace('Z', '+00:00'))
            # timezone 제거 (naive datetime으로 비교)
            if post_date.tzinfo:
                post_date = post_date.replace(tzinfo=None)

            if post_date > cutoff:
                filtered.append(post)
            else:
                excluded += 1
        except Exception:
            # 파싱 실패시 포함
            filtered.append(post)

    if excluded > 0:
        print(f"  [FILTER] {excluded}개 오래된 글 제외 (>{max_age_days}일)")

    return filtered


def run_all_scrapers(pages: int = 1) -> dict:
    """모든 크롤러 실행"""
    scrapers = [
        DcinsideScraper(),
        RuliwebScraper(),
        PpomppuScraper(),
        InvenScraper(),
    ]

    results = {
        "total": 0,
        "by_source": {},
        "errors": [],
    }

    all_posts = []

    for scraper in scrapers:
        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] {scraper.source_name} 크롤링 시작...")
            posts = []

            for page in range(1, pages + 1):
                page_posts = scraper.scrape(page=page)
                posts.extend(page_posts)
                print(f"  - 페이지 {page}: {len(page_posts)}개")

            results["by_source"][scraper.source_name] = len(posts)
            results["total"] += len(posts)
            all_posts.extend(posts)

            print(f"  [OK] {scraper.source_name}: {len(posts)}개 수집 완료")

        except Exception as e:
            error_msg = f"{scraper.source_name}: {str(e)}"
            results["errors"].append(error_msg)
            print(f"  [ERROR] {error_msg}")

    return results, all_posts


def save_raw_posts(posts: list[dict]) -> bool:
    """raw_posts 테이블에 저장"""
    if not posts:
        print("저장할 게시글이 없습니다.")
        return False

    try:
        batch_size = 50
        for i in range(0, len(posts), batch_size):
            batch = posts[i:i + batch_size]
            insert_raw_posts(batch)
            print(f"  raw_posts 저장: {i + len(batch)}/{len(posts)}")

        print(f"[OK] raw_posts: {len(posts)}개 저장 완료")
        return True

    except Exception as e:
        print(f"[ERROR] raw_posts 저장 실패: {e}")
        return False


def save_rankings(posts: list[dict]) -> bool:
    """
    분류된 게시글을 rankings 테이블에 저장

    posts 필드를 rankings 스키마에 맞게 변환:
    - title -> keyword
    - category -> category
    - views + likes*10 -> popularity_score
    - summary -> summary (AI 요약 또는 제목)
    """
    if not posts:
        print("저장할 랭킹 데이터가 없습니다.")
        return False

    try:
        rankings = []
        for post in posts:
            # 분류된 게시글만 (confidence가 있는 것)
            if post.get("confidence", 0) < 0.1:
                continue

            ranking = {
                "keyword": post.get("title", "")[:200],  # 제목 -> 키워드
                "category": post.get("category", "issue"),  # general → issue
                "popularity_score": post.get("views", 0) + post.get("likes", 0) * 10,
                "summary": post.get("summary") or post.get("title", ""),
                "source_urls": [post.get("url")] if post.get("url") else [],
                "post_date": post.get("post_date"),  # 원본 작성일
                "rank_change": 0,
            }
            rankings.append(ranking)

        if not rankings:
            print("저장할 랭킹이 없습니다. (모든 게시글 신뢰도 낮음)")
            return False

        # Upsert 실행
        batch_size = 50
        for i in range(0, len(rankings), batch_size):
            batch = rankings[i:i + batch_size]
            upsert_rankings(batch)
            print(f"  rankings 저장: {i + len(batch)}/{len(rankings)}")

        print(f"[OK] rankings: {len(rankings)}개 Upsert 완료")
        return True

    except Exception as e:
        print(f"[ERROR] rankings 저장 실패: {e}")
        import traceback
        traceback.print_exc()
        return False


def run_classification(posts: list[dict]) -> tuple[list[dict], list[dict]]:
    """게시글 분류 실행"""
    print("\n--- AI 분류 시작 ---")

    classified, uncertain = classify_posts(posts, confidence_threshold=0.1)

    # 분류 결과 출력
    categories = {}
    for post in classified:
        cat = post.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1

    print(f"분류 완료: {len(classified)}개")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count}개")

    print(f"불확실: {len(uncertain)}개")

    # 불확실 게시글 export
    if uncertain:
        filepath = export_uncertain_posts(uncertain)
        print(f"\n[EXPORT] 수동 분류 필요: {filepath}")

    return classified, uncertain


def cleanup_old_data():
    """오래된 데이터 정리"""
    try:
        deleted = delete_old_rankings(days=7)
        if deleted > 0:
            print(f"[CLEANUP] 7일 지난 랭킹 {deleted}개 삭제")
    except Exception as e:
        print(f"[WARNING] 정리 실패: {e}")


def main():
    """메인 실행"""
    print("=" * 50)
    print(f"MemeBoard 크롤러 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # 크롤링 실행
    results, posts = run_all_scrapers(pages=2)

    print("\n--- 수집 결과 ---")
    print(f"총 게시글: {results['total']}개")
    for source, count in results["by_source"].items():
        print(f"  - {source}: {count}개")

    if results["errors"]:
        print("\n--- 오류 ---")
        for error in results["errors"]:
            print(f"  - {error}")

    # 오래된 글 필터링 (7일 이상)
    posts = filter_old_posts(posts, max_age_days=7)
    print(f"필터링 후: {len(posts)}개")

    # AI 분류 (--classify 플래그)
    classified = []
    if "--classify" in sys.argv:
        classified, uncertain = run_classification(posts)
    else:
        classified = posts

    # Supabase 저장 (--save 플래그)
    if "--save" in sys.argv:
        print("\n--- Supabase 저장 ---")

        # 1. raw_posts 저장 (원본)
        save_raw_posts(posts)

        # 2. rankings 저장 (분류된 것만)
        if "--classify" in sys.argv:
            save_rankings(classified)

        # 3. 오래된 데이터 정리
        cleanup_old_data()

    else:
        print("\n[TIP] Supabase 저장하려면:")
        print("   python main.py --save           (크롤링만)")
        print("   python main.py --classify --save (분류 포함)")

    print("\n" + "=" * 50)
    print("완료!")
    print("=" * 50)


if __name__ == "__main__":
    main()
