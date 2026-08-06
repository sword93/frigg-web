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
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">✈️</div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">FRIGG</h1>
          <p className="text-sm text-gray-500 mt-1">유학 가족 통합 관리</p>
        </div>

        {/* 로그인 폼 */}
        <div className="card">
          <h2 className="font-bold text-[#1e3a5f] mb-4">
            {mode === 'login' ? '로그인' : '회원가입'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="email@example.com"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="비밀번호"
                required
                minLength={6}
              />
            </div>
            {error && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg p-2">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '가입하기'}
            </button>
          </form>
          <button
            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            className="text-xs text-gray-400 mt-3 w-full text-center"
          >
            {mode === 'login' ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          오딘 가족 전용 · Powered by Mimir & FRIGG
        </p>
      </div>
    </div>
  )
}
