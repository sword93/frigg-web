'use client'
import { useEffect, useState } from 'react'
import { createClient, fmtUsd, fmtKrw, usdToKrw, EXCHANGE_RATE } from '@/lib/supabase'
import { Expense, BudgetItem } from '@/lib/types'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = ['#1e3a5f','#f4a430','#2ea878','#e05c5c','#7b5ea7','#4a9eda','#e87c3e']

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [recent, setRecent] = useState<Expense[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const sb = createClient()

  useEffect(() => {
    const ms = `${year}-${String(month).padStart(2,'0')}-01`
    const me = month < 12 ? `${year}-${String(month+1).padStart(2,'0')}-01` : `${year+1}-01-01`
    sb.from('expenses').select('amount_usd,amount_krw,category,expense_date,name,paid_by').gte('expense_date', ms).lt('expense_date', me).then(({ data }) => setExpenses((data || []) as Expense[]))
    sb.from('budget_items').select('*').then(({ data }) => setBudget((data || []) as BudgetItem[]))
    sb.from('expenses').select('expense_date,name,category,amount_usd,amount_krw,paid_by').order('expense_date', { ascending: false }).limit(5).then(({ data }) => setRecent((data || []) as Expense[]))
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

  return (
    <div className="p-4 space-y-4">
      {/* D-3 납부 알림 */}
      {dueSoon.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
          <p className="text-xs font-bold text-orange-700 mb-1">⏰ 납부 임박</p>
          {dueSoon.map(b => (
            <p key={b.id} className="text-xs text-orange-600">{b.due_day}일 · {b.name} · {fmtUsd(b.amount_usd)}</p>
          ))}
        </div>
      )}

      {/* 월 선택 */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="btn-ghost px-3 py-1">‹</button>
        <h2 className="font-bold text-[#1e3a5f]">{year}년 {month}월</h2>
        <button onClick={nextMonth} className="btn-ghost px-3 py-1">›</button>
      </div>

      {/* 지표 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-gray-400">이번 달 지출</p>
          <p className="text-lg font-bold text-[#1e3a5f]">{fmtUsd(totalSpent)}</p>
          <p className="text-xs text-gray-400">{fmtKrw(usdToKrw(totalSpent))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">월 예산 합계</p>
          <p className="text-lg font-bold text-[#1e3a5f]">{fmtUsd(totalBudget)}</p>
          <p className="text-xs text-gray-400">{fmtKrw(usdToKrw(totalBudget))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">잔여 예산</p>
          <p className={`text-lg font-bold ${remain >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmtUsd(remain)}</p>
          <p className="text-xs text-gray-400">{fmtKrw(usdToKrw(Math.abs(remain)))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400">예산 소진율</p>
          <p className={`text-lg font-bold ${pct > 90 ? 'text-red-500' : pct > 70 ? 'text-orange-500' : 'text-green-600'}`}>{pct}%</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
            <div className="bg-[#f4a430] h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* 파이 차트 */}
      {pieData.length > 0 && (
        <div className="card">
          <p className="section-title">카테고리별 지출</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtUsd(v)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 납부 예정 */}
      <div className="card">
        <p className="section-title">⏰ 이번 달 납부 예정</p>
        <div className="space-y-2">
          {monthly.filter(b => b.due_day).sort((a, b) => (a.due_day||0) - (b.due_day||0)).map(b => (
            <div key={b.id} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm">{today.getDate() > (b.due_day||0) ? '✅' : '⏰'}</span>
                <div>
                  <p className="text-sm font-medium">{b.name}</p>
                  <p className="text-xs text-gray-400">{b.due_day}일</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-[#1e3a5f]">{fmtUsd(b.amount_usd)}</p>
                <p className="text-xs text-gray-400">{fmtKrw(b.amount_krw)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 최근 지출 */}
      <div className="card">
        <p className="section-title">최근 지출</p>
        <div className="space-y-2">
          {recent.map(e => (
            <div key={e.id} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium">{e.name}</p>
                <p className="text-xs text-gray-400">{e.expense_date} · {e.category} · {e.paid_by}</p>
              </div>
              <p className="text-sm font-bold text-[#1e3a5f]">{fmtUsd(e.amount_usd)}</p>
            </div>
          ))}
          {recent.length === 0 && <p className="text-sm text-gray-400 text-center py-2">지출 내역이 없어요</p>}
        </div>
      </div>

      <p className="text-center text-xs text-gray-300 pb-2">환율 $1 = ₩{EXCHANGE_RATE.toLocaleString()}</p>
    </div>
  )
}
