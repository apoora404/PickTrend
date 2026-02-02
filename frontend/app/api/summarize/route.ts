import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Anthropic API 직접 호출 (MoltWorker 불필요)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Supabase 서버사이드 클라이언트 (Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// 원문 URL에서 썸네일 이미지 추출
async function extractThumbnail(url: string): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    const html = await res.text()

    // 1순위: og:image
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i)
    if (ogMatch?.[1]) return ogMatch[1]

    // 2순위: twitter:image
    const twitterMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i)
    if (twitterMatch?.[1]) return twitterMatch[1]

    // 3순위: 첫 번째 큰 img src (작은 아이콘 제외)
    const imgMatches = html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)
    for (const match of imgMatches) {
      const src = match[1]
      // 작은 아이콘, 로고, 이모티콘 등 제외
      if (src.includes('icon') || src.includes('logo') || src.includes('emoji') ||
          src.includes('avatar') || src.includes('profile') || src.includes('.gif') ||
          src.includes('1x1') || src.includes('spacer')) {
        continue
      }
      // 상대 경로를 절대 경로로 변환
      if (src.startsWith('//')) {
        return 'https:' + src
      }
      if (src.startsWith('/')) {
        const urlObj = new URL(url)
        return urlObj.origin + src
      }
      if (src.startsWith('http')) {
        return src
      }
    }

    return null
  } catch {
    return null
  }
}

// 원문에서 본문 컨텐츠 추출
async function fetchSourceContent(urls: string[]): Promise<string> {
  if (!urls?.length) return ''

  const contents: string[] = []
  for (const url of urls.slice(0, 3)) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      })
      clearTimeout(timeoutId)

      const html = await res.text()

      // HTML 태그 제거하고 텍스트만 추출
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 800)

      if (text && text.length > 50) {
        contents.push(text)
      }
    } catch {
      // 개별 URL 실패는 무시하고 계속
    }
  }
  return contents.join('\n---\n')
}

export async function POST(request: NextRequest) {
  try {
    const { keyword, title, source_urls, force_refresh } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 캐싱 체크: force_refresh가 아니면 DB에서 기존 요약 확인
    if (!force_refresh) {
      const { data: existing } = await supabase
        .from('rankings')
        .select('ai_summary, community_reaction, thumbnail_url')
        .eq('keyword', keyword)
        .single()

      // 캐시된 요약이 있으면 바로 반환
      if (existing?.ai_summary) {
        return NextResponse.json({
          ai_summary: existing.ai_summary,
          community_reaction: existing.community_reaction,
          thumbnail_url: existing.thumbnail_url,
          cached: true
        })
      }
    }

    // 2. 썸네일 이미지 추출 (병렬 처리)
    let thumbnail_url: string | null = null
    if (source_urls?.length) {
      // 첫 번째 URL에서 이미지 추출 시도
      thumbnail_url = await extractThumbnail(source_urls[0])

      // 실패하면 두 번째 URL 시도
      if (!thumbnail_url && source_urls.length > 1) {
        thumbnail_url = await extractThumbnail(source_urls[1])
      }
    }

    // 3. 원문 컨텐츠 가져오기
    const fetchedContent = await fetchSourceContent(source_urls || [])

    // 4. Anthropic API 직접 호출
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // MZ 스타일 프롬프트
    const prompt = `너는 한국 커뮤니티 트렌드를 요약하는 MZ세대 에디터야.
빠르고 명확하게, 핵심만 전달해.

[키워드]
${title || keyword}

[원문 내용]
${fetchedContent || '(본문 없음 - 키워드 기반으로 추론해)'}

---

[AI 핵심 요약]
아래 형식으로 정확히 3줄 불렛포인트로 작성:
• 발단: (이 이슈가 터진 계기)
• 전개: (어떻게 퍼졌는지, 논란 포인트)
• 결론: (현재 상황 또는 예상 전개)

[커뮤니티 반응]
가장 추천 많이 받은 반응이나 여론 흐름 1-2줄.
"ㅋㅋ", "ㄹㅇ", "ㅇㅈ" 같은 커뮤 표현 OK.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', errorData)
      return NextResponse.json({ error: 'AI API call failed' }, { status: 500 })
    }

    const data = await response.json()
    const fullText = data.content[0]?.text || ''

    // 응답 파싱
    const aiSummaryMatch = fullText.match(/\[AI 핵심 요약\]([\s\S]*?)(?=\[커뮤니티 반응\]|$)/i)
    const communityMatch = fullText.match(/\[커뮤니티 반응\]([\s\S]*?)$/i)

    const ai_summary = aiSummaryMatch ? aiSummaryMatch[1].trim() : fullText
    const community_reaction = communityMatch ? communityMatch[1].trim() : null

    // 5. DB에 캐싱 (thumbnail_url 포함)
    const updateData: Record<string, string | null> = {
      ai_summary,
      community_reaction
    }

    // thumbnail_url이 있을 때만 업데이트
    if (thumbnail_url) {
      updateData.thumbnail_url = thumbnail_url
    }

    await supabase
      .from('rankings')
      .update(updateData)
      .eq('keyword', keyword)

    return NextResponse.json({
      ai_summary,
      community_reaction,
      thumbnail_url,
      cached: false
    })

  } catch (error) {
    console.error('Summarize API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
