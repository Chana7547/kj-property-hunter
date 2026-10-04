'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function LoginPage(){
  const router = useRouter()
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [message,setMessage] = useState('')

  async function submit(e:React.FormEvent){
    e.preventDefault()
    setLoading(true); setMessage('')
    const {error} = await supabase.auth.signInWithPassword({email,password})
    if(error) setMessage(error.message)
    else router.replace('/admin/dashboard')
    setLoading(false)
  }

  return (
    <div style={styles.page}>
      <div style={styles.visual}>
        <div>
          <div style={styles.kicker}>KJ PROPERTY HUNTER</div>
          <h1 style={styles.hero}>Agent<br/>Workspace</h1>
          <p style={styles.desc}>ระบบหลังบ้านสำหรับจัดการทรัพย์ เจ้าของ ลูกค้า นัดชม และสัญญา</p>
        </div>
      </div>

      <div style={styles.formWrap}>
        <form onSubmit={submit} style={styles.card}>
          <div style={styles.kicker}>SECURE LOGIN</div>
          <h2 style={styles.title}>Agent Login</h2>
          <p style={styles.sub}>เข้าสู่ระบบหลังบ้าน KJ Property Hunter</p>

          {message && <div style={styles.error}>{message}</div>}

          <label style={styles.label}>EMAIL</label>
          <input style={styles.input} type="email" required value={email} onChange={e=>setEmail(e.target.value)} />

          <label style={styles.label}>PASSWORD</label>
          <input style={styles.input} type="password" required value={password} onChange={e=>setPassword(e.target.value)} />

          <button style={styles.button} disabled={loading}>{loading?'กำลังเข้าสู่ระบบ...':'เข้าสู่ระบบ'}</button>
        </form>
      </div>
    </div>
  )
}

const styles:any = {
  page:{minHeight:'100vh',display:'grid',gridTemplateColumns:'1.05fr .95fr',background:'#f7f4ed'},
  visual:{background:'#171713',color:'#fff',padding:'70px',display:'flex',alignItems:'flex-end'},
  kicker:{fontSize:10,fontWeight:800,letterSpacing:2,color:'#9a8260'},
  hero:{fontFamily:'Georgia,serif',fontSize:'clamp(54px,7vw,92px)',fontWeight:400,lineHeight:.92,margin:'16px 0 20px'},
  desc:{maxWidth:520,color:'#b8b1a5',lineHeight:1.8},
  formWrap:{display:'flex',alignItems:'center',justifyContent:'center',padding:24},
  card:{width:'min(460px,100%)',background:'#fff',border:'1px solid #e5e7eb',padding:34,borderRadius:12},
  title:{fontSize:34,margin:'8px 0 0'},
  sub:{color:'#6b7280',margin:'8px 0 24px'},
  label:{display:'block',fontSize:10,fontWeight:800,letterSpacing:1,margin:'14px 0 6px'},
  input:{width:'100%',height:46,border:'1px solid #d9dee5',borderRadius:8,padding:'0 12px',fontSize:14},
  button:{width:'100%',height:46,marginTop:20,border:0,borderRadius:8,background:'#111827',color:'#fff',fontWeight:800},
  error:{padding:12,border:'1px solid #efc6c1',background:'#fff3f2',color:'#a63d36',borderRadius:8,marginBottom:14}
}
