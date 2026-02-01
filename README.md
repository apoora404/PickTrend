# MemeBoard

실시간 밈/이슈 순위 서비스 - 커뮤니티 인기글 분석 기반 카테고리별 순위 제공

## 기술 스택

| 구성요소 | 선택 | 비고 |
|----------|------|------|
| Backend | Python 3.10+ | 크롤링, 데이터 처리 |
| Database | Supabase (PostgreSQL) | 무료 티어 |
| Frontend | Next.js 14 (App Router) | Vercel 배포 |
| Styling | Tailwind CSS + Lucide Icons | |
| Scheduler | GitHub Actions | 1시간 간격 |

## 데이터 수집원

1. **에펨코리아** - 포텐 게시판
2. **디시인사이드** - 개념글
3. **더쿠** - 핫게시판

## 설정

### 1. Supabase 테이블 생성

Supabase 대시보드의 SQL Editor에서 아래 SQL 실행:

```sql
-- 카테고리 타입 생성
CREATE TYPE issue_category AS ENUM (
  'politics',
  'sports',
  'celebrity',
  'stock',
  'general'
);

-- rankings 테이블
CREATE TABLE rankings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword TEXT NOT NULL,
  category issue_category NOT NULL DEFAULT 'general',
  popularity_score INTEGER NOT NULL DEFAULT 0,
  summary TEXT,
  source_urls JSONB DEFAULT '[]'::jsonb,
  rank_change INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rankings_category ON rankings(category);
CREATE INDEX idx_rankings_popularity ON rankings(popularity_score DESC);
CREATE INDEX idx_rankings_created_at ON rankings(created_at DESC);

-- Updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER rankings_updated_at
  BEFORE UPDATE ON rankings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- raw_posts 테이블
CREATE TABLE raw_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_raw_posts_source ON raw_posts(source);
CREATE INDEX idx_raw_posts_scraped_at ON raw_posts(scraped_at DESC);
```

### 2. Backend 설정

```bash
cd backend

# 가상환경 생성 및 활성화
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일에 Supabase 키 입력
```

### 3. Frontend 설정

```bash
cd frontend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local 파일에 Supabase 키 입력

# 개발 서버 실행
npm run dev
```

## 사용법

### 크롤러 테스트

```bash
cd backend
python main.py
```

### Supabase에 저장

```bash
python main.py --save
```

### GitHub Actions 설정

1. Repository Settings → Secrets에 추가:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

2. `.github/workflows/scrape.yml` 파일이 자동 실행됨 (1시간 간격)

## 수동 분류 워크플로우 (비용 0원)

1. 크롤러 실행 → `raw_posts` 테이블에 저장
2. 사용자가 `raw_posts` 데이터를 채팅창에 복사
3. Claude가 카테고리 분류 + 요약 생성
4. 결과를 `rankings` 테이블에 입력

## 배포

### Vercel 배포

1. GitHub 연동
2. `frontend` 디렉토리를 Root Directory로 설정
3. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
