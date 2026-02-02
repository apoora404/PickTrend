import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Anthropic API 직접 호출 (MoltWorker 불필요)
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY

// Supabase 서버사이드 클라이언트 (Service Role Key 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { keyword, title, source_urls } = await request.json()

    if (!keyword) {
      return NextResponse.json({ error: 'keyword is required' }, { status: 400 })
    }

    // 1. 캐싱 체크: DB에 이미 요약이 있는지 확인
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: existing } = await supabase
      .from('rankings')
      .select('ai_summary, community_reaction')
      .eq('keyword', keyword)
      .single()

    // 캐시된 요약이 있으면 바로 반환
    if (existing?.ai_summary) {
      return NextResponse.json({
        ai_summary: existing.ai_summary,
        community_reaction: existing.community_reaction,
        cached: true
      })
    }

    // 2. Anthropic API 직접 호출
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
    }

    const prompt = `당신은 한국 커뮤니티 트렌드 분석 전문가입니다.

아래 키워드/제목에 대해 분석해주세요:
키워드: ${title || keyword}
관련 출처: ${source_urls?.join(', ') || '없음'}

다음 형식으로 답변해주세요:

[AI 핵심 요약]
- 이 이슈가 무엇인지 3줄 이내로 핵심만 요약
- 왜 지금 화제인지
- 관련된 주요 인물/사건

[커뮤니티 반응]
- 커뮤니티에서 이 이슈에 대한 일반적인 여론
- 찬성/반대 의견이 있다면 양쪽 관점
- 주요 밈이나 유행어가 있다면 언급

간결하고 객관적으로 작성해주세요. 각 섹션은 2-4문장으로 제한합니다.`

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

    // 3. DB에 캐싱
    await supabase
      .from('rankings')
      .update({
        ai_summary,
        community_reaction
      })
      .eq('keyword', keyword)

    return NextResponse.json({
      ai_summary,
      community_reaction,
      cached: false
    })

  } catch (error) {
    console.error('Summarize API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
