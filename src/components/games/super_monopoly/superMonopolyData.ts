import { SuperPropertyTile, CardAction } from '@/types/database';

export const SUPER_MONOPOLY_TILES: SuperPropertyTile[] = [
  // แถวล่าง (Bottom: 0 -> 10, จากขวาไปซ้าย)
  {
    index: 0,
    name: 'จุดเริ่มต้น',
    type: 'start',
    description: 'ผ่านหรือตกช่องนี้ รับเงินเดือน 2.0M',
    icon: '🏁',
  },
  {
    index: 1,
    name: 'นครปฐม',
    type: 'property',
    color: '#8b4513',
    cost: 0.6,
    houseCost: 0.3,
    hotelCost: 1.0,
    baseRent: 0.06,
    rent1House: 0.2,
    rent2House: 0.6,
    rent3House: 1.2,
    rentHotel: 2.5,
    icon: '🌾',
  },
  {
    index: 2,
    name: 'หีบสมบัติ',
    type: 'chest',
    description: 'เปิดการ์ดหีบสมบัติเพื่อรับรางวัลหรือโชคชะตา',
    icon: '🎁',
  },
  {
    index: 3,
    name: 'กรุงเทพฯ',
    type: 'property',
    color: '#8b4513',
    cost: 0.6,
    houseCost: 0.3,
    hotelCost: 1.0,
    baseRent: 0.06,
    rent1House: 0.2,
    rent2House: 0.6,
    rent3House: 1.2,
    rentHotel: 2.5,
    icon: '🏛️',
  },
  {
    index: 4,
    name: 'โรงแรมเอเชีย กรุงเทพฯ',
    type: 'property',
    isUtility: true,
    color: '#0284c7',
    cost: 2.0,
    baseRent: 0.4,
    description: 'โรงแรมระดับตำนานย่านราชเทวี หากมีโรงแรมในเครือเพิ่ม ค่าผ่านทางจะทวีคูณ!',
    icon: '🏨',
  },
  {
    index: 5,
    name: 'การประปานครหลวง',
    type: 'property',
    isUtility: true,
    color: '#0284c7',
    cost: 2.0,
    baseRent: 0.5,
    description: 'กิจการสาธารณูปโภคการประปา หากครอบครองทั้งการประปาและโรงไฟฟ้า ค่าผ่านทางจะเพิ่มเป็น 1.2M!',
    icon: '🚰',
  },
  {
    index: 6,
    name: 'ชลบุรี',
    type: 'property',
    color: '#00ced1',
    cost: 1.0,
    houseCost: 0.5,
    hotelCost: 1.5,
    baseRent: 0.1,
    rent1House: 0.3,
    rent2House: 0.9,
    rent3House: 1.8,
    rentHotel: 3.5,
    icon: '🏖️',
  },
  {
    index: 7,
    name: 'ประตูดวง',
    type: 'chance',
    description: 'เปิดการ์ดประตูดวง ลุ้นเหตุการณ์พลิกผัน!',
    icon: '⛩️',
  },
  {
    index: 8,
    name: 'ระยอง',
    type: 'property',
    color: '#00ced1',
    cost: 1.0,
    houseCost: 0.5,
    hotelCost: 1.5,
    baseRent: 0.1,
    rent1House: 0.3,
    rent2House: 0.9,
    rent3House: 1.8,
    rentHotel: 3.5,
    icon: '🏭',
  },
  {
    index: 9,
    name: 'จันทบุรี',
    type: 'property',
    color: '#00ced1',
    cost: 1.2,
    houseCost: 0.6,
    hotelCost: 1.8,
    baseRent: 0.12,
    rent1House: 0.35,
    rent2House: 1.0,
    rent3House: 2.0,
    rentHotel: 4.0,
    icon: '💎',
  },
  {
    index: 10,
    name: 'ห้องขัง',
    type: 'jail',
    description: 'เดินมาตกช่องนี้ก็ติดคุกเหมือนกัน ตาถัดไปต้องจ่ายค่าปรับ 0.5M หรือหยุด 1 ตา',
    icon: '⛓️',
  },

  // แถวซ้าย (Left: 10 -> 20, จากล่างขึ้นบน)
  {
    index: 11,
    name: 'กาญจนบุรี',
    type: 'property',
    color: '#ff1493',
    cost: 1.4,
    houseCost: 0.7,
    hotelCost: 2.0,
    baseRent: 0.14,
    rent1House: 0.45,
    rent2House: 1.3,
    rent3House: 2.5,
    rentHotel: 5.0,
    icon: '🌉',
  },
  {
    index: 12,
    name: 'โรงไฟฟ้านครหลวง',
    type: 'property',
    isUtility: true,
    color: '#eab308',
    cost: 2.0,
    baseRent: 0.5,
    description: 'กิจการสาธารณูปโภคโรงไฟฟ้า หากครอบครองทั้งการประปาและโรงไฟฟ้า ค่าผ่านทางจะเพิ่มเป็น 1.2M!',
    icon: '⚡',
  },
  {
    index: 13,
    name: 'ประจวบคีรีขันธ์',
    type: 'property',
    color: '#ff1493',
    cost: 1.4,
    houseCost: 0.7,
    hotelCost: 2.0,
    baseRent: 0.14,
    rent1House: 0.45,
    rent2House: 1.3,
    rent3House: 2.5,
    rentHotel: 5.0,
    icon: '🏝️',
  },
  {
    index: 14,
    name: 'เพชรบุรี',
    type: 'property',
    color: '#ff1493',
    cost: 1.6,
    houseCost: 0.8,
    hotelCost: 2.4,
    baseRent: 0.16,
    rent1House: 0.5,
    rent2House: 1.5,
    rent3House: 3.0,
    rentHotel: 6.0,
    icon: '🌴',
  },
  {
    index: 15,
    name: 'โรงแรมดุสิตธานี',
    type: 'property',
    isUtility: true,
    color: '#0284c7',
    cost: 2.0,
    baseRent: 0.4,
    description: 'โรงแรมหรูระดับ 5 ดาวแลนด์มาร์กกรุงเทพฯ หากมีโรงแรมในเครือเพิ่ม ค่าผ่านทางจะทวีคูณ!',
    icon: '🏨',
  },
  {
    index: 16,
    name: 'สุราษฎร์ธานี',
    type: 'property',
    color: '#ff8c00',
    cost: 1.8,
    houseCost: 0.9,
    hotelCost: 2.7,
    baseRent: 0.18,
    rent1House: 0.55,
    rent2House: 1.6,
    rent3House: 3.2,
    rentHotel: 6.5,
    icon: '🥥',
  },
  {
    index: 17,
    name: 'หีบสมบัติ',
    type: 'chest',
    description: 'เปิดการ์ดหีบสมบัติเพื่อรับรางวัลหรือโชคชะตา',
    icon: '🎁',
  },
  {
    index: 18,
    name: 'กระบี่',
    type: 'property',
    color: '#ff8c00',
    cost: 1.8,
    houseCost: 0.9,
    hotelCost: 2.7,
    baseRent: 0.18,
    rent1House: 0.55,
    rent2House: 1.6,
    rent3House: 3.2,
    rentHotel: 6.5,
    icon: '⛵',
  },
  {
    index: 19,
    name: 'ภูเก็ต',
    type: 'property',
    color: '#ff8c00',
    cost: 2.0,
    houseCost: 1.0,
    hotelCost: 3.0,
    baseRent: 0.2,
    rent1House: 0.6,
    rent2House: 1.8,
    rent3House: 3.5,
    rentHotel: 7.0,
    icon: '🏖️',
  },
  {
    index: 20,
    name: 'จุดพักผ่อน',
    type: 'parking',
    description: 'จุดพักผ่อนริมชายหาด ปลอดภัยจากค่าผ่านทาง แต่ต้องพัก 1 ตา',
    icon: '🏖️',
  },

  // แถวบน (Top: 20 -> 30, จากซ้ายไปขวา)
  {
    index: 21,
    name: 'พิษณุโลก',
    type: 'property',
    color: '#e60000',
    cost: 2.2,
    houseCost: 1.1,
    hotelCost: 3.3,
    baseRent: 0.22,
    rent1House: 0.7,
    rent2House: 2.0,
    rent3House: 4.0,
    rentHotel: 8.0,
    icon: '⚔️',
  },
  {
    index: 22,
    name: 'ประตูดวง',
    type: 'chance',
    description: 'เปิดการ์ดประตูดวง ลุ้นเหตุการณ์พลิกผัน!',
    icon: '⛩️',
  },
  {
    index: 23,
    name: 'สุโขทัย',
    type: 'property',
    color: '#e60000',
    cost: 2.2,
    houseCost: 1.1,
    hotelCost: 3.3,
    baseRent: 0.22,
    rent1House: 0.7,
    rent2House: 2.0,
    rent3House: 4.0,
    rentHotel: 8.0,
    icon: '🛕',
  },
  {
    index: 24,
    name: 'นครสวรรค์',
    type: 'property',
    color: '#e60000',
    cost: 2.4,
    houseCost: 1.2,
    hotelCost: 3.6,
    baseRent: 0.24,
    rent1House: 0.75,
    rent2House: 2.2,
    rent3House: 4.2,
    rentHotel: 8.5,
    icon: '🐉',
  },
  {
    index: 25,
    name: 'โรงแรมเซ็นทารา แกรนด์',
    type: 'property',
    isUtility: true,
    color: '#0284c7',
    cost: 2.0,
    baseRent: 0.4,
    description: 'โรงแรมหรูชั้นนำระดับแนวหน้าของไทย หากมีโรงแรมในเครือเพิ่ม ค่าผ่านทางจะทวีคูณ!',
    icon: '🏨',
  },
  {
    index: 26,
    name: 'โรงแรมสยามเคมปินสกี้',
    type: 'property',
    isUtility: true,
    color: '#0284c7',
    cost: 2.4,
    baseRent: 0.45,
    description: 'โรงแรม 5 ดาวระดับอัลตร้าลักชูรีใจกลางสยาม หากมีโรงแรมในเครือเพิ่ม ค่าผ่านทางจะทวีคูณ!',
    icon: '🏨',
  },
  {
    index: 27,
    name: 'ลำปาง',
    type: 'property',
    color: '#ffd700',
    cost: 2.6,
    houseCost: 1.3,
    hotelCost: 3.9,
    baseRent: 0.26,
    rent1House: 0.8,
    rent2House: 2.3,
    rent3House: 4.5,
    rentHotel: 9.0,
    icon: '🐎',
  },
  {
    index: 28,
    name: 'เชียงราย',
    type: 'property',
    color: '#ffd700',
    cost: 2.6,
    houseCost: 1.3,
    hotelCost: 3.9,
    baseRent: 0.26,
    rent1House: 0.8,
    rent2House: 2.3,
    rent3House: 4.5,
    rentHotel: 9.0,
    icon: '⛰️',
  },
  {
    index: 29,
    name: 'เชียงใหม่',
    type: 'property',
    color: '#ffd700',
    cost: 2.8,
    houseCost: 1.4,
    hotelCost: 4.2,
    baseRent: 0.28,
    rent1House: 0.9,
    rent2House: 2.5,
    rent3House: 5.0,
    rentHotel: 10.0,
    icon: '🐘',
  },
  {
    index: 30,
    name: 'สนามบิน',
    type: 'airport',
    description: 'บินไปลงช่องไหนก็ได้ที่เลือกเอง ถ้าบินผ่านจุดเริ่มต้นก็รับเงินเดือนตามปกติ',
    icon: '✈️',
  },

  // แถวขวา (Right: 30 -> 39, จากบนลงล่าง)
  {
    index: 31,
    name: 'อุดรธานี',
    type: 'property',
    color: '#32cd32',
    cost: 3.0,
    houseCost: 1.5,
    hotelCost: 4.5,
    baseRent: 0.3,
    rent1House: 1.0,
    rent2House: 2.8,
    rent3House: 5.5,
    rentHotel: 11.0,
    icon: '🌸',
  },
  {
    index: 32,
    name: 'ขอนแก่น',
    type: 'property',
    color: '#32cd32',
    cost: 3.0,
    houseCost: 1.5,
    hotelCost: 4.5,
    baseRent: 0.3,
    rent1House: 1.0,
    rent2House: 2.8,
    rent3House: 5.5,
    rentHotel: 11.0,
    icon: '🦕',
  },
  {
    index: 33,
    name: 'หีบสมบัติ',
    type: 'chest',
    description: 'เปิดการ์ดหีบสมบัติเพื่อรับรางวัลหรือโชคชะตา',
    icon: '🎁',
  },
  {
    index: 34,
    name: 'นครราชสีมา',
    type: 'property',
    color: '#32cd32',
    cost: 3.2,
    houseCost: 1.6,
    hotelCost: 4.8,
    baseRent: 0.32,
    rent1House: 1.1,
    rent2House: 3.0,
    rent3House: 6.0,
    rentHotel: 12.0,
    icon: '🏰',
  },
  {
    index: 35,
    name: 'โรงแรมแมนดาริน โอเรียนเต็ล',
    type: 'property',
    isUtility: true,
    color: '#0284c7',
    cost: 2.5,
    baseRent: 0.5,
    description: 'โรงแรมระดับตำนานริมแม่น้ำเจ้าพระยา ติดอันดับโลก หากมีโรงแรมในเครือเพิ่ม ค่าผ่านทางจะทวีคูณ!',
    icon: '🏨',
  },
  {
    index: 36,
    name: 'ประตูดวง',
    type: 'chance',
    description: 'เปิดการ์ดประตูดวง ลุ้นเหตุการณ์พลิกผัน!',
    icon: '⛩️',
  },
  {
    index: 37,
    name: 'สงขลา',
    type: 'property',
    color: '#15803d',
    cost: 3.5,
    houseCost: 1.75,
    hotelCost: 5.25,
    baseRent: 0.35,
    rent1House: 1.2,
    rent2House: 3.2,
    rent3House: 6.5,
    rentHotel: 13.0,
    icon: '🌊',
  },
  {
    index: 38,
    name: 'เสียภาษีรายได้',
    type: 'tax',
    description: 'จ่ายภาษีรายได้เข้ารัฐ 1.0M',
    icon: '💰',
  },
  {
    index: 39,
    name: 'พระนครศรีอยุธยา',
    type: 'property',
    color: '#15803d',
    cost: 4.0,
    houseCost: 2.0,
    hotelCost: 6.0,
    baseRent: 0.4,
    rent1House: 1.5,
    rent2House: 4.0,
    rent3House: 8.0,
    rentHotel: 16.0,
    icon: '🏛️',
  },
];

export const CHEST_CARDS: CardAction[] = [
  {
    id: 'ch-1',
    type: 'chest',
    title: 'รับมรดกจากเจ้าคุณปู่',
    description: 'ได้รับส่วนแบ่งมรดกที่ดินโบราณ ได้รับเงิน 2.0M',
    rewardMoney: 2.0,
  },
  {
    id: 'ch-2',
    type: 'chest',
    title: 'ถูกสลากกินแบ่งรัฐบาล',
    description: 'เลขท้ายตรงเผง รับเงินรางวัล 1.5M',
    rewardMoney: 1.5,
  },
  {
    id: 'ch-3',
    type: 'chest',
    title: 'จ่ายค่าบำรุงรักษาบ้าน',
    description: 'พายุเข้าหลังคาบ้านรั่ว จ่ายค่าซ่อมแซม 1.0M',
    rewardMoney: -1.0,
  },
  {
    id: 'ch-4',
    type: 'chest',
    title: 'วันเกิดแสนสุข',
    description: 'เพื่อนทุกคนในวงร่วมฉลอง มอบของขวัญให้คนละ 0.5M',
    collectFromAll: 0.5,
  },
  {
    id: 'ch-5',
    type: 'chest',
    title: 'เงินปันผลสหกรณ์',
    description: 'ผลกำไรจากการลงทุนประจำปี ได้รับเงิน 1.0M',
    rewardMoney: 1.0,
  },
  {
    id: 'ch-6',
    type: 'chest',
    title: 'ตรวจสุขภาพประจำปี',
    description: 'จ่ายค่าหมอและวิตามินบำรุงร่างกาย 0.5M',
    rewardMoney: -0.5,
  },
  {
    id: 'ch-7',
    type: 'chest',
    title: 'ขายที่ดินแปลงชานเมือง',
    description: 'เทศบาลเวนคืนที่ดินที่ไม่ได้ใช้ รับเงิน 1.2M',
    rewardMoney: 1.2,
  },
  {
    id: 'ch-8',
    type: 'chest',
    title: 'ค่าส่วนกลางหมู่บ้าน',
    description: 'ถึงรอบเก็บค่าส่วนกลางประจำปี จ่าย 0.7M',
    rewardMoney: -0.7,
  },
  {
    id: 'ch-9',
    type: 'chest',
    title: 'ถูกหวยรางวัลที่ 2',
    description: 'ดวงเฮียนเกินคาด รับเงินรางวัล 3.0M',
    rewardMoney: 3.0,
  },
  {
    id: 'ch-10',
    type: 'chest',
    title: 'จ่ายค่าเทอร์มินอลขนส่ง',
    description: 'ค่าขนส่งวัสดุก่อสร้างพุ่งสูง จ่าย 1.5M',
    rewardMoney: -1.5,
  },
  {
    id: 'ch-11',
    type: 'chest',
    title: 'เลี้ยงฉลองทั้งวง',
    description: 'คุณเป็นเจ้ามือ จ่ายให้เพื่อนทุกคนคนละ 0.4M',
    payToAll: 0.4,
  },
  {
    id: 'ch-12',
    type: 'chest',
    title: 'ขายหุ้นได้กำไร',
    description: 'พอร์ตโฟลิโต ขายทำกำไร รับเงิน 0.8M',
    rewardMoney: 0.8,
  },
];

export const CHANCE_CARDS: CardAction[] = [
  {
    id: 'cc-1',
    type: 'chance',
    title: 'เดินทางด่วนสู่จุดเริ่มต้น',
    description: 'ขึ้นรถไฟความเร็วสูงกลับไปยังจุดเริ่มต้นทันที รับ 2.0M',
    teleportToIndex: 0,
    rewardMoney: 2.0,
  },
  {
    id: 'cc-2',
    type: 'chance',
    title: 'บินลัดฟ้าไปอุดรธานี',
    description: 'ได้ตั๋วเครื่องบินฟรี มุ่งตรงไปลงทุนที่อุดรธานีทันที (ถ้าผ่านจุดเริ่มต้นรับ 2.0M)',
    teleportToIndex: 31,
  },
  {
    id: 'cc-3',
    type: 'chance',
    title: 'ซิ่งรถฝ่าไฟแดง',
    description: 'โดนตำรวจจราจรจับ ปรับเงิน 0.8M',
    rewardMoney: -0.8,
  },
  {
    id: 'cc-4',
    type: 'chance',
    title: 'โดนหมายศาลเรียกตัว!',
    description: 'ถูกสั่งขังเข้าคุกทันที ไม่ได้รับเงินเดือนใดๆ ทั้งสิ้น',
    goJail: true,
  },
  {
    id: 'cc-5',
    type: 'chance',
    title: 'ค่าผ่านทางสะพานข้ามเกาะ',
    description: 'จ่ายค่าธรรมเนียมบำรุงสะพาน 0.6M',
    rewardMoney: -0.6,
  },
  {
    id: 'cc-6',
    type: 'chance',
    title: 'ที่ดินราคาพุ่งกระฉูด',
    description: 'เก็งกำไรที่ดินสำเร็จ ได้รับผลตอบแทน 2.5M',
    rewardMoney: 2.5,
  },
  {
    id: 'cc-7',
    type: 'chance',
    title: 'ตรวจพบสิ่งผิดกฎหมาย',
    description: 'เจ้าหน้าที่เรียกคุย ถูกส่งเข้าห้องขังทันที',
    goJail: true,
  },
  {
    id: 'cc-8',
    type: 'chance',
    title: 'เงินปันผลหุ้นก้อนโต',
    description: 'หุ้นที่ถือไว้ราคาพุ่ง รับเงิน 1.8M',
    rewardMoney: 1.8,
  },
  {
    id: 'cc-9',
    type: 'chance',
    title: 'กลับไปตั้งหลักที่เชียงใหม่',
    description: 'ย้ายฐานการค้าไปเชียงใหม่ทันที (ถ้าผ่านจุดเริ่มต้นรับ 2.00M)',
    teleportToIndex: 21,
  },
  {
    id: 'cc-10',
    type: 'chance',
    title: 'ค่าซ่อมรถครั้งใหญ่',
    description: 'เครื่องพังกลางทาง จ่ายค่าซ่อม 1.2M',
    rewardMoney: -1.2,
  },
  {
    id: 'cc-11',
    type: 'chance',
    title: 'ได้งานประมูลเทศบาล',
    description: 'รับเหมาสร้างถนน กำไรงาม รับเงิน 2.2M',
    rewardMoney: 2.2,
  },
  {
    id: 'cc-12',
    type: 'chance',
    title: 'เรียกคืนภาษีย้อนหลัง',
    description: 'สรรพากรใจดี เก็บเงินจากเพื่อนทุกคน คนละ 0.3M',
    collectFromAll: 0.3,
  },
];

export function formatMoneyM(amount: number): string {
  // Always two decimals so every cash figure on screen lines up (15.00M, 1.40M, 0.60M)
  const rounded = Math.round(amount * 100) / 100;
  return `${rounded.toFixed(2)}M`;
}

// ---------------------------------------------------------------------------
// Draw piles
//
// Cards used to be picked at random every time, so the same one came up again
// and again. Each deck is now dealt out: a card is only reshuffled back in once
// the whole pile has been used. The remaining ids live in game_state so every
// client draws from the same pile.
// ---------------------------------------------------------------------------

function shuffleIds(cards: CardAction[]): string[] {
  const ids = cards.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids;
}

export function drawFromDeck(
  deck: string[] | undefined | null,
  cards: CardAction[]
): { card: CardAction; nextDeck: string[] } {
  let pile = Array.isArray(deck) ? deck.filter((id) => cards.some((c) => c.id === id)) : [];
  if (pile.length === 0) pile = shuffleIds(cards);

  const [drawnId, ...rest] = pile;
  const card = cards.find((c) => c.id === drawnId) || cards[0];
  return { card, nextDeck: rest };
}

// ---------------------------------------------------------------------------
// House rules that several places have to agree on
// ---------------------------------------------------------------------------

// The two halves of the ค่าผ่านทาง bonus: the five named hotels chain together,
// and the waterworks pairs with the power plant.
export const HOTEL_TILE_INDICES = [4, 15, 25, 26, 35];
export const UTILITY_TILE_INDICES = [5, 12];

// Ordinary provinces: everything you can actually build a house on.
export const PROVINCE_TILE_INDICES = SUPER_MONOPOLY_TILES.filter(
  (t) => t.type === 'property' && !t.isUtility
).map((t) => t.index);

export const INITIAL_CASH_M = 15.0; // 15M starting cash
export const STARTING_PROPERTIES_PER_PLAYER = 3;
export const MAX_VISIT_MULTIPLIER = 4;

// How far a province may be built up on a given visit. Landing on your own land
// the first time lets you put up two houses at once; the third house waits for
// your next visit, and the hotel for the one after that.
export function maxHousesForVisits(visits: number): number {
  if (visits >= 3) return 4;
  if (visits >= 2) return 3;
  return 2;
}

// A hotel or a utility earns a multiplier instead of houses: x1 the first time
// its owner lands on it, and one more each visit after, up to x4.
export function visitMultiplier(visits: number | undefined): number {
  return Math.min(MAX_VISIT_MULTIPLIER, Math.max(1, visits || 1));
}

// Every player starts holding land, paid for out of their opening cash, so the
// board is not a blank sheet for the first three laps. Pure chance made the
// draws wildly unfair - one player could be handed 11.5M of the 15M they had -
// so the picks are random but dealt out to keep the bills close together.
export function dealStartingProperties(
  playerIds: string[],
  perPlayer: number = STARTING_PROPERTIES_PER_PLAYER
): { properties: Record<number, { ownerId: string; houses: number; visits: number }>; spend: Record<string, number> } {
  const properties: Record<number, { ownerId: string; houses: number; visits: number }> = {};
  const spend: Record<string, number> = {};
  playerIds.forEach((id) => {
    spend[id] = 0;
  });

  // A big table can run the board out of provinces. Everyone gets the same
  // number rather than the last seats being dealt nothing.
  const each = Math.max(
    0,
    Math.min(perPlayer, Math.floor(PROVINCE_TILE_INDICES.length / Math.max(1, playerIds.length)))
  );
  const needed = playerIds.length * each;
  const pool = [...PROVINCE_TILE_INDICES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Deal the dearest land first, alternating direction each round, so whoever
  // took the most expensive square this round picks last in the next one.
  const picked = pool
    .slice(0, Math.min(needed, pool.length))
    .sort((a, b) => (costOf(b) || 0) - (costOf(a) || 0));

  picked.forEach((tileIndex, i) => {
    const round = Math.floor(i / playerIds.length);
    const slot = i % playerIds.length;
    const seat = round % 2 === 0 ? slot : playerIds.length - 1 - slot;
    const ownerId = playerIds[seat];
    properties[tileIndex] = { ownerId, houses: 0, visits: 0 };
    spend[ownerId] += costOf(tileIndex);
  });

  return { properties, spend };
}

function costOf(tileIndex: number): number {
  return SUPER_MONOPOLY_TILES[tileIndex]?.cost || 0;
}

// ---------------------------------------------------------------------------
// The row bonus: holding one side of the board
// ---------------------------------------------------------------------------

// The four sides of the ring, in the order the token walks them.
export const ROW_RANGES: Array<[number, number]> = [
  [0, 10],
  [11, 20],
  [21, 30],
  [31, 39],
];

export const ROW_NAMES = ['แถวล่าง', 'แถวซ้าย', 'แถวบน', 'แถวขวา'];

export function rowOfTile(tileIndex: number): number {
  return ROW_RANGES.findIndex(([lo, hi]) => tileIndex >= lo && tileIndex <= hi);
}

// Every buyable square on a side. Hotels and utilities are counted towards the
// claim even though the bonus never lands on them.
const ROW_TILE_INDICES: number[][] = ROW_RANGES.map(([lo, hi]) =>
  SUPER_MONOPOLY_TILES.filter((t) => t.type === 'property' && t.index >= lo && t.index <= hi).map(
    (t) => t.index
  )
);

export interface RowBonus {
  row: number;
  ownerId: string;
  count: number;
}

export function rowHoldingOf(
  row: number,
  ownerId: string,
  properties: Record<number, { ownerId: string }>
): number {
  if (row < 0) return 0;
  return (ROW_TILE_INDICES[row] || []).filter((i) => properties[i]?.ownerId === ownerId).length;
}

// Three squares on one side is worth x2, and every square after that adds one.
export const ROW_BONUS_THRESHOLD = 3;
export function rowMultiplierFor(count: number): number {
  return count >= ROW_BONUS_THRESHOLD ? count - 1 : 1;
}

// Only one side of the board pays this bonus at a time, and it belongs to
// whoever completed a side most recently - so a rival taking three squares on
// another side switches it off, wherever it was.
export function recomputeRowBonus(
  properties: Record<number, { ownerId: string }>,
  previous: RowBonus | null | undefined,
  justClaimed?: { tileIndex: number; ownerId: string } | null
): RowBonus | null {
  if (justClaimed) {
    const row = rowOfTile(justClaimed.tileIndex);
    const count = rowHoldingOf(row, justClaimed.ownerId, properties);
    if (count >= ROW_BONUS_THRESHOLD) {
      return { row, ownerId: justClaimed.ownerId, count };
    }
  }

  if (previous) {
    const count = rowHoldingOf(previous.row, previous.ownerId, properties);
    if (count >= ROW_BONUS_THRESHOLD) return { ...previous, count };
  }

  // The holder was broken up - hand it to the strongest side still standing
  // rather than leaving a board where somebody plainly owns a side get nothing.
  let best: RowBonus | null = null;
  ROW_TILE_INDICES.forEach((indices, row) => {
    const tally: Record<string, number> = {};
    indices.forEach((i) => {
      const owner = properties[i]?.ownerId;
      if (owner) tally[owner] = (tally[owner] || 0) + 1;
    });
    Object.entries(tally).forEach(([ownerId, count]) => {
      if (count >= ROW_BONUS_THRESHOLD && (!best || count > best.count)) {
        best = { row, ownerId, count };
      }
    });
  });
  return best;
}

// ---------------------------------------------------------------------------
// คำขวัญประจำจังหวัด
//
// Flavour, not rules: the board is named after real provinces, so a square can
// say what that province says about itself. Keyed by the tile name so a
// province that is renamed loses its motto rather than silently showing the
// wrong one, and only the 22 province squares have an entry - a hotel, a
// utility or a corner is not a province and gets nothing.
// ---------------------------------------------------------------------------
export const PROVINCE_MOTTOES: Record<string, string> = {
  'กรุงเทพฯ':
    'กรุงเทพฯ ดุจเทพสร้าง เมืองศูนย์กลางการปกครอง วัด วัง งามเรืองรอง เมืองหลวงของประเทศไทย',
  'นครปฐม':
    'ส้มโอหวาน ข้าวสารขาว ลูกสาวงาม ข้าวหลามหวานมัน สนามจันทร์งามล้น พุทธมณฑลคู่ธานี พระปฐมเจดีย์เสียดฟ้า สวยงามตาแม่น้ำท่าจีน',
  'ชลบุรี': 'ทะเลงาม ข้าวหลามอร่อย อ้อยหวาน จักสานดี ประเพณีวิ่งควาย',
  'ระยอง':
    'ผลไม้รสล้ำ อุตสาหกรรมก้าวหน้า น้ำปลารสเด็ด เกาะเสม็ดสวยหรู สุนทรภู่กวีเอก',
  'จันทบุรี':
    'น้ำตกลือเลื่อง เมืองผลไม้ พริกไทยพันธุ์ดี อัญมณีมากเหลือ เสื่อจันทบูร สมบูรณ์ธรรมชาติ สมเด็จพระเจ้าตากสินมหาราช รวมญาติกู้ชาติที่จันทบุรี',
  'กาญจนบุรี': 'แคว้นโบราณ ด่านเจดีย์ มณีเมืองกาญจน์ สะพานข้ามแม่น้ำแคว แหล่งแร่น้ำตก',
  'ประจวบคีรีขันธ์': 'เมืองทองเนื้อเก้า มะพร้าวสัปปะรด สวยสดหาดเขาถ้ำ งามล้ำน้ำใจ',
  'เพชรบุรี': 'เขาวังคู่บ้าน ขนมหวานเมืองพระ เลิศล้ำศิลปะ แดนธรรมะ ทะเลงาม',
  'สุราษฎร์ธานี': 'เมืองร้อยเกาะ เงาะอร่อย หอยใหญ่ ไข่แดง แหล่งธรรมะ',
  'กระบี่':
    'แหล่งถ่านหิน ถิ่นหอยเก่า เขาตระหง่าน ธารสวย รวยเกาะ เพาะปลูกปาล์ม งามหาดทราย',
  'ภูเก็ต':
    'ไข่มุกอันดามัน สวรรค์เมืองใต้ หาดทรายสีทอง สองวีรสตรี บารมีหลวงพ่อแช่ม',
  'พิษณุโลก':
    'พระพุทธชินราชงามเลิศ ถิ่นกำเนิดพระนเรศวร สองฝั่งน่านล้วนเรือนแพ หวานฉ่ำแท้กล้วยตาก ถ้ำและน้ำตกหลากตระการตา',
  'สุโขทัย':
    'มรดกโลกล้ำเลิศ กำเนิดลายสือไทย เล่นไฟลอยกระทง ดำรงพุทธศาสนา งามตาผ้าตีนจก สังคโลกทองโบราณ สักการแม่ย่าพ่อขุน รุ่งอรุณแห่งความสุข',
  'นครสวรรค์': 'เมืองสี่แคว แห่มังกร พักผ่อนบึงบอระเพ็ด ปลารสเด็ดปากน้ำโพ',
  'ลำปาง':
    'ถ่านหินลือชา รถม้าลือลั่น เครื่องปั้นลือนาม งามพระธาตุลือไกล ฝึกช้างใช้ลือโลก',
  'เชียงราย':
    'เหนือสุดในสยาม ชายแดนสามแผ่นดิน ถิ่นวัฒนธรรมล้านนา ล้ำค่าพระธาตุดอยตุง',
  'เชียงใหม่':
    'ดอยสุเทพเป็นศรี ประเพณีเป็นสง่า บุปผชาติล้วนงามตา นามล้ำค่านครพิงค์',
  'อุดรธานี':
    'น้ำตกจากสันภูพาน อุทยานแห่งธรรมะ อารยธรรมห้าพันปี ธานีผ้าหมี่ขิด แดนเนรมิตหนองประจักษ์ เลิศลักษณ์กล้วยไม้หอมอุดรซันไฉน',
  'ขอนแก่น':
    'พระธาตุขามแก่น เสียงแคนดอกคูน ศูนย์รวมผ้าไหม ร่วมใจผูกเสี่ยว เที่ยวขอนแก่นนครใหญ่ ไดโนเสาร์สิรินธรเน่ สุดเท่เหรียญทองแรกมวยโอลิมปิก',
  'นครราชสีมา': 'เมืองหญิงกล้า ผ้าไหมดี หมี่โคราช ปราสาทหิน ดินด่านเกวียน',
  'สงขลา':
    'นกน้ำเพลินตา สมิหลาเพลินใจ เมืองใหญ่สองทะเล เสน่ห์สะพานติณ ถิ่นธุรกิจแดนใต้',
  'พระนครศรีอยุธยา':
    'ราชธานีเก่า อู่ข้าวอู่น้ำ เลิศล้ำกานท์กวี คนดีศรีอยุธยา เลอคุณค่ามรดกโลก',
};

/** The province motto for a square, or null if the square is not a province. */
export function mottoOfTile(tile: { name?: string; isUtility?: boolean } | null | undefined) {
  if (!tile || tile.isUtility || !tile.name) return null;
  return PROVINCE_MOTTOES[tile.name] || null;
}
