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
    return (
      <main className="state">
        <div>Preparing residence...</div>
      </main>
    )
  }

  if (!property) {
    return (
      <main className="state">
        <h1>Residence not found</h1>
        <Link className="back-btn" href="/">
          Back to collection
        </Link>
      </main>
    )
  }

  const title = property.public_title || property.project_name

  return (
    <main className="detail-site">
      <header className="detail-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">KJ</span>

            <span className="brand-copy">
              <b>PROPERTY HUNTER</b>
              <small>BANGKOK RESIDENCE SPECIALIST</small>
            </span>
          </Link>

          <nav className="nav">
            <Link href="/">Collection</Link>
            <a href="#enquiry" className="nav-cta">
              Private Enquiry
            </a>
          </nav>
        </div>
      </header>

      <section className="intro container">
        <div className="breadcrumb">
          <Link href="/">COLLECTION</Link>
          <span>/</span>
          <span>{property.project_name}</span>
        </div>

        <div className="title-row">
          <div>
            <div className="eyebrow">
              {property.district || 'BANGKOK'} · FOR RENT
            </div>

            <h1>{title}</h1>
          </div>

          <div className="price">
            <small>MONTHLY RENT</small>
            <strong>{money(property.asking_rent)}</strong>
          </div>
        </div>
      </section>

      <section className="gallery container">
        <div className="gallery-main">
          {images[0] ? (
            <img src={images[0].image_url} alt={title} />
          ) : (
            <div className="placeholder">KJ</div>
          )}
        </div>

        <div className="gallery-side">
          {images.slice(1, 3).map((img) => (
            <div key={img.id}>
              <img src={img.image_url} alt={title} />
            </div>
          ))}
        </div>
      </section>

      <section className="body container">
        <div className="content">
          <div className="spec-grid">
            <Spec label="BEDROOMS" value={property.bedroom ?? '-'} />
            <Spec label="BATHROOMS" value={property.bathroom ?? '-'} />
            <Spec
              label="AREA"
              value={`${property.size_sqm ?? '-'} SQ.M.`}
            />
            <Spec label="FLOOR" value={property.floor || '-'} />
          </div>

          <section className="overview">
            <div className="section-head">
              <span className="eyebrow">THE RESIDENCE</span>
              <h2>รายละเอียดห้อง</h2>
            </div>

            <p>
              {property.public_description ||
                'สอบถามรายละเอียดเพิ่มเติมกับ Private Property Advisor ของเรา'}
            </p>
          </section>

          <section className="facts">
            <Fact label="PROJECT" value={property.project_name} />
            <Fact
              label="LOCATION"
              value={property.district || 'Bangkok'}
            />
            <Fact
              label="AVAILABLE"
              value={
                property.available_date
                  ? formatDate(property.available_date)
                  : 'On request'
              }
            />
            <Fact label="STATUS" value="Available for rent" />
          </section>

          {images.length > 3 && (
            <section className="more-photos">
              <div className="section-head">
                <span className="eyebrow">GALLERY</span>
                <h2>รูปเพิ่มเติม</h2>
              </div>

              <div className="photo-grid">
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

        <aside id="enquiry" className="enquiry-column">
          <div className="advisor-card">
            <div className="eyebrow light">
              PRIVATE PROPERTY ADVISOR
            </div>

            <h3>
              ข้าว <em>· Khaw</em>
            </h3>

            <p>
              Personal assistance for viewing, negotiation and move-in.
            </p>

            <a href="tel:0636575256">
              CALL · 063-657-5256
            </a>

            <div className="advisor-line">
              LINE · Chanaakrn7547.
            </div>
          </div>

          <LeadForm
            propertyId={property.id}
            projectName={property.project_name}
          />
        </aside>
      </section>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f6f3ec;
          color: #1b1b18;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .detail-site {
          min-height: 100vh;
          background: #f6f3ec;
          color: #1b1b18;
          font-family: Inter, "Noto Sans Thai", "Segoe UI", sans-serif;
        }

        .container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .detail-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(246, 243, 236, 0.94);
          border-bottom: 1px solid rgba(27, 27, 24, 0.08);
          backdrop-filter: blur(16px);
        }

        .header-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: inherit;
          text-decoration: none;
        }

        .brand-mark {
          font-family: Georgia, serif;
          font-size: 30px;
          line-height: 1;
        }

        .brand-copy b,
        .brand-copy small {
          display: block;
        }

        .brand-copy b {
          font-size: 11px;
          letter-spacing: 1.6px;
        }

        .brand-copy small {
          margin-top: 3px;
          color: #7c766d;
          font-size: 8px;
          letter-spacing: 1.2px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .nav a {
          color: #403d37;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .nav-cta {
          padding: 11px 15px;
          border-radius: 999px;
          background: #1b1b18;
          color: #fff !important;
        }

        .intro {
          padding: 34px 0 26px;
        }

        .breadcrumb {
          display: flex;
          gap: 9px;
          align-items: center;
          color: #8a8175;
          font-size: 9px;
          letter-spacing: 1.2px;
        }

        .breadcrumb a {
          color: inherit;
          text-decoration: none;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 30px;
          margin-top: 18px;
        }

        .eyebrow {
          color: #8a8175;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .eyebrow.light {
          color: #cfc6b8;
        }

        .title-row h1 {
          margin: 9px 0 0;
          max-width: 760px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(40px, 5vw, 68px);
          line-height: 1;
          font-weight: 400;
          letter-spacing: -2px;
        }

        .price {
          flex: 0 0 auto;
          text-align: right;
        }

        .price small,
        .price strong {
          display: block;
        }

        .price small {
          color: #8a8175;
          font-size: 8px;
          letter-spacing: 1.4px;
        }

        .price strong {
          margin-top: 8px;
          font-size: 18px;
        }

        .gallery {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 0.85fr);
          gap: 10px;
        }

        .gallery-main,
        .gallery-side > div {
          overflow: hidden;
          border-radius: 10px;
          background: #ddd8cf;
        }

        .gallery-main {
          aspect-ratio: 16 / 10;
        }

        .gallery-side {
          display: grid;
          gap: 10px;
        }

        .gallery-side > div {
          min-height: 0;
        }

        .gallery-main img,
        .gallery-side img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .placeholder {
          width: 100%;
          height: 100%;
          min-height: 380px;
          display: grid;
          place-items: center;
          color: #847b6d;
          font-family: Georgia, serif;
          font-size: 50px;
        }

        .body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 42px;
          align-items: start;
          padding: 34px 0 90px;
        }

        .content {
          min-width: 0;
        }

        .spec-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid #ddd7ce;
          border-radius: 10px;
          background: #fff;
          overflow: hidden;
        }

        .spec {
          min-height: 92px;
          padding: 18px;
          border-right: 1px solid #e7e2da;
        }

        .spec:last-child {
          border-right: 0;
        }

        .spec small,
        .spec strong {
          display: block;
        }

        .spec small {
          color: #968c7d;
          font-size: 8px;
          letter-spacing: 1.3px;
        }

        .spec strong {
          margin-top: 11px;
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 400;
        }

        .overview,
        .facts,
        .more-photos {
          margin-top: 22px;
          border: 1px solid #e0dbd2;
          border-radius: 10px;
          background: #fff;
        }

        .overview {
          padding: 28px;
        }

        .section-head h2 {
          margin: 7px 0 0;
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
        }

        .overview p {
          margin: 22px 0 0;
          color: #5f5a53;
          font-size: 14px;
          line-height: 1.9;
          white-space: pre-line;
        }

        .facts {
          overflow: hidden;
        }

        .fact {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 18px;
          border-bottom: 1px solid #eee9e2;
        }

        .fact:last-child {
          border-bottom: 0;
        }

        .fact span {
          color: #968c7d;
          font-size: 8px;
          letter-spacing: 1.1px;
        }

        .fact strong {
          text-align: right;
          font-size: 12px;
        }

        .more-photos {
          padding: 22px;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .photo-grid img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 8px;
        }

        .enquiry-column {
          position: sticky;
          top: 96px;
          display: grid;
          gap: 16px;
        }

        .advisor-card {
          padding: 28px;
          border-radius: 10px;
          background: #1c1b18;
          color: #fff;
        }

        .advisor-card h3 {
          margin: 14px 0 0;
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
        }

        .advisor-card h3 em {
          color: #c9baa4;
          font-size: 16px;
          font-weight: 400;
        }

        .advisor-card p {
          margin: 18px 0;
          color: #c9c2b7;
          font-size: 12px;
          line-height: 1.7;
        }

        .advisor-card a,
        .advisor-line {
          display: block;
          padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,.12);
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .5px;
        }

        .state {
          min-height: 100vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 18px;
          background: #f6f3ec;
          color: #1b1b18;
        }

        .state h1 {
          margin: 0;
          font-family: Georgia, serif;
          font-weight: 400;
        }

        .back-btn {
          padding: 12px 16px;
          border-radius: 8px;
          background: #1b1b18;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 980px) {
          .gallery {
            grid-template-columns: 1fr;
          }

          .gallery-side {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .gallery-side > div {
            aspect-ratio: 4 / 3;
          }

          .body {
            grid-template-columns: 1fr;
          }

          .enquiry-column {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .container {
            width: calc(100% - 28px);
          }

          .brand-copy small,
          .nav > a:first-child {
            display: none;
          }

          .title-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .price {
            text-align: left;
          }

          .title-row h1 {
            font-size: 44px;
          }

          .gallery-main {
            aspect-ratio: 4 / 3;
          }

          .spec-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .spec:nth-child(2) {
            border-right: 0;
          }

          .spec:nth-child(-n+2) {
            border-bottom: 1px solid #e7e2da;
          }

          .overview {
            padding: 22px;
          }

          .photo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}

function Spec({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="spec">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function Fact({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function money(value: number | null) {
  return value === null
    ? 'Price on request'
    : `฿${new Intl.NumberFormat('th-TH').format(value)} / month`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
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
    return (
      <main className="state">
        <div>Preparing residence...</div>
      </main>
    )
  }

  if (!property) {
    return (
      <main className="state">
        <h1>Residence not found</h1>
        <Link className="back-btn" href="/">
          Back to collection
        </Link>
      </main>
    )
  }

  const title = property.public_title || property.project_name

  return (
    <main className="detail-site">
      <header className="detail-header">
        <div className="container header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark">KJ</span>

            <span className="brand-copy">
              <b>PROPERTY HUNTER</b>
              <small>BANGKOK RESIDENCE SPECIALIST</small>
            </span>
          </Link>

          <nav className="nav">
            <Link href="/">Collection</Link>
            <a href="#enquiry" className="nav-cta">
              Private Enquiry
            </a>
          </nav>
        </div>
      </header>

      <section className="intro container">
        <div className="breadcrumb">
          <Link href="/">COLLECTION</Link>
          <span>/</span>
          <span>{property.project_name}</span>
        </div>

        <div className="title-row">
          <div>
            <div className="eyebrow">
              {property.district || 'BANGKOK'} · FOR RENT
            </div>

            <h1>{title}</h1>
          </div>

          <div className="price">
            <small>MONTHLY RENT</small>
            <strong>{money(property.asking_rent)}</strong>
          </div>
        </div>
      </section>

      <section className="gallery container">
        <div className="gallery-main">
          {images[0] ? (
            <img src={images[0].image_url} alt={title} />
          ) : (
            <div className="placeholder">KJ</div>
          )}
        </div>

        <div className="gallery-side">
          {images.slice(1, 3).map((img) => (
            <div key={img.id}>
              <img src={img.image_url} alt={title} />
            </div>
          ))}
        </div>
      </section>

      <section className="body container">
        <div className="content">
          <div className="spec-grid">
            <Spec label="BEDROOMS" value={property.bedroom ?? '-'} />
            <Spec label="BATHROOMS" value={property.bathroom ?? '-'} />
            <Spec
              label="AREA"
              value={`${property.size_sqm ?? '-'} SQ.M.`}
            />
            <Spec label="FLOOR" value={property.floor || '-'} />
          </div>

          <section className="overview">
            <div className="section-head">
              <span className="eyebrow">THE RESIDENCE</span>
              <h2>รายละเอียดห้อง</h2>
            </div>

            <p>
              {property.public_description ||
                'สอบถามรายละเอียดเพิ่มเติมกับ Private Property Advisor ของเรา'}
            </p>
          </section>

          <section className="facts">
            <Fact label="PROJECT" value={property.project_name} />
            <Fact
              label="LOCATION"
              value={property.district || 'Bangkok'}
            />
            <Fact
              label="AVAILABLE"
              value={
                property.available_date
                  ? formatDate(property.available_date)
                  : 'On request'
              }
            />
            <Fact label="STATUS" value="Available for rent" />
          </section>

          {images.length > 3 && (
            <section className="more-photos">
              <div className="section-head">
                <span className="eyebrow">GALLERY</span>
                <h2>รูปเพิ่มเติม</h2>
              </div>

              <div className="photo-grid">
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

        <aside id="enquiry" className="enquiry-column">
          <div className="advisor-card">
            <div className="eyebrow light">
              PRIVATE PROPERTY ADVISOR
            </div>

            <h3>
              ข้าว <em>· Khaw</em>
            </h3>

            <p>
              Personal assistance for viewing, negotiation and move-in.
            </p>

            <a href="tel:0636575256">
              CALL · 063-657-5256
            </a>

            <div className="advisor-line">
              LINE · Chanaakrn7547.
            </div>
          </div>

          <LeadForm
            propertyId={property.id}
            projectName={property.project_name}
          />
        </aside>
      </section>

      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }

        body {
          margin: 0;
          background: #f6f3ec;
          color: #1b1b18;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>

      <style jsx>{`
        .detail-site {
          min-height: 100vh;
          background: #f6f3ec;
          color: #1b1b18;
          font-family: Inter, "Noto Sans Thai", "Segoe UI", sans-serif;
        }

        .container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .detail-header {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(246, 243, 236, 0.94);
          border-bottom: 1px solid rgba(27, 27, 24, 0.08);
          backdrop-filter: blur(16px);
        }

        .header-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: inherit;
          text-decoration: none;
        }

        .brand-mark {
          font-family: Georgia, serif;
          font-size: 30px;
          line-height: 1;
        }

        .brand-copy b,
        .brand-copy small {
          display: block;
        }

        .brand-copy b {
          font-size: 11px;
          letter-spacing: 1.6px;
        }

        .brand-copy small {
          margin-top: 3px;
          color: #7c766d;
          font-size: 8px;
          letter-spacing: 1.2px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 18px;
        }

        .nav a {
          color: #403d37;
          text-decoration: none;
          font-size: 12px;
          font-weight: 600;
        }

        .nav-cta {
          padding: 11px 15px;
          border-radius: 999px;
          background: #1b1b18;
          color: #fff !important;
        }

        .intro {
          padding: 34px 0 26px;
        }

        .breadcrumb {
          display: flex;
          gap: 9px;
          align-items: center;
          color: #8a8175;
          font-size: 9px;
          letter-spacing: 1.2px;
        }

        .breadcrumb a {
          color: inherit;
          text-decoration: none;
        }

        .title-row {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 30px;
          margin-top: 18px;
        }

        .eyebrow {
          color: #8a8175;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.8px;
        }

        .eyebrow.light {
          color: #cfc6b8;
        }

        .title-row h1 {
          margin: 9px 0 0;
          max-width: 760px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(40px, 5vw, 68px);
          line-height: 1;
          font-weight: 400;
          letter-spacing: -2px;
        }

        .price {
          flex: 0 0 auto;
          text-align: right;
        }

        .price small,
        .price strong {
          display: block;
        }

        .price small {
          color: #8a8175;
          font-size: 8px;
          letter-spacing: 1.4px;
        }

        .price strong {
          margin-top: 8px;
          font-size: 18px;
        }

        .gallery {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 0.85fr);
          gap: 10px;
        }

        .gallery-main,
        .gallery-side > div {
          overflow: hidden;
          border-radius: 10px;
          background: #ddd8cf;
        }

        .gallery-main {
          aspect-ratio: 16 / 10;
        }

        .gallery-side {
          display: grid;
          gap: 10px;
        }

        .gallery-side > div {
          min-height: 0;
        }

        .gallery-main img,
        .gallery-side img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .placeholder {
          width: 100%;
          height: 100%;
          min-height: 380px;
          display: grid;
          place-items: center;
          color: #847b6d;
          font-family: Georgia, serif;
          font-size: 50px;
        }

        .body {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 380px;
          gap: 42px;
          align-items: start;
          padding: 34px 0 90px;
        }

        .content {
          min-width: 0;
        }

        .spec-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          border: 1px solid #ddd7ce;
          border-radius: 10px;
          background: #fff;
          overflow: hidden;
        }

        .spec {
          min-height: 92px;
          padding: 18px;
          border-right: 1px solid #e7e2da;
        }

        .spec:last-child {
          border-right: 0;
        }

        .spec small,
        .spec strong {
          display: block;
        }

        .spec small {
          color: #968c7d;
          font-size: 8px;
          letter-spacing: 1.3px;
        }

        .spec strong {
          margin-top: 11px;
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 400;
        }

        .overview,
        .facts,
        .more-photos {
          margin-top: 22px;
          border: 1px solid #e0dbd2;
          border-radius: 10px;
          background: #fff;
        }

        .overview {
          padding: 28px;
        }

        .section-head h2 {
          margin: 7px 0 0;
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
        }

        .overview p {
          margin: 22px 0 0;
          color: #5f5a53;
          font-size: 14px;
          line-height: 1.9;
          white-space: pre-line;
        }

        .facts {
          overflow: hidden;
        }

        .fact {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 16px 18px;
          border-bottom: 1px solid #eee9e2;
        }

        .fact:last-child {
          border-bottom: 0;
        }

        .fact span {
          color: #968c7d;
          font-size: 8px;
          letter-spacing: 1.1px;
        }

        .fact strong {
          text-align: right;
          font-size: 12px;
        }

        .more-photos {
          padding: 22px;
        }

        .photo-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
          margin-top: 18px;
        }

        .photo-grid img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 8px;
        }

        .enquiry-column {
          position: sticky;
          top: 96px;
          display: grid;
          gap: 16px;
        }

        .advisor-card {
          padding: 28px;
          border-radius: 10px;
          background: #1c1b18;
          color: #fff;
        }

        .advisor-card h3 {
          margin: 14px 0 0;
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
        }

        .advisor-card h3 em {
          color: #c9baa4;
          font-size: 16px;
          font-weight: 400;
        }

        .advisor-card p {
          margin: 18px 0;
          color: #c9c2b7;
          font-size: 12px;
          line-height: 1.7;
        }

        .advisor-card a,
        .advisor-line {
          display: block;
          padding: 14px 0;
          border-top: 1px solid rgba(255,255,255,.12);
          color: #fff;
          text-decoration: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .5px;
        }

        .state {
          min-height: 100vh;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 18px;
          background: #f6f3ec;
          color: #1b1b18;
        }

        .state h1 {
          margin: 0;
          font-family: Georgia, serif;
          font-weight: 400;
        }

        .back-btn {
          padding: 12px 16px;
          border-radius: 8px;
          background: #1b1b18;
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        @media (max-width: 980px) {
          .gallery {
            grid-template-columns: 1fr;
          }

          .gallery-side {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .gallery-side > div {
            aspect-ratio: 4 / 3;
          }

          .body {
            grid-template-columns: 1fr;
          }

          .enquiry-column {
            position: static;
          }
        }

        @media (max-width: 720px) {
          .container {
            width: calc(100% - 28px);
          }

          .brand-copy small,
          .nav > a:first-child {
            display: none;
          }

          .title-row {
            align-items: flex-start;
            flex-direction: column;
          }

          .price {
            text-align: left;
          }

          .title-row h1 {
            font-size: 44px;
          }

          .gallery-main {
            aspect-ratio: 4 / 3;
          }

          .spec-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .spec:nth-child(2) {
            border-right: 0;
          }

          .spec:nth-child(-n+2) {
            border-bottom: 1px solid #e7e2da;
          }

          .overview {
            padding: 22px;
          }

          .photo-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  )
}

function Spec({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="spec">
      <small>{label}</small>
      <strong>{value}</strong>
    </div>
  )
}

function Fact({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function money(value: number | null) {
  return value === null
    ? 'Price on request'
    : `฿${new Intl.NumberFormat('th-TH').format(value)} / month`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}
