'use client'

import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../../lib/supabase'

type Owner = {
  id: string
  full_name: string
  phone: string | null
}

type Property = {
  id: string
  owner_id: string
  project_name: string
  public_title: string | null
  unit_number: string | null
  district: string | null
  bedroom: number | null
  bathroom: number | null
  size_sqm: number | null
  floor: string | null
  asking_rent: number | null
  lowest_acceptable_rent: number | null
  commission_note: string | null
  public_description: string | null
  private_note: string | null
  available_date: string | null
  status: string
  is_published: boolean
  created_at: string
}

type Img = {
  id: string
  property_id: string
  image_url: string
  storage_path: string | null
  sort_order: number
}

const empty = {
  owner_id: '',
  project_name: '',
  public_title: '',
  unit_number: '',
  district: '',
  bedroom: '',
  bathroom: '',
  size_sqm: '',
  floor: '',
  asking_rent: '',
  lowest_rent: '',
  commission_note: '',
  public_description: '',
  private_note: '',
  available_date: '',
  status: 'available',
  is_published: false,
}

export default function PropertiesPage() {
  const [owners, setOwners] = useState<Owner[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [images, setImages] = useState<Img[]>([])

  const [form, setForm] = useState({ ...empty })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [publishFilter, setPublishFilter] = useState('all')

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    const [o, p, i] = await Promise.all([
      supabase
        .from('owners')
        .select('id,full_name,phone')
        .order('full_name'),

      supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('property_images')
        .select('id,property_id,image_url,storage_path,sort_order')
        .order('sort_order'),
    ])

    if (o.error || p.error || i.error) {
      setMessage(
        o.error?.message ||
          p.error?.message ||
          i.error?.message ||
          'โหลดข้อมูลไม่สำเร็จ'
      )
    }

    setOwners(o.data ?? [])
    setProperties(p.data ?? [])
    setImages(i.data ?? [])
  }

  const ownerMap = useMemo(
    () => Object.fromEntries(owners.map((o) => [o.id, o])),
    [owners]
  )

  const imageMap = useMemo(() => {
    const map: Record<string, Img[]> = {}

    images.forEach((img) => {
      ;(map[img.property_id] ||= []).push(img)
    })

    return map
  }, [images])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return properties.filter((p) => {
      const owner = ownerMap[p.owner_id]

      const matchesSearch =
        !q ||
        [
          p.project_name,
          p.public_title ?? '',
          p.unit_number ?? '',
          p.district ?? '',
          owner?.full_name ?? '',
          owner?.phone ?? '',
        ].some((v) => v.toLowerCase().includes(q))

      const matchesStatus =
        statusFilter === 'all' || p.status === statusFilter

      const matchesPublish =
        publishFilter === 'all' ||
        (publishFilter === 'published'
          ? p.is_published
          : !p.is_published)

      return matchesSearch && matchesStatus && matchesPublish
    })
  }, [properties, search, statusFilter, publishFilter, ownerMap])

  const publishedCount = properties.filter((p) => p.is_published).length
  const availableCount = properties.filter((p) => p.status === 'available').length
  const rentedCount = properties.filter((p) => p.status === 'rented').length

  function resetForm() {
    setEditingId(null)
    setForm({ ...empty })
    setShowForm(false)
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...empty })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function edit(p: Property) {
    setEditingId(p.id)

    setForm({
      owner_id: p.owner_id,
      project_name: p.project_name,
      public_title: p.public_title ?? '',
      unit_number: p.unit_number ?? '',
      district: p.district ?? '',
      bedroom: p.bedroom?.toString() ?? '',
      bathroom: p.bathroom?.toString() ?? '',
      size_sqm: p.size_sqm?.toString() ?? '',
      floor: p.floor ?? '',
      asking_rent: p.asking_rent?.toString() ?? '',
      lowest_rent: p.lowest_acceptable_rent?.toString() ?? '',
      commission_note: p.commission_note ?? '',
      public_description: p.public_description ?? '',
      private_note: p.private_note ?? '',
      available_date: p.available_date ?? '',
      status: p.status,
      is_published: p.is_published,
    })

    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e: FormEvent) {
    e.preventDefault()

    if (!form.owner_id) {
      setMessage('กรุณาเลือก Owner')
      return
    }

    if (!form.project_name.trim()) {
      setMessage('กรุณากรอกชื่อโครงการ')
      return
    }

    setLoading(true)
    setMessage('')

    const duplicate = properties.find(
      (p) =>
        p.id !== editingId &&
        p.project_name.trim().toLowerCase() ===
          form.project_name.trim().toLowerCase() &&
        p.unit_number &&
        form.unit_number &&
        p.unit_number.trim().toLowerCase() ===
          form.unit_number.trim().toLowerCase()
    )

    if (duplicate) {
      setMessage(
        `พบห้องซ้ำ: ${duplicate.project_name} Unit ${duplicate.unit_number}`
      )
      setLoading(false)
      return
    }

    const payload = {
      owner_id: form.owner_id,
      project_name: form.project_name.trim(),
      public_title: form.public_title.trim() || null,
      unit_number: form.unit_number.trim() || null,
      district: form.district.trim() || null,
      bedroom: form.bedroom ? Number(form.bedroom) : null,
      bathroom: form.bathroom ? Number(form.bathroom) : null,
      size_sqm: form.size_sqm ? Number(form.size_sqm) : null,
      floor: form.floor.trim() || null,
      asking_rent: form.asking_rent ? Number(form.asking_rent) : null,
      lowest_acceptable_rent: form.lowest_rent
        ? Number(form.lowest_rent)
        : null,
      commission_note: form.commission_note.trim() || null,
      public_description: form.public_description.trim() || null,
      private_note: form.private_note.trim() || null,
      available_date: form.available_date || null,
      status: form.status,
      is_published: form.is_published,
    }

    const result = editingId
      ? await supabase.from('properties').update(payload).eq('id', editingId)
      : await supabase.from('properties').insert(payload)

    if (result.error) {
      setMessage(`บันทึกไม่สำเร็จ: ${result.error.message}`)
    } else {
      setMessage(
        editingId ? 'แก้ไข Property สำเร็จ' : 'เพิ่ม Property สำเร็จ'
      )
      resetForm()
      await load()
    }

    setLoading(false)
  }

  async function upload(id: string, files: FileList | null) {
    if (!files?.length) return

    setUploading(id)
    setMessage('')

    const current = imageMap[id]?.length ?? 0

    for (let n = 0; n < files.length; n++) {
      const file = files[n]
      if (!file.type.startsWith('image/')) continue

      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${id}/${crypto.randomUUID()}.${ext}`

      const uploadResult = await supabase.storage
        .from('property-images')
        .upload(path, file)

      if (uploadResult.error) {
        setMessage(
          `อัปโหลดรูปไม่สำเร็จ: ${uploadResult.error.message}`
        )
        break
      }

      const imageUrl = supabase.storage
        .from('property-images')
        .getPublicUrl(path).data.publicUrl

      const dbResult = await supabase.from('property_images').insert({
        property_id: id,
        image_url: imageUrl,
        storage_path: path,
        sort_order: current + n,
      })

      if (dbResult.error) {
        await supabase.storage.from('property-images').remove([path])

        setMessage(
          `บันทึกรูปไม่สำเร็จ: ${dbResult.error.message}`
        )
        break
      }
    }

    setUploading(null)
    await load()
  }

  async function removeImage(img: Img) {
    if (!confirm('ลบรูปนี้ใช่หรือไม่?')) return

    if (img.storage_path) {
      await supabase.storage
        .from('property-images')
        .remove([img.storage_path])
    }

    await supabase.from('property_images').delete().eq('id', img.id)
    await load()
  }

  async function togglePublish(p: Property) {
    const result = await supabase
      .from('properties')
      .update({ is_published: !p.is_published })
      .eq('id', p.id)

    if (result.error) {
      setMessage(`เปลี่ยน Publish ไม่สำเร็จ: ${result.error.message}`)
      return
    }

    await load()
  }

  async function changeStatus(id: string, value: string) {
    const result = await supabase
      .from('properties')
      .update({ status: value })
      .eq('id', id)

    if (result.error) {
      setMessage(`เปลี่ยนสถานะไม่สำเร็จ: ${result.error.message}`)
      return
    }

    await load()
  }

  const editingImages = editingId ? imageMap[editingId] ?? [] : []

  return (
    <div className="properties-page">
      <div className="page-head">
        <div>
          <h1>Properties</h1>
          <p>จัดการทรัพย์ ราคา รูปภาพ สถานะ และการแสดงหน้าเว็บไซต์</p>
        </div>

        <button className="btn primary" onClick={openNew}>
          + Add Property
        </button>
      </div>

      <div className="stats-grid">
        <Stat label="All Properties" value={properties.length} />
        <Stat label="Available" value={availableCount} />
        <Stat label="Published" value={publishedCount} />
        <Stat label="Rented" value={rentedCount} />
      </div>

      {message && (
        <div
          className={`message ${
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

      {showForm && (
        <section className="form-card">
          <div className="form-head">
            <div>
              <h2>{editingId ? 'Edit Property' : 'Add Property'}</h2>
              <p>
                {editingId
                  ? 'แก้ไขข้อมูลทรัพย์'
                  : 'กรอกข้อมูลห้องใหม่'}
              </p>
            </div>

            <button className="close-btn" type="button" onClick={resetForm}>
              ×
            </button>
          </div>

          <form onSubmit={submit}>
            <div className="section">
              <h3>Basic Information</h3>

              <div className="grid-2">
                <Field label="Owner *">
                  <select
                    className="control"
                    required
                    value={form.owner_id}
                    onChange={(e) =>
                      setForm({ ...form, owner_id: e.target.value })
                    }
                  >
                    <option value="">เลือก Owner</option>
                    {owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.full_name}
                        {o.phone ? ` · ${o.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="ชื่อโครงการ *">
                  <input
                    className="control"
                    required
                    value={form.project_name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        project_name: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="หัวข้อหน้าเว็บ">
                  <input
                    className="control"
                    value={form.public_title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        public_title: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="ทำเล">
                  <input
                    className="control"
                    value={form.district}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        district: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="section">
              <h3>Unit Details</h3>

              <div className="grid-3">
                <Field label="Unit">
                  <input
                    className="control"
                    value={form.unit_number}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unit_number: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Floor">
                  <input
                    className="control"
                    value={form.floor}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        floor: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Size (sqm)">
                  <input
                    className="control"
                    type="number"
                    step="0.01"
                    value={form.size_sqm}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        size_sqm: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Bedroom">
                  <input
                    className="control"
                    type="number"
                    step="0.5"
                    value={form.bedroom}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bedroom: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Bathroom">
                  <input
                    className="control"
                    type="number"
                    step="0.5"
                    value={form.bathroom}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bathroom: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Available Date">
                  <input
                    className="control"
                    type="date"
                    value={form.available_date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        available_date: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="section">
              <h3>Pricing & Status</h3>

              <div className="grid-3">
                <Field label="Asking Rent">
                  <input
                    className="control"
                    type="number"
                    value={form.asking_rent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        asking_rent: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Lowest Acceptable Rent">
                  <input
                    className="control"
                    type="number"
                    value={form.lowest_rent}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        lowest_rent: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Status">
                  <select
                    className="control"
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                  >
                    <option value="available">Available</option>
                    <option value="pending">Pending</option>
                    <option value="rented">Rented</option>
                    <option value="hidden">Hidden</option>
                  </select>
                </Field>
              </div>

              <div style={{ marginTop: 14 }}>
                <Field label="Commission Note">
                  <input
                    className="control"
                    value={form.commission_note}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        commission_note: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="section">
              <h3>Description</h3>

              <div className="grid-2">
                <Field label="Public Description">
                  <textarea
                    className="textarea"
                    value={form.public_description}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        public_description: e.target.value,
                      })
                    }
                  />
                </Field>

                <Field label="Private Note">
                  <textarea
                    className="textarea"
                    value={form.private_note}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        private_note: e.target.value,
                      })
                    }
                  />
                </Field>
              </div>
            </div>

            <label className="publish-row">
              <input
                type="checkbox"
                checked={form.is_published}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_published: e.target.checked,
                  })
                }
              />
              <span>
                <strong>Publish on website</strong>
                <small>เปิดเมื่อข้อมูลและรูปพร้อมแล้ว</small>
              </span>
            </label>

            {editingId && (
              <div className="images-section">
                <div className="images-head">
                  <div>
                    <strong>Photos</strong>
                    <span>{editingImages.length} รูป</span>
                  </div>

                  <label className="btn">
                    {uploading === editingId ? 'Uploading...' : '+ Add Photos'}
                    <input
                      hidden
                      multiple
                      accept="image/*"
                      type="file"
                      onChange={(e) =>
                        upload(editingId, e.target.files)
                      }
                    />
                  </label>
                </div>

                {editingImages.length > 0 && (
                  <div className="image-grid">
                    {editingImages.map((img) => (
                      <div className="image-tile" key={img.id}>
                        <img src={img.image_url} alt="" />
                        <button
                          type="button"
                          onClick={() => removeImage(img)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button className="btn" type="button" onClick={resetForm}>
                Cancel
              </button>

              <button className="btn primary" disabled={loading}>
                {loading
                  ? 'Saving...'
                  : editingId
                  ? 'Save Changes'
                  : 'Save Property'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="toolbar">
        <input
          className="control"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาโครงการ / Unit / ทำเล / Owner"
        />

        <select
          className="control"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">ทุกสถานะ</option>
          <option value="available">Available</option>
          <option value="pending">Pending</option>
          <option value="rented">Rented</option>
          <option value="hidden">Hidden</option>
        </select>

        <select
          className="control"
          value={publishFilter}
          onChange={(e) => setPublishFilter(e.target.value)}
        >
          <option value="all">Public + Private</option>
          <option value="published">Published</option>
          <option value="private">Private</option>
        </select>
      </div>

      <div className="table-card">
        <div className="table-wrap">
          <table className="property-table">
            <thead>
              <tr>
                <th>PROPERTY</th>
                <th>OWNER</th>
                <th>UNIT</th>
                <th>RENT</th>
                <th>STATUS</th>
                <th>PUBLIC</th>
                <th>PHOTOS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((p) => {
                const owner = ownerMap[p.owner_id]
                const propertyImages = imageMap[p.id] ?? []
                const cover = propertyImages[0]

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="property-cell">
                        <div className="thumb">
                          {cover ? (
                            <img src={cover.image_url} alt="" />
                          ) : (
                            <span>NO IMG</span>
                          )}
                        </div>

                        <div>
                          <strong>{p.project_name}</strong>
                          <small>{p.district || '—'}</small>
                        </div>
                      </div>
                    </td>

                    <td>{owner?.full_name || '—'}</td>

                    <td>
                      Unit {p.unit_number || '—'}
                      <div className="muted">
                        Floor {p.floor || '—'}
                      </div>
                    </td>

                    <td>
                      <strong>{money(p.asking_rent)}</strong>
                      <div className="muted">
                        Min {money(p.lowest_acceptable_rent)}
                      </div>
                    </td>

                    <td>
                      <select
                        className="control compact"
                        value={p.status}
                        onChange={(e) =>
                          changeStatus(p.id, e.target.value)
                        }
                      >
                        <option value="available">Available</option>
                        <option value="pending">Pending</option>
                        <option value="rented">Rented</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </td>

                    <td>
                      <span
                        className={`pill ${
                          p.is_published ? 'green' : ''
                        }`}
                      >
                        {p.is_published ? 'Published' : 'Private'}
                      </span>
                    </td>

                    <td>{propertyImages.length}</td>

                    <td>
                      <div className="actions">
                        <button className="btn small" onClick={() => edit(p)}>
                          Edit
                        </button>

                        <label className="btn small">
                          {uploading === p.id ? 'Uploading' : 'Photos'}
                          <input
                            hidden
                            multiple
                            accept="image/*"
                            type="file"
                            onChange={(e) =>
                              upload(p.id, e.target.files)
                            }
                          />
                        </label>

                        <button
                          className="btn small primary"
                          onClick={() => togglePublish(p)}
                        >
                          {p.is_published ? 'Unpublish' : 'Publish'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty">ไม่พบ Property</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        .properties-page {
          width: 100%;
          min-width: 0;
          color: #1f2937;
        }

        .page-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 20px;
        }

        .page-head h1 {
          margin: 0;
          font-size: 32px;
          line-height: 1.15;
        }

        .page-head p {
          margin: 7px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .stat {
          padding: 18px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }

        .stat span {
          display: block;
          color: #6b7280;
          font-size: 10px;
          font-weight: 700;
        }

        .stat strong {
          display: block;
          margin-top: 9px;
          font-size: 28px;
        }

        .message {
          margin-bottom: 16px;
          padding: 12px 14px;
          border: 1px solid #cfe3d3;
          border-radius: 8px;
          background: #f4fbf5;
          color: #356042;
          font-size: 13px;
        }

        .message.error {
          border-color: #efc6c1;
          background: #fff3f2;
          color: #a63d36;
        }

        .form-card {
          margin-bottom: 18px;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }

        .form-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 4px;
          padding-bottom: 14px;
          border-bottom: 1px solid #eef1f4;
        }

        .form-head h2 {
          margin: 0;
          font-size: 18px;
        }

        .form-head p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 12px;
        }

        .close-btn {
          width: 34px;
          height: 34px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          font-size: 22px;
          color: #4b5563;
          cursor: pointer;
        }

        .section {
          padding: 18px 0;
          border-bottom: 1px solid #eef1f4;
        }

        .section h3 {
          margin: 0 0 14px;
          font-size: 14px;
        }

        .grid-2,
        .grid-3 {
          display: grid;
          gap: 14px;
        }

        .grid-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .field label {
          display: block;
          margin-bottom: 6px;
          color: #4b5563;
          font-size: 11px;
          font-weight: 700;
        }

        .control,
        .textarea {
          width: 100%;
          border: 1px solid #d9dee5;
          border-radius: 8px;
          background: #fff;
          color: #1f2937;
          font: inherit;
          outline: none;
        }

        .control {
          min-height: 44px;
          padding: 0 12px;
        }

        .textarea {
          min-height: 110px;
          padding: 10px 12px;
          resize: vertical;
        }

        .control:focus,
        .textarea:focus {
          border-color: #9a8260;
          box-shadow: 0 0 0 3px rgba(154, 130, 96, 0.08);
        }

        .publish-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 16px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background: #f9fafb;
        }

        .publish-row strong,
        .publish-row small {
          display: block;
        }

        .publish-row small {
          margin-top: 4px;
          color: #6b7280;
        }

        .images-section {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #eef1f4;
        }

        .images-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .images-head span {
          display: block;
          margin-top: 3px;
          color: #6b7280;
          font-size: 11px;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .image-tile {
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          border-radius: 8px;
          background: #f3f4f6;
        }

        .image-tile img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-tile button {
          position: absolute;
          top: 5px;
          right: 5px;
          width: 26px;
          height: 26px;
          border: 0;
          border-radius: 50%;
          background: rgba(17, 24, 39, 0.85);
          color: #fff;
          cursor: pointer;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 18px;
        }

        .btn {
          min-height: 40px;
          padding: 0 14px;
          border: 1px solid #d9dee5;
          border-radius: 8px;
          background: #fff;
          color: #374151;
          font: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .btn.primary {
          border-color: #111827;
          background: #111827;
          color: #fff;
        }

        .btn.small {
          min-height: 34px;
          padding: 0 10px;
          font-size: 11px;
        }

        .toolbar {
          display: grid;
          grid-template-columns: minmax(260px, 1fr) 180px 180px;
          gap: 10px;
          margin-bottom: 14px;
        }

        .table-card {
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fff;
        }

        .table-wrap {
          width: 100%;
          overflow-x: auto;
        }

        .property-table {
          width: 100%;
          min-width: 1120px;
          border-collapse: collapse;
        }

        .property-table th {
          padding: 12px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
          color: #6b7280;
          text-align: left;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.8px;
        }

        .property-table td {
          padding: 14px;
          border-bottom: 1px solid #eef1f4;
          vertical-align: top;
          font-size: 13px;
        }

        .property-cell {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 190px;
        }

        .property-cell strong,
        .property-cell small {
          display: block;
        }

        .property-cell small {
          margin-top: 4px;
          color: #6b7280;
        }

        .thumb {
          width: 56px;
          height: 44px;
          flex: 0 0 auto;
          overflow: hidden;
          border-radius: 6px;
          background: #f3f4f6;
          display: grid;
          place-items: center;
          color: #9ca3af;
          font-size: 8px;
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .muted {
          margin-top: 4px;
          color: #6b7280;
          font-size: 11px;
        }

        .compact {
          min-width: 130px;
        }

        .pill {
          display: inline-flex;
          padding: 5px 8px;
          border-radius: 999px;
          background: #f3f4f6;
          color: #4b5563;
          font-size: 10px;
          font-weight: 700;
        }

        .pill.green {
          background: #edf8ef;
          color: #357044;
        }

        .actions {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }

        .empty {
          padding: 40px 20px;
          text-align: center;
          color: #9ca3af;
        }

        @media (max-width: 1100px) {
          .stats-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .grid-3 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .page-head {
            flex-direction: column;
          }

          .grid-2,
          .grid-3,
          .toolbar {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .form-actions .btn {
            width: 100%;
          }

          .images-head {
            align-items: flex-start;
            flex-direction: column;
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
    <div className="field">
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
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function money(v: number | null) {
  return v === null
    ? '—'
    : `${new Intl.NumberFormat('th-TH').format(v)} บาท`
}
