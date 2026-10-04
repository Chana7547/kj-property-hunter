'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { supabase } from '../../../lib/supabase'

type Owner = {
  id: string
  full_name: string
  phone: string | null
  line_id: string | null
  email: string | null
  notes: string | null
  last_contacted_at: string | null
  next_follow_up_at: string | null
  created_at: string
}

type Property = {
  id: string
  owner_id: string
  project_name: string
  unit_number: string | null
  asking_rent: number | null
  status: string
}

type ContactLog = {
  id: string
  owner_id: string
  contact_type: string
  note: string
  contacted_at: string
  next_follow_up_at: string | null
}

const emptyOwnerForm = {
  full_name: '',
  phone: '',
  line_id: '',
  email: '',
  notes: '',
  next_follow_up: '',
}

const emptyContactForm = {
  type: 'call',
  note: '',
  followup: '',
}

export default function OwnersPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [logs, setLogs] = useState<ContactLog[]>([])

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [contactOwnerId, setContactOwnerId] = useState<string | null>(null)
  const [showOwnerForm, setShowOwnerForm] = useState(false)

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({ ...emptyOwnerForm })
  const [contact, setContact] = useState({ ...emptyContactForm })

  async function load() {
    const [o, p, l] = await Promise.all([
      supabase
        .from('owners')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('properties')
        .select(
          'id, owner_id, project_name, unit_number, asking_rent, status'
        )
        .order('created_at', { ascending: false }),

      supabase
        .from('owner_contact_logs')
        .select(
          'id, owner_id, contact_type, note, contacted_at, next_follow_up_at'
        )
        .order('contacted_at', { ascending: false }),
    ])

    if (o.error || p.error || l.error) {
      setMessage(
        o.error?.message ||
          p.error?.message ||
          l.error?.message ||
          'โหลดข้อมูลไม่สำเร็จ'
      )
    }

    setOwners(o.data ?? [])
    setProperties(p.data ?? [])
    setLogs(l.data ?? [])
  }

  useEffect(() => {
    load()
  }, [])

  const propertyMap = useMemo(() => {
    const m: Record<string, Property[]> = {}

    properties.forEach((p) => {
      ;(m[p.owner_id] ||= []).push(p)
    })

    return m
  }, [properties])

  const logMap = useMemo(() => {
    const m: Record<string, ContactLog[]> = {}

    logs.forEach((l) => {
      ;(m[l.owner_id] ||= []).push(l)
    })

    return m
  }, [logs])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    if (!q) return owners

    return owners.filter((o) =>
      [
        o.full_name,
        o.phone ?? '',
        o.line_id ?? '',
        o.email ?? '',
        o.notes ?? '',
        ...(propertyMap[o.id] ?? []).flatMap((p) => [
          p.project_name,
          p.unit_number ?? '',
        ]),
        ...(logMap[o.id] ?? []).map((l) => l.note),
      ].some((v) => v.toLowerCase().includes(q))
    )
  }, [owners, search, propertyMap, logMap])

  const followUpCount = owners.filter(
    (o) =>
      o.next_follow_up_at &&
      new Date(o.next_follow_up_at) <= new Date()
  ).length

  const ownersWithProperties = owners.filter(
    (o) => (propertyMap[o.id] ?? []).length > 0
  ).length

  const totalProperties = properties.length

  function resetOwnerForm() {
    setEditingId(null)
    setForm({ ...emptyOwnerForm })
    setShowOwnerForm(false)
  }

  function openNewOwner() {
    setEditingId(null)
    setForm({ ...emptyOwnerForm })
    setShowOwnerForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function edit(o: Owner) {
    setEditingId(o.id)

    setForm({
      full_name: o.full_name,
      phone: o.phone ?? '',
      line_id: o.line_id ?? '',
      email: o.email ?? '',
      notes: o.notes ?? '',
      next_follow_up: o.next_follow_up_at?.slice(0, 10) ?? '',
    })

    setShowOwnerForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const duplicate = owners.find(
      (o) =>
        o.id !== editingId &&
        ((form.phone.trim() && o.phone === form.phone.trim()) ||
          (form.line_id.trim() && o.line_id === form.line_id.trim()))
    )

    if (duplicate) {
      setMessage(`พบ Owner ซ้ำ: ${duplicate.full_name}`)
      setLoading(false)
      return
    }

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      line_id: form.line_id.trim() || null,
      email: form.email.trim() || null,
      notes: form.notes.trim() || null,
      next_follow_up_at: form.next_follow_up
        ? new Date(`${form.next_follow_up}T09:00:00`).toISOString()
        : null,
    }

    const r = editingId
      ? await supabase.from('owners').update(payload).eq('id', editingId)
      : await supabase.from('owners').insert({
          ...payload,
          last_contacted_at: new Date().toISOString(),
        })

    if (r.error) {
      setMessage(`บันทึกไม่สำเร็จ: ${r.error.message}`)
    } else {
      setMessage(
        editingId ? 'แก้ไข Owner สำเร็จ' : 'เพิ่ม Owner สำเร็จ'
      )
      resetOwnerForm()
      await load()
    }

    setLoading(false)
  }

  async function saveContact(ownerId: string) {
    if (!contact.note.trim()) {
      setMessage('กรุณาใส่รายละเอียดการติดต่อ')
      return
    }

    setLoading(true)
    setMessage('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    let agentId: string | null = null

    if (user) {
      const { data: a } = await supabase
        .from('agents')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

      agentId = a?.id ?? null
    }

    const contactedAt = new Date().toISOString()

    const followup = contact.followup
      ? new Date(`${contact.followup}T09:00:00`).toISOString()
      : null

    const r = await supabase.from('owner_contact_logs').insert({
      owner_id: ownerId,
      agent_id: agentId,
      contact_type: contact.type,
      note: contact.note.trim(),
      contacted_at: contactedAt,
      next_follow_up_at: followup,
    })

    if (r.error) {
      setMessage(`บันทึก Contact ไม่สำเร็จ: ${r.error.message}`)
    } else {
      await supabase
        .from('owners')
        .update({
          last_contacted_at: contactedAt,
          next_follow_up_at: followup,
        })
        .eq('id', ownerId)

      setContact({ ...emptyContactForm })
      setContactOwnerId(null)
      setMessage('บันทึกประวัติการติดต่อแล้ว')
      await load()
    }

    setLoading(false)
  }

  async function remove(o: Owner) {
    if ((propertyMap[o.id] ?? []).length) {
      alert(
        'Owner คนนี้ยังมี Property อยู่ กรุณาย้ายหรือลบ Property ก่อน'
      )
      return
    }

    if (!confirm(`ลบ ${o.full_name} ใช่หรือไม่?`)) return

    const r = await supabase.from('owners').delete().eq('id', o.id)

    if (r.error) {
      setMessage(`ลบ Owner ไม่สำเร็จ: ${r.error.message}`)
    } else {
      setMessage('ลบ Owner แล้ว')
      await load()
    }
  }

  return (
    <div className="owners-page">
      <div className="owners-head">
        <div>
          <span className="owners-kicker">OWNER CRM</span>
          <h1>Owners</h1>
          <p>จัดการข้อมูลเจ้าของห้อง การติดตาม และประวัติการติดต่อ</p>
        </div>

        <button className="add-owner-btn" onClick={openNewOwner}>
          + Add Owner
        </button>
      </div>

      <div className="owners-stats">
        <Stat label="ALL OWNERS" value={owners.length} />
        <Stat label="WITH PROPERTY" value={ownersWithProperties} />
        <Stat label="PROPERTIES" value={totalProperties} />
        <Stat label="FOLLOW-UP DUE" value={followUpCount} accent />
      </div>

      {message && (
        <div
          className={`owners-message ${
            message.includes('ไม่สำเร็จ') ||
            message.includes('ซ้ำ') ||
            message.includes('กรุณา')
              ? 'error'
              : ''
          }`}
        >
          {message}
        </div>
      )}

      {showOwnerForm && (
        <section className="owner-form-card">
          <div className="form-card-head">
            <div>
              <span>
                {editingId ? 'EDIT OWNER' : 'NEW OWNER'}
              </span>

              <h2>
                {editingId ? 'แก้ไขข้อมูลเจ้าของ' : 'เพิ่มเจ้าของใหม่'}
              </h2>
            </div>

            <button
              type="button"
              className="form-close"
              onClick={resetOwnerForm}
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="owner-form-grid">
              <Field label="ชื่อเจ้าของ *">
                <input
                  required
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="เบอร์โทร">
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="LINE ID">
                <input
                  value={form.line_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      line_id: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                />
              </Field>

              <Field label="Next Follow-up">
                <input
                  type="date"
                  value={form.next_follow_up}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      next_follow_up: e.target.value,
                    })
                  }
                />
              </Field>

              <div className="owner-note-field">
                <Field label="Owner Note">
                  <textarea
                    rows={4}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        notes: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={resetOwnerForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading
                  ? 'กำลังบันทึก...'
                  : editingId
                  ? 'Save Changes'
                  : 'Save Owner'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="owners-toolbar">
        <div className="owners-search">
          <span>SEARCH</span>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ / เบอร์ / LINE / โครงการ / Note"
          />
        </div>

        <div className="owners-count">
          {filtered.length} Owners
        </div>
      </div>

      <section className="owners-table-card">
        <div className="table-wrap">
          <table className="owners-table">
            <thead>
              <tr>
                <th>OWNER</th>
                <th>CONTACT</th>
                <th>PROPERTIES</th>
                <th>LAST CONTACT</th>
                <th>NEXT FOLLOW-UP</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((o) => {
                const ps = propertyMap[o.id] ?? []
                const hs = logMap[o.id] ?? []

                const due =
                  !!o.next_follow_up_at &&
                  new Date(o.next_follow_up_at) <= new Date()

                return (
                  <>
                    <tr key={o.id}>
                      <td>
                        <div className="owner-name">
                          {o.full_name}
                        </div>

                        <div className="owner-email">
                          {o.email || '—'}
                        </div>

                        {o.notes && (
                          <div className="owner-note">
                            {o.notes}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="contact-line">
                          <span>PHONE</span>
                          <strong>{o.phone || '—'}</strong>
                        </div>

                        <div className="contact-line">
                          <span>LINE</span>
                          <strong>{o.line_id || '—'}</strong>
                        </div>
                      </td>

                      <td>
                        <div className="property-count">
                          {ps.length}
                        </div>

                        {ps.slice(0, 2).map((p) => (
                          <div
                            className="property-mini"
                            key={p.id}
                          >
                            {p.project_name}
                            {p.unit_number
                              ? ` · ${p.unit_number}`
                              : ''}
                          </div>
                        ))}

                        {ps.length > 2 && (
                          <div className="more-text">
                            +{ps.length - 2} more
                          </div>
                        )}
                      </td>

                      <td>
                        {o.last_contacted_at
                          ? dt(o.last_contacted_at)
                          : '—'}
                      </td>

                      <td>
                        <div
                          className={`followup ${
                            due ? 'due' : ''
                          }`}
                        >
                          {o.next_follow_up_at
                            ? d(o.next_follow_up_at)
                            : '—'}
                        </div>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="row-btn"
                            onClick={() => edit(o)}
                          >
                            Edit
                          </button>

                          <button
                            className="row-btn primary"
                            onClick={() =>
                              setContactOwnerId(
                                contactOwnerId === o.id
                                  ? null
                                  : o.id
                              )
                            }
                          >
                            Contact
                          </button>

                          <button
                            className="row-btn danger"
                            onClick={() => remove(o)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>

                    {contactOwnerId === o.id && (
                      <tr className="detail-row">
                        <td colSpan={6}>
                          <div className="owner-detail-panel">
                            <div className="contact-form-panel">
                              <div className="panel-head">
                                <div>
                                  <span>NEW CONTACT</span>
                                  <h3>
                                    บันทึกการติดต่อ · {o.full_name}
                                  </h3>
                                </div>
                              </div>

                              <div className="contact-grid">
                                <Field label="ช่องทาง">
                                  <select
                                    value={contact.type}
                                    onChange={(e) =>
                                      setContact({
                                        ...contact,
                                        type: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="call">โทร</option>
                                    <option value="line">LINE</option>
                                    <option value="email">Email</option>
                                    <option value="meeting">นัดพบ</option>
                                    <option value="other">อื่น ๆ</option>
                                  </select>
                                </Field>

                                <Field label="Follow-up">
                                  <input
                                    type="date"
                                    value={contact.followup}
                                    onChange={(e) =>
                                      setContact({
                                        ...contact,
                                        followup: e.target.value,
                                      })
                                    }
                                  />
                                </Field>

                                <div className="contact-note">
                                  <Field label="รายละเอียด">
                                    <textarea
                                      rows={3}
                                      value={contact.note}
                                      onChange={(e) =>
                                        setContact({
                                          ...contact,
                                          note: e.target.value,
                                        })
                                      }
                                    />
                                  </Field>
                                </div>
                              </div>

                              <div className="contact-form-actions">
                                <button
                                  type="button"
                                  className="btn-primary"
                                  disabled={loading}
                                  onClick={() => saveContact(o.id)}
                                >
                                  {loading
                                    ? 'กำลังบันทึก...'
                                    : 'Save Contact'}
                                </button>
                              </div>
                            </div>

                            <div className="history-panel">
                              <div className="panel-head">
                                <div>
                                  <span>CONTACT HISTORY</span>
                                  <h3>ประวัติการติดต่อ</h3>
                                </div>
                              </div>

                              {hs.length === 0 ? (
                                <div className="empty-history">
                                  ยังไม่มีประวัติการติดต่อ
                                </div>
                              ) : (
                                <div className="history-list">
                                  {hs.slice(0, 8).map((h) => (
                                    <div
                                      className="history-item"
                                      key={h.id}
                                    >
                                      <div className="history-top">
                                        <strong>
                                          {contactLabel(
                                            h.contact_type
                                          )}
                                        </strong>

                                        <span>
                                          {dt(h.contacted_at)}
                                        </span>
                                      </div>

                                      <p>{h.note}</p>

                                      {h.next_follow_up_at && (
                                        <small>
                                          Follow-up:{' '}
                                          {d(h.next_follow_up_at)}
                                        </small>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-table">
                      ไม่พบ Owner ตามคำค้นหา
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style jsx>{`
        .owners-page {
          width: 100%;
          min-width: 0;
          color: #1f2937;
        }

        .owners-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
          margin-bottom: 22px;
        }

        .owners-kicker {
          display: block;
          color: #8b8170;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .owners-head h1 {
          margin: 7px 0 0;
          font-size: clamp(36px, 4vw, 48px);
          line-height: 1;
          font-weight: 700;
          letter-spacing: -1.2px;
        }

        .owners-head p {
          margin: 10px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .add-owner-btn,
        .btn-primary,
        .btn-secondary,
        .row-btn {
          border-radius: 8px;
          font: inherit;
          cursor: pointer;
        }

        .add-owner-btn {
          min-height: 42px;
          padding: 0 16px;
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
        }

        .owners-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .stat {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
        }

        .stat.accent {
          border-color: #f0d8ad;
          background: #fff9ec;
        }

        .stat span {
          display: block;
          color: #6b7280;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .stat strong {
          display: block;
          margin-top: 9px;
          font-size: 30px;
          line-height: 1;
        }

        .owners-message {
          margin-top: 16px;
          padding: 12px 14px;
          border: 1px solid #cfe3d3;
          border-radius: 8px;
          background: #f4fbf5;
          color: #356042;
          font-size: 13px;
        }

        .owners-message.error {
          border-color: #efc6c1;
          background: #fff3f2;
          color: #a63d36;
        }

        .owner-form-card {
          margin-top: 18px;
          padding: 22px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 8px 26px rgba(17, 24, 39, 0.04);
        }

        .form-card-head,
        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .form-card-head {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid #edf0f2;
        }

        .form-card-head span,
        .panel-head span {
          color: #8b8170;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .form-card-head h2,
        .panel-head h3 {
          margin: 5px 0 0;
          font-size: 20px;
          line-height: 1.2;
        }

        .form-close {
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          color: #4b5563;
          font-size: 22px;
          line-height: 1;
        }

        .owner-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .owner-note-field {
          grid-column: 1 / -1;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: #4b5563;
          font-size: 11px;
          font-weight: 700;
        }

        .field input,
        .field select,
        .field textarea,
        .owners-search input {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid #d9dee5;
          border-radius: 8px;
          outline: none;
          background: #fff;
          color: #111827;
          font: inherit;
          transition:
            border-color 0.16s ease,
            box-shadow 0.16s ease;
        }

        .field input,
        .field select {
          min-height: 44px;
          padding: 0 12px;
        }

        .field textarea {
          padding: 11px 12px;
          resize: vertical;
          line-height: 1.55;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus,
        .owners-search input:focus {
          border-color: #9a8260;
          box-shadow: 0 0 0 3px rgba(154, 130, 96, 0.08);
        }

        .form-actions,
        .contact-form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .btn-primary,
        .btn-secondary {
          min-height: 42px;
          padding: 0 16px;
          font-size: 12px;
          font-weight: 700;
        }

        .btn-primary {
          border: 1px solid #111827;
          background: #111827;
          color: #fff;
        }

        .btn-secondary {
          border: 1px solid #d9dee5;
          background: #fff;
          color: #374151;
        }

        .owners-toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 12px;
          align-items: center;
          margin-top: 20px;
        }

        .owners-search {
          position: relative;
          max-width: 560px;
        }

        .owners-search span {
          position: absolute;
          left: 12px;
          top: 7px;
          z-index: 1;
          color: #9a8260;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1px;
          pointer-events: none;
        }

        .owners-search input {
          min-height: 50px;
          padding: 18px 12px 6px;
        }

        .owners-count {
          color: #6b7280;
          font-size: 13px;
        }

        .owners-table-card {
          margin-top: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
          overflow: hidden;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .owners-table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
        }

        .owners-table th {
          padding: 12px 14px;
          border-bottom: 1px solid #e5e7eb;
          background: #f8fafc;
          color: #6b7280;
          text-align: left;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .owners-table td {
          padding: 16px 14px;
          border-bottom: 1px solid #eef1f4;
          vertical-align: top;
          font-size: 13px;
        }

        .owners-table tbody tr:hover > td {
          background: #fcfcfb;
        }

        .owner-name {
          color: #111827;
          font-size: 15px;
          font-weight: 800;
        }

        .owner-email {
          margin-top: 4px;
          color: #6b7280;
          font-size: 12px;
        }

        .owner-note {
          max-width: 280px;
          margin-top: 7px;
          color: #7c6f5e;
          font-size: 11px;
          line-height: 1.5;
        }

        .contact-line + .contact-line {
          margin-top: 7px;
        }

        .contact-line span {
          display: block;
          color: #9ca3af;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        .contact-line strong {
          display: block;
          margin-top: 2px;
          color: #374151;
          font-size: 12px;
        }

        .property-count {
          margin-bottom: 6px;
          color: #111827;
          font-size: 20px;
          font-weight: 800;
        }

        .property-mini,
        .more-text {
          max-width: 190px;
          color: #6b7280;
          font-size: 11px;
          line-height: 1.45;
        }

        .more-text {
          margin-top: 4px;
          color: #9a8260;
        }

        .followup {
          color: #4b5563;
          font-weight: 700;
        }

        .followup.due {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 999px;
          background: #fff3db;
          color: #9a6514;
        }

        .row-actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .row-btn {
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid #d9dee5;
          background: #fff;
          color: #374151;
          font-size: 11px;
          font-weight: 700;
        }

        .row-btn.primary {
          border-color: #111827;
          background: #111827;
          color: #fff;
        }

        .row-btn.danger {
          color: #b2433b;
        }

        .detail-row td {
          padding: 0;
          background: #fbfcfd !important;
        }

        .owner-detail-panel {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          padding: 18px;
        }

        .contact-form-panel,
        .history-panel {
          min-width: 0;
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: #fff;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }

        .contact-note {
          grid-column: 1 / -1;
        }

        .empty-history {
          margin-top: 14px;
          color: #9ca3af;
          font-size: 12px;
        }

        .history-list {
          margin-top: 12px;
        }

        .history-item {
          padding: 12px 0;
          border-bottom: 1px solid #eef1f4;
        }

        .history-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
        }

        .history-top strong {
          color: #374151;
          font-size: 12px;
        }

        .history-top span {
          color: #9ca3af;
          font-size: 10px;
        }

        .history-item p {
          margin: 6px 0 0;
          color: #4b5563;
          font-size: 12px;
          line-height: 1.55;
        }

        .history-item small {
          display: block;
          margin-top: 5px;
          color: #9a6514;
          font-size: 10px;
        }

        .empty-table {
          padding: 50px 20px;
          text-align: center;
          color: #9ca3af;
        }

        @media (max-width: 1100px) {
          .owners-stats {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .owner-detail-panel {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .owners-head {
            flex-direction: column;
          }

          .add-owner-btn {
            width: 100%;
          }

          .owner-form-grid {
            grid-template-columns: 1fr;
          }

          .owner-note-field {
            grid-column: auto;
          }

          .owners-toolbar {
            grid-template-columns: 1fr;
          }

          .owners-search {
            max-width: none;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .contact-grid {
            grid-template-columns: 1fr;
          }

          .contact-note {
            grid-column: auto;
          }
        }

        @media (max-width: 430px) {
          .owners-stats {
            grid-template-columns: 1fr 1fr;
          }

          .stat {
            padding: 14px;
          }

          .stat strong {
            font-size: 26px;
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
  children: ReactNode
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div className={`stat ${accent ? 'accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function d(v: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(v))
}

function dt(v: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(v))
}

function contactLabel(v: string) {
  return (
    {
      call: 'โทร',
      line: 'LINE',
      email: 'Email',
      meeting: 'นัดพบ',
      other: 'อื่น ๆ',
    } as Record<string, string>
  )[v] || v
}
