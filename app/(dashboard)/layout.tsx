'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'

const NAV = [
  { href: '/',           label: '홈',     svg: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill={a ? '#3182f6' : 'none'} stroke={a ? '#3182f6' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg> },
  { href: '/expenses',   label: '가계부', svg: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#3182f6' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="16" cy="12" r="1.5" fill={a ? '#3182f6' : '#9ca3af'}/><path d="M2 9h20"/></svg> },
  { href: '/budget',     label: '예산',   svg: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#3182f6' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 8h10M7 12h10M7 16h6"/></svg> },
  { href: '/checklist',  label: '준비물', svg: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#3182f6' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-5"/></svg> },
  { href: '/schedule',   label: '일정',   svg: (a: boolean) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? '#3182f6' : '#9ca3af'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 10h18"/></svg> },
]

const QUICK_CHIPS = [
  { label: '식비 추가', href: '/expenses', emoji: '🍽' },
  { label: '이번달 예산', href: '/budget', emoji: '📋' },
  { label: '다음 일정', href: '/schedule', emoji: '📅' },
  { label: '체크리스트', href: '/checklist', emoji: '✅' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quickInput, setQuickInput] = useState('')

  useEffect(() => {
    const sb = createClient()
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/login')
      else setChecking(false)
    })
  }, [router])

  // ESC로 drawer 닫기
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass p-8 flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-3xl flex items-center justify-center text-2xl" style={{ background: 'rgba(49,130,246,0.9)' }}>✈</div>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-[#3182f6] animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ paddingBottom: '140px' }}>

      {/* 상단 헤더 - Glassmorphism */}
      <header className="sticky top-0 z-20" style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.6)',
      }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm" style={{ background: 'rgba(49,130,246,0.9)', boxShadow: '0 2px 8px rgba(49,130,246,0.3)' }}>✈</div>
            <div>
              <span className="font-bold text-[#191f28] text-sm">FRIGG</span>
              <span className="text-xs text-[#8b95a1] ml-1.5">유학 가족 관리</span>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all"
            style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.8)' }}
            aria-label="설정 열기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b95a1" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </button>
        </div>
      </header>

      {/* 콘텐츠 */}
      <main className="max-w-2xl mx-auto">
        {children}
      </main>

      {/* 하단 탭바 */}
      <nav className="fixed z-20" style={{
        bottom: '76px',
        left: 0,
        right: 0,
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid rgba(255,255,255,0.7)',
      }}>
        <div className="max-w-2xl mx-auto flex">
          {NAV.map(({ href, label, svg }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors">
                {svg(active)}
                <span className={`text-[10px] font-medium ${active ? 'text-[#3182f6]' : 'text-[#9ca3af]'}`}>{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* 하단 Quick Action Bar */}
      <div className="quick-bar pb-safe">
        <div className="max-w-2xl mx-auto px-4 pt-3 pb-2">
          {/* 추천 칩 */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-2.5">
            {QUICK_CHIPS.map(({ label, href, emoji }) => (
              <button key={label} onClick={() => router.push(href)}
                className="chip flex-shrink-0">
                <span>{emoji}</span>{label}
              </button>
            ))}
          </div>
          {/* 빠른 입력 */}
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-2xl px-3.5 py-2.5" style={{
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                className="flex-1 text-sm bg-transparent outline-none text-[#191f28] placeholder-[#9ca3af]"
                placeholder="빠른 지출 입력 또는 검색..."
                value={quickInput}
                onChange={e => setQuickInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && quickInput.trim()) {
                    router.push('/expenses')
                    setQuickInput('')
                  }
                }}
              />
              {quickInput && (
                <button onClick={() => setQuickInput('')} className="text-[#9ca3af] text-xs">✕</button>
              )}
            </div>
            <button onClick={() => router.push('/expenses')}
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#3182f6', boxShadow: '0 2px 12px rgba(49,130,246,0.35)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 오른쪽 드로어 — Progressive Disclosure */}
      {drawerOpen && (
        <>
          <div className={`drawer-overlay open`} onClick={() => setDrawerOpen(false)} />
          <div className={`drawer-panel open`}>
            <div className="p-6">
              {/* 드로어 헤더 */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-bold text-[#191f28] text-base">설정</h3>
                  <p className="text-xs text-[#8b95a1] mt-0.5">FRIGG 환경 설정</p>
                </div>
                <button onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 rounded-2xl flex items-center justify-center text-[#8b95a1]"
                  style={{ background: 'rgba(0,0,0,0.05)' }}>✕</button>
              </div>

              {/* 계정 */}
              <section className="mb-6">
                <p className="text-xs font-semibold text-[#8b95a1] uppercase tracking-wider mb-3">계정</p>
                <div className="card p-4 space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#ebf3fe] flex items-center justify-center text-lg">👤</div>
                    <div>
                      <p className="text-sm font-medium text-[#191f28]">오딘 가족</p>
                      <p className="text-xs text-[#8b95a1]">sword93@gmail.com</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 앱 설정 */}
              <section className="mb-6">
                <p className="text-xs font-semibold text-[#8b95a1] uppercase tracking-wider mb-3">앱 설정</p>
                <div className="card p-0 overflow-hidden">
                  {[
                    { icon: '💱', label: '환율', value: '$1 = ₩1,550' },
                    { icon: '🔔', label: '납부 알림', value: '3일 전' },
                    { icon: '📊', label: '기본 화면', value: '홈' },
                  ].map(({ icon, label, value }, i, arr) => (
                    <div key={label} className={`flex items-center justify-between p-4 ${i < arr.length-1 ? 'border-b border-gray-100' : ''}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-base">{icon}</span>
                        <span className="text-sm font-medium text-[#191f28]">{label}</span>
                      </div>
                      <span className="text-xs text-[#8b95a1]">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* 빠른 이동 */}
              <section className="mb-6">
                <p className="text-xs font-semibold text-[#8b95a1] uppercase tracking-wider mb-3">빠른 이동</p>
                <div className="grid grid-cols-2 gap-2">
                  {NAV.map(({ href, label }) => (
                    <button key={href} onClick={() => { router.push(href); setDrawerOpen(false) }}
                      className="card p-3 text-left flex items-center gap-2 active:scale-95 transition-transform">
                      <span className="text-sm font-medium text-[#191f28]">{label}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* 로그아웃 */}
              <button onClick={async () => {
                const sb = createClient()
                await sb.auth.signOut()
                setDrawerOpen(false)
                router.push('/login')
              }}
                className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(232,64,64,0.08)', color: '#e84040' }}>
                로그아웃
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
