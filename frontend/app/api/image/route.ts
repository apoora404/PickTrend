import { NextRequest, NextResponse } from 'next/server'

// 이미지 프록시 API - Hotlinking 방지 우회
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'url parameter is required' }, { status: 400 })
  }

  try {
    // URL 디코딩 (이중 인코딩 방지)
    const decodedUrl = decodeURIComponent(url)

    // URL 유효성 검사
    let imageUrl: URL
    try {
      imageUrl = new URL(decodedUrl)
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // 허용된 프로토콜만 허용
    if (!['http:', 'https:'].includes(imageUrl.protocol)) {
      return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 })
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃

    // 사이트별 Referer 설정
    const referer = imageUrl.origin + '/'

    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        'Referer': referer,
        'Sec-Fetch-Dest': 'image',
        'Sec-Fetch-Mode': 'no-cors',
        'Sec-Fetch-Site': 'cross-site',
      },
      signal: controller.signal,
      redirect: 'follow', // 리다이렉트 자동 추적
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Image proxy failed: ${response.status} ${response.statusText} for ${decodedUrl}`)
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // 이미지 타입 검증 (일부 사이트는 octet-stream으로 반환)
    const isImage = contentType.startsWith('image/') ||
                    contentType === 'application/octet-stream' ||
                    contentType.includes('binary')

    if (!isImage) {
      console.error(`Not an image: ${contentType} for ${decodedUrl}`)
      return NextResponse.json({ error: `Not an image: ${contentType}` }, { status: 400 })
    }

    const imageBuffer = await response.arrayBuffer()

    // 빈 응답 체크
    if (imageBuffer.byteLength === 0) {
      console.error(`Empty image response for ${decodedUrl}`)
      return NextResponse.json({ error: 'Empty image response' }, { status: 400 })
    }

    // Content-Type 추론 (octet-stream인 경우)
    let finalContentType = contentType
    if (contentType === 'application/octet-stream' || contentType.includes('binary')) {
      // URL 확장자로 추론
      if (decodedUrl.includes('.jpg') || decodedUrl.includes('.jpeg')) {
        finalContentType = 'image/jpeg'
      } else if (decodedUrl.includes('.png')) {
        finalContentType = 'image/png'
      } else if (decodedUrl.includes('.gif')) {
        finalContentType = 'image/gif'
      } else if (decodedUrl.includes('.webp')) {
        finalContentType = 'image/webp'
      } else {
        finalContentType = 'image/jpeg' // 기본값
      }
    }

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': finalContentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600', // 1시간 캐시
        'Access-Control-Allow-Origin': '*',
      }
    })
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)

    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Image proxy timeout for ${url}`)
      return NextResponse.json({ error: 'Request timeout' }, { status: 408 })
    }

    console.error(`Image proxy error for ${url}:`, errMsg)
    return NextResponse.json({ error: `Failed to proxy image: ${errMsg}` }, { status: 500 })
  }
}
