'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLogin = pathname === '/admin/login'
  const [checking, setChecking] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    let mounted = true
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!mounted) return
      setAuthenticated(Boolean(session))
      if (!session && !isLogin) router.replace('/admin/login')
      if (session && isLogin) router.replace('/admin/dashboard')
      setChecking(false)
    }
    check()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setAuthenticated(Boolean(session))
      if (!session && !isLogin) router.replace('/admin/login')
      if (session && isLogin) router.replace('/admin/dashboard')
      setChecking(false)
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [isLogin, router])

  if (checking) return <main className="admin-loading">กำลังตรวจสอบสิทธิ์...</main>
  if (isLogin) return authenticated ? <main className="admin-loading">กำลังเข้าสู่ Dashboard...</main> : <>{children}</>
  if (!authenticated) return <main className="admin-loading">กำลังไปหน้า Login...</main>

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">KJ PROPERTY HUNTER</div>
        <nav className="admin-nav">
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/owners">Owners</Link>
          <Link href="/admin/properties">Properties</Link>
          <Link href="/admin/leads">Leads</Link>
          <Link href="/admin/appointments">Appointments</Link>
          <Link href="/admin/contracts">Contracts</Link>
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/">ดูหน้าเว็บ</Link>
          <button type="button" onClick={logout}>Logout</button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  )
}
