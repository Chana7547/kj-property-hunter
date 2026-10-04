KJ PROPERTY HUNTER — POLISHED UI PACK

แพ็กนี้เป็นไฟล์พร้อมแทนในโปรเจกต์เดิม ไม่ใช่โปรเจกต์ Next.js ใหม่ทั้งก้อน

1) สำรองโปรเจกต์เดิมก่อน
2) คัดลอกโฟลเดอร์ app และ lib ในแพ็กนี้ ไปทับไฟล์เดิมตาม path
3) อย่าลบ .env.local เดิม
4) ตรวจ .env.local ว่ามี:
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
5) ถ้ายังไม่ได้สร้าง owner_contact_logs / appointments / contracts หรือ permissions ไม่ครบ
   เปิด Supabase SQL Editor แล้วรัน supabase/final_setup.sql
6) ที่ VS Code Terminal:
   npm run dev
7) ทดสอบ:
   /
   /admin/login
   /admin/dashboard
   /admin/owners
   /admin/properties
   /admin/leads
   /admin/appointments
   /admin/contracts
   /condos/<property-id>
8) เมื่อทุกหน้าผ่าน:
   Ctrl+C
   npm run build

หมายเหตุ:
- หน้า Public ใช้ public_properties และ public_property_images
- หน้า Admin ใช้ข้อมูล private หลัง login
- ค่า lowest rent / private note / owner contact / commission ไม่ถูกนำไปหน้า Public
