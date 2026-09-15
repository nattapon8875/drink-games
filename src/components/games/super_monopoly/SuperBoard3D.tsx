'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SuperPropertyTile, PropertyOwnership, PlayerRecord } from '@/types/database';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';

interface SuperBoard3DProps {
  positions: Record<string, number>;
  properties: Record<number, PropertyOwnership>;
  players: PlayerRecord[];
  currentTurnPlayerId: string | null;
  activeStepTileIndex?: number | null;
  onTileClick: (tile: SuperPropertyTile) => void;
}

export const PLAYER_3D_COLORS = [
  '#ef4444', // 1. Crimson Red (Luffy)
  '#3b82f6', // 2. Royal Blue (Goku / Sonic)
  '#10b981', // 3. Emerald Green (Zoro / Deku)
  '#f59e0b', // 4. Golden Amber (Naruto)
  '#8b5cf6', // 5. Purple Violet (Frieza / Shinji)
  '#ec4899', // 6. Hot Pink (Anya / Nezuko)
  '#06b6d4', // 7. Electric Cyan (Rimuru / Hatsune Miku)
  '#84cc16', // 8. Lime Green (Yoda / Piccolo)
  '#f97316', // 9. Bright Orange (Denji / Chainsaw)
  '#e11d48', // 10. Ruby Rose (Tanjiro)
  '#14b8a6', // 11. Teal Mint (Satoru Gojo)
  '#6366f1', // 12. Indigo Blue (Megumi)
  '#d946ef', // 13. Neon Fuchsia (Jojo / Star Platinum)
  '#eab308', // 14. Bright Yellow (Pikachu / Saitama)
  '#64748b', // 15. Slate Steel (Kakashi / Levi)
  '#fb7185', // 16. Coral Salmon (Sakura)
  '#0284c7', // 17. Deep Sky Blue (Aqua / Megumin)
  '#a855f7', // 18. Vivid Violet (Beerus)
  '#4ade80', // 19. Light Green (Gon)
  '#fbbf24', // 20. Sun Gold (Dio Brando)
];

// 6 Funny Anime / Meme Faces ported from เกมเศรษฐีวงเหล้า
export function createFunnyFaceTexture(typeIndex: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.clearRect(0, 0, 128, 128);
    const faceType = typeIndex % 6;

    if (faceType === 0) {
      // 1. Anya / Smug "Heh" Face (😏)
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1e1b4b';
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(38, 48, 14, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(90, 48, 14, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(68, 75, 20, 0.1, Math.PI * 0.85);
      ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(28, 64, 8, 0, Math.PI * 2);
      ctx.arc(100, 64, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (faceType === 1) {
      // 2. Saitama / Derp Deadpan Face (•_•)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(38, 52, 6, 0, Math.PI * 2);
      ctx.arc(90, 52, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(48, 82);
      ctx.lineTo(80, 82);
      ctx.stroke();
    } else if (faceType === 2) {
      // 3. Anime Sparkle / Hype Star Eyes (🤩 / >w<)
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(28, 42); ctx.lineTo(44, 52); ctx.lineTo(28, 62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(100, 42); ctx.lineTo(84, 52); ctx.lineTo(100, 62);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(56, 76, 10, Math.PI * 1.2, 0);
      ctx.arc(72, 76, 10, Math.PI * 1.2, 0);
      ctx.stroke();
    } else if (faceType === 3) {
      // 4. Drunk / Dizzy Swirl Eyes (@_@)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#7c2d12';
      ctx.beginPath();
      ctx.arc(40, 50, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(88, 50, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(44, 80);
      ctx.quadraticCurveTo(56, 72, 64, 82);
      ctx.quadraticCurveTo(72, 90, 84, 80);
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(26, 62, 10, 0, Math.PI * 2);
      ctx.arc(102, 62, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (faceType === 4) {
      // 5. Angry Menacing Glares (｀Д´)
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1e1b4b';
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.moveTo(26, 42); ctx.lineTo(52, 52);
      ctx.moveTo(102, 42); ctx.lineTo(76, 52);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 80, 15, 0, Math.PI);
      ctx.fill();
    } else {
      // 6. Cool Sunglasses Boss (😎 Thug Life)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(24, 44, 36, 20);
      ctx.fillRect(68, 44, 36, 20);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(60, 52); ctx.lineTo(68, 52);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 76, 14, 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Coordinate mapping for 40 tiles around 11x11 perimeter
// Exact geometry: edge ribbons width 0.94, centered at edgeD = 4.16.
// Corner tiles are 0.94 x 0.94 square boxes at (+-4.16, +-4.16) forming flush 90-degree corners.
export function getSuperTile3DPosition(index: number): [number, number, number] {
  const step = 0.82;
  const edgeD = 4.16; // Exact ribbon center line

  if (index >= 0 && index <= 10) {
    // Bottom row (0 -> 10): right to left
    // 0 is bottom-right corner, 1..9 are edge tiles, 10 is bottom-left corner
    const x = index === 0 ? edgeD : index === 10 ? -edgeD : (5 - index) * step;
    return [x, 0, edgeD];
  } else if (index > 10 && index < 20) {
    // Left col (11 -> 19): bottom to top
    const z = (15 - index) * step;
    return [-edgeD, 0, z];
  } else if (index >= 20 && index <= 30) {
    // Top row (20 -> 30): left to right
    // 20 is top-left corner, 21..29 are edge tiles, 30 is top-right corner
    const x = index === 20 ? -edgeD : index === 30 ? edgeD : (index - 25) * step;
    return [x, 0, -edgeD];
  } else {
    // Right col (31 -> 39): top to bottom
    const z = (index - 35) * step;
    return [edgeD, 0, z];
  }
}

// Rotation for each tile:
// 1. 4 corners are normal square tiles (NO diagonal slant)
// 2. หัวการ์ด (Top / Banner) เข้าไปด้านในกระดาน
// 3. ท้ายการ์ด (Bottom / Price) ออกมาด้านนอกทั้ง 4 ด้าน
export function getSuperTile3DRotation(index: number): [number, number, number] {
  // Bottom row (0-10, START and JAIL) reads upright, and the right column
  // (31-39, TAX through GO TO JAIL) was rendering upside down until it was
  // turned the other way. The artwork has a fixed top and bottom, so each side
  // is set by which way its lettering ends up, not by a uniform header rule.
  if (index >= 0 && index <= 10) {
    return [0, 0, 0];
  } else if (index > 10 && index < 20) {
    return [0, Math.PI / 2, 0];
  } else if (index >= 20 && index <= 30) {
    return [0, Math.PI, 0];
  } else {
    return [0, Math.PI / 2, 0];
  }
}


// Shorten tile names for clean 3D typography without clipping
function getTileShortName(name: string): string {
  if (name.length <= 8) return name;
  return name
    .replace('โรงแรม', 'รร.')
    .replace('การประปานครหลวง', 'การประปา')
    .replace('โรงไฟฟ้านครหลวง', 'โรงไฟฟ้า')
    .replace('พระนครศรีอยุธยา', 'อยุธยา')
    .replace('เซ็นทารา แกรนด์', 'เซ็นทารา')
    .replace('แมนดาริน โอเรียนเต็ล', 'โอเรียนเต็ล')
    .replace('สยามเคมปินสกี้', 'เคมปินสกี้');
}

// Ultra-sharp 512x512 Canvas Texture Generator (LINE เกมเศรษฐี Style)
const tileTextureCache = new Map<string, THREE.CanvasTexture>();

function createSuperTileTexture(tile: SuperPropertyTile): THREE.CanvasTexture {
  const cacheKey = `v4_${tile.index}_${tile.name}_${tile.color || 'none'}`;
  if (tileTextureCache.has(cacheKey)) {
    return tileTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const isCorner = tile.index % 10 === 0;

    // 1. Tile Base Background (Crisp Solid White / Pastel Ivory)
    ctx.fillStyle = isCorner ? '#f8fafc' : '#ffffff';
    ctx.fillRect(0, 0, 512, 512);

    // 2. Subtle Outer Bevel / Drop Shadow border
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(6, 6, 500, 500);

    ctx.lineWidth = 4;
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(14, 14, 484, 484);

    // 3. Custom Corner Tiles (LINE เกมเศรษฐี Iconic Corner Artwork)
    if (tile.index === 0) {
      // START (จุดเริ่มต้น)
      ctx.fillStyle = '#ecfdf5';
      ctx.fillRect(16, 16, 480, 480);

      // Green Header Pill
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(40, 40, 432, 90, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('START ➔', 256, 102);

      // Center Icon
      ctx.font = '110px sans-serif';
      ctx.fillText('🏁', 256, 250);

      // Subtitle
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('จุดเริ่มต้น', 256, 340);

      // Money badge
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect(80, 390, 352, 80, 20);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.font = '900 42px monospace';
      ctx.fillText('รับ +2.0M', 256, 446);
    } else if (tile.index === 10) {
      // JAIL (ห้องขัง / เกาะร้าง)
      ctx.fillStyle = '#fff7ed';
      ctx.fillRect(16, 16, 480, 480);

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.roundRect(40, 40, 432, 90, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ห้องขัง JAIL', 256, 102);

      ctx.font = '110px sans-serif';
      ctx.fillText('⛓️', 256, 250);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('เกาะร้าง / คุก', 256, 340);

      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.roundRect(60, 390, 392, 80, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('หยุด 1 ตา / ปรับ 0.5M', 256, 442);
    } else if (tile.index === 20) {
      // REST AREA (จุดพักผ่อน / มาร์เบิลเวิลด์คัพ)
      ctx.fillStyle = '#f0fdfa';
      ctx.fillRect(16, 16, 480, 480);

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(40, 40, 432, 90, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('จุดพักผ่อน', 256, 102);

      ctx.font = '110px sans-serif';
      ctx.fillText('🏖️', 256, 250);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('REST AREA', 256, 340);

      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.roundRect(80, 390, 352, 80, 20);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('หยุดทอย 1 ตา', 256, 444);
    } else if (tile.index === 30) {
      // GO TO JAIL (ไปห้องขัง / เที่ยวรอบโลก)
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(16, 16, 480, 480);

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.roundRect(40, 40, 432, 90, 24);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ไปห้องขัง!', 256, 102);

      ctx.font = '110px sans-serif';
      ctx.fillText('🚨', 256, 250);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('GO TO JAIL', 256, 340);

      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(60, 390, 392, 80, 20);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('ส่งตัวเข้าคุกทันที', 256, 444);
    } else if (tile.type === 'chest') {
      // CHEST (หีบสมบัติ)
      ctx.fillStyle = '#fdf2f8';
      ctx.fillRect(16, 16, 480, 480);

      ctx.fillStyle = '#ec4899';
      ctx.fillRect(16, 16, 480, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('หีบสมบัติ', 256, 82);

      ctx.font = '120px sans-serif';
      ctx.fillText('🎁', 256, 260);

      ctx.fillStyle = '#be185d';
      ctx.beginPath();
      ctx.roundRect(80, 390, 352, 74, 18);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('สุ่มการ์ดโชคลาภ', 256, 440);
    } else if (tile.type === 'chance') {
      // CHANCE (ประตูดวง)
      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(16, 16, 480, 480);

      ctx.fillStyle = '#eab308';
      ctx.fillRect(16, 16, 480, 100);

      ctx.fillStyle = '#451a03';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ประตูดวง', 256, 82);

      ctx.font = '120px sans-serif';
      ctx.fillText('⛩️', 256, 260);

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.roundRect(80, 390, 352, 74, 18);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('สุ่มชะตากรรม', 256, 440);
    } else if (tile.type === 'tax') {
      // TAX (ภาษี)
      ctx.fillStyle = '#fff1f2';
      ctx.fillRect(16, 16, 480, 480);

      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(16, 16, 480, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('ภาษี TAX', 256, 82);

      ctx.font = '120px sans-serif';
      ctx.fillText('💰', 256, 260);

      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.roundRect(80, 390, 352, 74, 18);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 36px monospace';
      ctx.fillText('จ่าย 1.0M', 256, 440);
    } else {
      // NORMAL PROPERTY OR UTILITY TILE (LINE เกมเศรษฐี Colorful Property Style)
      // 1. Vibrant Top Color Strip
      const bannerColor = tile.color || (tile.isUtility ? '#0284c7' : '#10b981');
      ctx.fillStyle = bannerColor;
      ctx.fillRect(16, 16, 480, 115);

      // Subtle gloss line across banner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(16, 16, 480, 24);

      // Tile Icon in Banner or Center
      ctx.font = '75px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tile.icon || (tile.isUtility ? '⚡' : '🏛️'), 256, 225);

      // 2. Property Name (Bold, High Contrast Charcoal #0f172a)
      ctx.fillStyle = '#0f172a';
      ctx.font = '900 44px sans-serif';
      const shortName = getTileShortName(tile.name);
      ctx.fillText(shortName, 256, 320);

      // 3. Price Pill Badge at the Bottom
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.roundRect(70, 385, 372, 85, 22);
      ctx.fill();

      ctx.lineWidth = 4;
      ctx.strokeStyle = '#34d399';
      ctx.strokeRect(70, 385, 372, 85);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 40px monospace';
      ctx.fillText(formatMoneyM(tile.cost || 0.6), 256, 442);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = 16; // Maximum crispness at oblique viewing angles!
  texture.needsUpdate = true;

  tileTextureCache.set(cacheKey, texture);
  return texture;
}

// A claim flag in the owner's colour. Stands on a bought plot until the first
// house goes up, so a glance at the board tells you who holds what.
const ClaimFlag3D: React.FC<{ color: string }> = ({ color }) => {
  return (
    <group position={[0, 0.11, -0.15]}>
      {/* Pole */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.44, 8]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.5} />
      </mesh>
      {/* Pennant */}
      <mesh position={[0.11, 0.36, 0]} castShadow>
        <boxGeometry args={[0.2, 0.14, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.15} />
      </mesh>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.09, 0.11, 0.05, 12]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.3} />
      </mesh>
    </group>
  );
};

// 3D House Model (LINE เกมเศรษฐี Cute Cottage Style)
const House3D: React.FC<{ position: [number, number, number]; color?: string }> = ({
  position,
  color = '#10b981',
}) => {
  return (
    <group position={position}>
      {/* House Body (White / Cream) */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.22, 0.24, 0.22]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.3} />
      </mesh>
      {/* Roof painted in the owner's colour so you can read the board at a glance */}
      <mesh position={[0, 0.30, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.20, 0.18, 4]} />
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
      </mesh>
      {/* Chimney */}
      <mesh position={[0.06, 0.34, 0.06]}>
        <boxGeometry args={[0.04, 0.10, 0.04]} />
        <meshStandardMaterial color="#fef9c3" />
      </mesh>
    </group>
  );
};

// 3D Hotel Model (LINE เกมเศรษฐี Luxurious Landmark Hotel)
const Hotel3D: React.FC<{ position: [number, number, number]; color?: string }> = ({
  position,
  color = '#b91c1c',
}) => {
  return (
    <group position={position}>
      {/* Main tower in the owner's colour, gold crown kept for all hotels */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[0.42, 0.44, 0.30]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Top Roof (Golden Crown) */}
      <mesh position={[0, 0.48, 0]} castShadow>
        <boxGeometry args={[0.46, 0.08, 0.34]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Glowing Windows */}
      <mesh position={[0, 0.22, 0.155]}>
        <planeGeometry args={[0.34, 0.32]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );
};

// 3D Money Stack (LINE เกมเศรษฐี Banknote Bundles around the table corners)
const MoneyStack3D: React.FC<{ position: [number, number, number]; rotation?: [number, number, number] }> = ({
  position,
  rotation = [0, 0, 0],
}) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Stack 1 */}
      <mesh position={[-0.22, 0.12, 0]} castShadow>
        <boxGeometry args={[0.38, 0.24, 0.55]} />
        <meshStandardMaterial color="#93c5fd" roughness={0.6} />
      </mesh>
      {/* Paper Band */}
      <mesh position={[-0.22, 0.12, 0]}>
        <boxGeometry args={[0.39, 0.25, 0.14]} />
        <meshStandardMaterial color="#fef08a" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Stack 2 */}
      <mesh position={[0.22, 0.16, 0.06]} castShadow>
        <boxGeometry args={[0.38, 0.32, 0.55]} />
        <meshStandardMaterial color="#bfdbfe" roughness={0.6} />
      </mesh>
      <mesh position={[0.22, 0.16, 0.06]}>
        <boxGeometry args={[0.39, 0.33, 0.14]} />
        <meshStandardMaterial color="#fef08a" roughness={0.3} metalness={0.5} />
      </mesh>
    </group>
  );
};

// 3D Tile Component
const Tile3D: React.FC<{
  tile: SuperPropertyTile;
  ownership: PropertyOwnership | null;
  ownerColor: string | null;
  isStepActive?: boolean;
  onClick: () => void;
}> = ({ tile, ownership, ownerColor, isStepActive, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [x, y, z] = getSuperTile3DPosition(tile.index);
  const rot = getSuperTile3DRotation(tile.index);

  const topTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createSuperTileTexture(tile);
  }, [tile]);

  const isCorner = tile.index % 10 === 0;

  const tileGeo = useMemo(() => {
    if (isCorner) {
      // 4 corners are perfect 90-degree square tiles flush with board perimeter
      return new RoundedBoxGeometry(0.94, 0.22, 0.94, 2, 0.03);
    }
    // Normal perimeter tiles
    return new RoundedBoxGeometry(0.80, 0.22, 0.94, 2, 0.03);
  }, [isCorner]);

  const houses = ownership?.houses || 0;
  const hasHotel = houses === 4;

  return (
    <group position={[x, y, z]} rotation={rot}>
      {/* 3D Tile Block */}
      <mesh
        geometry={tileGeo}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial
          map={topTexture || undefined}
          roughness={0.25}
          metalness={0.05}
          color={isStepActive ? '#fef08a' : hovered ? '#ffffff' : '#fcfcfc'}
          emissive={isStepActive ? '#eab308' : hovered ? '#fde047' : '#000000'}
          emissiveIntensity={isStepActive ? 0.7 : hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Owner Color Base Flag / Trim */}
      {ownerColor && (
        <mesh position={[0, -0.06, 0]}>
          <boxGeometry args={[isCorner ? 0.96 : 0.82, 0.12, isCorner ? 0.96 : 0.96]} />
          <meshStandardMaterial color={ownerColor} roughness={0.3} metalness={0.5} />
        </mesh>
      )}

      {/* Step Shockwave Ring Effect */}
      {isStepActive && (
        <group position={[0, 0.15, 0]}>
          <pointLight color="#fde047" intensity={4.0} distance={2.0} />
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.46, 24]} />
            <meshBasicMaterial color="#fde047" transparent opacity={0.85} />
          </mesh>
        </group>
      )}

      {/* Bought but not built on yet: plant the owner's flag */}
      {ownerColor && houses === 0 && <ClaimFlag3D color={ownerColor} />}

      {/* 3D Houses / Hotel sitting on Tile */}
      {houses > 0 && (
        <group position={[0, 0.11, -0.15]}>
          {hasHotel ? (
            <Hotel3D position={[0, 0, 0]} color={ownerColor || undefined} />
          ) : (
            <>
              {houses >= 1 && <House3D position={[-0.24, 0, 0]} color={ownerColor || undefined} />}
              {houses >= 2 && <House3D position={[0, 0, 0]} color={ownerColor || undefined} />}
              {houses >= 3 && <House3D position={[0.24, 0, 0]} color={ownerColor || undefined} />}
            </>
          )}
        </group>
      )}
    </group>
  );
};

// 3D Animated Player Pawn with Anime Chibi Character & Accessories (ported from เกมเศรษฐีวงเหล้า)
const PlayerToken3D: React.FC<{
  player: PlayerRecord;
  targetTileIndex: number;
  playerIndex: number;
  isCurrentTurn: boolean;
  players: PlayerRecord[];
  positions: Record<string, number>;
}> = ({ player, targetTileIndex, playerIndex, isCurrentTurn, players, positions }) => {
  const meshRef = useRef<THREE.Group>(null);
  const turnBeamRef = useRef<THREE.Group>(null);

  const [tx, ty, tz] = getSuperTile3DPosition(targetTileIndex);
  const color = PLAYER_3D_COLORS[playerIndex % PLAYER_3D_COLORS.length];

  // Stable random costume ID per player (Hair / Accessories / Faces)
  const costumeId = useMemo(() => {
    let hash = 0;
    const str = player.id || player.display_name || 'player';
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) & 0xffffff;
    }
    return Math.abs(hash + playerIndex);
  }, [player.id, player.display_name, playerIndex]);

  const faceTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createFunnyFaceTexture(costumeId);
  }, [costumeId]);

  // Distribute players neatly on the same tile so they NEVER hang off the board edge
  const playersOnThisTile = players.filter((other) => {
    const otherTarget = other.id === player.id ? targetTileIndex : (positions[other.id] ?? 0);
    return otherTarget === targetTileIndex;
  });
  const rank = Math.max(0, playersOnThisTile.findIndex((other) => other.id === player.id));
  const count = playersOnThisTile.length;

  let localX = 0;
  let localZ = 0;

  if (count === 2) {
    localX = rank === 0 ? -0.15 : 0.15;
    localZ = 0;
  } else if (count === 3) {
    if (rank === 0) {
      localX = -0.15;
      localZ = -0.10;
    } else if (rank === 1) {
      localX = 0.15;
      localZ = -0.10;
    } else {
      localX = 0.0;
      localZ = 0.14;
    }
  } else if (count >= 4) {
    localX = rank % 2 === 0 ? -0.15 : 0.15;
    localZ = Math.floor(rank / 2) % 2 === 0 ? -0.14 : 0.14;
  }

  // Rotate local offset into world coordinates based on tile side
  let worldOffsetX = localX;
  let worldOffsetZ = localZ;

  if (targetTileIndex >= 0 && targetTileIndex <= 10) {
    worldOffsetX = localX;
    worldOffsetZ = localZ;
  } else if (targetTileIndex > 10 && targetTileIndex < 20) {
    worldOffsetX = localZ;
    worldOffsetZ = -localX;
  } else if (targetTileIndex >= 20 && targetTileIndex <= 30) {
    worldOffsetX = -localX;
    worldOffsetZ = -localZ;
  } else {
    worldOffsetX = -localZ;
    worldOffsetZ = localX;
  }

  const targetX = tx + worldOffsetX;
  const targetZ = tz + worldOffsetZ;

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * 12);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, delta * 12);

    // Distance to target determines hop bounce
    const dist = Math.hypot(meshRef.current.position.x - targetX, meshRef.current.position.z - targetZ);
    const hopHeight = dist > 0.08 ? Math.sin(Math.min(dist * 4, Math.PI)) * 0.32 : 0;

    // Extra bounce if it's this player's turn
    const turnBob = isCurrentTurn ? Math.sin(Date.now() * 0.009) * 0.06 : 0;
    meshRef.current.position.y = 0.22 + hopHeight + Math.sin(Date.now() * 0.005 + playerIndex) * 0.02 + turnBob;

    // Bob floating turn arrow over head
    if (turnBeamRef.current) {
      turnBeamRef.current.rotation.y += delta * 2.8;
      turnBeamRef.current.position.y = 0.88 + Math.sin(Date.now() * 0.008) * 0.08;
    }
  });

  return (
    <group ref={meshRef} position={[targetX, 0.22, targetZ]} rotation={[0, Math.PI / 4, 0]}>
      {/* 👑 Floating 3D Turn Pointer Indicator over character's head */}
      {isCurrentTurn && (
        <group ref={turnBeamRef} position={[0, 0.88, 0]}>
          <pointLight color="#fde047" intensity={2.0} distance={1.5} />
          {/* Inverted Bright Golden Pyramid Arrow */}
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.13, 0.26, 4]} />
            <meshStandardMaterial
              color="#fbbf24"
              emissive="#f59e0b"
              emissiveIntensity={0.9}
              metalness={0.7}
              roughness={0.2}
            />
          </mesh>
          {/* Shiny Floating Diamond Gem */}
          <mesh position={[0, 0.18, 0]}>
            <octahedronGeometry args={[0.09, 0]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fbbf24"
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      )}

      {/* 1. Character Body (Chibi Anime Cape/Coat) */}
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.10, 0.22, 0.38, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* 2. Belt / Gold Buckle */}
      <mesh position={[0, 0.24, 0]}>
        <torusGeometry args={[0.135, 0.024, 8, 16]} />
        <meshStandardMaterial color="#fcd34d" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3. Chibi Head (Skin Tone Ivory/Peach) */}
      <mesh castShadow position={[0, 0.44, 0]}>
        <sphereGeometry args={[0.17, 24, 24]} />
        <meshStandardMaterial color="#ffedd5" roughness={0.5} />
      </mesh>

      {/* 4. Funny Anime Face Decal on the front */}
      {faceTexture && (
        <mesh position={[0, 0.44, 0.165]}>
          <planeGeometry args={[0.22, 0.22]} />
          <meshBasicMaterial map={faceTexture} transparent side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* 5. Quirky Anime Hair / Headwear on top */}
      {costumeId % 4 === 0 && (
        // Straw Hat / Luffy style
        <group position={[0, 0.56, 0]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.03, 16]} />
            <meshStandardMaterial color="#facc15" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.07, 16]} />
            <meshStandardMaterial color="#ca8a04" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.14, 0.015, 8, 16]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      )}

      {costumeId % 4 === 1 && (
        // Naruto / Ninja Headband
        <group position={[0, 0.50, 0.02]}>
          <mesh position={[0, 0, 0]} rotation={[0.1, 0, 0]}>
            <torusGeometry args={[0.165, 0.028, 8, 16]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          <mesh position={[0, 0, 0.155]} rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.11, 0.045, 0.02]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.2} />
          </mesh>
        </group>
      )}

      {costumeId % 4 === 2 && (
        // Anya Horns / Hair Buns
        <group position={[0, 0.54, 0]}>
          <mesh position={[-0.12, 0, 0]} rotation={[0, 0, 0.35]}>
            <coneGeometry args={[0.045, 0.10, 12]} />
            <meshStandardMaterial color="#1e1b4b" />
          </mesh>
          <mesh position={[0.12, 0, 0]} rotation={[0, 0, -0.35]}>
            <coneGeometry args={[0.045, 0.10, 12]} />
            <meshStandardMaterial color="#1e1b4b" />
          </mesh>
        </group>
      )}

      {costumeId % 4 === 3 && (
        // Super Saiyan Spiky Crown Hair
        <group position={[0, 0.57, 0]}>
          <mesh position={[0, 0.03, 0]}>
            <coneGeometry args={[0.08, 0.16, 8]} />
            <meshStandardMaterial color="#fde047" roughness={0.3} />
          </mesh>
          <mesh position={[-0.07, 0, 0]} rotation={[0, 0, 0.4]}>
            <coneGeometry args={[0.06, 0.13, 8]} />
            <meshStandardMaterial color="#fde047" roughness={0.3} />
          </mesh>
          <mesh position={[0.07, 0, 0]} rotation={[0, 0, -0.4]}>
            <coneGeometry args={[0.06, 0.13, 8]} />
            <meshStandardMaterial color="#fde047" roughness={0.3} />
          </mesh>
        </group>
      )}
    </group>
  );
};

// 3D Center Deck & Play Mat (Clean, spacious luxury felt mat - all decks/plaques removed as requested)
const CenterDeck3D: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Large Mahogany Table Base (Extends under the board) */}
      <mesh position={[0, -0.22, 0]} receiveShadow>
        <boxGeometry args={[13.2, 0.35, 13.2]} />
        <meshStandardMaterial color="#2d1609" roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Table Gold/Brass Bevel Border */}
      <mesh position={[0, -0.04, 0]}>
        <boxGeometry args={[13.3, 0.04, 13.3]} />
        <meshStandardMaterial color="#542c13" roughness={0.4} />
      </mesh>

      {/* 2. Center Felt Playing Mat (Clean, elegant luxury gray felt) */}
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <boxGeometry args={[7.34, 0.18, 7.34]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.8} metalness={0.05} />
      </mesh>
    </group>
  );
};

// These MUST keep a stable identity. Passing fresh object literals made R3F
// re-apply the camera on every render, which snapped the view back to the
// default framing the moment anything changed - so panning and zooming never
// survived a bot's move.
//
// dpr renders above CSS size and lets the browser downsample: a plain 1:1
// buffer is what made the tile lettering look soft, and following the display's
// own ratio would change nothing at all on a 1x monitor.
const CANVAS_DPR: [number, number] = [1.5, 2];
const CANVAS_CAMERA = { position: [0, 9.8, 9.8] as [number, number, number], fov: 42 };
const CANVAS_GL = { antialias: true, toneMapping: THREE.ACESFilmicToneMapping };

const SuperBoard3DBase: React.FC<SuperBoard3DProps> = ({
  positions,
  properties,
  players,
  currentTurnPlayerId,
  activeStepTileIndex,
  onTileClick,
}) => {
  return (
    <div
      className="w-full min-h-[460px] sm:min-h-[560px] lg:min-h-[640px] max-w-[calc(100vh-15rem)] mx-auto aspect-square rounded-2xl overflow-hidden shadow-2xl relative bg-[#0f0703] border-2 border-[#54280a]"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Canvas shadows dpr={CANVAS_DPR} camera={CANVAS_CAMERA} gl={CANVAS_GL}>
        <color attach="background" args={['#120703']} />

        {/* Ambient & Directional Warm Sunlight Lighting */}
        <ambientLight intensity={0.9} color="#fff8ed" />
        <directionalLight
          position={[8, 16, 10]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0001}
          color="#fffdf5"
        />
        <pointLight position={[0, 5, 0]} intensity={1.5} color="#fef08a" distance={12} />

        {/* Orbit Camera Controls (Constrained to smooth isometric view) */}
        <OrbitControls
          // Right-drag pans, left-drag orbits, wheel zooms. Panning used to be
          // off and the near limit kept you too far out to read a tile.
          enablePan
          screenSpacePanning
          enableZoom
          minDistance={4}
          maxDistance={30}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 6}
        />

        {/* Entire Board in Isometric Diamond Rotation (LINE เกมเศรษฐี Classic 45° Angle!) */}
        <group rotation={[0, -Math.PI / 4, 0]}>
          {/* Center Play Mat, Table Base & Money Stacks */}
          <CenterDeck3D />

          {/* 40 Tiles around board with ultra-sharp textures & authentic orientation */}
          {SUPER_MONOPOLY_TILES.map((tile) => {
            const ownership = properties[tile.index] || null;
            const ownerPlayer = ownership ? players.find((p) => p.id === ownership.ownerId) : null;
            const ownerIdx = ownerPlayer ? players.indexOf(ownerPlayer) : -1;
            const ownerColor = ownerIdx >= 0 ? PLAYER_3D_COLORS[ownerIdx % PLAYER_3D_COLORS.length] : null;

            return (
              <Tile3D
                key={tile.index}
                tile={tile}
                ownership={ownership}
                ownerColor={ownerColor}
                isStepActive={activeStepTileIndex === tile.index}
                onClick={() => onTileClick(tile)}
              />
            );
          })}

          {/* 3D Animated Player Pawns with Turn Pointer */}
          {players.map((p, idx) => {
            const isTurn = p.id === currentTurnPlayerId;
            const targetIndex =
              isTurn && activeStepTileIndex !== null && activeStepTileIndex !== undefined
                ? activeStepTileIndex
                : positions[p.id] ?? 0;

            return (
              <PlayerToken3D
                key={p.id}
                player={p}
                targetTileIndex={targetIndex}
                playerIndex={idx}
                isCurrentTurn={isTurn}
                players={players}
                positions={positions}
              />
            );
          })}
        </group>
      </Canvas>

      {/* Overlay Hint */}
      <div className="absolute bottom-2 left-2 pointer-events-none px-2.5 py-1 rounded-lg bg-[#140501] border border-amber-500/30 text-[10px] text-amber-200/90 font-bold flex items-center gap-1.5 shadow">
        <span>🎮 มุมมอง 3D สไตล์เกมเศรษฐี</span>
        <span className="text-amber-400/50">•</span>
        <span>ลากเพื่อหมุน • เลื่อนลูกกลิ้งเพื่อซูม</span>
      </div>
    </div>
  );
};

// The walk animation rewrites game_state every 320ms and the poll republishes
// it on top of that. Without this the entire scene rebuilt several times a
// second, which is what made the board text shimmer while a token was moving.
export const SuperBoard3D = React.memo(SuperBoard3DBase);
