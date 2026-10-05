'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import './admin.css'

const menu = [
  { href: '/admin/dashboard', label: 'ภาพรวม' },
  { href: '/admin/owners', label: 'เจ้าของห้อง' },
  { href: '/admin/properties', label: 'ทรัพย์ / ห้องเช่า' },
  { href: '/admin/leads', label: 'ลูกค้าที่สนใจ' },
  { href: '/admin/appointments', label: 'นัดหมาย' },
  { href: '/admin/contracts', label: 'สัญญาและค่าคอมมิชชัน' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let mounted = true

    async function checkSession() {
      if (pathname === '/admin/login') {
        if (mounted) setChecking(false)
        return
      }

      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace('/admin/login')
        return
      }

      if (mounted) setChecking(false)
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (pathname !== '/admin/login' && !session) {
        router.replace('/admin/login')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (checking) {
    return (
      <div className="admin-loading">
        กำลังตรวจสอบการเข้าสู่ระบบ...
      </div>
    )
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">KJ</div>

          <div>
            <strong>KJ Property Hunter</strong>
            <span>ระบบจัดการหลังบ้าน</span>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-sidebar-section">เมนูหลัก</div>

          {menu.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`admin-sidebar-link ${active ? 'active' : ''}`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <Link href="/" className="admin-sidebar-secondary">
            ดูหน้าเว็บไซต์
          </Link>

          <button
            type="button"
            className="admin-sidebar-logout"
            onClick={logout}
          >
            ออกจากระบบ
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-content">{children}</div>
      </main>

      <style jsx global>{`
        .admin-shell {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 240px minmax(0, 1fr);
          background: #f5f6f8;
          color: #1f2937;
          font-family: Arial, "Noto Sans Thai", sans-serif;
        }

        .admin-sidebar {
          position: sticky;
          top: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
          border-right: 1px solid #e5e7eb;
          background: #fff;
        }

        .admin-sidebar-brand {
          min-height: 84px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px;
          border-bottom: 1px solid #eef0f3;
        }

        .admin-sidebar-logo {
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #111827;
          color: #fff;
          font-family: Georgia, serif;
          font-size: 18px;
        }

        .admin-sidebar-brand strong,
        .admin-sidebar-brand span { display: block; }

        .admin-sidebar-brand strong { font-size: 13px; }

        .admin-sidebar-brand span {
          margin-top: 3px;
          color: #9ca3af;
          font-size: 10px;
        }

        .admin-sidebar-nav {
          flex: 1;
          padding: 18px 12px;
        }

        .admin-sidebar-section {
          padding: 0 9px 8px;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }

        .admin-sidebar-link {
          display: block;
          margin-bottom: 4px;
          padding: 10px 12px;
          border-radius: 8px;
          color: #4b5563;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
        }

        .admin-sidebar-link:hover {
          background: #f7f7f8;
          color: #111827;
        }

        .admin-sidebar-link.active {
          background: #111827;
          color: #fff;
        }

        .admin-sidebar-bottom {
          display: grid;
          gap: 8px;
          padding: 14px 12px;
          border-top: 1px solid #eef0f3;
        }

        .admin-sidebar-secondary,
        .admin-sidebar-logout {
          width: 100%;
          min-height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
        }

        .admin-sidebar-secondary {
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #374151;
        }

        .admin-sidebar-logout {
          border: 0;
          background: #f3f4f6;
          color: #4b5563;
        }

        .admin-main { min-width: 0; }

        .admin-content {
          width: 100%;
          padding: 28px;
        }

        .admin-loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: #f5f6f8;
          color: #6b7280;
          font-family: Arial, "Noto Sans Thai", sans-serif;
        }

        @media (max-width: 820px) {
          .admin-shell { grid-template-columns: 1fr; }
          .admin-sidebar { position: static; height: auto; }
          .admin-sidebar-nav {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding: 10px 12px;
          }
          .admin-sidebar-section { display: none; }
          .admin-sidebar-link { flex: 0 0 auto; margin: 0; }
          .admin-sidebar-bottom { display: none; }
          .admin-content { padding: 18px 14px; }
        }
      `}</style>
    </div>
  )
}
