'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const NAV = [
  { href: '/',           icon: '🏠', label: '홈'     },
  { href: '/expenses',   icon: '💰', label: '가계부' },
  { href: '/budget',     icon: '📋', label: '예산'   },
  { href: '/checklist',  icon: '✅', label: '준비물' },
  { href: '/schedule',   icon: '📅', label: '일정'   },
]

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
      <div className="min-h-screen flex items-center justify-center bg-[#f5f7fa]">
        <div className="text-2xl animate-pulse">✈️</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] pb-20">
      {/* 상단 헤더 */}
      <header className="bg-[#1e3a5f] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">✈️</span>
          <span className="font-bold text-sm">FRIGG</span>
        </div>
        <button
          onClick={async () => {
            const sb = createClient()
            await sb.auth.signOut()
            router.push('/login')
          }}
          className="text-xs text-white/60 hover:text-white"
        >
          로그아웃
        </button>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-2xl mx-auto">
        {children}
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="max-w-2xl mx-auto flex">
          {NAV.map(({ href, icon, label }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center py-2 text-xs gap-0.5 transition-colors ${
                  active ? 'text-[#1e3a5f] font-bold' : 'text-gray-400'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span>{label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-[#f4a430]" />}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
