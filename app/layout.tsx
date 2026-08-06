import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FRIGG — 유학 가족 관리',
  description: '오딘 가족 전용 유학 통합 관리 플랫폼',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}
