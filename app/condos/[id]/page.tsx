'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import LeadForm from './LeadForm'

type Property = {
  id: string
  project_name: string
  public_title: string | null
  district: string | null
  bedroom: number | null
  bathroom: number | null
  size_sqm: number | null
  floor: string | null
  asking_rent: number | null
  public_description: string | null
  available_date: string | null
  status: string
}

type PropertyImage = {
  id: string
  property_id: string
  image_url: string
  sort_order: number
}

export default function CondoDetailPage() {
  const params = useParams()
  const id = String(params.id)

  const [property, setProperty] = useState<Property | null>(null)
  const [images, setImages] = useState<PropertyImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, i] = await Promise.all([
        supabase
          .from('public_properties')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('public_property_images')
          .select('id,property_id,image_url,sort_order')
          .eq('property_id', id)
          .order('sort_order'),
      ])

      if (!p.error) setProperty(p.data)
      if (!i.error) setImages(i.data ?? [])
      setLoading(false)
    }

    if (id) load()
  }, [id])

  if (loading) {
    return <main className="kj-state">กำลังโหลดข้อมูลห้อง...</main>
  }

  if (!property) {
    return (
      <main className="kj-state">
        <h1>ไม่พบห้องนี้</h1>
        <Link href="/" className="kj-back-btn">กลับหน้าแรก</Link>
      </main>
    )
  }

  const title = property.public_title || property.project_name

  return (
    <main className="kj-detail">
      <header className="kj-detail-header">
        <div className="kj-detail-container kj-detail-header-inner">
          <Link href="/" className="kj-detail-brand">
            <span className="kj-detail-brand-mark">KJ</span>
            <span className="kj-detail-brand-copy">
              <b>PROPERTY HUNTER</b>
              <small>BANGKOK CONDO RENTAL</small>
            </span>
          </Link>

          <nav className="kj-detail-nav">
            <Link href="/">หน้าหลัก</Link>
            <a href="#enquiry" className="kj-detail-nav-cta">นัดชมห้อง</a>
          </nav>
        </div>
      </header>

      <section className="kj-detail-container kj-detail-top">
        <div className="kj-detail-breadcrumb">
          <Link href="/">HOME</Link>
          <span>/</span>
          <span>{property.project_name}</span>
        </div>

        <div className="kj-detail-heading">
          <div>
            <span className="kj-detail-kicker">
              {property.district || 'Bangkok'} · FOR RENT
            </span>
            <h1>{title}</h1>
            <p>{property.project_name}</p>
          </div>

          <div className="kj-detail-price">
            <span>ค่าเช่าต่อเดือน</span>
            <strong>{money(property.asking_rent)}</strong>
          </div>
        </div>
      </section>

      <section className="kj-detail-container kj-detail-gallery">
        <div className="kj-detail-gallery-main">
          {images[0] ? (
            <img src={images[0].image_url} alt={title} />
          ) : (
            <div className="kj-detail-placeholder">KJ</div>
          )}
        </div>

        <div className="kj-detail-gallery-side">
          {images.slice(1, 3).map((img) => (
            <div key={img.id}>
              <img src={img.image_url} alt={title} />
            </div>
          ))}
        </div>
      </section>

      <section className="kj-detail-container kj-detail-main">
        <div className="kj-detail-left">
          <div className="kj-detail-specs">
            <InfoBox
              label="BEDROOM"
              value={property.bedroom === 0 ? 'Studio' : String(property.bedroom ?? '-')}
            />
            <InfoBox label="BATHROOM" value={String(property.bathroom ?? '-')} />
            <InfoBox label="SIZE" value={`${property.size_sqm ?? '-'} ตร.ม.`} />
            <InfoBox label="FLOOR" value={property.floor || '-'} />
          </div>

          <section className="kj-detail-card kj-detail-description">
            <div className="kj-detail-section-title">
              <span>OVERVIEW</span>
              <h2>รายละเอียดห้อง</h2>
            </div>

            <div className="kj-detail-description-text">
              {property.public_description ||
                'สอบถามรายละเอียดเพิ่มเติมกับ KJ Property Hunter'}
            </div>
          </section>

          <section className="kj-detail-card">
            <div className="kj-detail-section-title">
              <span>PROPERTY INFORMATION</span>
              <h2>ข้อมูลเพิ่มเติม</h2>
            </div>

            <div className="kj-detail-facts">
              <FactRow label="โครงการ" value={property.project_name} />
              <FactRow label="ทำเล" value={property.district || 'Bangkok'} />
              <FactRow
                label="พร้อมเข้าอยู่"
                value={property.available_date ? formatDate(property.available_date) : 'สอบถาม'}
              />
              <FactRow label="สถานะ" value="พร้อมเช่า" />
            </div>
          </section>

          {images.length > 3 && (
            <section className="kj-detail-card">
              <div className="kj-detail-section-title">
                <span>GALLERY</span>
                <h2>รูปเพิ่มเติม</h2>
              </div>

              <div className="kj-detail-photo-grid">
                {images.slice(3).map((img) => (
                  <img
                    key={img.id}
                    src={img.image_url}
                    alt={title}
                    loading="lazy"
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside id="enquiry" className="kj-detail-sidebar">
          <div className="kj-detail-agent-card">
            <span className="kj-detail-agent-kicker">PRIVATE PROPERTY ADVISOR</span>
            <h3>ข้าว <em>· Khaw</em></h3>
            <p>ดูแลการนัดชม ต่อรอง และประสานงานจนถึงวันเข้าอยู่</p>
            <a href="tel:0636575256">โทร · 063-657-5256</a>
            <div className="kj-detail-agent-line">LINE · Chanaakrn7547.</div>
          </div>

          <div className="kj-detail-lead-wrap">
            <LeadForm
              propertyId={property.id}
              projectName={property.project_name}
            />
          </div>
        </aside>
      </section>

      <style jsx global>{`
        html { scroll-behavior: smooth; }
        body { margin: 0; background: #f6f4ef; color: #1f1f1d; }
        * { box-sizing: border-box; }

        .kj-detail {
          min-height: 100vh;
          background: #f6f4ef;
          color: #1f1f1d;
          font-family: Arial, "Noto Sans Thai", sans-serif;
        }

        .kj-detail-container {
          width: min(1180px, calc(100% - 40px));
          margin: 0 auto;
        }

        .kj-detail-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid #e7e3dc;
          backdrop-filter: blur(12px);
        }

        .kj-detail-header-inner {
          min-height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .kj-detail-brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: #1f1f1d;
          text-decoration: none;
        }

        .kj-detail-brand-mark {
          font-family: Georgia, serif;
          font-size: 30px;
          line-height: 1;
        }

        .kj-detail-brand-copy b,
        .kj-detail-brand-copy small {
          display: block;
        }

        .kj-detail-brand-copy b {
          font-size: 11px;
          letter-spacing: 1.5px;
        }

        .kj-detail-brand-copy small {
          margin-top: 3px;
          color: #817b71;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .kj-detail-nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .kj-detail-nav a {
          color: #413f3a;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .kj-detail-nav-cta {
          padding: 11px 16px;
          border-radius: 8px;
          background: #1f1f1d;
          color: #fff !important;
        }

        .kj-detail-top { padding: 30px 0 24px; }

        .kj-detail-breadcrumb {
          display: flex;
          gap: 8px;
          align-items: center;
          color: #8a847a;
          font-size: 10px;
          letter-spacing: 0.8px;
        }

        .kj-detail-breadcrumb a {
          color: inherit;
          text-decoration: none;
        }

        .kj-detail-heading {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 30px;
          margin-top: 18px;
        }

        .kj-detail-kicker {
          color: #8c7b63;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.4px;
        }

        .kj-detail-heading h1 {
          margin: 8px 0 0;
          max-width: 760px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(38px, 5vw, 64px);
          line-height: 1.02;
          font-weight: 400;
          letter-spacing: -1.5px;
        }

        .kj-detail-heading p {
          margin: 8px 0 0;
          color: #767066;
          font-size: 13px;
        }

        .kj-detail-price {
          flex: 0 0 auto;
          text-align: right;
        }

        .kj-detail-price span,
        .kj-detail-price strong {
          display: block;
        }

        .kj-detail-price span {
          color: #8c8478;
          font-size: 9px;
          font-weight: 700;
        }

        .kj-detail-price strong {
          margin-top: 7px;
          font-size: 22px;
        }

        .kj-detail-gallery {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 0.8fr);
          gap: 10px;
          height: clamp(440px, 52vw, 620px);
        }

        .kj-detail-gallery-main,
        .kj-detail-gallery-side > div {
          overflow: hidden;
          border-radius: 12px;
          background: #ded9d0;
        }

        .kj-detail-gallery-main {
          min-width: 0;
          height: 100%;
        }

        .kj-detail-gallery-side {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 10px;
          height: 100%;
        }

        .kj-detail-gallery-side > div {
          min-height: 0;
          height: 100%;
        }

        .kj-detail-gallery-side > div:only-child {
          grid-row: 1 / -1;
        }

        .kj-detail-gallery-main img,
        .kj-detail-gallery-side img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .kj-detail-placeholder {
          width: 100%;
          height: 100%;
          min-height: 420px;
          display: grid;
          place-items: center;
          font-family: Georgia, serif;
          font-size: 52px;
          color: #8a8174;
        }

        .kj-detail-main {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 28px;
          align-items: start;
          padding: 28px 0 80px;
        }

        .kj-detail-left { min-width: 0; }

        .kj-detail-specs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }

        .kj-detail-info-box {
          min-height: 92px;
          padding: 18px;
          border: 1px solid #e5e0d8;
          border-radius: 10px;
          background: #fff;
        }

        .kj-detail-info-box span,
        .kj-detail-info-box strong {
          display: block;
        }

        .kj-detail-info-box span {
          color: #8d8578;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .kj-detail-info-box strong {
          margin-top: 11px;
          font-family: Georgia, serif;
          font-size: 23px;
          font-weight: 400;
        }

        .kj-detail-card {
          margin-top: 16px;
          padding: 24px;
          border: 1px solid #e5e0d8;
          border-radius: 12px;
          background: #fff;
        }

        .kj-detail-section-title span {
          color: #8b8276;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .kj-detail-section-title h2 {
          margin: 7px 0 0;
          font-family: Georgia, serif;
          font-size: 30px;
          font-weight: 400;
        }

        .kj-detail-description-text {
          margin-top: 20px;
          color: #57534d;
          font-size: 14px;
          line-height: 1.9;
          white-space: pre-line;
        }

        .kj-detail-facts {
          margin-top: 18px;
          border-top: 1px solid #eee9e2;
        }

        .kj-detail-fact-row {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 0;
          border-bottom: 1px solid #eee9e2;
        }

        .kj-detail-fact-row span {
          color: #8c8479;
          font-size: 10px;
        }

        .kj-detail-fact-row strong {
          text-align: right;
          font-size: 12px;
        }

        .kj-detail-photo-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .kj-detail-photo-grid img {
          width: 100%;
          aspect-ratio: 4 / 3;
          display: block;
          object-fit: cover;
          border-radius: 9px;
        }

        .kj-detail-sidebar {
          position: sticky;
          top: 90px;
          display: grid;
          gap: 14px;
        }

        .kj-detail-agent-card {
          padding: 24px;
          border-radius: 12px;
          background: #1d1d1a;
          color: #fff;
        }

        .kj-detail-agent-kicker {
          color: #c7baa6;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .kj-detail-agent-card h3 {
          margin: 14px 0 0;
          font-family: Georgia, serif;
          font-size: 30px;
          font-weight: 400;
        }

        .kj-detail-agent-card h3 em {
          color: #c7baa6;
          font-size: 15px;
          font-weight: 400;
        }

        .kj-detail-agent-card p {
          margin: 16px 0;
          color: #c9c4bb;
          font-size: 12px;
          line-height: 1.7;
        }

        .kj-detail-agent-card a,
        .kj-detail-agent-line {
          display: block;
          padding: 13px 0;
          border-top: 1px solid rgba(255,255,255,.12);
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
        }

        .kj-detail-lead-wrap {
          overflow: hidden;
          border: 1px solid #e5e0d8;
          border-radius: 12px;
          background: #fff;
        }

        .kj-state {
          min-height: 100vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 18px;
          background: #f6f4ef;
          color: #1f1f1d;
        }

        .kj-back-btn {
          padding: 11px 14px;
          border-radius: 8px;
          background: #1f1f1d;
          color: #fff;
          text-decoration: none;
        }

        @media (max-width: 980px) {
          .kj-detail-gallery {
            grid-template-columns: 1fr;
            height: auto;
          }

          .kj-detail-gallery-main {
            height: auto;
            aspect-ratio: 16 / 10;
          }

          .kj-detail-gallery-side {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: none;
            height: auto;
          }

          .kj-detail-gallery-side > div {
            height: auto;
            aspect-ratio: 4 / 3;
          }

          .kj-detail-gallery-side > div:only-child {
            grid-row: auto;
            grid-column: 1 / -1;
            aspect-ratio: 16 / 8;
          }
          .kj-detail-main { grid-template-columns: 1fr; }
          .kj-detail-sidebar { position: static; }
        }

        @media (max-width: 700px) {
          .kj-detail-container { width: calc(100% - 28px); }

          .kj-detail-brand-copy small,
          .kj-detail-nav > a:first-child {
            display: none;
          }

          .kj-detail-heading {
            align-items: flex-start;
            flex-direction: column;
          }

          .kj-detail-price { text-align: left; }
          .kj-detail-heading h1 { font-size: 42px; }
          .kj-detail-gallery-main {
            height: auto;
            aspect-ratio: 4 / 3;
          }

          .kj-detail-specs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .kj-detail-card { padding: 20px; }
          .kj-detail-photo-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  )
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="kj-detail-info-box">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function FactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="kj-detail-fact-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function money(value: number | null) {
  return value === null
    ? 'สอบถามราคา'
    : `฿${new Intl.NumberFormat('th-TH').format(value)} / เดือน`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
