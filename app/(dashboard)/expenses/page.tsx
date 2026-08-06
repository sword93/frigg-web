'use client'
import { useEffect, useState } from 'react'
import { createClient, fmtUsd, fmtKrw, usdToKrw, EXCHANGE_RATE } from '@/lib/supabase'
import { Expense, CATEGORIES, PAY_METHODS } from '@/lib/types'

const EMPTY: Partial<Expense> = { name: '', category: '식비', amount_usd: 0, paid_by: '아빠', expense_date: new Date().toISOString().slice(0,10) }

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
    setRows(data || [])
  }

  useEffect(() => { load() }, [year, month])

  async function save() {
    if (!form.name || !form.amount_usd) return
    setLoading(true)
    const payload = {
      ...form,
      amount_krw: usdToKrw(form.amount_usd || 0),
    }
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

  const filtered = filterCat === '전체' ? rows : rows.filter(r => r.category === filterCat)
  const total = filtered.reduce((s, r) => s + (r.amount_usd || 0), 0)

  function prevMonth() { if (month === 1) { setYear(y => y-1); setMonth(12) } else setMonth(m => m-1) }
  function nextMonth() { if (month === 12) { setYear(y => y+1); setMonth(1) } else setMonth(m => m+1) }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="btn-ghost px-3 py-1 text-sm">‹</button>
          <span className="font-bold text-[#1e3a5f]">{year}년 {month}월</span>
          <button onClick={nextMonth} className="btn-ghost px-3 py-1 text-sm">›</button>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }} className="btn-accent px-3 py-2 text-xs">
          + 지출 추가
        </button>
      </div>

      {/* 합계 */}
      <div className="card flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">{filterCat === '전체' ? '전체' : filterCat} 지출</p>
          <p className="text-xl font-bold text-[#1e3a5f]">{fmtUsd(total)}</p>
        </div>
        <p className="text-sm text-gray-500">{fmtKrw(usdToKrw(total))}</p>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['전체', ...CATEGORIES].map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${filterCat === c ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-8 text-gray-400 text-sm">지출 내역이 없어요</div>
        )}
        {filtered.map(e => (
          <div key={e.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium text-sm">{e.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{e.expense_date} · {e.category} · {e.paid_by}</p>
                {e.memo && <p className="text-xs text-gray-400 mt-0.5">📝 {e.memo}</p>}
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-[#1e3a5f]">{fmtUsd(e.amount_usd)}</p>
                <p className="text-xs text-gray-400">{fmtKrw(e.amount_krw)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
              <button onClick={() => startEdit(e)} className="text-xs text-[#1e3a5f] font-medium">수정</button>
              <button onClick={() => del(e.id!)} className="text-xs text-red-400 font-medium">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#1e3a5f]">{editId ? '지출 수정' : '지출 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">항목명 *</label>
              <input className="input" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="예: 마트 장보기" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">금액 (USD) *</label>
                <input className="input" type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm(f => ({...f, amount_usd: parseFloat(e.target.value) || 0}))} placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">원화 (자동계산)</label>
                <input className="input bg-gray-50" readOnly value={fmtKrw(usdToKrw(form.amount_usd || 0))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                <select className="select" value={form.category || ''} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">결제자</label>
                <select className="select" value={form.paid_by || ''} onChange={e => setForm(f => ({...f, paid_by: e.target.value}))}>
                  {['아빠','엄마','본인','카드'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜</label>
                <input className="input" type="date" value={form.expense_date || ''} onChange={e => setForm(f => ({...f, expense_date: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">결제수단</label>
                <select className="select" value={form.payment_method || ''} onChange={e => setForm(f => ({...f, payment_method: e.target.value}))}>
                  {PAY_METHODS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">메모</label>
              <input className="input" value={form.memo || ''} onChange={e => setForm(f => ({...f, memo: e.target.value}))} placeholder="선택사항" />
            </div>

            <button onClick={save} disabled={loading} className="btn-primary w-full py-3">
              {loading ? '저장 중...' : editId ? '수정 완료' : '추가하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
