-- AI 요약 기능을 위한 컬럼 추가
-- Supabase SQL Editor에서 실행

-- 1. thumbnail_url 컬럼 추가 (이미 있으면 무시)
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 2. ai_summary 컬럼 추가 (AI 생성 MZ 스타일 요약)
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- 3. community_reaction 컬럼 추가 (커뮤니티 반응)
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS community_reaction TEXT;

-- 4. 인덱스 추가 (keyword 검색 성능 향상)
CREATE INDEX IF NOT EXISTS idx_rankings_keyword ON rankings(keyword);

-- 5. 컬럼 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'rankings'
ORDER BY ordinal_position;
