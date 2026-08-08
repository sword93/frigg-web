'use client'
import { useEffect, useState } from 'react'
import { createClient, fmtUsd, fmtKrw, usdToKrw } from '@/lib/supabase'
import { Expense, CATEGORIES, PAY_METHODS } from '@/lib/types'

const EMPTY: Partial<Expense> = { name: '', category: '식비', amount_usd: 0, paid_by: '아빠', expense_date: new Date().toISOString().slice(0,10) }

const CAT_ICON: Record<string, string> = {
  '식비':'🍽','주거':'🏠','교통':'🚌','보험':'🛡','학업':'📚','의료':'💊','통신':'📱','여행':'✈','의류':'👕','생활':'🛒','기타':'📌'
}

export default function ExpensesPage() {
  const sb = createClient()
  const [rows, setRows] = useState<Expense[]>([])
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [form, setForm] = useState<Partial<Expense>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterCat, setFilterCat] = useState<string>('전체')

  async function load() {
    const ms = `${year}-${String(month).padStart(2,'0')}-01`
    const me = month < 12 ? `${year}-${String(month+1).padStart(2,'0')}-01` : `${year+1}-01-01`
    const { data } = await sb.from('expenses').select('*').gte('expense_date', ms).lt('expense_date', me).order('expense_date', { ascending: false })
    setRows((data || []) as Expense[])
  }

  useEffect(() => { load() }, [year, month])

  async function save() {
    if (!form.name || !form.amount_usd) return
    setLoading(true)
    const payload = { ...form, amount_krw: usdToKrw(form.amount_usd || 0) }
    if (editId) {
      await sb.from('expenses').update(payload).eq('id', editId)
    } else {
      await sb.from('expenses').insert(payload)
    }
    setLoading(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
    load()
  }

  async function del(id: string) {
    if (!confirm('삭제할까요?')) return
    await sb.from('expenses').delete().eq('id', id)
    load()
  }

  function startEdit(e: Expense) {
    setForm(e)
    setEditId(e.id!)
    setShowForm(true)
  }

  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }

  const filtered = filterCat === '전체' ? rows : rows.filter(r => r.category === filterCat)
  const total = filtered.reduce((s, r) => s + (r.amount_usd || 0), 0)

  return (
    <div className="px-4 py-5 space-y-4">

      {/* 월 선택 + 추가 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-gray-500 text-lg font-bold" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>‹</button>
          <span className="font-bold text-[#191f28] text-base px-2">{year}년 {month}월</span>
          <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-xl bg-white text-gray-500 text-lg font-bold" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>›</button>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#3182f6' }}>
          <span className="text-base leading-none">+</span> 지출 추가
        </button>
      </div>

      {/* 합계 카드 */}
      <div className="card flex justify-between items-center">
        <div>
          <p className="text-xs text-[#8b95a1]">{filterCat === '전체' ? '전체' : filterCat} 지출</p>
          <p className="text-2xl font-bold text-[#191f28] mt-0.5">{fmtUsd(total)}</p>
        </div>
        <p className="text-sm font-medium text-[#8b95a1]">{fmtKrw(usdToKrw(total))}</p>
      </div>

      {/* 카테고리 필터 칩 */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {['전체', ...CATEGORIES].map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all"
            style={filterCat === c
              ? { background: '#3182f6', color: '#fff' }
              : { background: '#fff', color: '#8b95a1', border: '1px solid #e8eaed' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 지출 목록 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">💸</p>
            <p className="text-sm text-[#8b95a1]">이번 달 지출 내역이 없어요</p>
          </div>
        )}
        {filtered.map(e => (
          <div key={e.id} className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: '#f2f4f6' }}>
                {CAT_ICON[e.category] || '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[#191f28] text-sm truncate">{e.name}</p>
                <p className="text-xs text-[#8b95a1] mt-0.5">{e.expense_date} · {e.category} · {e.paid_by}</p>
                {e.memo && <p className="text-xs text-[#8b95a1] mt-0.5 truncate">📝 {e.memo}</p>}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-[#191f28] text-sm">{fmtUsd(e.amount_usd)}</p>
                <p className="text-xs text-[#8b95a1]">{fmtKrw(e.amount_krw)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => startEdit(e)} className="text-xs font-semibold" style={{ color: '#3182f6' }}>수정</button>
              <button onClick={() => del(e.id!)} className="text-xs font-semibold" style={{ color: '#e84040' }}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 폼 바텀시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-t-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-bold text-[#191f28] text-base">{editId ? '지출 수정' : '지출 추가'}</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8b95a1] text-lg"
                style={{ background: '#f2f4f6' }}>✕</button>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">항목명 *</label>
              <input className="input" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="예: 마트 장보기" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">금액 (USD) *</label>
                <input className="input" type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm(f => ({...f, amount_usd: parseFloat(e.target.value) || 0}))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">원화 (자동)</label>
                <input className="input" readOnly value={fmtKrw(usdToKrw(form.amount_usd || 0))} style={{ background: '#f9fafb', color: '#8b95a1' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">카테고리</label>
                <select className="select" value={form.category || ''} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">결제자</label>
                <select className="select" value={form.paid_by || ''} onChange={e => setForm(f => ({...f, paid_by: e.target.value}))}>
                  {['아빠','엄마','본인','카드'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">날짜</label>
                <input className="input" type="date" value={form.expense_date || ''} onChange={e => setForm(f => ({...f, expense_date: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">결제수단</label>
                <select className="select" value={form.payment_method || ''} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))}>
                  {PAY_METHODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">메모</label>
              <input className="input" value={form.memo || ''} onChange={e => setForm(f => ({...f, memo: e.target.value}))} placeholder="선택사항" />
            </div>

            <button onClick={save} disabled={loading} className="btn-primary w-full py-3.5" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '저장 중...' : editId ? '수정 완료' : '추가하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
