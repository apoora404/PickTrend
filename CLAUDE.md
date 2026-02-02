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
│   │   ├── extract_keywords_hf.py # 위키피디아 키워드 추출
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

## 현재 진행상황 (2026-02-02)

### 완료된 작업
1. ✅ requirements.txt에 HuggingFace 의존성 추가 (transformers, datasets, wikipedia-api)
2. ✅ 위키피디아 키워드 추출 스크립트 생성 (`backend/scripts/extract_keywords_hf.py`)
3. ✅ 키워드 추출 실행 및 keywords.py 병합 (869개 → 2,178개)
4. ✅ CLAUDE.md 문서 업데이트 및 라이선스 표기
5. ✅ **issue fallback 비율 48% → 21%로 감소** (목표 25% 이하 달성!)
   - stock에 쇼핑몰/딜 키워드 35개 추가 (G마켓, 11번가, 쿠팡, 무배 등)
   - game에 애니메이션/만화 키워드 80개+ 추가 (드래곤퀘스트, 페이트, 나루토 등)
   - celebrity에 셰프/요리사 키워드 추가

### 분류 테스트 결과 (최신)
```
총 게시글: 155개
- celebrity: 10개 (6%)
- game: 55개 (35%)
- issue: 32개 (21%) ✅ 목표 달성
- politics: 1개 (1%)
- sports: 6개 (4%)
- stock: 51개 (33%)
```

### 개선 전후 비교
| 카테고리 | 이전 | 이후 | 변화 |
|----------|------|------|------|
| issue | 75개 (48%) | 32개 (21%) | **-43개** |
| stock | 21개 (14%) | 51개 (33%) | +30개 (쇼핑 딜) |
| game | 39개 (25%) | 55개 (35%) | +16개 (애니/만화) |

### 다음 단계
- [ ] LLM 기반 분류 도입 검토 (추가 개선 시)
- [ ] 키워드 정제 (노이즈 제거, 중복 처리)
- [ ] Supabase DB 저장 테스트

---

## 최근 변경 (2026-02-02)

### 위키피디아 기반 키워드 자동 추출
HuggingFace 리소스와 한국어 위키피디아에서 키워드 자동 추출하여 분류 정확도 개선

**키워드 추출 스크립트:**
- `backend/scripts/extract_keywords_hf.py` - 위키피디아 카테고리에서 키워드 자동 추출

**키워드 변경:**
| 카테고리 | 이전 | 이후 | 주요 추가 소스 |
|----------|------|------|---------------|
| politics | 140개 | 243개 | 위키 정치인, 정당, 대통령 |
| sports | 153개 | 345개 | 위키 선수, 리그, 팀 |
| celebrity | 186개 | 691개 | 위키 배우, 가수, 아이돌 그룹 |
| stock | 147개 | 367개 | 위키 기업, 암호화폐, 부동산 |
| game | 214개 | 503개 | 위키 게임, 애니메이션, 만화 |
| issue | 29개 | 29개 | 최소 유지 (fallback용) |
| **총계** | **869개** | **2,178개** | |

**분류 테스트 결과:**
| 카테고리 | 이전 (%) | 이후 (%) |
|----------|----------|----------|
| celebrity | 6% | 11% |
| game | 32% | 28% |
| issue | 45% | 45% |
| politics | 1% | 1% |
| sports | 8% | 5% |
| stock | 8% | 10% |

**수정/생성 파일:**
- `backend/scripts/extract_keywords_hf.py` - 키워드 추출 스크립트 (신규)
- `backend/ai/keywords.py` - 위키피디아 키워드 병합
- `backend/requirements.txt` - transformers, datasets, wikipedia-api 추가

**사용법:**
```bash
cd backend
python scripts/extract_keywords_hf.py  # 키워드 재추출
python main.py --classify              # 분류 테스트
```

---

### 이전: 키워드 대폭 확장 (keywords.py)
분류 정확도 개선을 위해 키워드를 194개에서 869개로 대폭 확장

**변경 내용:**
| 카테고리 | 이전 | 이후 | 주요 추가 |
|----------|------|------|----------|
| politics | 59개 | 140개 | 정치인(과거/현재), 정당, 선거 용어 |
| sports | 33개 | 153개 | 해외 리그/팀, 선수, 스포츠 용어 |
| celebrity | 27개 | 186개 | 아이돌 그룹, 배우, 예능인, 소속사 |
| stock | 40개 | 147개 | 종목명, 투자 용어, 부동산 |
| game | 20개 | 214개 | 모바일/PC/콘솔 게임, 만화/애니/웹툰 |
| issue | 15개 | 29개 | 최소화 (fallback용) |

**수정 파일:**
- `backend/ai/keywords.py` - 키워드 대폭 추가
- `backend/ai/exporter.py` - 분류 옵션 업데이트 (general → game/issue)

---

### MCP 도구 통합
Claude Code에 MCP(Model Context Protocol) 서버 3개 통합:

**생성된 파일:**
- `.claude/settings.json` - MCP 서버 설정 (fetch, memory, supabase)
- `backend/ai/memory_classifier.py` - Memory MCP 연동 분류기 유틸리티

**수정된 파일:**
- `backend/ai/base_classifier.py` - CATEGORIES에 game, issue 추가
- `CLAUDE.md` - MCP 사용법 문서 추가

**설치된 도구:**
- `uv` (v0.9.28) - Fetch MCP 실행용

**다음 단계:**
1. Claude Code 재시작하여 MCP 설정 적용
2. `/mcp` 명령으로 서버 연결 확인
3. 각 MCP 서버 테스트:
   - Fetch: "fetch로 https://gall.dcinside.com/hit 가져와줘"
   - Memory: "memory에 '손흥민'을 sports 키워드로 저장해줘"
   - Supabase: "supabase에서 rankings 테이블 조회해줘"

---

## 이전 변경 (2026-02-01)

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

---

## MCP (Model Context Protocol) 통합

### 설정 파일
`.claude/settings.json`에 MCP 서버 설정:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"]
    }
  }
}
```

### 필수 도구 설치
```bash
# Python uv (Fetch MCP용)
pip install uv

# Node.js npx (Memory, Supabase MCP용) - 이미 설치됨
```

### MCP 서버별 활용

#### 1. Fetch MCP - 웹 크롤링 강화
- 새로운 커뮤니티 사이트 탐색
- 차단된 사이트(FmKorea, TheQoo) 우회 시도
- 크롤링 로직 디버깅

**사용 예시:**
```
Claude Code에서: "fetch로 https://gall.dcinside.com/hit 페이지 가져와줘"
→ 마크다운으로 변환된 콘텐츠 반환
```

#### 2. Supabase MCP - DB 직접 연동
- 스키마 관리: Claude Code에서 직접 테이블 수정
- 데이터 조회: SQL 쿼리 직접 실행
- 디버깅: 데이터 상태 실시간 확인

**주의:** Production DB 연결 금지 (개발/테스트용만)

**사용 예시:**
```
"supabase에서 rankings 테이블 최근 10개 조회해줘"
→ 데이터 반환
```

#### 3. Memory MCP - AI 분류 학습
지식 그래프로 키워드-카테고리 관계 학습:

**키워드 학습:**
```
Entity: "손흥민"
Type: "keyword"
Observations: ["celebrity와 sports 모두 해당", "주로 sports로 분류"]
Relations: ["손흥민" --belongs_to--> "sports"]
```

**애매한 키워드 처리:**
```
Entity: "이적"
Type: "ambiguous_keyword"
Observations: ["축구 컨텍스트면 sports", "연예계 컨텍스트면 celebrity"]
```

**사용 예시:**
```
"memory에 '손흥민'을 sports 키워드로 저장해줘"
→ 엔티티 생성 및 관계 설정
```

### MCP 연결 확인
```bash
# Claude Code에서
/mcp
# → fetch, memory, supabase 서버 목록 확인
```

### 보안 고려사항
1. **Supabase MCP**: Production DB 연결 금지
2. **Fetch MCP**: robots.txt 준수 (`--ignore-robots-txt` 사용 자제)
3. **Memory MCP**: 민감 정보(API 키, 비밀번호) 저장 금지

### 참고 자료
- [Supabase MCP 공식 문서](https://supabase.com/docs/guides/getting-started/mcp)
- [GitHub MCP Servers](https://github.com/modelcontextprotocol/servers)
- [Supabase MCP GitHub](https://github.com/supabase-community/supabase-mcp)

---

## 외부 리소스 라이선스

키워드 추출에 사용된 외부 리소스 출처:

| 리소스 | 라이선스 | 용도 |
|--------|---------|------|
| 한국어 위키피디아 | CC-BY-SA-3.0 | 카테고리별 문서 제목 추출 |
| KLUE 데이터셋 | CC-BY-SA-4.0 | 뉴스 분류 학습 데이터 (참고) |
| KcBERT | Apache 2.0 | 토크나이저 (참고) |

**출처 표기:**
- 위키피디아: https://ko.wikipedia.org/
- KLUE: https://klue-benchmark.com/
- KcBERT: https://github.com/Beomi/KcBERT
