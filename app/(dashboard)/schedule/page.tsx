'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Schedule } from '@/lib/types'

const SCHEDULE_CATS = ['전체','출국준비','도착정착','학사일정','월별납부','기타']
const EMPTY: Partial<Schedule> = { title: '', category: '기타', event_date: new Date().toISOString().slice(0,10), is_done: false }

const CAT_COLORS: Record<string, string> = {
  '출국준비': 'bg-blue-100 text-blue-700',
  '도착정착': 'bg-green-100 text-green-700',
  '학사일정': 'bg-purple-100 text-purple-700',
  '월별납부': 'bg-orange-100 text-orange-700',
  '기타': 'bg-gray-100 text-gray-600',
}

export default function SchedulePage() {
  const sb = createClient()
  const [rows, setRows] = useState<Schedule[]>([])
  const [form, setForm] = useState<Partial<Schedule>>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterCat, setFilterCat] = useState('전체')
  const [showPast, setShowPast] = useState(false)

  async function load() {
    const { data } = await sb.from('schedules').select('*').order('event_date')
    setRows(data || [])
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item: Schedule) {
    await sb.from('schedules').update({ is_done: !item.is_done }).eq('id', item.id!)
    setRows(prev => prev.map(r => r.id === item.id ? { ...r, is_done: !r.is_done } : r))
  }

  async function save() {
    if (!form.title || !form.event_date) return
    setLoading(true)
    if (editId) {
      await sb.from('schedules').update(form).eq('id', editId)
    } else {
      await sb.from('schedules').insert(form)
    }
    setLoading(false)
    setShowForm(false)
    setEditId(null)
    setForm(EMPTY)
    load()
  }

  async function del(id: string) {
    if (!confirm('삭제할까요?')) return
    await sb.from('schedules').delete().eq('id', id)
    load()
  }

  function startEdit(s: Schedule) {
    setForm(s)
    setEditId(s.id!)
    setShowForm(true)
  }

  const today = new Date().toISOString().slice(0,10)
  const catFiltered = filterCat === '전체' ? rows : rows.filter(r => r.category === filterCat)
  const visible = showPast ? catFiltered : catFiltered.filter(r => r.event_date >= today || !r.is_done)

  // 다음 이벤트 찾기
  const nextEvent = rows.filter(r => r.event_date >= today && !r.is_done)[0]
  const daysUntil = nextEvent ? Math.ceil((new Date(nextEvent.event_date).getTime() - new Date(today).getTime()) / 86400000) : null

  return (
    <div className="p-4 space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-[#1e3a5f]">일정 관리</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }} className="btn-accent px-3 py-2 text-xs">
          + 일정 추가
        </button>
      </div>

      {/* 다음 일정 카드 */}
      {nextEvent && (
        <div className="card bg-gradient-to-r from-[#1e3a5f] to-[#2a5080] text-white">
          <p className="text-xs text-white/60 mb-1">다음 일정</p>
          <p className="font-bold">{nextEvent.title}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-sm text-white/80">{nextEvent.event_date}</p>
            <p className="text-sm font-bold text-[#f4a430]">D-{daysUntil === 0 ? 'Day' : daysUntil}</p>
          </div>
          {nextEvent.description && <p className="text-xs text-white/60 mt-1">{nextEvent.description}</p>}
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SCHEDULE_CATS.map(c => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-colors ${filterCat === c ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* 과거 일정 토글 */}
      <button
        onClick={() => setShowPast(v => !v)}
        className={`text-xs px-3 py-1 rounded-full border transition-colors ${showPast ? 'bg-gray-200 text-gray-700 border-gray-200' : 'bg-white text-gray-400 border-gray-200'}`}
      >
        {showPast ? '지난 일정 숨기기' : '지난 일정 보기'}
      </button>

      {/* 타임라인 */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card text-center py-8 text-gray-400 text-sm">일정이 없어요</div>
        )}
        {visible.map(item => {
          const isPast = item.event_date < today
          const days = Math.ceil((new Date(item.event_date).getTime() - new Date(today).getTime()) / 86400000)
          return (
            <div key={item.id} className={`card ${item.is_done ? 'opacity-60' : ''} ${!isPast && days <= 3 ? 'border-orange-200' : ''}`}>
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className={`text-sm font-medium ${item.is_done ? 'line-through text-gray-400' : ''}`}>{item.title}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${CAT_COLORS[item.category] || CAT_COLORS['기타']}`}>{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-gray-400">{item.event_date}</p>
                    {!item.is_done && !isPast && (
                      <p className={`text-xs font-bold ${days <= 3 ? 'text-orange-500' : 'text-[#1e3a5f]'}`}>
                        {days === 0 ? 'D-Day' : `D-${days}`}
                      </p>
                    )}
                    {isPast && !item.is_done && <p className="text-xs text-red-400">지남</p>}
                  </div>
                  {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => startEdit(item)} className="text-xs text-[#1e3a5f]">수정</button>
                  <button onClick={() => del(item.id!)} className="text-xs text-red-400">삭제</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 입력 폼 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full p-4 space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#1e3a5f]">{editId ? '일정 수정' : '일정 추가'}</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400">✕</button>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">제목 *</label>
              <input className="input" value={form.title || ''} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="예: 기숙사 입소" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">날짜 *</label>
                <input className="input" type="date" value={form.event_date || ''} onChange={e => setForm(f => ({...f, event_date: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">카테고리</label>
                <select className="select" value={form.category || '기타'} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {SCHEDULE_CATS.filter(c => c !== '전체').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">설명</label>
              <input className="input" value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="선택사항" />
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="sched_done" checked={form.is_done || false} onChange={e => setForm(f => ({...f, is_done: e.target.checked}))} />
              <label htmlFor="sched_done" className="text-sm">완료</label>
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
