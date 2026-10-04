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
  asking_rent: number | null
}

type Contract = {
  id: string
  lead_id: string | null
  property_id: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  monthly_rent: number | null
  deposit_amount: number | null
  advance_amount: number | null
  commission_amount: number | null
  commission_status: string
  contract_status: string
  note: string | null
  created_at: string
}

const contractStatuses = [
  'draft',
  'waiting_signature',
  'signed',
  'active',
  'completed',
  'cancelled',
]

const commissionStatuses = [
  'pending',
  'invoiced',
  'paid',
  'cancelled',
]

const empty = {
  lead_id: '',
  property_id: '',
  start: '',
  end: '',
  monthly_rent: '',
  deposit: '',
  advance: '',
  commission: '',
  commission_status: 'pending',
  contract_status: 'draft',
  note: '',
}

export default function ContractsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [items, setItems] = useState<Contract[]>([])

  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ ...empty })

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [l, p, c] = await Promise.all([
      supabase
        .from('leads')
        .select('id,customer_name,interested_property_id')
        .order('created_at', { ascending: false }),

      supabase
        .from('properties')
        .select('id,project_name,unit_number,asking_rent')
        .order('created_at', { ascending: false }),

      supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false }),
    ])

    if (l.error || p.error || c.error) {
      setMessage(
        l.error?.message ||
          p.error?.message ||
          c.error?.message ||
          'โหลดข้อมูลไม่สำเร็จ'
      )
    }

    setLeads(l.data ?? [])
    setProperties(p.data ?? [])
    setItems(c.data ?? [])
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

    return items.filter((c) => {
      const lead = c.lead_id ? leadMap[c.lead_id] : null
      const property = c.property_id ? propertyMap[c.property_id] : null

      const matchesFilter =
        filter === 'all' || c.contract_status === filter

      const matchesSearch =
        !q ||
        [
          lead?.customer_name ?? '',
          property?.project_name ?? '',
          property?.unit_number ?? '',
          c.contract_status,
          c.commission_status,
          c.note ?? '',
        ].some((v) => v.toLowerCase().includes(q))

      return matchesFilter && matchesSearch
    })
  }, [items, filter, search, leadMap, propertyMap])

  const unpaid = items
    .filter(
      (x) =>
        x.commission_status !== 'paid' &&
        x.commission_status !== 'cancelled'
    )
    .reduce(
      (sum, x) =>
        sum + Number(x.commission_amount || 0),
      0
    )

  const paid = items
    .filter((x) => x.commission_status === 'paid')
    .reduce(
      (sum, x) =>
        sum + Number(x.commission_amount || 0),
      0
    )

  function reset() {
    setEditingId(null)
    setForm({ ...empty })
    setShowForm(false)
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...empty })
    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  function chooseLead(id: string) {
    const lead = leadMap[id]

    const property =
      lead?.interested_property_id
        ? propertyMap[lead.interested_property_id]
        : null

    setForm({
      ...form,
      lead_id: id,
      property_id:
        lead?.interested_property_id || '',
      monthly_rent:
        property?.asking_rent?.toString() ||
        form.monthly_rent,
    })
  }

  function chooseProperty(id: string) {
    const property = propertyMap[id]

    setForm({
      ...form,
      property_id: id,
      monthly_rent:
        property?.asking_rent?.toString() ||
        form.monthly_rent,
    })
  }

  function edit(c: Contract) {
    setEditingId(c.id)

    setForm({
      lead_id: c.lead_id || '',
      property_id: c.property_id || '',
      start: c.contract_start_date || '',
      end: c.contract_end_date || '',
      monthly_rent:
        c.monthly_rent?.toString() || '',
      deposit:
        c.deposit_amount?.toString() || '',
      advance:
        c.advance_amount?.toString() || '',
      commission:
        c.commission_amount?.toString() || '',
      commission_status:
        c.commission_status,
      contract_status:
        c.contract_status,
      note: c.note || '',
    })

    setShowForm(true)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    const payload = {
      lead_id: form.lead_id || null,
      property_id: form.property_id || null,
      contract_start_date: form.start || null,
      contract_end_date: form.end || null,
      monthly_rent: form.monthly_rent
        ? Number(form.monthly_rent)
        : null,
      deposit_amount: form.deposit
        ? Number(form.deposit)
        : null,
      advance_amount: form.advance
        ? Number(form.advance)
        : null,
      commission_amount: form.commission
        ? Number(form.commission)
        : null,
      commission_status:
        form.commission_status,
      contract_status:
        form.contract_status,
      note: form.note.trim() || null,
    }

    const r = editingId
      ? await supabase
          .from('contracts')
          .update(payload)
          .eq('id', editingId)
      : await supabase
          .from('contracts')
          .insert(payload)

    if (r.error) {
      setMessage(
        `บันทึก Contract ไม่สำเร็จ: ${r.error.message}`
      )

      setLoading(false)
      return
    }

    if (
      form.lead_id &&
      ['signed', 'active'].includes(
        form.contract_status
      )
    ) {
      await supabase
        .from('leads')
        .update({
          status: 'contract',
        })
        .eq('id', form.lead_id)
    }

    if (
      form.lead_id &&
      form.contract_status === 'completed'
    ) {
      await supabase
        .from('leads')
        .update({
          status: 'closed',
        })
        .eq('id', form.lead_id)
    }

    if (
      form.property_id &&
      ['active', 'completed'].includes(
        form.contract_status
      )
    ) {
      await supabase
        .from('properties')
        .update({
          status: 'rented',
          is_published: false,
        })
        .eq('id', form.property_id)
    }

    setMessage(
      editingId
        ? 'แก้ไข Contract สำเร็จ'
        : 'เพิ่ม Contract สำเร็จ'
    )

    reset()
    await load()

    setLoading(false)
  }

  async function remove(id: string) {
    if (!confirm('ลบ Contract นี้ใช่หรือไม่?')) {
      return
    }

    const r = await supabase
      .from('contracts')
      .delete()
      .eq('id', id)

    if (r.error) {
      setMessage(
        `ลบ Contract ไม่สำเร็จ: ${r.error.message}`
      )
      return
    }

    setMessage('ลบ Contract แล้ว')
    await load()
  }

  async function updateContractStatus(
    id: string,
    contractStatus: string
  ) {
    const r = await supabase
      .from('contracts')
      .update({
        contract_status: contractStatus,
      })
      .eq('id', id)

    if (r.error) {
      setMessage(
        `เปลี่ยนสถานะไม่สำเร็จ: ${r.error.message}`
      )
      return
    }

    await load()
  }

  async function updateCommissionStatus(
    id: string,
    commissionStatus: string
  ) {
    const r = await supabase
      .from('contracts')
      .update({
        commission_status: commissionStatus,
      })
      .eq('id', id)

    if (r.error) {
      setMessage(
        `เปลี่ยน Commission ไม่สำเร็จ: ${r.error.message}`
      )
      return
    }

    await load()
  }

  return (
    <div className="contracts-page">
      <div className="admin-page-head">
        <div>
          <span className="admin-kicker">
            CONTRACTS & COMMISSION
          </span>

          <h1>Contracts</h1>

          <p>
            จัดการสัญญา ค่าเช่า เงินประกัน
            และ Commission
          </p>
        </div>

        <button
          className="admin-btn primary"
          onClick={openNew}
        >
          + Add Contract
        </button>
      </div>

      <div className="admin-stats">
        <Stat
          label="ALL CONTRACTS"
          value={items.length}
        />

        <Stat
          label="ACTIVE"
          value={
            items.filter(
              (x) =>
                x.contract_status === 'active'
            ).length
          }
        />

        <StatMoney
          label="UNPAID COMMISSION"
          value={unpaid}
          tone="gold"
        />

        <StatMoney
          label="PAID COMMISSION"
          value={paid}
          tone="green"
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

      {showForm && (
        <section className="admin-card contract-form-card">
          <div className="contract-form-head">
            <div>
              <span className="admin-kicker">
                {editingId
                  ? 'EDIT CONTRACT'
                  : 'NEW CONTRACT'}
              </span>

              <h2>
                {editingId
                  ? 'แก้ไขสัญญา'
                  : 'เพิ่มสัญญาใหม่'}
              </h2>
            </div>

            <button
              type="button"
              className="contract-close"
              onClick={reset}
            >
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="contract-section">
              <h3>ข้อมูลลูกค้าและทรัพย์</h3>

              <div className="admin-grid-2">
                <Field label="Lead">
                  <select
                    className="admin-select"
                    value={form.lead_id}
                    onChange={(e) =>
                      chooseLead(e.target.value)
                    }
                  >
                    <option value="">
                      เลือก Lead
                    </option>

                    {leads.map((l) => (
                      <option
                        key={l.id}
                        value={l.id}
                      >
                        {l.customer_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Property">
                  <select
                    className="admin-select"
                    value={form.property_id}
                    onChange={(e) =>
                      chooseProperty(
                        e.target.value
                      )
                    }
                  >
                    <option value="">
                      เลือก Property
                    </option>

                    {properties.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                      >
                        {p.project_name}
                        {p.unit_number
                          ? ` · Unit ${p.unit_number}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </div>

            <div className="contract-section">
              <h3>ระยะเวลาสัญญา</h3>

              <div className="admin-grid-2">
                <Field label="Start Date">
                  <input
                    className="admin-input"
                    type="date"
                    value={form.start}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        start: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="End Date">
                  <input
                    className="admin-input"
                    type="date"
                    value={form.end}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        end: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="contract-section">
              <h3>การเงิน</h3>

              <div className="admin-grid-2">
                <Field label="Monthly Rent">
                  <MoneyInput
                    value={form.monthly_rent}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        monthly_rent: value,
                      })
                    }
                  />
                </Field>

                <Field label="Deposit">
                  <MoneyInput
                    value={form.deposit}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        deposit: value,
                      })
                    }
                  />
                </Field>

                <Field label="Advance">
                  <MoneyInput
                    value={form.advance}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        advance: value,
                      })
                    }
                  />
                </Field>

                <Field label="Commission">
                  <MoneyInput
                    value={form.commission}
                    onChange={(value) =>
                      setForm({
                        ...form,
                        commission: value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="contract-section">
              <h3>สถานะ</h3>

              <div className="admin-grid-2">
                <Field label="Contract Status">
                  <select
                    className="admin-select"
                    value={
                      form.contract_status
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contract_status:
                          e.target.value,
                      })
                    }
                  >
                    {contractStatuses.map(
                      (s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {statusLabel(s)}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Commission Status">
                  <select
                    className="admin-select"
                    value={
                      form.commission_status
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        commission_status:
                          e.target.value,
                      })
                    }
                  >
                    {commissionStatuses.map(
                      (s) => (
                        <option
                          key={s}
                          value={s}
                        >
                          {commissionLabel(s)}
                        </option>
                      )
                    )}
                  </select>
                </Field>
              </div>
            </div>

            <div className="contract-section">
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
                  placeholder="บันทึกรายละเอียดเพิ่มเติม..."
                />
              </Field>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-btn"
                onClick={reset}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-btn primary"
                disabled={loading}
              >
                {loading
                  ? 'กำลังบันทึก...'
                  : editingId
                  ? 'Save Changes'
                  : 'Save Contract'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="admin-toolbar contract-toolbar">
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

          {contractStatuses.map((s) => (
            <option
              key={s}
              value={s}
            >
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table contract-table">
            <thead>
              <tr>
                <th>CUSTOMER</th>
                <th>PROPERTY</th>
                <th>TERM</th>
                <th>MONTHLY RENT</th>
                <th>CONTRACT STATUS</th>
                <th>COMMISSION</th>
                <th>COMMISSION STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => {
                const lead = c.lead_id
                  ? leadMap[c.lead_id]
                  : null

                const property =
                  c.property_id
                    ? propertyMap[c.property_id]
                    : null

                return (
                  <tr key={c.id}>
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
                        <div className="contract-muted">
                          Unit{' '}
                          {property.unit_number}
                        </div>
                      )}
                    </td>

                    <td>
                      <div>
                        {c.contract_start_date
                          ? date(
                              c.contract_start_date
                            )
                          : '—'}
                      </div>

                      <div className="contract-muted">
                        ถึง{' '}
                        {c.contract_end_date
                          ? date(
                              c.contract_end_date
                            )
                          : '—'}
                      </div>
                    </td>

                    <td>
                      <strong>
                        {money(
                          c.monthly_rent
                        )}
                      </strong>

                      <div className="contract-muted">
                        Deposit{' '}
                        {money(
                          c.deposit_amount
                        )}
                      </div>
                    </td>

                    <td>
                      <select
                        className="admin-select"
                        value={
                          c.contract_status
                        }
                        onChange={(e) =>
                          updateContractStatus(
                            c.id,
                            e.target.value
                          )
                        }
                      >
                        {contractStatuses.map(
                          (s) => (
                            <option
                              key={s}
                              value={s}
                            >
                              {statusLabel(s)}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    <td>
                      <strong>
                        {money(
                          c.commission_amount
                        )}
                      </strong>
                    </td>

                    <td>
                      <select
                        className="admin-select"
                        value={
                          c.commission_status
                        }
                        onChange={(e) =>
                          updateCommissionStatus(
                            c.id,
                            e.target.value
                          )
                        }
                      >
                        {commissionStatuses.map(
                          (s) => (
                            <option
                              key={s}
                              value={s}
                            >
                              {commissionLabel(s)}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn"
                          onClick={() =>
                            edit(c)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="admin-btn danger"
                          onClick={() =>
                            remove(c.id)
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="admin-empty">
                      ยังไม่มี Contract
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      <style jsx global>{`
        .admin-page-head{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:20px;
          margin-bottom:20px;
        }
        .admin-page-head h1{
          margin:0;
          font-size:34px;
          line-height:1.1;
          color:#1f2937;
        }
        .admin-page-head p{
          margin:8px 0 0;
          color:#6b7280;
          font-size:14px;
        }
        .admin-kicker{
          display:block;
          margin-bottom:6px;
          color:#9a8260;
          font-size:9px;
          font-weight:800;
          letter-spacing:1.8px;
        }
        .admin-btn{
          min-height:40px;
          border-radius:8px;
          padding:0 14px;
          border:1px solid #e5e7eb;
          background:#fff;
          color:#1f2937;
          font-weight:700;
          font-size:12px;
          cursor:pointer;
        }
        .admin-btn.primary{
          background:#111827;
          border-color:#111827;
          color:#fff;
        }
        .admin-btn.danger{
          color:#b33f36;
        }
        .admin-btn:disabled{
          opacity:.55;
          cursor:not-allowed;
        }
        .admin-message{
          margin:12px 0 16px;
          padding:12px 14px;
          border:1px solid #cfe3d3;
          background:#f4fbf5;
          color:#356042;
          border-radius:8px;
          font-size:13px;
        }
        .admin-message.error{
          border-color:#efc6c1;
          background:#fff3f2;
          color:#a63d36;
        }
        .admin-stats{
          display:grid;
          grid-template-columns:repeat(4,minmax(0,1fr));
          gap:12px;
          margin-bottom:20px;
        }
        .admin-stat{
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:18px;
        }
        .admin-stat span{
          display:block;
          color:#6b7280;
          font-size:9px;
          font-weight:800;
          letter-spacing:1px;
        }
        .admin-stat strong{
          display:block;
          margin-top:8px;
          font-size:28px;
          color:#1f2937;
        }
        .admin-card{
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:12px;
          padding:20px;
        }
        .admin-card h2{
          margin:0;
          font-size:18px;
        }
        .admin-toolbar{
          display:grid;
          grid-template-columns:minmax(260px,1fr) 220px;
          gap:10px;
          margin-bottom:14px;
        }
        .admin-input,
        .admin-select,
        .admin-textarea{
          width:100%;
          border:1px solid #d9dee5;
          border-radius:8px;
          background:#fff;
          color:#1f2937;
          font:inherit;
          outline:none;
        }
        .admin-input,
        .admin-select{
          min-height:44px;
          padding:0 12px;
        }
        .admin-textarea{
          min-height:100px;
          padding:10px 12px;
          resize:vertical;
        }
        .admin-input:focus,
        .admin-select:focus,
        .admin-textarea:focus{
          border-color:#9a8260;
          box-shadow:0 0 0 3px rgba(154,130,96,.08);
        }
        .admin-grid-2{
          display:grid;
          grid-template-columns:repeat(2,minmax(0,1fr));
          gap:16px;
        }
        .admin-field label{
          display:block;
          margin-bottom:6px;
          color:#4b5563;
          font-size:11px;
          font-weight:700;
        }
        .admin-form-actions{
          display:flex;
          justify-content:flex-end;
          gap:8px;
          margin-top:18px;
        }
        .admin-table-card{
          overflow:hidden;
          background:#fff;
          border:1px solid #e5e7eb;
          border-radius:12px;
        }
        .admin-table-wrap{
          width:100%;
          overflow-x:auto;
        }
        .admin-table{
          width:100%;
          min-width:900px;
          border-collapse:collapse;
        }
        .admin-table th{
          padding:12px 14px;
          background:#f8fafc;
          border-bottom:1px solid #e5e7eb;
          text-align:left;
          color:#6b7280;
          font-size:9px;
          font-weight:800;
          letter-spacing:1px;
        }
        .admin-table td{
          padding:14px;
          border-bottom:1px solid #eef1f4;
          vertical-align:top;
          font-size:13px;
          color:#1f2937;
        }
        .admin-table tbody tr:hover td{
          background:#fcfcfb;
        }
        .admin-actions{
          display:flex;
          gap:6px;
          flex-wrap:wrap;
        }
        .admin-empty{
          padding:40px 20px;
          text-align:center;
          color:#9ca3af;
        }
        @media(max-width:1100px){
          .admin-stats{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
        }
        @media(max-width:700px){
          .admin-page-head{
            flex-direction:column;
          }
          .admin-toolbar,
          .admin-grid-2{
            grid-template-columns:1fr;
          }
          .admin-stats{
            grid-template-columns:1fr 1fr;
          }
          .admin-form-actions{
            flex-direction:column-reverse;
          }
          .admin-form-actions .admin-btn{
            width:100%;
          }
        }
      `}</style>

      <style jsx>{`
        .contracts-page {
          min-width: 0;
        }

        .contract-form-card {
          margin-bottom: 18px;
        }

        .contract-form-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 14px;
          margin-bottom: 2px;
          border-bottom: 1px solid #eef1f4;
        }

        .contract-form-head h2 {
          margin: 3px 0 0;
        }

        .contract-close {
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          color: #4b5563;
          font-size: 22px;
          cursor: pointer;
        }

        .contract-section {
          padding: 18px 0;
          border-bottom: 1px solid #eef1f4;
        }

        .contract-section h3 {
          margin: 0 0 14px;
          font-size: 14px;
        }

        .contract-toolbar {
          grid-template-columns:
            minmax(280px, 1fr)
            220px;
        }

        .contract-table {
          min-width: 1280px;
        }

        .contract-muted {
          margin-top: 4px;
          color: #6b7280;
          font-size: 11px;
        }

        .money-wrap {
          position: relative;
        }

        .money-wrap span {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #9ca3af;
          font-size: 11px;
          pointer-events: none;
        }

        .money-wrap input {
          padding-right: 42px;
        }

        @media (max-width: 700px) {
          .contract-toolbar {
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

function MoneyInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="money-wrap">
      <input
        className="admin-input"
        type="number"
        min="0"
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

      <span>THB</span>
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

function StatMoney({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'gold' | 'green'
}) {
  return (
    <div
      className="admin-stat"
      style={{
        background:
          tone === 'green'
            ? '#f5fbf6'
            : '#fffaf0',
      }}
    >
      <span>{label}</span>

      <strong
        style={{
          color:
            tone === 'green'
              ? '#357044'
              : '#9a6514',
        }}
      >
        {new Intl.NumberFormat(
          'th-TH'
        ).format(value)}
      </strong>

      <div
        style={{
          marginTop: 4,
          color: '#6b7280',
          fontSize: 11,
        }}
      >
        THB
      </div>
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
      draft: 'Draft',
      waiting_signature: 'Waiting Signature',
      signed: 'Signed',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
    } as Record<string, string>
  )[v] || v
}

function commissionLabel(v: string) {
  return (
    {
      pending: 'Pending',
      invoiced: 'Invoiced',
      paid: 'Paid',
      cancelled: 'Cancelled',
    } as Record<string, string>
  )[v] || v
}
