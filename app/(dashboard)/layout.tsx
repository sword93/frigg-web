'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const NAV = [
  { href: '/',           icon: HomeIcon,    label: '홈'     },
  { href: '/expenses',   icon: WalletIcon,  label: '가계부' },
  { href: '/budget',     icon: ListIcon,    label: '예산'   },
  { href: '/checklist',  icon: CheckIcon,   label: '준비물' },
  { href: '/schedule',   icon: CalIcon,     label: '일정'   },
]

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#3182f6' : 'none'} stroke={active ? '#3182f6' : '#8b95a1'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
      <path d="M9 21V12h6v9"/>
    </svg>
  )
}
function WalletIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3182f6' : '#8b95a1'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2"/>
      <path d="M16 12a1 1 0 100 2 1 1 0 000-2z" fill={active ? '#3182f6' : '#8b95a1'}/>
      <path d="M2 9h20"/>
    </svg>
  )
}
function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3182f6' : '#8b95a1'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3"/>
      <path d="M7 8h10M7 12h10M7 16h6"/>
    </svg>
  )
}
function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3182f6' : '#8b95a1'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <path d="M8 12l3 3 5-5"/>
    </svg>
  )
}
function CalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#3182f6' : '#8b95a1'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2"/>
      <path d="M8 2v4M16 2v4M3 10h18"/>
    </svg>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setChecking(false)
    })
  }, [router])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f2f4f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#3182f6] flex items-center justify-center">
            <span className="text-white text-lg">✈</span>
          </div>
          <div className="flex gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#3182f6] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f2f4f6] pb-20">
      {/* 상단 헤더 */}
      <header className="bg-white sticky top-0 z-10" style={{ boxShadow: '0 1px 0 #e8eaed' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#3182f6] flex items-center justify-center">
              <span className="text-white text-xs">✈</span>
            </div>
            <span className="font-bold text-[#191f28] text-base">FRIGG</span>
          </div>
          <button
            onClick={async () => {
              const sb = createClient()
              await sb.auth.signOut()
              router.push('/login')
            }}
            className="text-xs text-[#8b95a1] hover:text-[#191f28] transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-2xl mx-auto">
        {children}
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white z-10" style={{ boxShadow: '0 -1px 0 #e8eaed' }}>
        <div className="max-w-2xl mx-auto flex" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors"
              >
                <Icon active={active} />
                <span className={`text-[10px] font-medium ${active ? 'text-[#3182f6]' : 'text-[#8b95a1]'}`}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
