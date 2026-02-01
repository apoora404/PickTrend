import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '서비스 소개 - PickTrend',
  description: 'PickTrend는 한국 주요 커뮤니티의 인기 게시글을 수집하고 분류하여 실시간 트렌드를 제공하는 서비스입니다.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-bg-main">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-gray-900">
            PickTrend
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">서비스 소개</h1>

        <div className="space-y-12">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">PickTrend란?</h2>
            <p className="text-gray-700 leading-relaxed">
              PickTrend는 한국 주요 커뮤니티(디시인사이드, 루리웹, 뽐뿌, 인벤)의 인기 게시글을
              자동으로 수집하고 AI 기반으로 카테고리 분류하여 실시간 트렌드를 제공하는 서비스입니다.
              바쁜 일상 속에서 빠르게 오늘의 핫이슈를 확인하세요.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">주요 기능</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">실시간 랭킹</h3>
                <p className="text-gray-600 text-sm">
                  인기도 점수 기반으로 정렬된 실시간 랭킹을 확인할 수 있습니다.
                  30분, 1시간, 12시간, 24시간 단위로 필터링 가능합니다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">🏷️</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">카테고리 분류</h3>
                <p className="text-gray-600 text-sm">
                  정치, 스포츠, 연예, 경제, 게임, 일반 이슈 등 6개 카테고리로
                  자동 분류되어 원하는 분야의 트렌드만 볼 수 있습니다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">📱</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">반응형 디자인</h3>
                <p className="text-gray-600 text-sm">
                  모바일과 데스크탑 모두에서 최적화된 UI를 제공합니다.
                  뷰 모드를 수동으로 전환할 수도 있습니다.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl mb-3">🔗</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">원본 링크 제공</h3>
                <p className="text-gray-600 text-sm">
                  모든 이슈에 대해 원본 게시글 링크를 제공하여
                  더 자세한 내용을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">데이터 수집 방식</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              PickTrend는 다음과 같은 방식으로 데이터를 수집합니다:
            </p>
            <ol className="list-decimal pl-6 text-gray-700 space-y-3">
              <li>
                <strong>크롤링:</strong> 주요 커뮤니티 사이트의 인기글 목록을 정기적으로 수집합니다.
              </li>
              <li>
                <strong>분류:</strong> 규칙 기반 AI가 키워드 분석을 통해 게시글을 카테고리로 분류합니다.
              </li>
              <li>
                <strong>점수 계산:</strong> 조회수, 추천수 등을 기반으로 인기도 점수를 계산합니다.
              </li>
              <li>
                <strong>업데이트:</strong> 매시간 자동으로 데이터가 갱신됩니다.
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">수집 출처</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm">디시인사이드</span>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm">루리웹</span>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm">뽐뿌</span>
              <span className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 text-sm">인벤</span>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">연락처 및 피드백</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              서비스 관련 문의, 버그 제보, 기능 제안 등은 아래로 연락해 주세요.
            </p>
            <div className="space-y-2">
              <p className="text-gray-700">
                <strong>이메일:</strong>{' '}
                <a
                  href="mailto:jbh6134@gmail.com"
                  className="text-blue-600 hover:underline"
                >
                  jbh6134@gmail.com
                </a>
              </p>
              <p className="text-gray-700">
                <strong>GitHub:</strong>{' '}
                <a
                  href="https://github.com/apoora404/PickTrend"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  github.com/apoora404/PickTrend
                </a>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">면책 조항</h2>
            <p className="text-gray-700 leading-relaxed">
              PickTrend는 정보 제공 목적으로만 운영되며, 수집된 콘텐츠의 정확성이나
              신뢰성을 보장하지 않습니다. 원본 게시글의 저작권은 각 원저작자에게 있으며,
              PickTrend는 링크만 제공합니다.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">홈</Link>
            <Link href="/about" className="hover:text-gray-700">서비스 소개</Link>
            <Link href="/privacy" className="hover:text-gray-700">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
