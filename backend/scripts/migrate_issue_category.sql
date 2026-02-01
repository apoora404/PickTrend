-- MemeBoard DB 마이그레이션 스크립트
-- Supabase SQL Editor에서 실행

-- 1. rankings 테이블에 post_date 컬럼 추가
ALTER TABLE rankings ADD COLUMN IF NOT EXISTS post_date TIMESTAMPTZ;

-- 2. raw_posts 테이블에 post_date 컬럼 추가
ALTER TABLE raw_posts ADD COLUMN IF NOT EXISTS post_date TIMESTAMPTZ;

-- 3. general → issue 카테고리 마이그레이션 (기존 데이터 변환)
UPDATE rankings SET category = 'issue' WHERE category = 'general';

-- 4. (선택) 오래된 데이터 정리 (7일 이상) - 주석 해제하여 실행
-- DELETE FROM rankings WHERE created_at < NOW() - INTERVAL '7 days';

-- 5. (선택) raw_posts URL unique constraint 추가 - 주석 해제하여 실행
-- ALTER TABLE raw_posts ADD CONSTRAINT raw_posts_url_unique UNIQUE (url);

-- 실행 결과 확인
SELECT 'rankings 카테고리 분포:' as info;
SELECT category, COUNT(*) as count FROM rankings GROUP BY category ORDER BY count DESC;

SELECT 'raw_posts post_date 컬럼 확인:' as info;
SELECT COUNT(*) as total, COUNT(post_date) as with_date FROM raw_posts;
