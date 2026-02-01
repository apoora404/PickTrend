@echo off
REM MemeBoard 1회 실행 스크립트 (Windows)
REM 크롤링 + 분류 + 저장을 1회 실행합니다.

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..

echo ========================================
echo MemeBoard 크롤러 (1회 실행)
echo ========================================

cd /d "%BACKEND_DIR%"
python main.py --classify --save

echo.
echo 완료!
pause
