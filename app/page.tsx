'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

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
  created_at: string
}

type PropertyImage = {
  id: string
  property_id: string
  image_url: string
  sort_order: number
}

const areas = [
  ['Asoke', 'อโศก'],
  ['Phrom Phong', 'พร้อมพงษ์'],
  ['Thonglor', 'ทองหล่อ'],
  ['Ekkamai', 'เอกมัย'],
  ['Rama 9', 'พระราม 9'],
  ['Ratchada', 'รัชดา'],
]

export default function HomePage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [images, setImages] = useState<PropertyImage[]>([])
  const [search, setSearch] = useState('')
  const [bedroom, setBedroom] = useState('all')
  const [budget, setBudget] = useState('all')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setMessage('')

      const [p, i] = await Promise.all([
        supabase
          .from('public_properties')
          .select('*')
          .order('created_at', { ascending: false }),

        supabase
          .from('public_property_images')
          .select('id,property_id,image_url,sort_order')
          .order('sort_order'),
      ])

      if (p.error) {
        setMessage(`โหลดข้อมูลห้องไม่สำเร็จ: ${p.error.message}`)
      }

      if (i.error) {
        console.error(i.error)
      }

      setProperties(p.data ?? [])
      setImages(i.data ?? [])
      setLoading(false)
    }

    load()
  }, [])

  const imageMap = useMemo(() => {
    const out: Record<string, PropertyImage[]> = {}

    for (const img of images) {
      ;(out[img.property_id] ||= []).push(img)
    }

    return out
  }, [images])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()

    return properties.filter((p) => {
      const searchOk =
        !q ||
        [
          p.project_name,
          p.public_title ?? '',
          p.district ?? '',
        ].some((v) => v.toLowerCase().includes(q))

      const bedOk =
        bedroom === 'all' ||
        Number(p.bedroom) === Number(bedroom)

      const rent = p.asking_rent ?? 0

      const budgetOk =
        budget === 'all' ||
        (budget === 'u20' && rent > 0 && rent <= 20000) ||
        (budget === '20-30' && rent >= 20000 && rent <= 30000) ||
        (budget === '30-50' && rent >= 30000 && rent <= 50000) ||
        (budget === '50+' && rent > 50000)

      return searchOk && bedOk && budgetOk
    })
  }, [properties, search, bedroom, budget])

  const heroImage = images[0]?.image_url
  const availableCount = properties.filter(
    (p) => p.status === 'available'
  ).length

  function chooseArea(area: string) {
    setSearch(area)
    document
      .getElementById('residences')
      ?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <main className="site">
      <header className="header">
        <div className="container header-inner">
          <Link href="/" className="brand" aria-label="KJ Property Hunter">
            <span className="brand-mark">KJ</span>

            <span className="brand-copy">
              <b>PROPERTY HUNTER</b>
              <small>BANGKOK RESIDENCE SPECIALIST</small>
            </span>
          </Link>

          <nav className="nav" aria-label="Main navigation">
            <a href="#residences">Residences</a>
            <a href="#locations">Locations</a>
            <a href="#service">Service</a>
            <a href="#contact" className="nav-cta">
              Enquire
            </a>
          </nav>
        </div>
      </header>

      <section
        className="hero"
        style={
          heroImage
            ? {
                backgroundImage: `linear-gradient(90deg, rgba(15,15,14,.80), rgba(15,15,14,.30)), url(${heroImage})`,
              }
            : undefined
        }
      >
        <div className="container hero-inner">
          <div className="hero-copy">
            <span className="eyebrow light">
              BANGKOK · PRIVATE RESIDENCES
            </span>

            <h1>
              Find a home
              <br />
              <em>that feels right.</em>
            </h1>

            <p>
              คัดสรรคอนโดให้เช่าในกรุงเทพฯ แบบส่วนตัว
              ตั้งแต่ค้นหาห้อง นัดชม ต่อรอง จนถึงวันเข้าอยู่
            </p>

            <div className="hero-actions">
              <a href="#residences" className="btn light-btn">
                Explore residences
              </a>

              <a href="#contact" className="text-link">
                Talk to Khaw <span>↗</span>
              </a>
            </div>
          </div>

          <div className="hero-meta">
            <div>
              <small>AVAILABLE NOW</small>
              <strong>{availableCount}</strong>
              <span>residences</span>
            </div>

            <div>
              <small>PERSONAL ADVISOR</small>
              <strong>KHAW</strong>
              <span>KJ Property Hunter</span>
            </div>
          </div>
        </div>
      </section>

      <section className="search-section">
        <div className="container">
          <div className="search-card">
            <div className="search-title">
              <span className="eyebrow">FIND YOUR HOME</span>
              <strong>ค้นหาคอนโดที่เหมาะกับคุณ</strong>
            </div>

            <label>
              <span>Location / Project</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Asoke, Thonglor, project name"
              />
            </label>

            <label>
              <span>Bedrooms</span>
              <select
                value={bedroom}
                onChange={(e) => setBedroom(e.target.value)}
              >
                <option value="all">ทั้งหมด</option>
                <option value="1">1 Bedroom</option>
                <option value="2">2 Bedrooms</option>
                <option value="3">3 Bedrooms</option>
              </select>
            </label>

            <label>
              <span>Monthly Budget</span>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option value="all">ทุกงบ</option>
                <option value="u20">≤ 20,000</option>
                <option value="20-30">20,000–30,000</option>
                <option value="30-50">30,000–50,000</option>
                <option value="50+">50,000+</option>
              </select>
            </label>

            <a href="#residences" className="btn dark-btn">
              Search
            </a>
          </div>

          <div className="quick-areas">
            <span>Popular:</span>

            {areas.slice(0, 4).map(([en]) => (
              <button key={en} onClick={() => chooseArea(en)}>
                {en}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="service" className="service">
        <div className="container service-grid">
          <div>
            <span className="eyebrow">PERSONAL SERVICE</span>
            <h2>
              A smarter way
              <br />
              <em>to rent in Bangkok.</em>
            </h2>
          </div>

          <div className="service-copy">
            <p>
              ไม่ต้องเสียเวลาไล่ดูหลายสิบห้อง
              เราช่วยคัดตัวเลือกที่ตรงกับทำเล งบประมาณ
              ไลฟ์สไตล์ และวันเข้าอยู่ของคุณ
            </p>

            <div className="service-points">
              <div>
                <span>01</span>
                <strong>Curated Selection</strong>
                <small>คัดห้องที่เหมาะกับคุณจริง ๆ</small>
              </div>

              <div>
                <span>02</span>
                <strong>Private Viewing</strong>
                <small>จัดนัดชมให้เป็นระบบ</small>
              </div>

              <div>
                <span>03</span>
                <strong>Negotiation Support</strong>
                <small>ช่วยต่อรองและดูรายละเอียดก่อนเข้าอยู่</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="locations" className="locations">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">PRIME LOCATIONS</span>
              <h2>พื้นที่ยอดนิยมในกรุงเทพฯ</h2>
            </div>

            <p>เลือกทำเลเพื่อดูห้องที่มีอยู่</p>
          </div>

          <div className="location-grid">
            {areas.map(([en, th], index) => (
              <button key={en} onClick={() => chooseArea(en)}>
                <span className="location-no">
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span>
                  <strong>{en}</strong>
                  <small>{th}</small>
                </span>

                <b>↗</b>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="residences" className="residences">
        <div className="container">
          <div className="section-head residences-head">
            <div>
              <span className="eyebrow">CURATED RESIDENCES</span>
              <h2>คอนโดพร้อมเช่าที่คัดมาแล้ว</h2>
            </div>

            <div className="result-count">
              <strong>{filtered.length}</strong>
              <span>residences</span>
            </div>
          </div>

          {message && <div className="notice error">{message}</div>}

          {loading ? (
            <div className="empty-state">กำลังโหลดรายการห้อง...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              ยังไม่พบห้องตามเงื่อนไขที่เลือก
            </div>
          ) : (
            <div className="property-grid">
              {filtered.map((p) => {
                const image = imageMap[p.id]?.[0]

                return (
                  <Link
                    key={p.id}
                    href={`/condos/${p.id}`}
                    className="property-card"
                  >
                    <div className="property-image">
                      {image ? (
                        <img
                          src={image.image_url}
                          alt={p.public_title || p.project_name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="placeholder">KJ</div>
                      )}

                      <span className="area-pill">
                        {p.district || 'Bangkok'}
                      </span>
                    </div>

                    <div className="property-body">
                      <div>
                        <small className="project-name">
                          {p.project_name}
                        </small>

                        <h3>
                          {p.public_title || p.project_name}
                        </h3>
                      </div>

                      <div className="specs">
                        <span>{p.bedroom ?? '-'} bed</span>
                        <span>{p.bathroom ?? '-'} bath</span>
                        <span>{p.size_sqm ?? '-'} sq.m.</span>
                      </div>

                      <div className="property-bottom">
                        <div>
                          <small>Monthly rent</small>
                          <strong>{money(p.asking_rent)}</strong>
                        </div>

                        <span className="arrow">↗</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <section id="contact" className="contact">
        <div className="container contact-grid">
          <div className="contact-copy">
            <span className="eyebrow light">PRIVATE ENQUIRY</span>

            <h2>
              บอกสิ่งที่คุณกำลังหา
              <br />
              <em>แล้วเราจะช่วยคัดให้</em>
            </h2>

            <p>
              ส่งทำเล งบประมาณ จำนวนห้องนอน และวันเข้าอยู่
              แล้ว Khaw จะช่วยแนะนำตัวเลือกที่เหมาะกับคุณ
            </p>

            <div className="contact-actions">
              <a href="tel:0636575256" className="btn contact-btn">
                Call 063-657-5256
              </a>

              <div className="line-id">
                <span>LINE ID</span>
                <strong>Chanaakrn7547.</strong>
              </div>
            </div>
          </div>

          <div className="qr-card">
            <div className="qr-box">
              <img
                src="/line-qr.jpg"
                alt="LINE QR Code - KJ Property Hunter"
              />
            </div>

            <div>
              <span>SCAN TO CHAT</span>
              <strong>LINE · Chanaakrn7547.</strong>
              <small>Khaw · KJ Property Hunter</small>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="container footer-inner">
          <div className="brand footer-brand">
            <span className="brand-mark">KJ</span>

            <span className="brand-copy">
              <b>PROPERTY HUNTER</b>
              <small>BANGKOK, THAILAND</small>
            </span>
          </div>

          <p>Bangkok condo rental · Personal property service</p>

          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>

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
        .site {
          min-height: 100vh;
          background: #f6f3ec;
          color: #1b1b18;
          font-family: Inter, "Noto Sans Thai", "Segoe UI", sans-serif;
        }

        .container {
          width: min(1180px, calc(100% - 48px));
          margin: 0 auto;
        }

        .header {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(246, 243, 236, 0.93);
          border-bottom: 1px solid rgba(27, 27, 24, 0.08);
          backdrop-filter: blur(16px);
        }

        .header-inner {
          min-height: 76px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
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
          letter-spacing: -1px;
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
          gap: 26px;
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

        .hero {
          min-height: 660px;
          background:
            linear-gradient(90deg, #1b1a17, #4d4941);
          background-position: center;
          background-size: cover;
          color: #fff;
        }

        .hero-inner {
          min-height: 660px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 40px;
          padding: 96px 0 64px;
        }

        .hero-copy {
          max-width: 760px;
        }

        .eyebrow {
          display: block;
          color: #8a8175;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 2px;
        }

        .eyebrow.light {
          color: #d7d0c3;
        }

        .hero h1,
        .service h2,
        .contact h2 {
          font-family: Georgia, "Times New Roman", serif;
          font-weight: 400;
        }

        .hero h1 {
          margin: 18px 0 20px;
          max-width: 760px;
          font-size: clamp(56px, 7vw, 96px);
          line-height: 0.94;
          letter-spacing: -3px;
        }

        .hero h1 em,
        .service h2 em,
        .contact h2 em {
          font-weight: 400;
          color: #d6c7b0;
        }

        .hero p {
          max-width: 600px;
          margin: 0;
          color: #e0dbd2;
          font-size: 16px;
          line-height: 1.8;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-top: 30px;
        }

        .btn {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 18px;
          border-radius: 7px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .light-btn {
          background: #fff;
          color: #1b1b18;
        }

        .dark-btn {
          background: #1b1b18;
          color: #fff;
        }

        .text-link {
          color: #fff;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
        }

        .text-link span {
          margin-left: 6px;
        }

        .hero-meta {
          display: grid;
          gap: 10px;
          width: 200px;
        }

        .hero-meta > div {
          padding: 16px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          background: rgba(15, 15, 14, 0.25);
          backdrop-filter: blur(8px);
        }

        .hero-meta small,
        .hero-meta strong,
        .hero-meta span {
          display: block;
        }

        .hero-meta small {
          color: #bbb3a7;
          font-size: 8px;
          letter-spacing: 1.2px;
        }

        .hero-meta strong {
          margin-top: 7px;
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 400;
        }

        .hero-meta span {
          margin-top: 4px;
          color: #d7d1c8;
          font-size: 10px;
        }

        .search-section {
          position: relative;
          z-index: 2;
          margin-top: -30px;
        }

        .search-card {
          display: grid;
          grid-template-columns:
            1.1fr
            minmax(220px, 1.6fr)
            minmax(140px, 0.8fr)
            minmax(160px, 0.9fr)
            auto;
          align-items: end;
          gap: 12px;
          padding: 18px;
          border: 1px solid #e0dbd1;
          border-radius: 12px;
          background: #fff;
          box-shadow: 0 16px 46px rgba(33, 31, 27, 0.08);
        }

        .search-title strong {
          display: block;
          margin-top: 8px;
          font-size: 14px;
        }

        .search-card label span {
          display: block;
          margin-bottom: 7px;
          color: #6d675e;
          font-size: 9px;
          font-weight: 700;
        }

        .search-card input,
        .search-card select {
          width: 100%;
          min-height: 46px;
          padding: 0 12px;
          border: 1px solid #ded9d0;
          border-radius: 7px;
          background: #fff;
          color: #1b1b18;
          font: inherit;
          outline: none;
        }

        .quick-areas {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          padding: 12px 4px 0;
          color: #746d63;
          font-size: 11px;
        }

        .quick-areas button {
          border: 0;
          background: transparent;
          color: #403d37;
          text-decoration: underline;
          cursor: pointer;
          font: inherit;
        }

        .service {
          padding: 110px 0;
        }

        .service-grid {
          display: grid;
          grid-template-columns: 0.9fr 1.1fr;
          gap: 80px;
          align-items: start;
        }

        .service h2,
        .contact h2 {
          margin: 14px 0 0;
          font-size: clamp(44px, 5vw, 70px);
          line-height: 1.02;
          letter-spacing: -2px;
        }

        .service-copy > p {
          margin: 0;
          max-width: 620px;
          color: #625d55;
          font-size: 16px;
          line-height: 1.9;
        }

        .service-points {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
          margin-top: 30px;
        }

        .service-points > div {
          padding: 18px;
          border-top: 1px solid #cbc4b8;
        }

        .service-points span,
        .service-points strong,
        .service-points small {
          display: block;
        }

        .service-points span {
          color: #978b7a;
          font-size: 9px;
        }

        .service-points strong {
          margin-top: 12px;
          font-size: 12px;
        }

        .service-points small {
          margin-top: 6px;
          color: #766f65;
          line-height: 1.55;
        }

        .locations {
          padding: 90px 0;
          background: #e9e4da;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 24px;
          margin-bottom: 26px;
        }

        .section-head h2 {
          margin: 8px 0 0;
          font-family: Georgia, serif;
          font-size: clamp(34px, 4vw, 52px);
          font-weight: 400;
        }

        .section-head > p {
          margin: 0;
          color: #726b61;
          font-size: 12px;
        }

        .location-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          border-top: 1px solid #cbc4b8;
          border-left: 1px solid #cbc4b8;
        }

        .location-grid button {
          min-height: 140px;
          display: grid;
          grid-template-columns: auto 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 20px;
          border: 0;
          border-right: 1px solid #cbc4b8;
          border-bottom: 1px solid #cbc4b8;
          background: transparent;
          color: #1b1b18;
          text-align: left;
          cursor: pointer;
        }

        .location-grid button:hover {
          background: rgba(255, 255, 255, 0.32);
        }

        .location-no {
          color: #908677;
          font-size: 9px;
        }

        .location-grid strong,
        .location-grid small {
          display: block;
        }

        .location-grid strong {
          font-family: Georgia, serif;
          font-size: 22px;
          font-weight: 400;
        }

        .location-grid small {
          margin-top: 5px;
          color: #746c61;
        }

        .residences {
          padding: 100px 0;
        }

        .result-count {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }

        .result-count strong {
          font-family: Georgia, serif;
          font-size: 34px;
          font-weight: 400;
        }

        .result-count span {
          color: #777066;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .notice {
          margin-bottom: 18px;
          padding: 12px 14px;
          border-radius: 7px;
          font-size: 12px;
        }

        .notice.error {
          border: 1px solid #efc6c1;
          background: #fff3f2;
          color: #a63d36;
        }

        .empty-state {
          padding: 70px 20px;
          border: 1px dashed #d1cabf;
          text-align: center;
          color: #82796d;
        }

        .property-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }

        .property-card {
          overflow: hidden;
          border: 1px solid #e1ddd5;
          border-radius: 10px;
          background: #fff;
          color: inherit;
          text-decoration: none;
          transition:
            transform 0.18s ease,
            box-shadow 0.18s ease;
        }

        .property-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 14px 34px rgba(33, 31, 27, 0.08);
        }

        .property-image {
          position: relative;
          aspect-ratio: 4 / 3;
          overflow: hidden;
          background: #ded9d0;
        }

        .property-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .property-card:hover .property-image img {
          transform: scale(1.025);
        }

        .placeholder {
          width: 100%;
          height: 100%;
          display: grid;
          place-items: center;
          color: #82796d;
          font-family: Georgia, serif;
          font-size: 38px;
        }

        .area-pill {
          position: absolute;
          left: 12px;
          bottom: 12px;
          padding: 6px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.91);
          color: #38342e;
          font-size: 9px;
          font-weight: 700;
          backdrop-filter: blur(6px);
        }

        .property-body {
          padding: 17px;
        }

        .project-name {
          color: #8a8175;
          font-size: 9px;
          letter-spacing: 0.9px;
          text-transform: uppercase;
        }

        .property-body h3 {
          min-height: 48px;
          margin: 7px 0 0;
          font-family: Georgia, serif;
          font-size: 20px;
          font-weight: 400;
          line-height: 1.2;
        }

        .specs {
          display: flex;
          gap: 13px;
          margin-top: 18px;
          color: #6f685f;
          font-size: 10px;
          text-transform: uppercase;
        }

        .property-bottom {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 14px;
          margin-top: 17px;
          padding-top: 15px;
          border-top: 1px solid #eeeae4;
        }

        .property-bottom small,
        .property-bottom strong {
          display: block;
        }

        .property-bottom small {
          color: #968d81;
          font-size: 8px;
          text-transform: uppercase;
        }

        .property-bottom strong {
          margin-top: 5px;
          font-size: 14px;
        }

        .arrow {
          font-size: 18px;
        }

        .contact {
          padding: 100px 0;
          background: #1c1b18;
          color: #fff;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.25fr) minmax(320px, 0.75fr);
          gap: 70px;
          align-items: center;
        }

        .contact-copy p {
          max-width: 600px;
          margin: 22px 0 0;
          color: #c7c0b5;
          line-height: 1.8;
        }

        .contact-actions {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-top: 26px;
        }

        .contact-btn {
          background: #fff;
          color: #1b1b18;
        }

        .line-id span,
        .line-id strong {
          display: block;
        }

        .line-id span {
          color: #938a7d;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .line-id strong {
          margin-top: 5px;
          font-size: 12px;
        }

        .qr-card {
          display: grid;
          grid-template-columns: 128px 1fr;
          gap: 18px;
          align-items: center;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
        }

        .qr-box {
          padding: 9px;
          background: #fff;
        }

        .qr-box img {
          display: block;
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }

        .qr-card span,
        .qr-card strong,
        .qr-card small {
          display: block;
        }

        .qr-card span {
          color: #8f877b;
          font-size: 8px;
          letter-spacing: 1.2px;
        }

        .qr-card strong {
          margin-top: 7px;
          font-size: 12px;
        }

        .qr-card small {
          margin-top: 5px;
          color: #bdb5a9;
        }

        .footer {
          padding: 26px 0;
          background: #11110f;
          color: #d4cec4;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .footer-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .footer-brand {
          color: #fff;
        }

        .footer p,
        .footer > span {
          color: #8e887f;
          font-size: 10px;
        }

        @media (max-width: 1000px) {
          .nav {
            gap: 16px;
          }

          .search-card {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .search-title {
            grid-column: 1 / -1;
          }

          .service-grid,
          .contact-grid {
            grid-template-columns: 1fr;
          }

          .property-grid,
          .location-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .hero-meta {
            display: none;
          }

          .hero-inner {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 720px) {
          .container {
            width: min(100% - 32px, 1180px);
          }

          .header-inner {
            min-height: 68px;
          }

          .brand-copy small {
            display: none;
          }

          .nav a:not(.nav-cta) {
            display: none;
          }

          .hero,
          .hero-inner {
            min-height: 590px;
          }

          .hero-inner {
            padding: 96px 0 54px;
          }

          .hero h1 {
            font-size: clamp(48px, 14vw, 68px);
            letter-spacing: -2px;
          }

          .hero p {
            font-size: 14px;
          }

          .hero-actions {
            align-items: flex-start;
            flex-direction: column;
          }

          .search-section {
            margin-top: -20px;
          }

          .search-card {
            grid-template-columns: 1fr;
          }

          .search-title {
            grid-column: auto;
          }

          .service {
            padding: 80px 0;
          }

          .service-grid {
            gap: 36px;
          }

          .service-points {
            grid-template-columns: 1fr;
          }

          .locations,
          .residences,
          .contact {
            padding: 72px 0;
          }

          .section-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .property-grid,
          .location-grid {
            grid-template-columns: 1fr;
          }

          .contact-actions {
            align-items: flex-start;
            flex-direction: column;
          }

          .qr-card {
            grid-template-columns: 110px 1fr;
          }

          .footer-inner {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 430px) {
          .container {
            width: calc(100% - 28px);
          }

          .brand-mark {
            font-size: 27px;
          }

          .brand-copy b {
            font-size: 9px;
          }

          .nav-cta {
            padding: 10px 13px;
            font-size: 11px !important;
          }

          .hero h1 {
            font-size: 46px;
          }

          .qr-card {
            grid-template-columns: 1fr;
          }

          .qr-box {
            width: 150px;
          }
        }
      `}</style>
    </main>
  )
}

function money(value: number | null) {
  return value === null
    ? 'Price on request'
    : `฿${new Intl.NumberFormat('th-TH').format(value)} / month`
}
