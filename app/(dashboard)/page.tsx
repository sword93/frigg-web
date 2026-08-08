'use client'
import { useEffect, useState } from 'react'
import { createClient, fmtUsd, fmtKrw, usdToKrw, EXCHANGE_RATE } from '@/lib/supabase'
import { Expense, BudgetItem } from '@/lib/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#3182f6','#00c73c','#f59100','#e84040','#8b5cf6','#06b6d4','#f97316']

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [recent, setRecent] = useState<Expense[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [error, setError] = useState<string | null>(null)
  const sb = createClient()

  useEffect(() => {
    const ms = `${year}-${String(month).padStart(2,'0')}-01`
    const me = month < 12 ? `${year}-${String(month+1).padStart(2,'0')}-01` : `${year+1}-01-01`

    sb.from('expenses')
      .select('amount_usd,amount_krw,category,expense_date,name,paid_by')
      .gte('expense_date', ms)
      .lt('expense_date', me)
      .then(({ data, error: err }) => {
        if (err) { setError('지출 데이터를 불러오는 데 실패했어요.'); return }
        setExpenses((data || []) as Expense[])
      })

    sb.from('budget_items')
      .select('*')
      .then(({ data, error: err }) => {
        if (err) { setError('예산 데이터를 불러오는 데 실패했어요.'); return }
        setBudget((data || []) as BudgetItem[])
      })

    sb.from('expenses')
      .select('expense_date,name,category,amount_usd,amount_krw,paid_by')
      .order('expense_date', { ascending: false })
      .limit(5)
      .then(({ data, error: err }) => {
        if (err) { setError('최근 지출을 불러오는 데 실패했어요.'); return }
        setRecent((data || []) as Expense[])
      })
  }, [year, month])

  const totalSpent = expenses.reduce((s, e) => s + (e.amount_usd || 0), 0)
  const monthly = budget.filter(b => b.cycle === '매월')
  const totalBudget = monthly.reduce((s, b) => s + (b.amount_usd || 0), 0)
  const remain = totalBudget - totalSpent
  const pct = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0
  const today = new Date()

  const pieData = Object.entries(
    expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount_usd; return acc }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }))

  const dueSoon = monthly.filter(b => b.due_day && b.due_day >= today.getDate() && b.due_day <= today.getDate() + 3)

  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }

  const pctColor = pct > 90 ? '#e84040' : pct > 70 ? '#f59100' : '#00c73c'

  return (
    <div className="px-4 py-5 space-y-4">

      {/* 에러 배너 */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl"
          style={{ background: '#fff0f0', border: '1px solid #fecaca' }}>
          <span style={{ color: '#e84040', fontSize: 14 }}>⚠️</span>
          <p className="text-sm flex-1" style={{ color: '#b91c1c' }}>{error}</p>
          <button onClick={() => setError(null)} className="text-xs font-bold" style={{ color: '#b91c1c' }}>✕</button>
        </div>
      )}

      {/* 납부 임박 알림 */}
      {dueSoon.length > 0 && (
        <div className="card" style={{ background: '#fff8eb', borderLeft: '3px solid #f59100' }}>
          <div className="flex items-center gap-2 mb-1">
            <span style={{ color: '#f59100', fontSize: 14 }}>⏰</span>
            <p className="text-xs font-bold" style={{ color: '#b36800' }}>납부 임박</p>
          </div>
          {dueSoon.map(b => (
            <p key={b.id} className="text-xs" style={{ color: '#b36800' }}>{b.due_day}일 · {b.name} · {fmtUsd(b.amount_usd)}</p>
          ))}
        </div>
      )}

      {/* 월 선택 */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-gray-500 text-lg font-bold" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>‹</button>
        <span className="font-bold text-[#191f28] text-base">{year}년 {month}월</span>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-gray-500 text-lg font-bold" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>›</button>
      </div>

      {/* 메인 지출 요약 카드 */}
      <div className="card" style={{ background: '#3182f6' }}>
        <p className="text-xs font-medium mb-1" style={{ color: 'rgba(255,255,255,0.7)' }}>이번 달 지출</p>
        <p className="text-3xl font-bold text-white mb-0.5">{fmtUsd(totalSpent)}</p>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{fmtKrw(usdToKrw(totalSpent))}</p>
        <div className="mt-3 bg-white/20 rounded-full h-1.5">
          <div className="bg-white h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>예산 {pct}% 사용</span>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>/ {fmtUsd(totalBudget)}</span>
        </div>
      </div>

      {/* 보조 지표 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-[#8b95a1] mb-1">잔여 예산</p>
          <p className="text-xl font-bold" style={{ color: remain >= 0 ? '#00c73c' : '#e84040' }}>{fmtUsd(remain)}</p>
          <p className="text-xs text-[#8b95a1] mt-0.5">{fmtKrw(usdToKrw(Math.abs(remain)))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-[#8b95a1] mb-1">소진율</p>
          <p className="text-xl font-bold" style={{ color: pctColor }}>{pct}%</p>
          <p className="text-xs text-[#8b95a1] mt-0.5">{remain >= 0 ? `$${remain.toFixed(0)} 남음` : '예산 초과'}</p>
        </div>
      </div>

      {/* 카테고리 파이차트 */}
      {pieData.length > 0 && (
        <div className="card">
          <p className="section-title">카테고리별 지출</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`}
                labelLine={false} fontSize={10}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtUsd(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 납부 예정 */}
      {monthly.filter(b => b.due_day).length > 0 && (
        <div className="card">
          <p className="section-title">이번 달 납부 예정</p>
          <div className="space-y-3">
            {monthly.filter(b => b.due_day).sort((a, b) => (a.due_day||0) - (b.due_day||0)).map(b => {
              const done = today.getDate() > (b.due_day||0)
              return (
                <div key={b.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                      {done ? '✓' : b.due_day}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#191f28]">{b.name}</p>
                      <p className="text-xs text-[#8b95a1]">{done ? '납부 완료' : `${b.due_day}일 예정`}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#191f28]">{fmtUsd(b.amount_usd)}</p>
                    <p className="text-xs text-[#8b95a1]">{fmtKrw(b.amount_krw)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 최근 지출 */}
      <div className="card">
        <p className="section-title">최근 지출</p>
        {recent.length === 0 ? (
          <p className="text-sm text-[#8b95a1] text-center py-4">지출 내역이 없어요</p>
        ) : (
          <div className="space-y-3">
            {recent.map(e => (
              <div key={e.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#ebf3fe] flex items-center justify-center">
                    <span className="text-xs">{catIcon(e.category)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#191f28]">{e.name}</p>
                    <p className="text-xs text-[#8b95a1]">{e.expense_date} · {e.category}</p>
                  </div>
                </div>
                <p className="text-sm font-bold text-[#191f28]">{fmtUsd(e.amount_usd)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[#8b95a1] pb-2">환율 $1 = ₩{EXCHANGE_RATE.toLocaleString()}</p>
    </div>
  )
}

function catIcon(cat: string) {
  const m: Record<string, string> = {
    '식비':'🍽','주거':'🏠','교통':'🚌','보험':'🛡','학업':'📚','의료':'💊','통신':'📱','여행':'✈','의류':'👕','생활':'🛒','기타':'📌'
  }
  return m[cat] || '💳'
}
