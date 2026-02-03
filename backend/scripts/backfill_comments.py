"""베스트 댓글 백필 스크립트

기존 rankings 중 best_comments가 비어있는 항목에 대해
source_urls에서 댓글을 수집하여 업데이트합니다.
"""
import sys
import os
import re
import time
import random
from typing import Optional

# 상위 디렉토리 추가 (supabase_client 임포트용)
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from supabase_client import get_client


# 요청 헤더
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
}


def fetch_page(url: str, timeout: int = 10) -> Optional[str]:
    """URL에서 HTML 가져오기"""
    try:
        # 봇 감지 우회용 딜레이
        time.sleep(random.uniform(0.5, 1.5))

        response = requests.get(url, headers=HEADERS, timeout=timeout)
        response.raise_for_status()
        return response.text
    except Exception as e:
        print(f"  [WARN] 페이지 로드 실패: {url[:50]}... - {e}")
        return None


def extract_dcinside_comments(html: str) -> list[dict]:
    """디시인사이드 댓글 추출"""
    comments = []

    # 댓글 패턴: usertxt 클래스 내용 + 추천수
    comment_pattern = r'<li[^>]*class="[^"]*ub-content[^"]*"[^>]*>[\s\S]*?<p[^>]*class="usertxt[^"]*"[^>]*>([\s\S]*?)</p>[\s\S]*?(?:<em[^>]*>(\d+)</em>|<span[^>]*up_num[^>]*>(\d+)</span>)?'

    for match in re.finditer(comment_pattern, html, re.IGNORECASE):
        content = match.group(1)
        if content:
            # HTML 태그 제거
            content = re.sub(r'<[^>]+>', '', content).strip()
            likes = int(match.group(2) or match.group(3) or '0')

            if content and 5 < len(content) < 200:
                comments.append({
                    "content": content,
                    "likes": likes
                })

    return comments


def extract_ruliweb_comments(html: str) -> list[dict]:
    """루리웹 댓글 추출"""
    comments = []

    # 루리웹 댓글 구조:
    # <td class="comment">
    #   <div class="text_wrapper">
    #     <span class="icon_best">BEST</span><br>
    #     <span class="text">댓글 내용</span>
    #   </div>
    # </td>

    # 패턴 1: span.text 클래스에서 댓글 추출 (더 정확함)
    text_pattern = r'<span[^>]*class="text"[^>]*>([^<]+)</span>'

    for match in re.finditer(text_pattern, html, re.IGNORECASE):
        content = match.group(1).strip()
        if content and 5 < len(content) < 200:
            comments.append({
                "content": content,
                "likes": 0  # 루리웹은 추천수 구조가 복잡함
            })

    # 베스트 댓글 우선 (icon_best가 있는 댓글)
    best_pattern = r'<span[^>]*class="icon_best"[^>]*>[^<]*</span>[\s\S]*?<span[^>]*class="text"[^>]*>([^<]+)</span>'
    best_comments = []
    for match in re.finditer(best_pattern, html, re.IGNORECASE):
        content = match.group(1).strip()
        if content and 5 < len(content) < 200:
            best_comments.append({
                "content": content,
                "likes": 100  # 베스트 댓글에 높은 점수 부여
            })

    # 베스트 댓글을 앞에 배치
    return best_comments + [c for c in comments if c["content"] not in [b["content"] for b in best_comments]]


def extract_ppomppu_comments(html: str) -> list[dict]:
    """뽐뿌 댓글 추출"""
    comments = []

    # 댓글 패턴: cmt_contents 클래스
    comment_pattern = r'<td[^>]*class="[^"]*cmt_contents[^"]*"[^>]*>([\s\S]*?)</td>'

    for match in re.finditer(comment_pattern, html, re.IGNORECASE):
        content = match.group(1)
        if content:
            content = re.sub(r'<[^>]+>', '', content).strip()

            if content and 5 < len(content) < 200:
                comments.append({
                    "content": content,
                    "likes": 0  # 뽐뿌는 추천수 파싱 어려움
                })

    return comments


def fetch_best_comments(url: str) -> list[dict]:
    """URL에서 베스트 댓글 추출"""
    html = fetch_page(url)
    if not html:
        return []

    comments = []

    if "dcinside" in url:
        comments = extract_dcinside_comments(html)
    elif "ruliweb" in url:
        comments = extract_ruliweb_comments(html)
    elif "ppomppu" in url:
        comments = extract_ppomppu_comments(html)

    # 추천수 기준 정렬 후 상위 5개
    comments.sort(key=lambda x: x.get("likes", 0), reverse=True)
    return comments[:5]


def backfill_comments(limit: int = 100, dry_run: bool = False):
    """best_comments가 비어있는 rankings에 댓글 백필

    Args:
        limit: 처리할 최대 개수
        dry_run: True면 실제 업데이트 없이 테스트만
    """
    print("=" * 60)
    print("베스트 댓글 백필 스크립트")
    print("=" * 60)

    if dry_run:
        print("[DRY RUN] 실제 업데이트 없이 테스트만 진행합니다.\n")

    client = get_client()

    # best_comments가 비어있는 rankings 조회
    # Supabase에서 NULL 또는 빈 배열 체크
    result = client.table("rankings") \
        .select("id, keyword, source_urls, best_comments, category") \
        .is_("best_comments", "null") \
        .limit(limit) \
        .execute()

    rankings = result.data or []
    print(f"처리 대상: {len(rankings)}개 항목\n")

    if not rankings:
        print("백필할 항목이 없습니다.")
        return

    success_count = 0
    skip_count = 0

    for i, ranking in enumerate(rankings, 1):
        keyword = ranking.get("keyword", "")
        source_urls = ranking.get("source_urls", [])
        category = ranking.get("category", "")

        print(f"[{i}/{len(rankings)}] {keyword} ({category})")

        if not source_urls:
            print("  → source_urls 없음, 스킵")
            skip_count += 1
            continue

        # 최대 3개 URL에서 댓글 수집
        all_comments = []
        for url in source_urls[:3]:
            comments = fetch_best_comments(url)
            if comments:
                print(f"  → {url[:40]}... : {len(comments)}개 댓글")
                all_comments.extend(comments)

        if not all_comments:
            print("  → 댓글 수집 실패, 스킵")
            skip_count += 1
            continue

        # 중복 제거 (content 기준) 후 추천수 기준 상위 3개
        seen = set()
        unique_comments = []
        for c in all_comments:
            content = c.get("content", "")
            if content not in seen:
                seen.add(content)
                unique_comments.append(c)

        unique_comments.sort(key=lambda x: x.get("likes", 0), reverse=True)
        top_comments = unique_comments[:3]

        if not dry_run:
            # DB 업데이트
            try:
                client.table("rankings") \
                    .update({"best_comments": top_comments}) \
                    .eq("id", ranking["id"]) \
                    .execute()
                print(f"  → [OK] {len(top_comments)}개 댓글 저장")
                success_count += 1
            except Exception as e:
                print(f"  → [ERROR] DB 업데이트 실패: {e}")
        else:
            print(f"  → [DRY RUN] {len(top_comments)}개 댓글 수집됨")
            for c in top_comments:
                likes = c.get("likes", 0)
                content = c.get("content", "")[:50]
                print(f"     - ({likes}추천) {content}...")
            success_count += 1

    print("\n" + "=" * 60)
    print(f"완료: 성공 {success_count}개, 스킵 {skip_count}개")
    print("=" * 60)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="베스트 댓글 백필 스크립트")
    parser.add_argument("--limit", type=int, default=100, help="처리할 최대 개수 (기본: 100)")
    parser.add_argument("--dry-run", action="store_true", help="테스트 모드 (실제 업데이트 없음)")

    args = parser.parse_args()

    backfill_comments(limit=args.limit, dry_run=args.dry_run)
