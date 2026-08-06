'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ChecklistItem } from '@/lib/types'

const CHECKLIST_CATS = ['전체','서류','금융','의류','전자기기','주방','욕실','건강','생활','학업']
const EMPTY: Partial<ChecklistItem> = { name: '', category: '생활', priority: '중', notes: '', is_done: false }

export default function ChecklistPage() {
  const sb = createClient()
  const [rows, setRows] = useState<ChecklistItem[]>([])
  const [form, setForm] = useState<Partial<ChecklistItem>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterCat, setFilterCat] = useState('전체')
  const [showDone, setShowDone] = useState(false)

  async function load() {
    const { data } = await sb.from('checklist_items').select('*').order('priority').order('category').order('name')
    setRows(data || [])
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item: ChecklistItem) {
    await sb.from('checklist_items').update({ is_done: !item.is_done }).eq('id', item.id!)
    setRows(prev => prev.map(r => r.id === item.id ? { ...r, is_done: !r.is_done } : r))
  }

  async function save() {
    if (!form.name) return
    setLoading(true)
    if (editId) {
      await sb.from('checklist_items').update(form).eq('id', editId)
    } else {
      await sb.from('checklist_items').insert(form)
    }
    setLoading(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
    load()
  }

  async function del(id: string) {
    if (!confirm('삭제할까요?')) return
    await sb.from('checklist_items').delete().eq('id', id)
    load()
  }

  function startEdit(c: ChecklistItem) {
    setForm(c)
    setEditId(c.id!)
    setShowForm(true)
  }

  const catFiltered = filterCat === '전체' ? rows : rows.filter(r => r.category === filterCat)
  const visible = showDone ? catFiltered : catFiltered.filter(r => !r.is_done)
  const done = catFiltered.filter(r => r.is_done).length
  const total = catFiltered.length
  const pct = total > 0 ? Math.round(done / total * 100) : 0

  const PRIORITY_COLOR: Record<string, string> = { '상': 'text-red-500', '중': 'text-orange-400', '하': 'text-gray-400' }

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#1e3a5f]">준비물 체크리스트</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }} className="btn-accent px-3 py-2 text-xs">
          + 항목 추가
        </button>
      </div>

      {/* 진행률 */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold text-[#1e3a5f]">{done} / {total} 완료</p>
          <p className="text-sm font-bold text-[#f4a430]">{pct}%</p>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div className="bg-[#f4a430] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CHECKLIST_CATS.map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${filterCat === c ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 완료 항목 토글 */}
      <button
        onClick={() => setShowDone(v => !v)}
        className={`text-xs px-3 py-1 rounded-full border transition-colors ${showDone ? 'bg-gray-200 text-gray-700 border-gray-200' : 'bg-white text-gray-400 border-gray-200'}`}
      >
        {showDone ? '✅ 완료 항목 숨기기' : '완료 항목 보기'}
      </button>

      {/* 목록 */}
      <div className="space-y-1.5">
        {visible.length === 0 && (
          <div className="card text-center py-8 text-gray-400 text-sm">
            {showDone ? '항목이 없어요' : '모든 항목을 완료했어요! 🎉'}
          </div>
        )}
        {visible.map(item => (
          <div key={item.id} className={`card py-3 ${item.is_done ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleDone(item)}
                className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  item.is_done ? 'bg-[#f4a430] border-[#f4a430] text-white' : 'border-gray-300'
                }`}
              >
                {item.is_done && <span className="text-xs">✓</span>}
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-sm font-medium ${item.is_done ? 'line-through text-gray-400' : ''}`}>{item.name}</p>
                  <span className={`text-xs ${PRIORITY_COLOR[item.priority] || 'text-gray-400'}`}>
                    {item.priority === '상' ? '‼️' : item.priority === '중' ? '!' : ''}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{item.category}</p>
                {item.notes && <p className="text-xs text-gray-400 mt-0.5">📝 {item.notes}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => startEdit(item)} className="text-xs text-[#1e3a5f]">수정</button>
                <button onClick={() => del(item.id!)} className="text-xs text-red-400">삭제</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 입력 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#1e3a5f]">{editId ? '항목 수정' : '항목 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">항목명 *</label>
              <input className="input" value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="예: 여권" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                <select className="select" value={form.category || '생활'} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CHECKLIST_CATS.filter(c => c !== '전체').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">우선순위</label>
                <select className="select" value={form.priority || '중'} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                  {['상','중','하'].map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">메모</label>
              <input className="input" value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="선택사항" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_done" checked={form.is_done || false} onChange={e => setForm(f => ({...f, is_done: e.target.checked}))} />
              <label htmlFor="is_done" className="text-sm">완료</label>
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
