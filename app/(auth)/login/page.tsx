'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const router = useRouter()
  const sb = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        const { error } = await sb.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/')
      } else {
        const { error } = await sb.auth.signUp({ email, password })
        if (error) throw error
        setError('가입 완료! 이메일을 확인하거나 바로 로그인해보세요.')
        setMode('login')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5">
      {/* 배경 장식 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full" style={{ background: 'rgba(49,130,246,0.12)', filter: 'blur(60px)' }} />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', filter: 'blur(60px)' }} />
      </div>

      <div className="w-full max-w-sm relative">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 text-3xl"
            style={{ background: 'rgba(49,130,246,0.9)', boxShadow: '0 8px 24px rgba(49,130,246,0.35)' }}>✈</div>
          <h1 className="text-2xl font-bold text-[#191f28]">FRIGG</h1>
          <p className="text-sm text-[#8b95a1] mt-1">유학 가족 통합 관리</p>
        </div>

        {/* 로그인 카드 - Glass */}
        <div className="glass p-6">
          <h2 className="font-bold text-[#191f28] text-base mb-5">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">이메일</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input w-full" placeholder="email@example.com" required />
            </div>
            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">비밀번호</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="input w-full" placeholder="6자 이상" required minLength={6} />
            </div>

            {error && (
              <div className="rounded-2xl p-3 text-xs" style={{ background: 'rgba(49,130,246,0.08)', color: '#3182f6' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
          </form>

          <div className="mt-4 pt-4 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-xs text-[#8b95a1]">
              {mode === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
              <span style={{ color: '#3182f6', fontWeight: 600 }}>
                {mode === 'login' ? '회원가입' : '로그인'}
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[#8b95a1] mt-5">
          오딘 가족 전용 · Powered by Mimir &amp; FRIGG
        </p>
      </div>
    </div>
  )
}
