# 🍻 Party Drink Hub (ศูนย์รวมเกมวงเหล้าออนไลน์)

เว็บแอปพลิเคชันปาร์ตี้วงเหล้าเล่นหลายคนแบบเรียลไทม์ ด้วย Next.js (App Router), Tailwind CSS, Supabase Realtime พร้อมรองรับสถาปัตยกรรมแบบ **Multi-platform (LINE LIFF + Discord Activity + Web Browser)**

---

## 🌟 ฟีเจอร์เด่น (Key Features)
1. **Multi-platform Support:**
   - **LINE LIFF:** ดึงชื่อ/รูปโปรไฟล์ LINE อัตโนมัติ พร้อมปุ่มแชร์ Flex Message ชวนเพื่อนเข้ากลุ่ม LINE ด้วย `shareTargetPicker`
   - **Discord Activity (Embedded App SDK):** รองรับการเล่นใน Discord Voice Channel พร้อมฟีเจอร์ Auto-sync รหัสห้องตาม `channelId`
   - **Web Browser:** สุ่มชื่อเล่นกวนๆ สไตล์วงเหล้า พร้อมระบบเลือก/สุ่มรูป Avatar
2. **Modular Game Engine:**
   - ออกแบบระบบแยกโฟลเดอร์มินิเกมชัดเจน (`src/components/games/`) รองรับการเสียบเกมใหม่ได้ทันที
   - มินิเกมแรก: **"เกมเศรษฐีวงเหล้า (Board Game)"** กระดาน 24 ช่องวนรอบจอ พร้อมลูกเต๋า 3D และคำสั่งวงเหล้าไทยสุดฮา
3. **Real-time Sync:**
   - ซิงก์ตำแหน่งหมาก, ผลลูกเต๋า, จำนวนแก้วที่ดื่มสะสม (`drinks_count`) และการสลับตาเล่นแบบเรียลไทม์ผ่าน Supabase Realtime
4. **Mobile-first UI 100%:**
   - ธีม Dark Mode ไฟนีออนปาร์ตี้ (Neon Glow) เล่นได้ถนัดด้วยมือเดียว

---

## 📂 โครงสร้างโฟลเดอร์ (Project Structure)

```
party-game-hub/
├── .env.example
├── supabase_schema.sql             # SQL Migration (rooms, players, monopoly_tiles)
├── public/
│   └── assets/                     # โฟลเดอร์เก็บ Assets และเสียง
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home: เลือกเกม, สร้างห้อง, ใส่รหัส
│   │   ├── lobby/[roomCode]/       # ห้องรอ (Lobby) ซิงก์รายชื่อแบบ Real-time
│   │   ├── play/[roomCode]/        # Dynamic Switcher สลับเกมตาม room.game_type
│   │   └── api/
│   │       ├── discord/token/      # Token exchange สำหรับ Discord OAuth
│   │       └── room/               # API ตรวจสอบสถานะห้อง
│   ├── components/
│   │   ├── common/                 # Button, Modal, Avatar, DrinkCounter
│   │   ├── lobby/                  # PlayerList, ShareInvite
│   │   └── games/
│   │       ├── monopoly/           # เกมเศรษฐีวงเหล้า 24 ช่อง (เกมหลัก)
│   │       └── spin-bottle/        # เกมหมุนขวด (ตัวอย่างเกมถัดไป)
│   ├── hooks/                      # usePlatform, useRoomRealtime
│   ├── lib/
│   │   ├── supabase/               # Client & Server Supabase
│   │   ├── platforms/              # LIFF, Discord SDK, Platform Adapter
│   │   └── mockTiles.ts            # ข้อมูล 24 ช่องเกมเศรษฐี
│   └── types/                      # TypeScript Interfaces
```

---

## 🚀 วิธีการติดตั้งและรันโปรเจกต์ (Quick Start)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables (`.env.local`)
คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:
```bash
cp .env.example .env.local
```

กรอกค่าคอนฟิก:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# LINE LIFF
NEXT_PUBLIC_LIFF_ID=your-liff-id

# Discord Embedded App
NEXT_PUBLIC_DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. รัน Migration บน Supabase
1. ไปที่ Supabase Dashboard > **SQL Editor**
2. คัดลอกโค้ดทั้งหมดจากไฟล์ `supabase_schema.sql` ไปวางแล้วกด **Run**
3. ไปที่ **Database > Replication** แล้วตรวจสอบว่าเปิด Realtime ให้ตาราง `rooms` และ `players` เรียบร้อยแล้ว

### 4. รันโหมด Development
```bash
npm run dev
```
เปิดบราวเซอร์ที่ [http://localhost:3000](http://localhost:3000)

---

## 📱 คู่มือการตั้งค่า LINE LIFF
1. เข้าสู่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง Provider และ Create Channel ประเภท **LINE Login**
3. ไปที่แท็บ **LIFF** แล้วกด **Add**:
   - **Size:** Full
   - **Endpoint URL:** ใส่ URL ของแอป (เช่น `https://your-domain.com` หรือ ngrok URL)
   - **Scopes:** `profile`, `openid`
   - **Bot Prompt:** Aggressive หรือ Off
   - **Share Target Picker:** เปิดเป็น **ON** (จำเป็นสำหรับการแชร์การ์ดเข้ากลุ่ม)
4. คัดลอก **LIFF ID** มาใส่ใน `NEXT_PUBLIC_LIFF_ID` ในไฟล์ `.env.local`

---

## 🎮 คู่มือการตั้งค่า Discord Activity (Embedded App SDK)
1. ไปที่ [Discord Developer Portal](https://discord.com/developers/applications)
2. สร้าง New Application
3. ในแท็บ **OAuth2**:
   - เพิ่ม Redirect URI: `https://your-domain.com/api/discord/token`
   - คัดลอก **Client ID** และ **Client Secret**
4. ในแท็บ **Activities**:
   - เปิดใช้งาน **Enable Activities**
   - ในส่วน **URL Mappings**:
     - Prefix: `/`
     - Target: ใส่ URL ของเซิร์ฟเวอร์ Next.js (ต้องเป็น HTTPS เช่น Cloudflare Tunnel / ngrok)
5. เมื่อเข้าใช้งานผ่าน Discord Voice Channel ตัวเกมจะตรวจพบและซิงก์ห้องตาม Channel ID ให้อัตโนมัติทันที!
