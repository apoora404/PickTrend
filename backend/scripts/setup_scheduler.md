# MemeBoard 자동화 설정 가이드

## 1. Windows 작업 스케줄러 설정 (권장)

### 방법 A: GUI로 설정
1. `Win + R` → `taskschd.msc` 입력
2. "작업 만들기" 클릭
3. **일반 탭**:
   - 이름: `MemeBoard Crawler`
   - "가장 높은 수준의 권한으로 실행" 체크
4. **트리거 탭**:
   - "새로 만들기" 클릭
   - "매일" 선택, 시작 시간 설정
   - "작업 반복 간격": 1시간
   - "기간": 무기한
5. **동작 탭**:
   - "새로 만들기" 클릭
   - 프로그램: `python`
   - 인수: `main.py --classify --save`
   - 시작 위치: `C:\Users\jbh61\OneDrive\바탕 화면\files\memeboard\backend`

### 방법 B: PowerShell로 설정
```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "main.py --classify --save" -WorkingDirectory "C:\Users\jbh61\OneDrive\바탕 화면\files\memeboard\backend"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration ([TimeSpan]::MaxValue)
Register-ScheduledTask -TaskName "MemeBoard Crawler" -Action $action -Trigger $trigger -RunLevel Highest
```

## 2. Linux/Mac Cron 설정

```bash
# crontab 편집
crontab -e

# 매시간 실행 (분 0에)
0 * * * * cd /path/to/memeboard/backend && python3 main.py --classify --save >> /var/log/memeboard.log 2>&1
```

## 3. 수동 실행 스크립트

### Windows
```batch
# 1회 실행
scripts\run_once.bat

# 반복 실행 (60분 간격)
scripts\automate.bat 60
```

### Linux/Mac
```bash
# 1회 실행
cd backend && python3 main.py --classify --save

# 반복 실행 (60분 간격)
./scripts/automate.sh 60
```

## 4. 더 나은 아이디어: GitHub Actions (무료 서버리스)

`.github/workflows/crawler.yml` 파일을 만들어 GitHub Actions에서 자동 실행:

```yaml
name: MemeBoard Crawler

on:
  schedule:
    - cron: '0 * * * *'  # 매시간
  workflow_dispatch:  # 수동 실행 가능

jobs:
  crawl:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run crawler
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          cd backend
          python main.py --classify --save
```

**장점**:
- PC를 켜놓지 않아도 됨
- 무료 (GitHub Free 플랜 포함)
- 로그 확인 쉬움
- 실패 시 알림 가능

## 5. 권장 구성

| 상황 | 권장 방식 |
|------|----------|
| PC 24시간 켜둠 | Windows 작업 스케줄러 |
| PC 간헐적 사용 | GitHub Actions |
| 서버 있음 | Cron + systemd |
| 테스트 중 | run_once.bat 수동 실행 |
