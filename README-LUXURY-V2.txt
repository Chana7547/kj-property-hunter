KJ PROPERTY HUNTER — LUXURY V2
================================

แพ็กนี้เป็นชุดแทนไฟล์เดิมทั้ง Public Website + Admin CRM
ดีไซน์: Quiet Luxury / Editorial / Bangkok Private Residences

วิธีใช้
1) สำรองโฟลเดอร์โปรเจกต์เดิมก่อน
2) แตก ZIP นี้
3) คัดลอกโฟลเดอร์ app, lib, supabase ไปวางทับในโปรเจกต์ kj-property-hunter เดิม
4) อย่าลบ .env.local เดิม
5) ใน VS Code Terminal รัน:
   npm run dev
6) เปิด http://localhost:3000
7) ทดสอบ /admin/login และทุกหน้า Admin
8) เมื่อผ่านแล้วรัน:
   npm run build

หน้าที่มีในชุด
- Public Home
- Condo Detail
- Lead Form
- Admin Login
- Dashboard
- Owners CRM + Contact History
- Properties + Images
- Leads
- Appointments
- Contracts + Commission

สีหลัก
Ivory / Charcoal / Champagne Gold
ดีไซน์ตั้งใจให้ดูหรูแบบ editorial ไม่ใช้สีทองมากเกินไป

สำคัญ
- เก็บ .env.local เดิมไว้
- ใช้ Supabase Publishable key ฝั่ง browser เท่านั้น
- หากเคยแชร์ Secret/Service key ให้ rotate key ก่อน Deploy จริง
