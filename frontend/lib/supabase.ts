import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Category = 'politics' | 'sports' | 'celebrity' | 'stock' | 'game' | 'issue'
export type TimeRange = 'realtime' | '1h' | '12h' | '24h'

export interface Ranking {
  id: string
  keyword: string
  category: Category
  popularity_score: number
  summary: string | null
  image_url?: string | null  // 기존 이미지 URL (fallback)
  thumbnail_url?: string | null  // AI 추출 썸네일 (우선)
  source_urls: string[]
  source?: string  // 출처 (dcinside, ruliweb, ppomppu, inven)
  rank_change: number
  post_date?: string  // 원본 게시글 작성일
  created_at: string
  updated_at: string
}

export interface RawPost {
  id: string
  source: string
  title: string
  content: string | null
  url: string | null
  views: number
  likes: number
  scraped_at: string
}

export async function getRankings(
  category?: Category,
  limit: number = 20,
  timeRange: TimeRange = '24h'
): Promise<Ranking[]> {
  // 시간 범위 계산
  const now = new Date()
  const timeOffsets: Record<TimeRange, number> = {
    'realtime': 30,   // 30분
    '1h': 60,         // 1시간
    '12h': 720,       // 12시간
    '24h': 1440,      // 24시간
  }
  const cutoffDate = new Date(now.getTime() - timeOffsets[timeRange] * 60 * 1000)

  let query = supabase
    .from('rankings')
    .select('*')
    .gte('created_at', cutoffDate.toISOString())
    .order('popularity_score', { ascending: false })
    .limit(limit)

  if (category) {
    query = query.eq('category', category)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching rankings:', error)
    return []
  }

  return data || []
}

// 키워드로 단일 랭킹 조회 (상세 페이지용)
export async function getRankingByKeyword(keyword: string): Promise<Ranking | null> {
  const { data, error } = await supabase
    .from('rankings')
    .select('*')
    .eq('keyword', keyword)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Error fetching ranking by keyword:', error)
    return null
  }

  return data
}

// 같은 카테고리의 관련 랭킹 조회 (상세 페이지 추천용)
export async function getRelatedRankings(
  category: Category,
  excludeKeyword: string,
  limit: number = 5
): Promise<Ranking[]> {
  const { data, error } = await supabase
    .from('rankings')
    .select('*')
    .eq('category', category)
    .neq('keyword', excludeKeyword)
    .order('popularity_score', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related rankings:', error)
    return []
  }

  return data || []
}

export async function getRawPosts(source?: string, limit: number = 100): Promise<RawPost[]> {
  let query = supabase
    .from('raw_posts')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (source) {
    query = query.eq('source', source)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching raw posts:', error)
    return []
  }

  return data || []
}
