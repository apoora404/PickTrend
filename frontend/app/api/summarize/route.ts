import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Anthropic API 직접 호출 (MoltWorker 불필요)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Supabase 서버사이드 클라이언트 (Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

// 베스트 댓글 타입
interface BestComment {
  author?: string
  content: string
  likes?: number
}

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
    const imgMatches = Array.from(html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi))
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

// 베스트 댓글 추출 (사이트별 파싱)
async function fetchBestComments(url: string): Promise<BestComment[]> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    const html = await res.text()
    const comments: BestComment[] = []

    // 디시인사이드 댓글 파싱
    if (url.includes('dcinside')) {
      // 댓글 내용: <p class="usertxt">...</p>
      // 추천수: <span class="up_num">...</span> 또는 <em class="num_count">...</em>
      const commentPattern = /<li[^>]*class="[^"]*ub-content[^"]*"[^>]*>[\s\S]*?<p[^>]*class="usertxt[^"]*"[^>]*>([\s\S]*?)<\/p>[\s\S]*?(?:<em[^>]*>(\d+)<\/em>|<span[^>]*up_num[^>]*>(\d+)<\/span>)?/gi
      let match
      while ((match = commentPattern.exec(html)) !== null) {
        const content = match[1]?.replace(/<[^>]+>/g, '').trim()
        const likes = parseInt(match[2] || match[3] || '0', 10)
        if (content && content.length > 5 && content.length < 200) {
          comments.push({ content, likes })
        }
      }
    }

    // 루리웹 댓글 파싱
    if (url.includes('ruliweb')) {
      // <div class="text_wrapper">...</div>, 추천: <span class="like">...</span>
      const commentPattern = /<div[^>]*class="[^"]*text_wrapper[^"]*"[^>]*>([\s\S]*?)<\/div>[\s\S]*?<span[^>]*class="[^"]*like[^"]*"[^>]*>(\d+)<\/span>/gi
      let match
      while ((match = commentPattern.exec(html)) !== null) {
        const content = match[1]?.replace(/<[^>]+>/g, '').trim()
        const likes = parseInt(match[2] || '0', 10)
        if (content && content.length > 5 && content.length < 200) {
          comments.push({ content, likes })
        }
      }
    }

    // 뽐뿌 댓글 파싱
    if (url.includes('ppomppu')) {
      // 간단한 댓글 영역 파싱
      const commentPattern = /<td[^>]*class="[^"]*cmt_contents[^"]*"[^>]*>([\s\S]*?)<\/td>/gi
      let match
      while ((match = commentPattern.exec(html)) !== null) {
        const content = match[1]?.replace(/<[^>]+>/g, '').trim()
        if (content && content.length > 5 && content.length < 200) {
          comments.push({ content, likes: 0 })
        }
      }
    }

    // 추천수 기준 정렬 후 상위 5개 반환
    return comments
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 5)
  } catch {
    return []
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
    const { keyword, title, source_urls, force_refresh, thumbnail_only } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
    }

    // 환경변수 체크
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing env vars:', {
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!supabaseServiceKey
      })
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 캐싱 체크: force_refresh가 아니면 DB에서 기존 요약 확인
    if (!force_refresh) {
      const { data: existing } = await supabase
        .from('rankings')
        .select('ai_summary, community_reaction, thumbnail_url, best_comments')
        .eq('keyword', keyword)
        .single()

      // 캐시된 요약이 있으면 바로 반환
      if (existing?.ai_summary) {
        return NextResponse.json({
          ai_summary: existing.ai_summary,
          community_reaction: existing.community_reaction,
          thumbnail_url: existing.thumbnail_url,
          best_comments: existing.best_comments,
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

    // thumbnail_only 모드: 썸네일만 추출 후 빠르게 반환 (Claude API 호출 없음)
    if (thumbnail_only) {
      if (thumbnail_url) {
        // DB에 썸네일 저장
        await supabase
          .from('rankings')
          .update({ thumbnail_url })
          .eq('keyword', keyword)
      }
      return NextResponse.json({
        thumbnail_url,
        thumbnail_only: true
      })
    }

    // 3. 원문 컨텐츠 가져오기
    const fetchedContent = await fetchSourceContent(source_urls || [])

    // 3.5 베스트 댓글 수집
    let bestComments: BestComment[] = []
    if (source_urls?.length) {
      bestComments = await fetchBestComments(source_urls[0])
    }

    // 4. Anthropic API 직접 호출
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    // 베스트 댓글 포맷팅 (프롬프트용)
    const commentsForPrompt = bestComments.length > 0
      ? bestComments.map((c, i) => `${i + 1}. ${c.likes ? `(${c.likes}추천) ` : ''}"${c.content}"`).join('\n')
      : '(수집된 댓글 없음)'

    // MZ 스타일 프롬프트 (이모지 + 찰진 말투 + 댓글 맥락)
    const prompt = `너는 한국 커뮤니티 트렌드를 요약하는 MZ세대 에디터야.
존댓말 NO, 반말 OK. 짧고 임팩트 있게 핵심만 전달해.

[키워드]
${title || keyword}

[원문 내용]
${fetchedContent || '(본문 없음 - 키워드 기반으로 추론해)'}

[베스트 댓글]
${commentsForPrompt}

---

[AI 핵심 요약]
정확히 3문장으로 작성해. 번호나 레이블 붙이지 마. 이모지 1-2개 포함.
첫째 문장: 이슈가 터진 계기
둘째 문장: 어떻게 퍼졌는지
셋째 문장: 현재 상황

예시 형식:
유튜버 A가 논란 발언을 해서 난리남 🔥
트위터에서 실검 1위 찍고 커뮤니티마다 글 올라옴
결국 사과문 올렸는데 반응은 싸늘함 💀

[커뮤니티 반응]
베스트 댓글 분석해서 여론의 핵심을 1-2줄로 정리해.
"ㅋㅋ", "ㄹㅇ", "ㅇㅈ", "레전드", "역대급" 같은 커뮤 표현 적극 사용.
실제 댓글 인용하면 더 좋음.

[베스트 댓글 선별]
가장 공감이 많거나 재밌는 댓글 2-3개를 선별해서 원문 그대로 인용해.
각 줄에 하나씩, 따옴표로 감싸서.`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Anthropic API error:', response.status, errorData)
      return NextResponse.json({
        error: 'AI API call failed',
        status: response.status,
        details: errorData.slice(0, 200)
      }, { status: 500 })
    }

    const data = await response.json()
    const fullText = data.content[0]?.text || ''

    // 응답 파싱
    const aiSummaryMatch = fullText.match(/\[AI 핵심 요약\]([\s\S]*?)(?=\[커뮤니티 반응\]|$)/i)
    const communityMatch = fullText.match(/\[커뮤니티 반응\]([\s\S]*?)(?=\[베스트 댓글 선별\]|$)/i)
    const bestCommentsMatch = fullText.match(/\[베스트 댓글 선별\]([\s\S]*?)$/i)

    const ai_summary = aiSummaryMatch ? aiSummaryMatch[1].trim() : fullText
    const community_reaction = communityMatch ? communityMatch[1].trim() : null

    // AI가 선별한 베스트 댓글 파싱 (또는 원본 사용)
    let finalBestComments: BestComment[] = bestComments
    if (bestCommentsMatch) {
      const aiSelectedComments = bestCommentsMatch[1]
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line.startsWith('"') || line.includes('"'))
        .map((line: string) => {
          // "댓글 내용" 형태에서 내용 추출
          const match = line.match(/"([^"]+)"/)
          return match ? { content: match[1] } : null
        })
        .filter((c: BestComment | null): c is BestComment => c !== null)
        .slice(0, 3)

      if (aiSelectedComments.length > 0) {
        finalBestComments = aiSelectedComments
      }
    }

    // 5. DB에 캐싱 (thumbnail_url, best_comments 포함)
    const updateData: Record<string, unknown> = {
      ai_summary,
      community_reaction
    }

    // thumbnail_url이 있을 때만 업데이트
    if (thumbnail_url) {
      updateData.thumbnail_url = thumbnail_url
    }

    // best_comments가 있을 때만 업데이트
    if (finalBestComments.length > 0) {
      updateData.best_comments = finalBestComments
    }

    await supabase
      .from('rankings')
      .update(updateData)
      .eq('keyword', keyword)

    return NextResponse.json({
      ai_summary,
      community_reaction,
      thumbnail_url,
      best_comments: finalBestComments.length > 0 ? finalBestComments : null,
      cached: false
    })

  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error('Summarize API error:', errMsg, error)
    return NextResponse.json({ error: `Internal server error: ${errMsg}` }, { status: 500 })
  }
}
