-- raw_posts 테이블에 thumbnail_url 컬럼 추가
-- Supabase SQL Editor에서 실행

ALTER TABLE raw_posts
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 인덱스 추가 (선택사항 - 썸네일 있는 게시글 필터링 시 성능 향상)
-- CREATE INDEX IF NOT EXISTS idx_raw_posts_thumbnail ON raw_posts(thumbnail_url) WHERE thumbnail_url IS NOT NULL;

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'raw_posts' AND column_name = 'thumbnail_url';
