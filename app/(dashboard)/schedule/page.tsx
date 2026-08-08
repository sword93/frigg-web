'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Schedule } from '@/lib/types'
import ConfirmDialog from '@/components/ConfirmDialog'

const SCHEDULE_CATS = ['전체','출국준비','도착정착','학사일정','월별납부','기타']
const EMPTY: Partial<Schedule> = { title: '', category: '기타', event_date: new Date().toISOString().slice(0,10), is_done: false }

const CAT_STYLE: Record<string, { bg: string; color: string }> = {
  '출국준비': { bg: '#ebf3fe', color: '#3182f6' },
  '도착정착': { bg: '#e6faf0', color: '#00a63c' },
  '학사일정': { bg: '#f3f0ff', color: '#7c3aed' },
  '월별납부': { bg: '#fff8eb', color: '#f59100' },
  '기타': { bg: '#f2f4f6', color: '#8b95a1' },
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
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function load() {
    try {
      const { data, error: err } = await sb.from('schedules').select('*').order('event_date')
      if (err) throw err
      setRows((data || []) as Schedule[])
    } catch {
      setError('일정을 불러오는 데 실패했어요.')
    }
  }

  useEffect(() => { load() }, [])

  async function toggleDone(item: Schedule) {
    try {
      const { error: err } = await sb.from('schedules').update({ is_done: !item.is_done }).eq('id', item.id!)
      if (err) throw err
      setRows(prev => prev.map(r => r.id === item.id ? { ...r, is_done: !r.is_done } : r))
    } catch {
      setError('상태 변경에 실패했어요.')
    }
  }

  async function save() {
    if (!form.title || !form.event_date) return
    setLoading(true)
    try {
      if (editId) {
        const { error: err } = await sb.from('schedules').update(form).eq('id', editId)
        if (err) throw err
      } else {
        const { error: err } = await sb.from('schedules').insert(form)
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
      const { error: err } = await sb.from('schedules').delete().eq('id', confirmId)
      if (err) throw err
      await load()
    } catch {
      setError('삭제에 실패했어요. 다시 시도해 주세요.')
    } finally {
      setConfirmId(null)
    }
  }

  function startEdit(s: Schedule) { setForm(s); setEditId(s.id!); setShowForm(true) }

  const today = new Date().toISOString().slice(0,10)
  const catFiltered = filterCat === '전체' ? rows : rows.filter(r => r.category === filterCat)
  const visible = showPast ? catFiltered : catFiltered.filter(r => r.event_date >= today || !r.is_done)
  const nextEvent = rows.filter(r => r.event_date >= today && !r.is_done)[0]
  const daysUntil = nextEvent ? Math.ceil((new Date(nextEvent.event_date).getTime() - new Date(today).getTime()) / 86400000) : null

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
        <h2 className="font-bold text-[#191f28] text-base">일정 관리</h2>
        <button onClick={() => { setForm(EMPTY); setEditId(null); setShowForm(true) }}
          className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#3182f6' }}>
          <span className="text-base leading-none">+</span> 일정 추가
        </button>
      </div>

      {/* 다음 일정 카드 */}
      {nextEvent && (
        <div className="card" style={{ background: '#3182f6' }}>
          <p className="text-xs mb-2" style={{ color: 'rgba(255,255,255,0.65)' }}>다음 일정</p>
          <p className="font-bold text-white text-base">{nextEvent.title}</p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{nextEvent.event_date}</p>
            <div className="px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <span className="text-sm font-bold text-white">
                {daysUntil === 0 ? 'D-Day' : `D-${daysUntil}`}
              </span>
            </div>
          </div>
          {nextEvent.description && (
            <p className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>{nextEvent.description}</p>
          )}
        </div>
      )}

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SCHEDULE_CATS.map(c => (
          <button key={c} onClick={() => setFilterCat(c)}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap font-medium"
            style={filterCat === c
              ? { background: '#3182f6', color: '#fff' }
              : { background: '#fff', color: '#8b95a1', border: '1px solid #e8eaed' }}>
            {c}
          </button>
        ))}
      </div>

      {/* 지난 일정 토글 */}
      <button onClick={() => setShowPast(v => !v)}
        className="text-xs px-3 py-1.5 rounded-full font-medium"
        style={showPast
          ? { background: '#f2f4f6', color: '#191f28' }
          : { background: '#fff', color: '#8b95a1', border: '1px solid #e8eaed' }}>
        {showPast ? '지난 일정 숨기기' : '지난 일정 보기'}
      </button>

      {/* 타임라인 */}
      <div className="space-y-2">
        {visible.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-3xl mb-2">📅</p>
            <p className="text-sm text-[#8b95a1]">일정이 없어요</p>
          </div>
        )}
        {visible.map(item => {
          const isPast = item.event_date < today
          const days = Math.ceil((new Date(item.event_date).getTime() - new Date(today).getTime()) / 86400000)
          const catStyle = CAT_STYLE[item.category] || CAT_STYLE['기타']
          const isUrgent = !item.is_done && !isPast && days <= 3
          return (
            <div key={item.id} className="card" style={{ opacity: item.is_done ? 0.6 : 1, borderLeft: isUrgent ? '3px solid #f59100' : undefined }}>
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
                      {item.title}
                    </p>
                    <span className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                      style={{ background: catStyle.bg, color: catStyle.color }}>
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-[#8b95a1]">{item.event_date}</p>
                    {!item.is_done && !isPast && (
                      <span className="text-xs font-bold" style={{ color: days <= 3 ? '#f59100' : '#3182f6' }}>
                        {days === 0 ? 'D-Day' : `D-${days}`}
                      </span>
                    )}
                    {isPast && !item.is_done && <span className="text-xs" style={{ color: '#e84040' }}>기한 지남</span>}
                  </div>
                  {item.description && <p className="text-xs text-[#8b95a1] mt-0.5">{item.description}</p>}
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <button onClick={() => startEdit(item)} className="text-xs font-semibold" style={{ color: '#3182f6' }}>수정</button>
                  <button onClick={() => setConfirmId(item.id!)} className="text-xs font-semibold" style={{ color: '#e84040' }}>삭제</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 바텀시트 */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.45)' }}>
          <div className="bg-white rounded-t-3xl w-full p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-[#191f28] text-base">{editId ? '일정 수정' : '일정 추가'}</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8b95a1]"
                style={{ background: '#f2f4f6' }}>✕</button>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">제목 *</label>
              <input className="input" value={form.title || ''} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="예: 개강일" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">날짜 *</label>
                <input className="input" type="date" value={form.event_date || ''} onChange={e => setForm(f => ({...f, event_date: e.target.value}))} />
              </div>
              <div>
                <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">카테고리</label>
                <select className="select" value={form.category || '기타'} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {SCHEDULE_CATS.filter(c => c !== '전체').map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[#8b95a1] mb-1.5 block">설명</label>
              <input className="input" value={form.description || ''} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="선택사항" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
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
        message="이 일정을 삭제할까요?"
        onConfirm={doDelete}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  )
}
