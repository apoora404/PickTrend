"""
디시인사이드 스크래퍼 단독 테스트
- 1페이지에서 최대 5개만 수집
- 각 게시글 상세 로그 출력
- DB 저장 테스트
"""
import sys
import os

# 상위 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.dcinside import DcinsideScraper
from supabase_client import insert_raw_posts


def main():
    print("=" * 60)
    print("디시인사이드 스크래퍼 단독 테스트")
    print("=" * 60)

    # 스크래퍼 초기화
    scraper = DcinsideScraper()
    print(f"\n[INFO] 타겟 URL: {scraper.base_url}/hit")
    print(f"[INFO] User-Agent: {scraper.session.headers.get('User-Agent', 'N/A')[:50]}...")

    # 크롤링 실행
    print("\n--- 크롤링 시작 ---")
    try:
        posts = scraper.scrape(page=1)
        print(f"[OK] 수집된 게시글: {len(posts)}개")
    except Exception as e:
        print(f"[FAIL] 크롤링 실패: {e}")
        import traceback
        traceback.print_exc()
        return

    if not posts:
        print("[WARN] 수집된 게시글이 없습니다. 봇 차단일 수 있습니다.")
        return

    # 상세 로그 출력 (최대 5개)
    print("\n--- 게시글 상세 (최대 5개) ---")
    sample_posts = posts[:5]
    for i, post in enumerate(sample_posts, 1):
        print(f"\n=== 게시글 {i} ===")
        print(f"제목: {post['title'][:80]}{'...' if len(post['title']) > 80 else ''}")
        print(f"URL: {post['url']}")
        print(f"조회수: {post['views']}, 추천: {post['likes']}")
        print(f"날짜: {post['post_date']}")
        print(f"썸네일: {post.get('thumbnail_url', 'N/A')}")

    # 통계
    print("\n--- 통계 ---")
    date_ok = sum(1 for p in posts if p.get("post_date"))
    date_fail = len(posts) - date_ok
    has_thumbnail = sum(1 for p in posts if p.get("thumbnail_url"))
    has_views = sum(1 for p in posts if p.get("views", 0) > 0)
    has_likes = sum(1 for p in posts if p.get("likes", 0) > 0)

    print(f"총 게시글: {len(posts)}개")
    print(f"날짜 파싱: {date_ok}개 성공, {date_fail}개 기본값")
    print(f"조회수 있음: {has_views}개")
    print(f"추천수 있음: {has_likes}개")
    print(f"썸네일 있음: {has_thumbnail}개")

    # DB 저장 테스트 (5개만)
    print("\n--- DB 저장 테스트 (5개) ---")
    try:
        result = insert_raw_posts(sample_posts)
        if result:
            print(f"[OK] raw_posts 저장 성공: {len(result)}개")
        else:
            print("[OK] raw_posts 저장 완료 (결과 없음)")
    except Exception as e:
        print(f"[FAIL] raw_posts 저장 실패: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
    print("테스트 완료")
    print("=" * 60)


if __name__ == "__main__":
    main()
