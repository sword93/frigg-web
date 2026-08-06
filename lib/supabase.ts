import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const EXCHANGE_RATE = 1550

export function usdToKrw(usd: number): number {
  return Math.round((usd || 0) * EXCHANGE_RATE)
}

export function fmtUsd(v: number | null | undefined): string {
  if (v == null) return '—'
  return `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtKrw(v: number | null | undefined): string {
  if (v == null) return '—'
  return `₩${Math.round(v).toLocaleString('ko-KR')}`
}
