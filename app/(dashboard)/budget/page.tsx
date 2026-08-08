'use client'
import { useEffect, useState } from 'react'
import { createClient, fmtUsd, fmtKrw, usdToKrw } from '@/lib/supabase'
import { BudgetItem } from '@/lib/types'
import ConfirmDialog from '@/components/ConfirmDialog'

const CYCLES = ['매월', '학기별', '연간', '일회성']
const EMPTY: Partial<BudgetItem> = { name: '', category: '주거', cycle: '매월', amount_usd: 0 }
const CYCLE_ICON: Record<string, string> = { '매월': '🔄', '학기별': '📚', '연간': '📅', '일회성': '1️⃣' }
const CYCLE_COLOR: Record<string, string> = { '매월': '#3182f6', '학기별': '#8b5cf6', '연간': '#00c73c', '일회성': '#f59100' }
const CYCLE_BG: Record<string, string> = { '매월': '#ebf3fe', '학기별': '#f3f0ff', '연간': '#e6faf0', '일회성': '#fff8eb' }

export default function BudgetPage() {
  const sb = createClient()
  const [rows, setRows] = useState<BudgetItem[]>([])
  const [form, setForm] = useState<Partial<BudgetItem>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterCycle, setFilterCycle] = useState('전체')
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function load() {
    try {
      const { data, error: err } = await sb.from('budget_items').select('*').order('cycle').order('amount_usd', { ascending: false })
      if (err) throw err
      setRows((data || []) as BudgetItem[])
    } catch {
      setError('예산 목록을 불러오는 데 실패했어요.')
    }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!form.name || !form.amount_usd) return
    setLoading(true)
    try {
      const payload = { ...form, amount_krw: usdToKrw(form.amount_usd || 0) }
      if (editId) {
        const { error: err } = await sb.from('budget_items').update(payload).eq('id', editId)
        if (err) throw err
      } else {
        const { error: err } = await sb.from('budget_items').insert(payload)
        if (err) throw err
      }
      setShowForm(false)
      setEditId(null)
      setForm(EMPTY)
      await load()
    } catch {
      setError('저장에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  async function doDelete() {
    if (!confirmId) return
    try {
      const { error: err } = await sb.from('budget_items').delete().eq('id', confirmId)
      if (err) throw err
      await load()
    } catch {
      setError('삭제에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setConfirmId(null)
    }
  }

  function startEdit(b: BudgetItem) { setForm(b); setEditId(b.id!); setShowForm(true) }

  const filtered = filterCycle === '전체' ? rows : rows.filter(r => r.cycle === filterCycle)
  const monthly = rows.filter(r => r.cycle === '매월').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const semester = rows.filter(r => r.cycle === '학기별').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const annual = rows.filter(r => r.cycle === '연간').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const oneTime = rows.filter(r => r.cycle === '일회성').reduce((s, r) => s + (r.amount_usd || 0), 0)
  const monthlyTotal = monthly + semester / 6 + annual / 12

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

      {/* 상단 */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#191f28] text-base">예산 관리</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#3182f6' }}>
          <span className="text-base leading-none">+</span> 예산 추가
        </button>
      </div>

      {/* 월 환산 요약 */}
      <div className="card" style={{ background: '#191f28' }}>
        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.55)' }}>월 환산 총예산</p>
        <p className="text-3xl font-bold text-white">{fmtUsd(monthlyTotal)}</p>
        <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>{fmtKrw(usdToKrw(monthlyTotal))}</p>
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { label: '매월', val: monthly },
            { label: '학기(월환산)', val: semester/6 },
            { label: '연간(월환산)', val: annual/12 },
          ].map(({ label, val }) => (
            <div key={label} className="text-center">
              <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</p>
              <p className="text-sm font-bold text-white">{fmtUsd(val)}</p>
            </div>
          ))}
        </div>
        {oneTime > 0 && (
          <p className="text-xs mt-3 text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>+ 일회성 {fmtUsd(oneTime)} 별도</p>
        )}
      </div>

      {/* 사이클 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {['전체', ...CYCLES].map(c => (
          <button key={c} onClick={() => setFilterCycle(c)}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all"
            style={filterCycle === c
              ? { background: '#3182f6', color: '#fff' }
              : { background: '#fff', color: '#8b95a1', border: '1px solid #e8eaed' }}>
            {c !== '전체' ? CYCLE_ICON[c] + ' ' : ''}{c}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm text-[#8b95a1]">예산 항목이 없어요</p>
          </div>
        )}
        {filtered.map(b => (
          <div key={b.id} className="card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ background: CYCLE_BG[b.cycle] || '#f2f4f6' }}>
                {CYCLE_ICON[b.cycle]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#191f28] text-sm">{b.name}</p>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: CYCLE_BG[b.cycle], color: CYCLE_COLOR[b.cycle] }}>
                    {b.cycle}
                  </span>
                </div>
                <p className="text-xs text-[#8b95a1] mt-0.5">{b.category}{b.due_day ? ` · 매월 ${b.due_day}일` : ''}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-[#191f28] text-sm">{fmtUsd(b.amount_usd)}</p>
                <p className="text-xs text-[#8b95a1]">{fmtKrw(b.amount_krw)}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100">
              <button onClick={() => startEdit(b)} className="text-xs font-semibold" style={{ color: '#3182f6' }}>수정</button>
              <button onClick={() => setConfirmId(b.id!)} className="text-xs font-semibold" style={{ color: '#e84040' }}>삭제</button>
            </div>
          </div>
        ))}
      </div>

      {/* 바텀시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-t-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#191f28] text-base">{editId ? '예산 수정' : '예산 추가'}</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8b95a1]"
                style={{ background: '#f2f4f6' }}>✕</button>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">항목명 *</label>
              <input className="input" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="예: 월세" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">금액 (USD) *</label>
                <input className="input" type="number" step="0.01" value={form.amount_usd || ''} onChange={e => setForm(f => ({...f, amount_usd: parseFloat(e.target.value) || 0}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">원화</label>
                <input className="input" readOnly value={fmtKrw(usdToKrw(form.amount_usd || 0))} style={{ background: '#f9fafb', color: '#8b95a1' }} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">주기</label>
                <select className="select" value={form.cycle || '매월'} onChange={e => setForm(f => ({...f, cycle: e.target.value}))}>
                  {CYCLES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">납부일 (일)</label>
                <input className="input" type="number" min={1} max={31} value={form.due_day || ''} onChange={e => setForm(f => ({...f, due_day: parseInt(e.target.value) || undefined}))} placeholder="예: 1" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">카테고리</label>
              <input className="input" value={form.category || ''} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder="주거, 학업, 식비..." />
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

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={confirmId !== null}
        message="이 예산 항목을 삭제할까요?"
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
