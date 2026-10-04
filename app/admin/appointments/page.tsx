'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../../lib/supabase'

type Lead = {
  id: string
  customer_name: string
  interested_property_id: string | null
}

type Property = {
  id: string
  project_name: string
  unit_number: string | null
}

type Appointment = {
  id: string
  lead_id: string | null
  property_id: string | null
  appointment_at: string
  status: string
  note: string | null
  created_at: string
}

const statuses = [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]

const emptyForm = {
  lead_id: '',
  property_id: '',
  appointment_at: '',
  note: '',
}

export default function AppointmentsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [items, setItems] = useState<Appointment[]>([])

  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ ...emptyForm })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [l, p, a] = await Promise.all([
      supabase
        .from('leads')
        .select('id,customer_name,interested_property_id')
        .order('created_at', { ascending: false }),

      supabase
        .from('properties')
        .select('id,project_name,unit_number')
        .order('created_at', { ascending: false }),

      supabase
        .from('appointments')
        .select('*')
        .order('appointment_at', { ascending: true }),
    ])

    if (l.error || p.error || a.error) {
      setMessage(
        l.error?.message ||
          p.error?.message ||
          a.error?.message ||
          'โหลดข้อมูลไม่สำเร็จ'
      )
    }

    setLeads(l.data ?? [])
    setProperties(p.data ?? [])
    setItems(a.data ?? [])
  }

  const leadMap = useMemo(
    () => Object.fromEntries(leads.map((x) => [x.id, x])),
    [leads]
  )

  const propertyMap = useMemo(
    () => Object.fromEntries(properties.map((x) => [x.id, x])),
    [properties]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return items.filter((item) => {
      const lead = item.lead_id ? leadMap[item.lead_id] : null
      const property = item.property_id
        ? propertyMap[item.property_id]
        : null

      const matchesStatus =
        filter === 'all' || item.status === filter

      const matchesSearch =
        !q ||
        [
          lead?.customer_name ?? '',
          property?.project_name ?? '',
          property?.unit_number ?? '',
          item.note ?? '',
          item.status,
        ].some((v) => v.toLowerCase().includes(q))

      return matchesStatus && matchesSearch
    })
  }, [items, filter, search, leadMap, propertyMap])

  const todayCount = items.filter((x) =>
    isSameDay(new Date(x.appointment_at), new Date())
  ).length

  const upcomingCount = items.filter((x) => {
    const d = new Date(x.appointment_at)
    const now = new Date()

    return (
      d >= now &&
      !['completed', 'cancelled', 'no_show'].includes(x.status)
    )
  }).length

  const completedCount = items.filter(
    (x) => x.status === 'completed'
  ).length

  function openNew() {
    setForm({ ...emptyForm })
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function closeForm() {
    setForm({ ...emptyForm })
    setShowForm(false)
  }

  function chooseLead(id: string) {
    const lead = leadMap[id]

    setForm({
      ...form,
      lead_id: id,
      property_id:
        lead?.interested_property_id || form.property_id,
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.lead_id) {
      setMessage('กรุณาเลือก Lead')
      return
    }

    if (!form.appointment_at) {
      setMessage('กรุณาเลือกวันและเวลานัด')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let agentId: string | null = null

    if (user) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      agentId = agent?.id ?? null
    }

    const r = await supabase
      .from('appointments')
      .insert({
        lead_id: form.lead_id || null,
        property_id: form.property_id || null,
        assigned_agent_id: agentId,
        appointment_at: new Date(
          form.appointment_at
        ).toISOString(),
        status: 'scheduled',
        note: form.note.trim() || null,
      })

    if (r.error) {
      setMessage(
        `บันทึกนัดไม่สำเร็จ: ${r.error.message}`
      )
      setLoading(false)
      return
    }

    if (form.lead_id) {
      await supabase
        .from('leads')
        .update({
          status: 'viewing',
        })
        .eq('id', form.lead_id)
    }

    setMessage('เพิ่มนัดชมสำเร็จ')
    closeForm()
    await load()
    setLoading(false)
  }

  async function changeStatus(
    id: string,
    status: string
  ) {
    const r = await supabase
      .from('appointments')
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

  async function remove(id: string) {
    if (!confirm('ลบนัดนี้ใช่หรือไม่?')) return

    const r = await supabase
      .from('appointments')
      .delete()
      .eq('id', id)

    if (r.error) {
      setMessage(
        `ลบนัดไม่สำเร็จ: ${r.error.message}`
      )
      return
    }

    setMessage('ลบนัดแล้ว')
    await load()
  }

  return (
    <div className="appointments-page">
      <div className="admin-page-head">
        <div>
          <span className="admin-kicker">
            VIEWINGS
          </span>

          <h1>Appointments</h1>

          <p>
            จัดการนัดชมคอนโดและติดตามลูกค้า
          </p>
        </div>

        <button
          className="admin-btn primary"
          onClick={openNew}
        >
          + Add Appointment
        </button>
      </div>

      <div className="admin-stats">
        <Stat
          label="ALL APPOINTMENTS"
          value={items.length}
        />

        <Stat
          label="TODAY"
          value={todayCount}
        />

        <Stat
          label="UPCOMING"
          value={upcomingCount}
        />

        <Stat
          label="COMPLETED"
          value={completedCount}
        />
      </div>

      {message && (
        <div
          className={`admin-message ${
            message.includes('ไม่สำเร็จ') ||
            message.includes('กรุณา')
              ? 'error'
              : ''
          }`}
        >
          {message}
        </div>
      )}

      {showForm && (
        <section className="admin-card appointment-form-card">
          <div className="appointment-form-head">
            <div>
              <span className="admin-kicker">
                NEW APPOINTMENT
              </span>

              <h2>เพิ่มนัดชมใหม่</h2>
            </div>

            <button
              type="button"
              className="appointment-close"
              onClick={closeForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="admin-grid-3">
              <Field label="Lead *">
                <select
                  className="admin-select"
                  required
                  value={form.lead_id}
                  onChange={(e) =>
                    chooseLead(e.target.value)
                  }
                >
                  <option value="">
                    เลือก Lead
                  </option>

                  {leads.map((lead) => (
                    <option
                      key={lead.id}
                      value={lead.id}
                    >
                      {lead.customer_name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Property">
                <select
                  className="admin-select"
                  value={form.property_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      property_id:
                        e.target.value,
                    })
                  }
                >
                  <option value="">
                    เลือก Property
                  </option>

                  {properties.map((property) => (
                    <option
                      key={property.id}
                      value={property.id}
                    >
                      {property.project_name}
                      {property.unit_number
                        ? ` · Unit ${property.unit_number}`
                        : ''}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="วันและเวลา *">
                <input
                  className="admin-input"
                  required
                  type="datetime-local"
                  value={form.appointment_at}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      appointment_at:
                        e.target.value,
                    })
                  }
                />
              </Field>
            </div>

            <div style={{ marginTop: 14 }}>
              <Field label="Note">
                <textarea
                  className="admin-textarea"
                  rows={4}
                  value={form.note}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      note: e.target.value,
                    })
                  }
                  placeholder="เช่น นัดเจอที่ Lobby / ลูกค้าต้องการดู 2 ห้อง"
                />
              </Field>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                className="admin-btn primary"
                disabled={loading}
              >
                {loading
                  ? 'กำลังบันทึก...'
                  : 'Save Appointment'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="admin-toolbar appointment-toolbar">
        <input
          className="admin-input"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="ค้นหาลูกค้า / โครงการ / Unit / Note"
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
          <table className="admin-table appointment-table">
            <thead>
              <tr>
                <th>DATE & TIME</th>
                <th>CUSTOMER</th>
                <th>PROPERTY</th>
                <th>NOTE</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((appointment) => {
                const lead =
                  appointment.lead_id
                    ? leadMap[
                        appointment.lead_id
                      ]
                    : null

                const property =
                  appointment.property_id
                    ? propertyMap[
                        appointment.property_id
                      ]
                    : null

                const isToday = isSameDay(
                  new Date(
                    appointment.appointment_at
                  ),
                  new Date()
                )

                return (
                  <tr key={appointment.id}>
                    <td>
                      <div className="appointment-date">
                        <strong>
                          {dateOnly(
                            appointment.appointment_at
                          )}
                        </strong>

                        <span>
                          {timeOnly(
                            appointment.appointment_at
                          )}
                        </span>

                        {isToday && (
                          <em>TODAY</em>
                        )}
                      </div>
                    </td>

                    <td>
                      <strong>
                        {lead?.customer_name ||
                          '—'}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        {property?.project_name ||
                          '—'}
                      </strong>

                      {property?.unit_number && (
                        <div className="appointment-muted">
                          Unit{' '}
                          {
                            property.unit_number
                          }
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="appointment-note">
                        {appointment.note || '—'}
                      </div>
                    </td>

                    <td>
                      <select
                        className="admin-select"
                        value={
                          appointment.status
                        }
                        onChange={(e) =>
                          changeStatus(
                            appointment.id,
                            e.target.value
                          )
                        }
                      >
                        {statuses.map((status) => (
                          <option
                            key={status}
                            value={status}
                          >
                            {statusLabel(
                              status
                            )}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td>
                      <button
                        className="admin-btn danger"
                        onClick={() =>
                          remove(
                            appointment.id
                          )
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="admin-empty">
                      ไม่มีนัดชม
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

        .admin-btn {
          min-height: 40px;
          border-radius: 8px;
          padding: 0 14px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #1f2937;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }

        .admin-btn.primary {
          background: #111827;
          border-color: #111827;
          color: #fff;
        }

        .admin-btn.danger {
          color: #b33f36;
        }

        .admin-btn:disabled {
          opacity: 0.55;
          cursor: not-allowed;
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

        .admin-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .admin-card h2 {
          margin: 0;
          font-size: 18px;
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
        .admin-select,
        .admin-textarea {
          width: 100%;
          border: 1px solid #d9dee5;
          border-radius: 8px;
          background: #fff;
          color: #1f2937;
          font: inherit;
          outline: none;
        }

        .admin-input,
        .admin-select {
          min-height: 44px;
          padding: 0 12px;
        }

        .admin-textarea {
          min-height: 100px;
          padding: 10px 12px;
          resize: vertical;
        }

        .admin-input:focus,
        .admin-select:focus,
        .admin-textarea:focus {
          border-color: #9a8260;
          box-shadow:
            0 0 0 3px
            rgba(154, 130, 96, 0.08);
        }

        .admin-grid-3 {
          display: grid;
          grid-template-columns:
            repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .admin-field label {
          display: block;
          margin-bottom: 6px;
          color: #4b5563;
          font-size: 11px;
          font-weight: 700;
        }

        .admin-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
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

          .admin-grid-3 {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .admin-page-head {
            flex-direction: column;
          }

          .admin-toolbar,
          .admin-grid-3 {
            grid-template-columns: 1fr;
          }

          .admin-stats {
            grid-template-columns: 1fr 1fr;
          }

          .admin-form-actions {
            flex-direction: column-reverse;
          }

          .admin-form-actions .admin-btn {
            width: 100%;
          }
        }
      `}</style>

      <style jsx>{`
        .appointments-page {
          min-width: 0;
        }

        .appointment-form-card {
          margin-bottom: 18px;
        }

        .appointment-form-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 14px;
          margin-bottom: 16px;
          border-bottom:
            1px solid #eef1f4;
        }

        .appointment-form-head h2 {
          margin: 3px 0 0;
        }

        .appointment-close {
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          color: #4b5563;
          font-size: 22px;
          cursor: pointer;
        }

        .appointment-toolbar {
          grid-template-columns:
            minmax(280px, 1fr)
            220px;
        }

        .appointment-table {
          min-width: 980px;
        }

        .appointment-date {
          min-width: 110px;
        }

        .appointment-date strong,
        .appointment-date span {
          display: block;
        }

        .appointment-date span {
          margin-top: 4px;
          color: #6b7280;
        }

        .appointment-date em {
          display: inline-flex;
          margin-top: 7px;
          padding: 4px 7px;
          border-radius: 999px;
          background: #fff3db;
          color: #9a6514;
          font-style: normal;
          font-size: 9px;
          font-weight: 800;
        }

        .appointment-muted {
          margin-top: 4px;
          color: #6b7280;
          font-size: 11px;
        }

        .appointment-note {
          max-width: 260px;
          color: #4b5563;
          line-height: 1.5;
        }

        @media (max-width: 700px) {
          .appointment-toolbar {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="admin-field">
      <label>{label}</label>
      {children}
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

function statusLabel(v: string) {
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

function dateOnly(v: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(v))
}

function timeOnly(v: string) {
  return new Intl.DateTimeFormat('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(v))
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}
