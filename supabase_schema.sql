-- =======================================================
-- PARTY DRINK HUB - SUPABASE DATABASE MIGRATION SCHEMA
-- =======================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS monopoly_tiles CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 3. Create 'rooms' Table
CREATE TABLE rooms (
    code TEXT PRIMARY KEY,                       -- รหัสห้อง 4 หลัก (เช่น 'A9B2')
    host_id TEXT NOT NULL,                       -- Player ID ของหัวหน้าห้อง
    game_type TEXT NOT NULL DEFAULT 'monopoly',  -- 'monopoly', 'spin-bottle', etc.
    status TEXT NOT NULL DEFAULT 'waiting',      -- 'waiting', 'playing', 'finished'
    current_turn_player_id TEXT,                 -- Player ID ที่ถึงตาเล่นปัจจุบัน
    game_state JSONB DEFAULT '{}'::jsonb,        -- เก็บ state เช่น { positions: {}, diceResult: 1, lastTile: 0 }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create 'players' Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code TEXT NOT NULL REFERENCES rooms(code) ON DELETE CASCADE,
    line_user_id TEXT,                           -- User ID จาก LINE หรือ Discord หรือ guest session
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    drinks_count INT NOT NULL DEFAULT 0,         -- จำนวนแก้ว/ช็อตที่ดื่มสะสม
    turn_order INT NOT NULL DEFAULT 0,           -- ลำดับการเล่น (0, 1, 2, ...)
    is_connected BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster player lookups in a room
CREATE INDEX idx_players_room_code ON players(room_code);

-- 5. Create 'monopoly_tiles' Table (กระดาน 24 ช่อง)
CREATE TABLE monopoly_tiles (
    tile_index INT PRIMARY KEY,                  -- 0 ถึง 23
    title TEXT NOT NULL,
    action_text TEXT NOT NULL,
    tile_type TEXT NOT NULL                      -- 'drink', 'order_others', 'challenge', 'safe'
);

-- 6. Insert 28 Thai Drinking Rules for Monopoly Tiles
INSERT INTO monopoly_tiles (tile_index, title, action_text, tile_type) VALUES
(0, 'จุดเริ่มต้น (GO)', 'วนครบรอบหรือตกช่องนี้ สั่งใครก็ได้ดื่ม 2 จิบ', 'order_others'),
(1, 'ประเดิมวง', 'คนเดินตก ดื่มเองเบาๆ 1 จิบ', 'drink'),
(2, 'ซ้าย-ขวา สามัคคี', 'คนนั่งซ้ายและขวาของคนทอย ชนแก้วดื่มคนละ 1 จิบ', 'drink'),
(3, 'ทายหัวก้อย', 'ทายเหรียญ ถ้าทายผิดดื่ม 2 จิบ ถ้าถูกรอด', 'challenge'),
(4, 'ชี้เป้า', 'สั่งใครในวงก็ได้ดื่ม 1 ช็อต/จิบ', 'order_others'),
(5, 'รหัสต้องห้าม', 'ห้ามพูดคำว่า "กิน/ดื่ม/ชน" จนกว่าจะถึงตาหน้า ใครหลุดดื่ม 1 จิบ', 'challenge'),
(6, 'ตัวเต็งประจำโต๊ะ', 'โหวตชี้คนที่น่าจะเมาก่อนเพื่อน คนโดนชี้มากสุดดื่ม 1 จิบ', 'order_others'),
(7, 'ห้องพยาบาล (พักยก)', 'จุดปลอดภัย นั่งพักหายใจ ไม่ต้องดื่มรอบนี้', 'safe'),
(8, 'มินิเกม ห้ามสบตา', 'สบตากับคนในวง 5 วินาที ใครหลบตาก่อนคนนั้นดื่ม', 'challenge'),
(9, 'เจ้าภาพใจดี', 'คนเดินตกต้องชนแก้วกับทุกคนในวง (ดื่มพร้อมกัน 1 จิบ)', 'drink'),
(10, 'ชายล้วน', 'ผู้ชายทุกคนในวง ดื่มคนละ 1 จิบ', 'drink'),
(11, 'ยืมมือเพื่อน', 'ให้เพื่อนทางขวาทอยเต๋าแทน เลขคู่คนสั่งดื่ม คี่เพื่อนดื่ม', 'challenge'),
(12, 'หญิงแกร่ง', 'ผู้หญิงทุกคนในวง ดื่มคนละ 1 จิบ', 'drink'),
(13, 'เต้นโชว์ 1 ท่า', 'ลุกขึ้นเต้น 5 วินาที ถ้าไม่ยอมเต้น ดื่มเพียว 1 ช็อต', 'challenge'),
(14, 'จุดจอดพักรถ', 'ช่องฟรี นั่งชิลล์ คุยเล่นได้ตามสบาย', 'safe'),
(15, 'สั่งคูณสอง', 'สั่งเพื่อน 1 คนดื่ม 2 จิบ หรือสั่ง 2 คน คนละ 1 จิบ', 'order_others'),
(16, 'นับ 1-30 ห้ามพูดเลข 7', 'เล่นเกม 7 บูม วนทั้งวง ใครพลาดดื่ม 1 จิบ', 'challenge'),
(17, 'โสดโปรดดื่ม', 'คนที่มีสถานะโสดในวง ยกแก้วดื่มคนละ 1 จิบ', 'drink'),
(18, 'แบกเพื่อน', 'เลือกเพื่อน 1 คนมาเป็นบัดดี้ คนใดคนหนึ่งโดน อีกคนต้องโดนด้วย 1 รอบ', 'challenge'),
(19, 'ดื่มตามแต้มเต๋า', 'ทอยเต๋าอีก 1 ครั้ง แต้มออกเท่าไหร่ ดื่มเท่านั้นวินาที', 'drink'),
(20, 'ตกถังข้าวสาร', 'ได้สิทธิ์สั่งใครก็ได้ "หมดแก้ว" หรือเพียว 1 ฝา', 'order_others'),
(21, 'ด่านตรวจแอลกอฮอล์', 'โดนกักตัว 1 เทิร์น (ข้ามตาเดินรอบหน้า) เว้นแต่ยอมดื่ม 2 จิบเพื่อผ่านทาง', 'challenge'),
(22, 'ต่อเพลง', 'ร้องเพลงที่มีคำว่า เหล้า/เบียร์/เมา วนทั้งวง ใครนึกไม่ออกดื่ม 1 จิบ', 'challenge'),
(23, 'ช็อตเสี่ยงทาย', 'เทเครื่องดื่มรวมกันในแก้วช็อต แล้วคนตกช่องนี้ต้องดื่ม', 'drink'),
(24, 'เกมใบ้คำ', 'ทำท่าใบ้คำห้ามออกเสียง ถ้าเพื่อนทายไม่ถูกใน 15 วิ คนใบ้ดื่ม', 'challenge'),
(25, 'แย่งแตะจมูก', 'คนตกแตะจมูกตัวเอง ใครแตะตามช้าสุด ดื่ม 1 จิบ', 'challenge'),
(26, 'หมดแก้วสามัคคี', 'ทุกคนในวงชนแก้วและดื่มพร้อมกัน 1 อึกใหญ่', 'drink'),
(27, 'ดวงกึ่ม', 'คนเดินตกโดนเอง 2 จิบส่งท้ายรอบ', 'drink');

-- 7. Configure Row Level Security (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE monopoly_tiles ENABLE ROW LEVEL SECURITY;

-- Allow public anonymous read/write access for game rooms
CREATE POLICY "Allow public all access on rooms" ON rooms
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public all access on players" ON players
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow public read access on monopoly_tiles" ON monopoly_tiles
    FOR SELECT USING (true);

-- 8. Add Tables to Supabase Realtime Publication
-- Note: In Supabase Dashboard, also ensure "Realtime" is toggled ON for 'rooms' and 'players'
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE rooms, players;
COMMIT;
