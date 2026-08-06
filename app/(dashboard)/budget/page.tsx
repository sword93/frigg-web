'use client'
import { useEffect, useState } from 'react'
import { createClient, fmtUsd, fmtKrw, usdToKrw } from '@/lib/supabase'
import { BudgetItem } from '@/lib/types'

const CYCLES = ['매월', '학기별', '연간', '일회성']
const EMPTY: Partial<BudgetItem> = { name: '', category: '주거', cycle: '매월', amount_usd: 0 }

const CYCLE_ICON: Record<string, string> = { '매월': '🔄', '학기별': '📚', '연간': '📅', '일회성': '1️⃣' }

export default function BudgetPage() {
  const sb = createClient()
  const [rows, setRows] = useState<BudgetItem[]>([])
  const [form, setForm] = useState<Partial<BudgetItem>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterCycle, setFilterCycle] = useState('전체')

  async function load() {
    const { data } = await sb.from('budget_items').select('*').order('cycle').order('amount_usd', { ascending: false })
    setRows(data || [])
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.name || !form.amount_usd) return
    setLoading(true)
    const payload = { ...form, amount_krw: usdToKrw(form.amount_usd || 0) }
    if (editId) {
      await sb.from('budget_items').update(payload).eq('id', editId)
    } else {
      await sb.from('budget_items').insert(payload)
    }
    setLoading(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
    load()
  }

  async function del(id: string) {
    if (!confirm('삭제할까요?')) return
    await sb.from('budget_items').delete().eq('id', id)
    load()
  }

  function startEdit(b: BudgetItem) {
    setForm(b)
    setEditId(b.id!)
    setShowForm(true)
  }

  const filtered = filterCycle === '전체' ? rows : rows.filter(r => r.cycle === filterCycle)
  const monthly = rows.filter(r => r.cycle === '매월').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const semester = rows.filter(r => r.cycle === '학기별').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const annual = rows.filter(r => r.cycle === '연간').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const oneTime = rows.filter(r => r.cycle === '일회성').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const monthlyTotal = monthly + semester / 6 + annual / 12

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#1e3a5f]">예산 관리</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }} className="btn-accent px-3 py-2 text-xs">
          + 예산 추가
        </button>
      </div>

      {/* 요약 카드 */}
      <div className="card">
        <p className="section-title">월 환산 총예산</p>
        <p className="text-2xl font-bold text-[#1e3a5f]">{fmtUsd(monthlyTotal)}</p>
        <p className="text-sm text-gray-400">{fmtKrw(usdToKrw(monthlyTotal))}</p>
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <p className="text-xs text-gray-400">매월</p>
            <p className="text-sm font-bold text-[#1e3a5f]">{fmtUsd(monthly)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">학기(월환산)</p>
            <p className="text-sm font-bold text-[#1e3a5f]">{fmtUsd(semester/6)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">연간(월환산)</p>
            <p className="text-sm font-bold text-[#1e3a5f]">{fmtUsd(annual/12)}</p>
          </div>
        </div>
        {oneTime > 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">+ 일회성 {fmtUsd(oneTime)} 별도</p>
        )}
      </div>

      {/* 사이클 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['전체', ...CYCLES].map(c => (
          <button
            key={c}
            onClick={() => setFilterCycle(c)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${filterCycle === c ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            {c !== '전체' ? CYCLE_ICON[c] + ' ' : ''}{c}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-8 text-gray-400 text-sm">예산 항목이 없어요</div>
        )}
        {filtered.map(b => (
          <div key={b.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{CYCLE_ICON[b.cycle]}</span>
                  <p className="font-medium text-sm">{b.name}</p>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{b.category} · {b.cycle}{b.due_day ? ` · 매월 ${b.due_day}일` : ''}</p>
                {b.memo && <p className="text-xs text-gray-400 mt-0.5">📝 {b.memo}</p>}
              </div>
              <div className="text-right ml-3">
                <p className="font-bold text-[#1e3a5f]">{fmtUsd(b.amount_usd)}</p>
                <p className="text-xs text-gray-400">{fmtKrw(b.amount_krw)}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
              <button onClick={() => startEdit(b)} className="text-xs text-[#1e3a5f] font-medium">수정</button>
              <button onClick={() => del(b.id!)} className="text-xs text-red-400 font-medium">삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#1e3a5f]">{editId ? '예산 수정' : '예산 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">항목명 *</label>
              <input className="input" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="예: 월세" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">금액 (USD) *</label>
                <input className="input" type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm(f => ({...f, amount_usd: parseFloat(e.target.value) || 0}))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">원화</label>
                <input className="input bg-gray-50" readOnly value={fmtKrw(usdToKrw(form.amount_usd || 0))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">주기</label>
                <select className="select" value={form.cycle || '매월'} onChange={e => setForm(f => ({...f, cycle: e.target.value}))}>
                  {CYCLES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">납부일 (매월)</label>
                <input className="input" type="number" min={1} max={31} value={form.due_day || ''} onChange={e => setForm(f => ({...f, due_day: parseInt(e.target.value) || undefined}))} placeholder="예: 1" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
              <input className="input" value={form.category || ''} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder="예: 주거, 학업, 식비..." />
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
