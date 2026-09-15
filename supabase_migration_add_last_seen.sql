-- =======================================================
-- MIGRATION: add players.last_seen (heartbeat)
-- =======================================================
-- รันไฟล์นี้ใน Supabase SQL Editor บนฐานข้อมูล production
--
-- ปลอดภัย: เป็นการเพิ่มคอลัมน์อย่างเดียว ไม่ DROP ไม่ลบ ไม่แก้ข้อมูลเดิม
-- ห้ามรัน supabase_schema.sql ทั้งไฟล์บน production เด็ดขาด เพราะไฟล์นั้นขึ้นต้นด้วย DROP TABLE

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- ให้แถวเดิมที่ยังเป็น NULL ถือว่าเพิ่งเห็นตอนนี้ จะได้ไม่โดนเก็บกวาดทันทีหลัง deploy
UPDATE players SET last_seen = NOW() WHERE last_seen IS NULL;

-- ช่วยให้คำสั่งเก็บกวาดหาแถวค้างได้เร็ว
CREATE INDEX IF NOT EXISTS idx_players_last_seen ON players(room_code, last_seen);
