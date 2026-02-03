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
    FmkoreaScraper,
)
from supabase_client import insert_raw_posts, upsert_rankings, delete_old_rankings, generate_uuid_from_string, deduplicate_by_id
from ai import classify_posts, export_uncertain_posts, LLMClassifier, classify_posts_llm


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


def run_all_scrapers(pages: int = 1, use_selenium: bool = False) -> dict:
    """모든 크롤러 실행

    Args:
        pages: 크롤링할 페이지 수
        use_selenium: Selenium 기반 크롤러 포함 여부 (FmKorea)
    """
    scrapers = [
        DcinsideScraper(),
        RuliwebScraper(),
        PpomppuScraper(),
        InvenScraper(),
    ]

    # Selenium 기반 크롤러 (선택적)
    if use_selenium:
        try:
            scrapers.append(FmkoreaScraper(use_selenium=True))
            print("[INFO] FmKorea 크롤러 활성화 (Selenium)")
        except ImportError as e:
            print(f"[WARNING] FmKorea 크롤러 비활성화 (Selenium 미설치): {e}")

    results = {
        "total": 0,
        "by_source": {},
        "errors": [],
        "details": {},  # 상세 통계 추가
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

            # 상세 통계 계산
            date_ok = sum(1 for p in posts if p.get("post_date"))
            date_fail = len(posts) - date_ok
            has_thumbnail = sum(1 for p in posts if p.get("thumbnail_url"))
            has_views = sum(1 for p in posts if p.get("views", 0) > 0)
            has_likes = sum(1 for p in posts if p.get("likes", 0) > 0)

            results["by_source"][scraper.source_name] = len(posts)
            results["details"][scraper.source_name] = {
                "count": len(posts),
                "date_ok": date_ok,
                "date_fail": date_fail,
                "has_thumbnail": has_thumbnail,
                "has_views": has_views,
                "has_likes": has_likes,
            }
            results["total"] += len(posts)
            all_posts.extend(posts)

            # 상세 로그 출력
            print(f"  [OK] {scraper.source_name}: {len(posts)}개 수집")
            print(f"       - 날짜: {date_ok}개 OK, {date_fail}개 기본값")
            print(f"       - 조회수: {has_views}개, 추천: {has_likes}개, 썸네일: {has_thumbnail}개")

        except Exception as e:
            error_msg = f"{scraper.source_name}: {str(e)}"
            results["errors"].append(error_msg)
            print(f"  [ERROR] {error_msg}")
            import traceback
            traceback.print_exc()

    return results, all_posts


def save_raw_posts(posts: list[dict]) -> bool:
    """raw_posts 테이블에 저장"""
    if not posts:
        print("저장할 게시글이 없습니다.")
        return False

    try:
        # 소스별 통계
        by_source = {}
        for post in posts:
            src = post.get("source", "unknown")
            by_source[src] = by_source.get(src, 0) + 1

        print(f"[DB] raw_posts 저장 시작 ({len(posts)}개)")
        for src, cnt in sorted(by_source.items()):
            print(f"       - {src}: {cnt}개")

        batch_size = 50
        total_saved = 0
        for i in range(0, len(posts), batch_size):
            batch = posts[i:i + batch_size]
            result = insert_raw_posts(batch)
            saved_count = len(result) if result else len(batch)
            total_saved += saved_count
            print(f"  raw_posts 저장: {i + len(batch)}/{len(posts)} (batch: {saved_count}개)")

        print(f"[OK] raw_posts: {total_saved}개 저장 완료")
        return True

    except Exception as e:
        print(f"[ERROR] raw_posts 저장 실패: {e}")
        import traceback
        traceback.print_exc()
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
                "thumbnail_url": post.get("thumbnail_url"),  # 썸네일 이미지
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


def run_classification(posts: list[dict], use_llm: bool = False) -> tuple[list[dict], list[dict]]:
    """게시글 분류 실행

    Args:
        posts: 게시글 리스트
        use_llm: True면 Claude Haiku LLM 사용, False면 규칙 기반

    Returns:
        (classified, uncertain) 튜플
    """
    print("\n--- AI 분류 시작 ---")

    if use_llm:
        print("[MODE] LLM 분류 (Claude Haiku)")
        if LLMClassifier is None:
            print("[ERROR] anthropic 패키지가 설치되지 않았습니다.")
            print("        pip install anthropic>=0.18.0")
            return posts, []

        try:
            classified = classify_posts_llm(posts)
            uncertain = []  # LLM은 항상 분류함
        except Exception as e:
            print(f"[ERROR] LLM 분류 실패: {e}")
            print("[FALLBACK] 규칙 기반 분류로 전환")
            classified, uncertain = classify_posts(posts, confidence_threshold=0.1)
    else:
        print("[MODE] 규칙 기반 분류 (키워드 매칭)")
        classified, uncertain = classify_posts(posts, confidence_threshold=0.1)

    # 분류 결과 출력
    categories = {}
    for post in classified:
        cat = post.get("category", "unknown")
        categories[cat] = categories.get(cat, 0) + 1

    print(f"분류 완료: {len(classified)}개")
    for cat, count in sorted(categories.items()):
        print(f"  - {cat}: {count}개")

    if uncertain:
        print(f"불확실: {len(uncertain)}개")
        # 불확실 게시글 export
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

    # 크롤링 실행 (--selenium 플래그로 FmKorea 활성화)
    use_selenium = "--selenium" in sys.argv
    results, posts = run_all_scrapers(pages=2, use_selenium=use_selenium)

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

    # AI 분류 (--classify 플래그, --llm으로 LLM 사용)
    classified = []
    if "--classify" in sys.argv:
        use_llm = "--llm" in sys.argv
        classified, uncertain = run_classification(posts, use_llm=use_llm)
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
        print("   python main.py --save                        (크롤링만)")
        print("   python main.py --classify --save             (규칙 기반 분류)")
        print("   python main.py --classify --llm --save       (LLM 분류)")
        print("   python main.py --selenium --classify --save  (FmKorea 포함)")

    print("\n" + "=" * 50)
    print("완료!")
    print("=" * 50)


if __name__ == "__main__":
    main()
