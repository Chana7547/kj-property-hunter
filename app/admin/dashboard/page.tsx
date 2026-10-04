'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase'

type Lead = {
  id: string
  customer_name: string
  status: string
  created_at: string
}

type Appointment = {
  id: string
  lead_id: string | null
  property_id: string | null
  status: string
  appointment_at: string
}

type Contract = {
  id: string
  commission_status: string
  commission_amount: number | null
  contract_status: string
}

type Owner = {
  id: string
}

type Property = {
  id: string
  project_name: string
  status: string
}

type DashboardData = {
  owners: number
  properties: number
  available: number
  newLeads: number
  activeAppointments: number
  activeContracts: number
  unpaidCommission: number
}

const leadStatuses = [
  'new',
  'contacted',
  'matching',
  'viewing',
  'negotiating',
  'contract',
  'closed',
  'lost',
]

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    owners: 0,
    properties: 0,
    available: 0,
    newLeads: 0,
    activeAppointments: 0,
    activeContracts: 0,
    unpaidCommission: 0,
  })

  const [leads, setLeads] = useState<Lead[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setMessage('')

    const [ownersRes, propertiesRes, leadsRes, appointmentsRes, contractsRes] =
      await Promise.all([
        supabase.from('owners').select('id'),
        supabase.from('properties').select('id,project_name,status'),
        supabase
          .from('leads')
          .select('id,customer_name,status,created_at')
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('id,lead_id,property_id,status,appointment_at')
          .order('appointment_at', { ascending: true }),
        supabase
          .from('contracts')
          .select('id,commission_status,commission_amount,contract_status'),
      ])

    const err =
      ownersRes.error ||
      propertiesRes.error ||
      leadsRes.error ||
      appointmentsRes.error ||
      contractsRes.error

    if (err) {
      setMessage(err.message)
    }

    const owners = (ownersRes.data ?? []) as Owner[]
    const properties = (propertiesRes.data ?? []) as Property[]
    const leadsData = (leadsRes.data ?? []) as Lead[]
    const appointmentsData = (appointmentsRes.data ?? []) as Appointment[]
    const contractsData = (contractsRes.data ?? []) as Contract[]

    setLeads(leadsData)
    setAppointments(appointmentsData)
    setContracts(contractsData)

    setData({
      owners: owners.length,
      properties: properties.length,
      available: properties.filter((x) => x.status === 'available').length,
      newLeads: leadsData.filter((x) => x.status === 'new').length,
      activeAppointments: appointmentsData.filter((x) =>
        ['scheduled', 'confirmed'].includes(x.status)
      ).length,
      activeContracts: contractsData.filter((x) =>
        ['signed', 'active'].includes(x.contract_status)
      ).length,
      unpaidCommission: contractsData
        .filter(
          (x) =>
            x.commission_status !== 'paid' &&
            x.commission_status !== 'cancelled'
        )
        .reduce((sum, x) => sum + Number(x.commission_amount || 0), 0),
    })

    setLoading(false)
  }

  const recentLeads = leads.slice(0, 5)

  const upcomingAppointments = useMemo(() => {
    const now = new Date()

    return appointments
      .filter((x) => {
        const d = new Date(x.appointment_at)
        return (
          d >= now &&
          !['completed', 'cancelled', 'no_show'].includes(x.status)
        )
      })
      .slice(0, 5)
  }, [appointments])

  const leadPipeline = leadStatuses.map((status) => ({
    status,
    count: leads.filter((x) => x.status === status).length,
  }))

  return (
    <div className="dash">
      <div className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p>ภาพรวมระบบ KJ Property Hunter</p>
        </div>

        <button className="dash-refresh" onClick={load} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {message && <div className="dash-alert">{message}</div>}

      <div className="kpi-grid">
        <KpiCard
          label="Properties"
          value={data.properties}
          sub={`${data.available} available`}
          href="/admin/properties"
        />

        <KpiCard
          label="New Leads"
          value={data.newLeads}
          sub={`${leads.length} total leads`}
          href="/admin/leads"
        />

        <KpiCard
          label="Appointments"
          value={data.activeAppointments}
          sub="scheduled / confirmed"
          href="/admin/appointments"
        />

        <KpiCard
          label="Active Contracts"
          value={data.activeContracts}
          sub="signed / active"
          href="/admin/contracts"
        />
      </div>

      <div className="dash-main-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent Leads</h2>
              <p>ลูกค้าที่เข้ามาล่าสุด</p>
            </div>

            <Link href="/admin/leads">View all</Link>
          </div>

          <div className="table-wrap">
            <table className="simple-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>

              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.customer_name}</strong>
                    </td>

                    <td>
                      <span className="status-badge">
                        {leadStatusLabel(lead.status)}
                      </span>
                    </td>

                    <td>{dateOnly(lead.created_at)}</td>
                  </tr>
                ))}

                {recentLeads.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-cell">
                      ยังไม่มี Lead
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Upcoming Appointments</h2>
              <p>นัดชมที่กำลังจะถึง</p>
            </div>

            <Link href="/admin/appointments">View all</Link>
          </div>

          <div className="appointment-list">
            {upcomingAppointments.map((item) => (
              <div className="appointment-item" key={item.id}>
                <div className="appointment-date">
                  <strong>{dayOnly(item.appointment_at)}</strong>
                  <span>{monthOnly(item.appointment_at)}</span>
                </div>

                <div className="appointment-info">
                  <strong>{timeOnly(item.appointment_at)}</strong>
                  <span>{appointmentStatusLabel(item.status)}</span>
                </div>
              </div>
            ))}

            {upcomingAppointments.length === 0 && (
              <div className="empty-box">
                ยังไม่มีนัดที่กำลังจะถึง
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="dash-bottom-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Lead Pipeline</h2>
              <p>จำนวน Lead ในแต่ละสถานะ</p>
            </div>
          </div>

          <div className="pipeline">
            {leadPipeline.map((item) => (
              <div className="pipeline-row" key={item.status}>
                <span>{leadStatusLabel(item.status)}</span>

                <div className="pipeline-bar">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${
                        leads.length
                          ? Math.max(
                              4,
                              Math.round(
                                (item.count / leads.length) * 100
                              )
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>

                <strong>{item.count}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="side-stack">
          <div className="commission-card">
            <span>UNPAID COMMISSION</span>
            <strong>{money(data.unpaidCommission)}</strong>
            <small>ยอดที่ยังไม่ชำระ</small>
          </div>

          <div className="quick-panel">
            <h2>Quick Actions</h2>

            <div className="quick-actions">
              <Link href="/admin/properties">+ Add Property</Link>
              <Link href="/admin/owners">+ Add Owner</Link>
              <Link href="/admin/appointments">+ Add Appointment</Link>
              <Link href="/admin/contracts">+ Add Contract</Link>
            </div>
          </div>
        </section>
      </div>

      <style jsx>{`
        .dash {
          width: 100%;
          min-width: 0;
          color: #1f2937;
        }

        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 22px;
        }

        .dash-header h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.15;
          font-weight: 700;
        }

        .dash-header p {
          margin: 7px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .dash-refresh {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #d9dee5;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font-weight: 700;
          cursor: pointer;
        }

        .dash-alert {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid #efc6c1;
          border-radius: 8px;
          background: #fff3f2;
          color: #a63d36;
          font-size: 13px;
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .dash-main-grid,
        .dash-bottom-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.5fr) minmax(320px, 0.8fr);
          gap: 16px;
          margin-bottom: 16px;
        }

        .panel {
          min-width: 0;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          overflow: hidden;
        }

        .panel-head {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 18px 14px;
          border-bottom: 1px solid #eef1f4;
        }

        .panel-head h2 {
          margin: 0;
          font-size: 16px;
        }

        .panel-head p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .panel-head a {
          color: #6b7280;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .simple-table {
          width: 100%;
          border-collapse: collapse;
        }

        .simple-table th {
          padding: 11px 16px;
          background: #f8fafc;
          color: #6b7280;
          text-align: left;
          font-size: 10px;
          font-weight: 700;
        }

        .simple-table td {
          padding: 14px 16px;
          border-top: 1px solid #eef1f4;
          font-size: 13px;
        }

        .status-badge {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #4b5563;
          font-size: 10px;
          font-weight: 700;
        }

        .empty-cell,
        .empty-box {
          padding: 34px 16px;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
        }

        .appointment-list {
          padding: 4px 16px 8px;
        }

        .appointment-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 0;
          border-bottom: 1px solid #eef1f4;
        }

        .appointment-item:last-child {
          border-bottom: 0;
        }

        .appointment-date {
          width: 46px;
          height: 46px;
          display: grid;
          place-items: center;
          align-content: center;
          border-radius: 8px;
          background: #f8fafc;
        }

        .appointment-date strong {
          font-size: 15px;
          line-height: 1;
        }

        .appointment-date span {
          margin-top: 3px;
          color: #6b7280;
          font-size: 9px;
          text-transform: uppercase;
        }

        .appointment-info strong,
        .appointment-info span {
          display: block;
        }

        .appointment-info strong {
          font-size: 13px;
        }

        .appointment-info span {
          margin-top: 4px;
          color: #6b7280;
          font-size: 11px;
        }

        .pipeline {
          padding: 16px 18px 18px;
        }

        .pipeline-row {
          display: grid;
          grid-template-columns: 110px minmax(0, 1fr) 34px;
          gap: 10px;
          align-items: center;
          margin-bottom: 12px;
        }

        .pipeline-row:last-child {
          margin-bottom: 0;
        }

        .pipeline-row > span {
          color: #4b5563;
          font-size: 11px;
        }

        .pipeline-row strong {
          text-align: right;
          font-size: 12px;
        }

        .pipeline-bar {
          height: 7px;
          overflow: hidden;
          border-radius: 999px;
          background: #eef1f4;
        }

        .pipeline-fill {
          height: 100%;
          border-radius: inherit;
          background: #111827;
        }

        .side-stack {
          display: grid;
          gap: 16px;
          align-content: start;
        }

        .commission-card,
        .quick-panel {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          padding: 18px;
        }

        .commission-card {
          background: #fffaf0;
          border-color: #f0dfb8;
        }

        .commission-card span {
          display: block;
          color: #9a6514;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        .commission-card strong {
          display: block;
          margin-top: 10px;
          color: #9a6514;
          font-size: 28px;
        }

        .commission-card small {
          display: block;
          margin-top: 6px;
          color: #8b7353;
          font-size: 11px;
        }

        .quick-panel h2 {
          margin: 0;
          font-size: 16px;
        }

        .quick-actions {
          display: grid;
          gap: 8px;
          margin-top: 14px;
        }

        .quick-actions a {
          display: block;
          padding: 11px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          color: #374151;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          background: #fbfbfc;
        }

        .quick-actions a:hover {
          background: #fff;
          border-color: #cfd4dc;
        }

        @media (max-width: 1100px) {
          .kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .dash-main-grid,
          .dash-bottom-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .dash-header {
            flex-direction: column;
          }

          .kpi-grid {
            grid-template-columns: 1fr 1fr;
          }

          .pipeline-row {
            grid-template-columns: 90px minmax(0, 1fr) 28px;
          }
        }

        @media (max-width: 420px) {
          .kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <style jsx global>{`
        .dash-kpi {
          min-height: 118px;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          color: #1f2937;
          text-decoration: none;
          transition:
            box-shadow 0.15s ease,
            transform 0.15s ease;
        }

        .dash-kpi:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(17, 24, 39, 0.05);
        }

        .dash-kpi span {
          display: block;
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
        }

        .dash-kpi strong {
          display: block;
          margin-top: 12px;
          font-size: 30px;
          line-height: 1;
        }

        .dash-kpi small {
          display: block;
          margin-top: 8px;
          color: #9ca3af;
          font-size: 11px;
        }
      `}</style>
    </div>
  )
}

function KpiCard({
  label,
  value,
  sub,
  href,
}: {
  label: string
  value: number
  sub: string
  href: string
}) {
  return (
    <Link className="dash-kpi" href={href}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{sub}</small>
    </Link>
  )
}

function money(v: number) {
  return `${new Intl.NumberFormat('th-TH').format(v)} บาท`
}

function dateOnly(v: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(v))
}

function dayOnly(v: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
  }).format(new Date(v))
}

function monthOnly(v: string) {
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
  }).format(new Date(v))
}

function timeOnly(v: string) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(v))
}

function leadStatusLabel(v: string) {
  return (
    {
      new: 'New',
      contacted: 'Contacted',
      matching: 'Matching',
      viewing: 'Viewing',
      negotiating: 'Negotiating',
      contract: 'Contract',
      closed: 'Closed',
      lost: 'Lost',
    } as Record<string, string>
  )[v] || v
}

function appointmentStatusLabel(v: string) {
  return (
    {
      scheduled: 'Scheduled',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      no_show: 'No Show',
    } as Record<string, string>
  )[v] || v
}
