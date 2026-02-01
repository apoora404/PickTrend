# MemeBoard - 커뮤니티 게시글 수집 및 분류 시스템

## Project Overview
한국 주요 커뮤니티(dcinside, ruliweb, ppomppu, inven)의 인기 게시글을 수집하고 AI로 카테고리 분류하는 시스템.

**GitHub**: https://github.com/apoora404/PickTrend

---

## Tech Stack
| 구성요소 | 선택 | 비고 |
|----------|------|------|
| Backend | Python 3.10+ | 크롤링 + 분류 |
| AI 분류 | Rule-based | 키워드 매칭 |
| Database | Supabase | PostgreSQL |
| Frontend | Next.js 14 | App Router |
| Styling | Tailwind CSS | 반응형 |

---

## Directory Structure
```
memeboard/
├── backend/
│   ├── ai/
│   │   ├── base_classifier.py    # 분류기 베이스 클래스
│   │   ├── keywords.py           # 카테고리별 키워드 사전
│   │   ├── rule_classifier.py    # 규칙 기반 분류기
│   │   └── exporter.py           # 불확실 게시글 export
│   ├── scrapers/                 # 사이트별 크롤러
│   ├── scripts/
│   │   ├── automate.bat          # Windows 자동화
│   │   ├── automate.sh           # Linux/Mac 자동화
│   │   ├── run_once.bat          # 1회 실행
│   │   └── setup_scheduler.md    # 스케줄러 설정 가이드
│   ├── output/                   # 분류 결과 출력
│   ├── main.py                   # CLI 진입점
│   └── supabase_client.py        # DB 클라이언트
├── frontend/
│   ├── app/
│   │   ├── layout.tsx            # 레이아웃
│   │   ├── page.tsx              # 메인 페이지
│   │   └── globals.css           # 글로벌 CSS
│   ├── components/
│   │   ├── Header.tsx            # 헤더 (검색바, 뷰 모드 전환)
│   │   ├── Sidebar.tsx           # 좌측 사이드바 (데스크탑)
│   │   ├── CategoryFilter.tsx    # 카테고리 필터
│   │   ├── RankingCard.tsx       # 랭킹 카드
│   │   ├── BottomTabBar.tsx      # 하단 탭바 (모바일)
│   │   └── FloatingButton.tsx    # 플로팅 버튼
│   └── lib/
│       └── supabase.ts           # Supabase 클라이언트
└── .github/
    └── workflows/
        └── crawler.yml           # GitHub Actions 자동화
```

---

## CLI 사용법

```bash
cd backend

# 크롤링만
python main.py

# 크롤링 + 분류
python main.py --classify

# 크롤링 + 분류 + DB 저장 (추천)
python main.py --classify --save
```

---

## 데이터 흐름

1. **크롤링**: scrapers → raw_posts 테이블
2. **분류**: ai/rule_classifier → category 할당
3. **저장**: supabase_client → rankings 테이블 (Upsert)
4. **표시**: frontend → Supabase에서 조회

---

## Supabase 테이블

### raw_posts
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | URL 해시 (중복 방지) |
| source | text | 출처 (dcinside, ruliweb 등) |
| title | text | 제목 |
| url | text | 원본 URL |
| views | int | 조회수 |
| likes | int | 추천수 |
| post_date | timestamp | 원본 게시글 작성일 |
| scraped_at | timestamp | 수집 시간 |

### rankings
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | category + keyword 해시 |
| keyword | text | 제목/키워드 |
| category | text | politics/sports/celebrity/stock/game/issue |
| popularity_score | int | 인기 점수 |
| summary | text | 요약 |
| source_urls | text[] | 원본 URL 배열 |
| post_date | timestamp | 원본 게시글 작성일 |
| rank_change | int | 순위 변동 |
| created_at | timestamp | 생성 시간 |
| updated_at | timestamp | 업데이트 시간 |

---

## 반응형 디자인

### 모바일 뷰 (max-width: 480px)
- 1열 카드 레이아웃
- 가로 스크롤 카테고리 필터
- 하단 탭바 표시

### 데스크탑 뷰 (min-width: 481px)
- 좌측 사이드바 (카테고리 + 급상승 키워드)
- 2~3열 그리드 레이아웃
- 인기순/최신순 정렬
- 하단 탭바 숨김

### 뷰 모드 수동 전환
- 헤더 우측 모니터/스마트폰 아이콘
- 플로팅 버튼 (모바일)
- localStorage에 설정 저장

---

## 자동화

### Windows 작업 스케줄러
```powershell
$action = New-ScheduledTaskAction -Execute "python" -Argument "main.py --classify --save" -WorkingDirectory "C:\path\to\backend"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
Register-ScheduledTask -TaskName "MemeBoard" -Action $action -Trigger $trigger
```

### GitHub Actions (권장)
- `.github/workflows/crawler.yml` 설정됨
- Secrets 필요: `SUPABASE_URL`, `SUPABASE_KEY`
- 매시간 자동 실행

---

## 최근 변경 (2026-02-01)

### game/issue 카테고리 분리
`game`과 `issue`를 별개 카테고리로 분리하여 UI에 독립적으로 노출

**백엔드 변경:**
- `backend/ai/keywords.py`: `game` 카테고리 신규 추가
  - 게임 타이틀: 롤, 배그, 오버워치, 발로란트, 메이플, 로스트아크 등
  - 플랫폼/콘솔: 스팀, PS5, 닌텐도, 스위치, 엑스박스
  - 게임 용어: 게임, 겜, 패치, 업데이트, e스포츠
- `issue`에서 게임 관련 키워드 제거
- `CATEGORY_PRIORITY`: game을 issue보다 앞에 배치

**프론트엔드 변경:**
- `frontend/lib/supabase.ts`: Category 타입에 `'game'` 추가
- `frontend/components/CategoryFilter.tsx`: '게임' 필터 항목 추가
- `frontend/components/Sidebar.tsx`: '게임' 메뉴 + `Gamepad2` 아이콘 추가

**분류 테스트 결과:**
| 카테고리 | 게시글 수 |
|----------|----------|
| celebrity | 3개 |
| game | 28개 |
| issue | 91개 |
| politics | 3개 |
| sports | 15개 |
| stock | 13개 |

**DB 마이그레이션 (필요 시):**
```sql
ALTER TYPE issue_category ADD VALUE 'game';
```

---

### 이전 변경: 오래된 글 필터링 & 분류 개선
1. **post_date 필드 추가**: 원본 게시글 작성일 수집 (스크래퍼 업데이트)
2. **7일 필터링**: 7일 이상 오래된 글 자동 제외
3. **카테고리 변경**: `general` → `issue` ("일반 이슈")
4. **라벨 변경**: "주식" → "경제"
5. **키워드 정리**: 너무 포괄적인 키워드 제거 ("금", "세력", "환율")
6. **우선순위 로직**: 동점 시 구체적 카테고리 우선 (celebrity > sports > stock > politics > game > issue)
7. **URL 기반 중복 방지**: source+title 대신 URL로 UUID 생성

### 이전 DB 마이그레이션
- `backend/scripts/migrate_issue_category.sql` 실행 필요
- Supabase SQL Editor에서 실행

### 이전 프론트엔드 업데이트
- Category 타입에 `issue` 추가, `general` 제거
- 사이드바/필터 라벨 업데이트
- Newspaper 아이콘 적용

---

## Known Issues

### 1. 분류율 개선 필요
- 키워드 매칭 한계 (issue 카테고리로 fallback)
- 해결 방안: LLM 기반 분류 도입 고려

### 2. 일부 사이트 차단
- FmKorea: 봇 차단 (430 에러)
- TheQoo: JS 렌더링 필요

### 3. 날짜 파싱 한계
- 인벤: 뉴스 페이지라 목록에서 날짜 추출 어려움 (오늘 날짜 사용)

---

## 개발 환경

```bash
# Backend
cd backend
pip install -r requirements.txt
python main.py --classify --save

# Frontend
cd frontend
npm install
npm run dev
# http://localhost:3000
```
