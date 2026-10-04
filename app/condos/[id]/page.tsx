'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import LeadForm from './LeadForm'

type Property = { id:string; project_name:string; public_title:string|null; district:string|null; bedroom:number|null; bathroom:number|null; size_sqm:number|null; floor:string|null; asking_rent:number|null; public_description:string|null; available_date:string|null; status:string }
type PropertyImage = { id:string; property_id:string; image_url:string; sort_order:number }

export default function CondoDetailPage() {
  const params = useParams(); const id = String(params.id)
  const [property, setProperty] = useState<Property | null>(null)
  const [images, setImages] = useState<PropertyImage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, i] = await Promise.all([
        supabase.from('public_properties').select('*').eq('id', id).maybeSingle(),
        supabase.from('public_property_images').select('id, property_id, image_url, sort_order').eq('property_id', id).order('sort_order'),
      ])
      if (!p.error) setProperty(p.data)
      if (!i.error) setImages(i.data ?? [])
      setLoading(false)
    }
    if (id) load()
  }, [id])

  if (loading) return <main className="hotel-detail-state">Preparing residence...</main>
  if (!property) return <main className="hotel-detail-state"><h1>Residence not found</h1><Link className="hotel-button dark" href="/">Back to collection</Link></main>

  const title = property.public_title || property.project_name
  return (
    <main className="hotel-site">
      <header className="hotel-header">
        <div className="kj-container hotel-header-inner">
          <Link href="/" className="hotel-brand"><span className="hotel-brand-mark">KJ</span><span className="hotel-brand-copy"><b>PROPERTY HUNTER</b><small>PRIVATE RESIDENCE COLLECTION</small></span></Link>
          <nav className="hotel-nav"><Link href="/">Collection <span>หน้าแรก</span></Link><a href="#enquiry" className="hotel-nav-cta">Private Enquiry</a></nav>
        </div>
      </header>

      <section className="hotel-detail-intro kj-container">
        <div className="hotel-breadcrumb"><Link href="/">COLLECTION</Link><span>/</span><span>{property.project_name}</span></div>
        <div className="hotel-detail-title-row"><div><div className="hotel-kicker dark">{property.district || 'BANGKOK'} · FOR RENT</div><h1>{title}</h1></div><div className="hotel-detail-price"><small>MONTHLY RENT</small><strong>{money(property.asking_rent)}</strong></div></div>
      </section>

      <section className="hotel-detail-gallery kj-container">
        <div className="hotel-gallery-main">{images[0] ? <img src={images[0].image_url} alt={title} /> : <div className="hotel-property-placeholder">KJ</div>}</div>
        <div className="hotel-gallery-side">{images.slice(1, 3).map((img) => <div key={img.id}>{<img src={img.image_url} alt={title} />}</div>)}</div>
      </section>

      <section className="hotel-detail-body kj-container">
        <div className="hotel-detail-content">
          <div className="hotel-detail-spec-grid">
            <div><small>BEDROOMS</small><strong>{property.bedroom ?? '-'}</strong></div>
            <div><small>BATHROOMS</small><strong>{property.bathroom ?? '-'}</strong></div>
            <div><small>AREA</small><strong>{property.size_sqm ?? '-'} <em>SQ.M.</em></strong></div>
            <div><small>FLOOR</small><strong>{property.floor || '-'}</strong></div>
          </div>
          <div className="hotel-detail-story"><div className="hotel-section-number">03</div><div><div className="hotel-kicker dark">THE RESIDENCE</div><h2>รายละเอียดห้อง</h2><p>{property.public_description || 'สอบถามรายละเอียดเพิ่มเติมกับ Private Property Advisor ของเรา'}</p></div></div>
          <div className="hotel-detail-facts"><div><span>PROJECT</span><strong>{property.project_name}</strong></div><div><span>LOCATION</span><strong>{property.district || 'Bangkok'}</strong></div><div><span>AVAILABLE</span><strong>{property.available_date ? date(property.available_date) : 'On request'}</strong></div><div><span>STATUS</span><strong>Available for rent</strong></div></div>
        </div>
        <aside id="enquiry" className="hotel-enquiry-column"><div className="hotel-advisor-card"><div className="hotel-kicker">PRIVATE PROPERTY ADVISOR</div><h3>ข้าว <em>· Khaw</em></h3><p>Personal assistance for viewing, negotiation and move-in.</p><a href="tel:0636575256">CALL · 063-657-5256</a><a href="https://line.me/ti/p/~Chanaakrn7547" target="_blank" rel="noreferrer">LINE · Chanaakrn7547</a></div><LeadForm propertyId={property.id} projectName={property.project_name} /></aside>
      </section>
    </main>
  )
}

function money(value:number|null){ return value === null ? 'Price on request' : `฿${new Intl.NumberFormat('th-TH').format(value)} / month` }
function date(value:string){ return new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value)) }
