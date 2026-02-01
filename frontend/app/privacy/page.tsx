import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '개인정보처리방침 - PickTrend',
  description: 'PickTrend 서비스의 개인정보처리방침입니다.',
}

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">개인정보처리방침</h1>

        <div className="prose prose-gray max-w-none space-y-8">
          <p className="text-gray-600">
            최종 업데이트: 2026년 2월 2일
          </p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">1. 수집하는 정보</h2>
            <p className="text-gray-700 mb-4">
              PickTrend는 서비스 제공을 위해 다음과 같은 정보를 자동으로 수집할 수 있습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>기기 정보 (브라우저 종류, 운영체제)</li>
              <li>접속 로그 (IP 주소, 접속 시간, 페이지 뷰)</li>
              <li>쿠키 및 유사 기술을 통해 수집되는 정보</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">2. 정보 사용 목적</h2>
            <p className="text-gray-700 mb-4">
              수집된 정보는 다음 목적으로 사용됩니다:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>서비스 제공 및 운영</li>
              <li>서비스 개선 및 분석</li>
              <li>사용자 경험 최적화</li>
              <li>광고 게재 (Google AdSense)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. 쿠키 정책</h2>
            <p className="text-gray-700 mb-4">
              PickTrend는 다음과 같은 목적으로 쿠키를 사용합니다:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>사용자 설정 저장 (다크 모드, 뷰 모드 등)</li>
              <li>서비스 이용 통계 수집</li>
              <li>광고 맞춤화</li>
            </ul>
            <p className="text-gray-700 mt-4">
              브라우저 설정을 통해 쿠키를 거부할 수 있으나, 일부 서비스 기능이 제한될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">4. 제3자 서비스</h2>
            <p className="text-gray-700 mb-4">
              PickTrend는 다음과 같은 제3자 서비스를 사용합니다:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>
                <strong>Google AdSense:</strong> 광고 게재를 위해 사용됩니다.
                Google의 개인정보처리방침은{' '}
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  여기
                </a>
                에서 확인할 수 있습니다.
              </li>
              <li>
                <strong>Supabase:</strong> 데이터베이스 서비스로 사용됩니다.
              </li>
              <li>
                <strong>Vercel:</strong> 웹 호스팅 서비스로 사용됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">5. 정보의 보관 및 보호</h2>
            <p className="text-gray-700">
              수집된 정보는 서비스 운영에 필요한 기간 동안 보관되며,
              관련 법령에 따른 보관 의무가 있는 경우 해당 기간 동안 보관됩니다.
              PickTrend는 개인정보 보호를 위해 기술적, 관리적 보안 조치를 취하고 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">6. 사용자 권리</h2>
            <p className="text-gray-700 mb-4">
              사용자는 다음과 같은 권리를 행사할 수 있습니다:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2">
              <li>개인정보 열람 요청</li>
              <li>개인정보 정정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>처리 제한 요청</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">7. 개인정보처리방침 변경</h2>
            <p className="text-gray-700">
              본 개인정보처리방침은 법률 또는 서비스 변경에 따라 수정될 수 있습니다.
              변경 시 본 페이지를 통해 공지합니다.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">8. 연락처</h2>
            <p className="text-gray-700">
              개인정보 관련 문의사항은 아래 이메일로 연락해 주시기 바랍니다.
            </p>
            <p className="text-gray-700 mt-2">
              <strong>이메일:</strong>{' '}
              <a
                href="mailto:jbh6134@gmail.com"
                className="text-blue-600 hover:underline"
              >
                jbh6134@gmail.com
              </a>
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
