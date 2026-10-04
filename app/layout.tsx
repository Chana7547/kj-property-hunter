import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'KJ Property Hunter | Private Residences in Bangkok',
  description: 'Curated Bangkok condo rentals with personal property advisory by KJ Property Hunter.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
