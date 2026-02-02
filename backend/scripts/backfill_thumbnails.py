"""
기존 rankings 데이터 중 thumbnail_url이 null인 항목에 대해
원문 URL에서 og:image를 추출하여 업데이트

사용법:
    cd backend
    python scripts/backfill_thumbnails.py
    python scripts/backfill_thumbnails.py --limit 50  # 최대 50개만 처리
    python scripts/backfill_thumbnails.py --dry-run   # 테스트 모드 (DB 저장 안함)
"""
import sys
import os
import argparse
import time
import random

# 상위 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from supabase_client import get_client


def extract_thumbnail(url: str) -> str | None:
    """원문 URL에서 썸네일 이미지 추출

    우선순위:
    1. og:image 메타 태그
    2. twitter:image 메타 태그
    3. 본문 첫 번째 큰 이미지
    """
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        html = response.text

        # 1순위: og:image
        import re
        og_match = re.search(
            r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        if not og_match:
            og_match = re.search(
                r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']',
                html, re.IGNORECASE
            )
        if og_match:
            return og_match.group(1)

        # 2순위: twitter:image
        tw_match = re.search(
            r'<meta[^>]*name=["\']twitter:image["\'][^>]*content=["\']([^"\']+)["\']',
            html, re.IGNORECASE
        )
        if not tw_match:
            tw_match = re.search(
                r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']twitter:image["\']',
                html, re.IGNORECASE
            )
        if tw_match:
            return tw_match.group(1)

        # 3순위: 첫 번째 큰 이미지 (아이콘/로고 제외)
        img_matches = re.findall(r'<img[^>]*src=["\']([^"\']+)["\']', html, re.IGNORECASE)
        for src in img_matches:
            src_lower = src.lower()
            # 작은 아이콘, 로고, 이모티콘 등 제외
            if any(x in src_lower for x in [
                'icon', 'logo', 'emoji', 'avatar', 'profile',
                '.gif', '1x1', 'spacer', 'blank', 'loading'
            ]):
                continue

            # 상대 경로를 절대 경로로
            if src.startswith('//'):
                return 'https:' + src
            if src.startswith('/'):
                from urllib.parse import urlparse
                parsed = urlparse(url)
                return f"{parsed.scheme}://{parsed.netloc}{src}"
            if src.startswith('http'):
                return src

        return None

    except Exception as e:
        print(f"  [ERROR] 추출 실패: {e}")
        return None


def backfill_thumbnails(limit: int = 100, dry_run: bool = False):
    """thumbnail_url이 null인 항목 일괄 갱신"""
    print("=" * 50)
    print("MemeBoard 썸네일 일괄 갱신")
    print("=" * 50)

    supabase = get_client()

    # thumbnail_url이 null인 항목 조회
    print(f"\n[1/3] thumbnail_url이 null인 항목 조회 (최대 {limit}개)...")

    result = supabase.table('rankings') \
        .select('id, keyword, source_urls') \
        .is_('thumbnail_url', 'null') \
        .limit(limit) \
        .execute()

    if not result.data:
        print("  업데이트할 항목이 없습니다.")
        return

    print(f"  {len(result.data)}개 항목 발견")

    # 썸네일 추출 및 업데이트
    print(f"\n[2/3] 썸네일 추출 중...")
    updated = 0
    failed = 0

    for i, row in enumerate(result.data, 1):
        keyword = row.get('keyword', '')[:30]
        source_urls = row.get('source_urls', [])

        if not source_urls:
            print(f"  [{i}/{len(result.data)}] {keyword}... - URL 없음")
            failed += 1
            continue

        # 첫 번째 URL에서 추출 시도
        thumbnail_url = extract_thumbnail(source_urls[0])

        # 실패하면 두 번째 URL 시도
        if not thumbnail_url and len(source_urls) > 1:
            thumbnail_url = extract_thumbnail(source_urls[1])

        if thumbnail_url:
            if not dry_run:
                supabase.table('rankings') \
                    .update({'thumbnail_url': thumbnail_url}) \
                    .eq('id', row['id']) \
                    .execute()
            print(f"  [{i}/{len(result.data)}] {keyword}... - OK")
            updated += 1
        else:
            print(f"  [{i}/{len(result.data)}] {keyword}... - 실패")
            failed += 1

        # Rate limiting (봇 감지 우회)
        time.sleep(random.uniform(0.5, 1.0))

    # 결과 출력
    print(f"\n[3/3] 완료!")
    print("=" * 50)
    print(f"총 처리: {len(result.data)}개")
    print(f"성공: {updated}개")
    print(f"실패: {failed}개")
    if dry_run:
        print("\n(Dry-run 모드: DB에 저장되지 않음)")
    print("=" * 50)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='기존 rankings 썸네일 일괄 갱신')
    parser.add_argument('--limit', type=int, default=100, help='최대 처리 개수 (기본: 100)')
    parser.add_argument('--dry-run', action='store_true', help='테스트 모드 (DB 저장 안함)')

    args = parser.parse_args()
    backfill_thumbnails(limit=args.limit, dry_run=args.dry_run)
