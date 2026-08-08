'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChecklistItem } from '@/lib/types'
import ConfirmDialog from '@/components/ConfirmDialog'

const CHECKLIST_CATS = ['전체','서류','금융','의류','전자기기','주방','욕실','건강','생활','학업']
const EMPTY: Partial<ChecklistItem> = { name: '', category: '생활', priority: '중', notes: '', is_done: false }
const PRIORITY_COLOR: Record<string, string> = { '상': '#e84040', '중': '#f59100', '하': '#8b95a1' }
const PRIORITY_BG: Record<string, string> = { '상': '#fff0f0', '중': '#fff8eb', '하': '#f2f4f6' }

export default function ChecklistPage() {
  const sb = createClient()
  const [rows, setRows] = useState<ChecklistItem[]>([])
  const [form, setForm] = useState<Partial<ChecklistItem>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterCat, setFilterCat] = useState('전체')
  const [showDone, setShowDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function load() {
    try {
      const { data, error: err } = await sb.from('checklist_items').select('*').order('priority').order('category').order('name')
      if (err) throw err
      setRows((data || []) as ChecklistItem[])
    } catch {
      setError('체크리스트를 불러오는 데 실패했어요.')
    }
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item: ChecklistItem) {
    try {
      const { error: err } = await sb.from('checklist_items').update({ is_done: !item.is_done }).eq('id', item.id!)
      if (err) throw err
      setRows(prev => prev.map(r => r.id === item.id ? { ...r, is_done: !r.is_done } : r))
    } catch {
      setError('상태 변경에 실패했어요.')
    }
  }

  async function save() {
    if (!form.name) return
    setLoading(true)
    try {
      if (editId) {
        const { error: err } = await sb.from('checklist_items').update(form).eq('id', editId)
        if (err) throw err
      } else {
        const { error: err } = await sb.from('checklist_items').insert(form)
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
      const { error: err } = await sb.from('checklist_items').delete().eq('id', confirmId)
      if (err) throw err
      await load()
    } catch {
      setError('삭제에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setConfirmId(null)
    }
  }

  function startEdit(c: ChecklistItem) { setForm(c); setEditId(c.id!); setShowForm(true) }

  const catFiltered = filterCat === '전체' ? rows : rows.filter(r => r.category === filterCat)
  const visible = showDone ? catFiltered : catFiltered.filter(r => !r.is_done)
  const done = catFiltered.filter(r => r.is_done).length
  const total = catFiltered.length
  const pct = total > 0 ? Math.round(done / total * 100) : 0

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
        <h2 className="font-bold text-[#191f28] text-base">준비물 체크리스트</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#3182f6' }}>
          <span className="text-base leading-none">+</span> 항목 추가
        </button>
      </div>

      {/* 진행률 카드 */}
      <div className="card">
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-xs text-[#8b95a1]">진행률</p>
            <p className="text-xl font-bold text-[#191f28] mt-0.5">{done} / {total} 완료</p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: pct >= 100 ? '#e6faf0' : '#ebf3fe' }}>
            <span className="text-lg font-bold" style={{ color: pct >= 100 ? '#00c73c' : '#3182f6' }}>
              {pct}%
            </span>
          </div>
        </div>
        <div className="w-full rounded-full h-2" style={{ background: '#f2f4f6' }}>
          <div className="h-2 rounded-full transition-all"
            style={{ width: `${pct}%`, background: pct >= 100 ? '#00c73c' : '#3182f6' }} />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CHECKLIST_CATS.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium"
            style={filterCat === c
              ? { background: '#3182f6', color: '#fff' }
              : { background: '#fff', color: '#8b95a1', border: '1px solid #e8eaed' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 완료 항목 토글 */}
      <button onClick={() => setShowDone(v => !v)}
        className="text-xs px-3 py-1.5 rounded-full font-medium"
        style={showDone
          ? { background: '#f2f4f6', color: '#191f28' }
          : { background: '#fff', color: '#8b95a1', border: '1px solid #e8eaed' }}>
        {showDone ? '✅ 완료 항목 숨기기' : '완료 항목 보기'}
      </button>

      {/* 목록 */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">{showDone ? '📋' : '🎉'}</p>
            <p className="text-sm text-[#8b95a1]">{showDone ? '항목이 없어요' : '모든 항목을 완료했어요!'}</p>
          </div>
        )}
        {visible.map(item => (
          <div key={item.id} className="card" style={{ opacity: item.is_done ? 0.6 : 1 }}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleDone(item)}
                className="mt-0.5 w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                style={item.is_done
                  ? { background: '#3182f6', borderColor: '#3182f6', color: '#fff' }
                  : { borderColor: '#d1d5db' }}>
                {item.is_done && <span className="text-xs font-bold">✓</span>}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-medium ${item.is_done ? 'line-through text-[#8b95a1]' : 'text-[#191f28]'}`}>
                    {item.name}
                  </p>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                    style={{ background: PRIORITY_BG[item.priority], color: PRIORITY_COLOR[item.priority] }}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-[#8b95a1] mt-0.5">{item.category}</p>
                {item.notes && <p className="text-xs text-[#8b95a1] mt-0.5">📝 {item.notes}</p>}
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="text-xs font-semibold" style={{ color: '#3182f6' }}>수정</button>
                <button onClick={() => setConfirmId(item.id!)} className="text-xs font-semibold" style={{ color: '#e84040' }}>삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 바텀시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-t-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#191f28] text-base">{editId ? '항목 수정' : '항목 추가'}</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8b95a1]"
                style={{ background: '#f2f4f6' }}>✕</button>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">항목명 *</label>
              <input className="input" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="예: 여권 사본" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">카테고리</label>
                <select className="select" value={form.category || '생활'} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CHECKLIST_CATS.filter(c => c !== '전체').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">우선순위</label>
                <select className="select" value={form.priority || '중'} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                  {['상','중','하'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">메모</label>
              <input className="input" value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="선택사항" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all`}
                style={form.is_done ? { background: '#3182f6', borderColor: '#3182f6', color: '#fff' } : { borderColor: '#d1d5db' }}
                onClick={() => setForm(f => ({...f, is_done: !f.is_done}))}>
                {form.is_done && <span className="text-xs font-bold">✓</span>}
              </div>
              <span className="text-sm text-[#191f28]">완료로 표시</span>
            </label>

            <button onClick={save} disabled={loading} className="btn-primary w-full py-3.5" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '저장 중...' : editId ? '수정 완료' : '추가하기'}
            </button>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog
        open={confirmId !== null}
        message="이 체크리스트 항목을 삭제할까요?"
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
