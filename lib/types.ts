export interface Expense {
  id?: string
  expense_date: string
  name: string
  category: string
  amount_usd: number
  amount_krw: number
  payment_method?: string
  paid_by: string
  memo?: string
  created_at?: string
}

export interface BudgetItem {
  id?: string
  name: string
  category: string
  cycle: string        // 매월 | 학기별 | 연간 | 일회성
  due_day?: number
  amount_usd: number
  amount_krw: number
  assignee?: string
  memo?: string
  created_at?: string
}

export interface ChecklistItem {
  id?: string
  category: string
  name: string
  priority: string    // 상 | 중 | 하
  is_done: boolean
  notes?: string
  created_at?: string
}

export interface Schedule {
  id?: string
  title: string
  event_date: string
  category: string
  description?: string
  is_done: boolean
  created_at?: string
}

export const CATEGORIES = ['식비','주거','교통','보험','학업','의료','통신','여행','의류','생활','기타']
export const PAY_METHODS = ['해외송금','해외카드','현금','직불카드','자동이체']
