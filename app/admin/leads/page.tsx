'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lead = {
  id: string
  customer_name: string
  phone: string | null
  line_id: string | null
  email: string | null
  budget_min: number | null
  budget_max: number | null
  move_in_date: string | null
  preferred_area: string | null
  note: string | null
  interested_property_id: string | null
  status: string
  created_at: string
}

type Property = {
  id: string
  project_name: string
  unit_number: string | null
}

const statuses = [
  'new',
  'contacted',
  'matching',
  'viewing',
  'negotiating',
  'contract',
  'closed',
  'lost',
]

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [message, setMessage] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [l, p] = await Promise.all([
      supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('properties')
        .select('id,project_name,unit_number'),
    ])

    if (l.error || p.error) {
      setMessage(
        l.error?.message ||
          p.error?.message ||
          'โหลดข้อมูลไม่สำเร็จ'
      )
    }

    setLeads(l.data ?? [])
    setProperties(p.data ?? [])
  }

  const propertyMap = useMemo(
    () =>
      Object.fromEntries(
        properties.map((p) => [p.id, p])
      ),
    [properties]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return leads.filter((lead) => {
      const property =
        lead.interested_property_id
          ? propertyMap[
              lead.interested_property_id
            ]
          : null

      const matchesSearch =
        !q ||
        [
          lead.customer_name,
          lead.phone ?? '',
          lead.line_id ?? '',
          lead.email ?? '',
          lead.preferred_area ?? '',
          lead.note ?? '',
          property?.project_name ?? '',
          property?.unit_number ?? '',
        ].some((v) =>
          v.toLowerCase().includes(q)
        )

      const matchesStatus =
        filter === 'all' ||
        lead.status === filter

      return matchesSearch && matchesStatus
    })
  }, [
    leads,
    search,
    filter,
    propertyMap,
  ])

  async function updateStatus(
    id: string,
    status: string
  ) {
    const r = await supabase
      .from('leads')
      .update({ status })
      .eq('id', id)

    if (r.error) {
      setMessage(
        `เปลี่ยนสถานะไม่สำเร็จ: ${r.error.message}`
      )
      return
    }

    await load()
  }

  const newCount = leads.filter(
    (x) => x.status === 'new'
  ).length

  const viewingCount = leads.filter(
    (x) => x.status === 'viewing'
  ).length

  const contractCount = leads.filter(
    (x) => x.status === 'contract'
  ).length

  const closedCount = leads.filter(
    (x) => x.status === 'closed'
  ).length

  return (
    <div className="leads-page">
      <div className="admin-page-head">
        <div>
          <span className="admin-kicker">
            CUSTOMER PIPELINE
          </span>

          <h1>Leads</h1>

          <p>
            จัดการลูกค้าที่สนใจ
            ติดตามสถานะ และเตรียมนัดชม
          </p>
        </div>
      </div>

      <div className="admin-stats">
        <Stat
          label="ALL LEADS"
          value={leads.length}
        />

        <Stat
          label="NEW"
          value={newCount}
        />

        <Stat
          label="VIEWING"
          value={viewingCount}
        />

        <Stat
          label="CONTRACT / CLOSED"
          value={contractCount + closedCount}
        />
      </div>

      {message && (
        <div
          className={`admin-message ${
            message.includes('ไม่สำเร็จ')
              ? 'error'
              : ''
          }`}
        >
          {message}
        </div>
      )}

      <div className="admin-toolbar leads-toolbar">
        <input
          className="admin-input"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="ค้นหาชื่อ / เบอร์ / LINE / ทำเล / โครงการ"
        />

        <select
          className="admin-select"
          value={filter}
          onChange={(e) =>
            setFilter(e.target.value)
          }
        >
          <option value="all">
            ทุกสถานะ
          </option>

          {statuses.map((status) => (
            <option
              key={status}
              value={status}
            >
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table leads-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>CONTACT</th>
                <th>INTEREST</th>
                <th>BUDGET</th>
                <th>MOVE IN</th>
                <th>STATUS</th>
                <th>NOTE</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((lead) => {
                const property =
                  lead.interested_property_id
                    ? propertyMap[
                        lead
                          .interested_property_id
                      ]
                    : null

                return (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-name">
                        {lead.customer_name}
                      </div>

                      <div className="lead-sub">
                        {lead.preferred_area ||
                          'ยังไม่ระบุทำเล'}
                      </div>
                    </td>

                    <td>
                      <div className="contact-block">
                        <span>PHONE</span>
                        <strong>
                          {lead.phone || '—'}
                        </strong>
                      </div>

                      <div className="contact-block">
                        <span>LINE</span>
                        <strong>
                          {lead.line_id || '—'}
                        </strong>
                      </div>

                      {lead.email && (
                        <div className="contact-block">
                          <span>EMAIL</span>
                          <strong>
                            {lead.email}
                          </strong>
                        </div>
                      )}
                    </td>

                    <td>
                      {property ? (
                        <>
                          <strong>
                            {
                              property.project_name
                            }
                          </strong>

                          {property.unit_number && (
                            <div className="lead-sub">
                              Unit{' '}
                              {
                                property.unit_number
                              }
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="lead-sub">
                          ยังไม่ได้เลือกห้อง
                        </span>
                      )}
                    </td>

                    <td>
                      <div className="budget">
                        {money(
                          lead.budget_min
                        )}
                      </div>

                      <div className="lead-sub">
                        ถึง{' '}
                        {money(
                          lead.budget_max
                        )}
                      </div>
                    </td>

                    <td>
                      {lead.move_in_date
                        ? date(
                            lead.move_in_date
                          )
                        : '—'}
                    </td>

                    <td>
                      <select
                        className="admin-select status-select"
                        value={lead.status}
                        onChange={(e) =>
                          updateStatus(
                            lead.id,
                            e.target.value
                          )
                        }
                      >
                        {statuses.map(
                          (status) => (
                            <option
                              key={status}
                              value={status}
                            >
                              {statusLabel(
                                status
                              )}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    <td>
                      <div className="lead-note">
                        {lead.note || '—'}
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="admin-empty">
                      ไม่พบ Lead
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx global>{`
        .admin-page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 20px;
        }

        .admin-page-head h1 {
          margin: 0;
          font-size: 34px;
          line-height: 1.1;
          color: #1f2937;
        }

        .admin-page-head p {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .admin-kicker {
          display: block;
          margin-bottom: 6px;
          color: #9a8260;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .admin-message {
          margin: 12px 0 16px;
          padding: 12px 14px;
          border: 1px solid #cfe3d3;
          background: #f4fbf5;
          color: #356042;
          border-radius: 8px;
          font-size: 13px;
        }

        .admin-message.error {
          border-color: #efc6c1;
          background: #fff3f2;
          color: #a63d36;
        }

        .admin-stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .admin-stat {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 18px;
        }

        .admin-stat span {
          display: block;
          color: #6b7280;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .admin-stat strong {
          display: block;
          margin-top: 8px;
          font-size: 28px;
          color: #1f2937;
        }

        .admin-toolbar {
          display: grid;
          grid-template-columns:
            minmax(260px, 1fr)
            220px;
          gap: 10px;
          margin-bottom: 14px;
        }

        .admin-input,
        .admin-select {
          width: 100%;
          min-height: 44px;
          padding: 0 12px;
          border: 1px solid #d9dee5;
          border-radius: 8px;
          background: #fff;
          color: #1f2937;
          font: inherit;
          outline: none;
        }

        .admin-input:focus,
        .admin-select:focus {
          border-color: #9a8260;
          box-shadow:
            0 0 0 3px
            rgba(154, 130, 96, 0.08);
        }

        .admin-table-card {
          overflow: hidden;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }

        .admin-table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
        }

        .admin-table th {
          padding: 12px 14px;
          background: #f8fafc;
          border-bottom:
            1px solid #e5e7eb;
          text-align: left;
          color: #6b7280;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .admin-table td {
          padding: 14px;
          border-bottom:
            1px solid #eef1f4;
          vertical-align: top;
          font-size: 13px;
          color: #1f2937;
        }

        .admin-table tbody tr:hover td {
          background: #fcfcfb;
        }

        .admin-empty {
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
        }

        @media (max-width: 1100px) {
          .admin-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .admin-page-head {
            flex-direction: column;
          }

          .admin-toolbar {
            grid-template-columns: 1fr;
          }

          .admin-stats {
            grid-template-columns:
              1fr 1fr;
          }
        }
      `}</style>

      <style jsx>{`
        .leads-page {
          min-width: 0;
        }

        .leads-toolbar {
          grid-template-columns:
            minmax(280px, 1fr)
            220px;
        }

        .leads-table {
          min-width: 1120px;
        }

        .lead-name {
          font-size: 14px;
          font-weight: 800;
        }

        .lead-sub {
          margin-top: 4px;
          color: #6b7280;
          font-size: 11px;
        }

        .contact-block + .contact-block {
          margin-top: 7px;
        }

        .contact-block span {
          display: block;
          color: #9ca3af;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        .contact-block strong {
          display: block;
          margin-top: 2px;
          font-size: 12px;
          color: #374151;
        }

        .budget {
          font-weight: 800;
        }

        .status-select {
          min-width: 145px;
        }

        .lead-note {
          max-width: 260px;
          color: #4b5563;
          line-height: 1.5;
          white-space: normal;
        }

        @media (max-width: 700px) {
          .leads-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function Stat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="admin-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function money(v: number | null) {
  return v === null
    ? '—'
    : `${new Intl.NumberFormat(
        'th-TH'
      ).format(v)} บาท`
}

function date(v: string) {
  return new Intl.DateTimeFormat(
    'th-TH',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  ).format(new Date(v))
}

function statusLabel(v: string) {
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
