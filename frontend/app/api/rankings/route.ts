import { NextRequest, NextResponse } from 'next/server'
import { getRankings, Category } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get('category') as Category | null
  const limit = parseInt(searchParams.get('limit') || '20', 10)

  try {
    const rankings = await getRankings(category ?? undefined, limit)
    return NextResponse.json({
      success: true,
      data: rankings,
      count: rankings.length,
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rankings' },
      { status: 500 }
    )
  }
}
