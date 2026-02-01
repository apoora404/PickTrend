@echo off
REM MemeBoard 자동화 스크립트 (Windows)
REM 사용법: automate.bat [interval_minutes]
REM 예시: automate.bat 60 (1시간마다 실행)

setlocal enabledelayedexpansion

set INTERVAL=%1
if "%INTERVAL%"=="" set INTERVAL=60

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%..

echo ========================================
echo MemeBoard 자동 크롤러
echo 실행 간격: %INTERVAL%분
echo ========================================

:loop
echo.
echo [%date% %time%] 크롤링 시작...

cd /d "%BACKEND_DIR%"
python main.py --classify --save

echo [%date% %time%] 완료. %INTERVAL%분 후 재실행...

REM 분을 초로 변환 (60초 * 간격)
set /a WAIT_SECONDS=%INTERVAL%*60
timeout /t %WAIT_SECONDS% /nobreak > nul

goto loop
