"""불확실 게시글 export (수동 분류용)"""
import os
from datetime import datetime


def export_uncertain_posts(
    posts: list[dict],
    output_dir: str = "output",
    filename: str | None = None
) -> str:
    """
    불확실한 게시글을 txt 파일로 export

    Args:
        posts: 분류 불확실한 게시글 리스트
        output_dir: 출력 디렉토리
        filename: 파일명 (기본: uncertain_posts_YYYY-MM-DD.txt)

    Returns:
        생성된 파일 경로
    """
    os.makedirs(output_dir, exist_ok=True)

    if filename is None:
        today = datetime.now().strftime("%Y-%m-%d")
        filename = f"uncertain_posts_{today}.txt"

    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        today = datetime.now().strftime("%Y-%m-%d %H:%M")
        f.write(f"===== {today} 수동 분류 필요 ({len(posts)}개) =====\n\n")
        f.write("분류 옵션: politics / sports / celebrity / stock / general\n")
        f.write("-" * 60 + "\n\n")

        for i, post in enumerate(posts, 1):
            source = post.get("source", "unknown")
            title = post.get("title", "제목 없음")
            url = post.get("url", "")
            confidence = post.get("confidence", 0)
            matched = post.get("matched_keywords", [])

            f.write(f"{i}. [{source}] {title}\n")
            f.write(f"   URL: {url}\n")
            f.write(f"   현재 신뢰도: {confidence:.1%}\n")
            if matched:
                f.write(f"   매칭 키워드: {', '.join(matched)}\n")
            f.write(f"   분류: _______ (politics/sports/celebrity/stock/general)\n")
            f.write(f"   요약:\n")
            f.write(f"   _______________________________\n")
            f.write("\n")

    return filepath


def parse_classified_file(filepath: str) -> list[dict]:
    """
    수동 분류된 txt 파일 파싱

    Args:
        filepath: 수동 분류 완료된 파일

    Returns:
        분류 결과 리스트 [{"url": str, "category": str, "summary": str}, ...]
    """
    results = []
    current_post = {}

    with open(filepath, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if line.startswith("URL:"):
                current_post["url"] = line.replace("URL:", "").strip()

            elif "분류:" in line and "_______" not in line:
                # 사용자가 입력한 분류
                category = line.split("분류:")[-1].strip()
                if category:
                    current_post["category"] = category

            elif "요약:" in line:
                # 다음 줄에 요약이 있을 수 있음
                pass

            elif current_post.get("url") and not line.startswith("_"):
                # 요약 텍스트일 수 있음
                if line and "신뢰도" not in line and "키워드" not in line:
                    if "summary" not in current_post:
                        current_post["summary"] = line

            # 빈 줄이면 다음 게시글
            if not line and current_post.get("url"):
                if current_post.get("category"):
                    results.append(current_post.copy())
                current_post = {}

    return results
