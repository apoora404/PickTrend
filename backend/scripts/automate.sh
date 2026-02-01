#!/bin/bash
# MemeBoard 자동화 스크립트 (Linux/Mac)
# 사용법: ./automate.sh [interval_minutes]
# 예시: ./automate.sh 60 (1시간마다 실행)

INTERVAL=${1:-60}  # 기본값 60분
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/.."

echo "========================================"
echo "MemeBoard 자동 크롤러"
echo "실행 간격: ${INTERVAL}분"
echo "========================================"

while true; do
    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 크롤링 시작..."

    cd "$BACKEND_DIR"
    python3 main.py --classify --save

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 완료. ${INTERVAL}분 후 재실행..."

    sleep $((INTERVAL * 60))
done
