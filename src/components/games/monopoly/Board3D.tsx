'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MonopolyTileRecord, PlayerRecord } from '@/types/database';
import { getTileIcon } from '@/lib/mockTiles';

interface Board3DProps {
  tiles: MonopolyTileRecord[];
  positions: Record<string, number>;
  players: PlayerRecord[];
  highlightTileIndex?: number;
  isRolling: boolean;
  diceResult: number;
  costumes?: Record<string, number>;
  currentTurnPlayerId?: string | null;
}

export const PLAYER_COLORS = [
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

// 6 Hilarious Funny Anime / Meme Faces
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

      // Half-closed smug curved eyes
      ctx.beginPath();
      ctx.arc(38, 48, 14, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(90, 48, 14, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();

      // Smug angled smirk
      ctx.beginPath();
      ctx.arc(68, 75, 20, 0.1, Math.PI * 0.85);
      ctx.stroke();

      // Cheek blush
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(28, 64, 8, 0, Math.PI * 2);
      ctx.arc(100, 64, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (faceType === 1) {
      // 2. Saitama / Derp Deadpan Face (•_•)
      ctx.fillStyle = '#0f172a';
      // Dot eyes
      ctx.beginPath();
      ctx.arc(38, 52, 6, 0, Math.PI * 2);
      ctx.arc(90, 52, 6, 0, Math.PI * 2);
      ctx.fill();

      // Deadpan straight line mouth
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
      // "> <" eyes
      ctx.beginPath();
      ctx.moveTo(28, 42); ctx.lineTo(44, 52); ctx.lineTo(28, 62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(100, 42); ctx.lineTo(84, 52); ctx.lineTo(100, 62);
      ctx.stroke();

      // "3" cute mouth
      ctx.beginPath();
      ctx.arc(56, 76, 10, Math.PI * 1.2, 0);
      ctx.arc(72, 76, 10, Math.PI * 1.2, 0);
      ctx.stroke();
    } else if (faceType === 3) {
      // 4. Drunk / Dizzy Swirl Eyes (@_@)
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#7c2d12';

      // Left swirl
      ctx.beginPath();
      ctx.arc(40, 50, 12, 0, Math.PI * 2);
      ctx.stroke();
      // Right swirl
      ctx.beginPath();
      ctx.arc(88, 50, 12, 0, Math.PI * 2);
      ctx.stroke();

      // Wobbly drunken squiggly mouth
      ctx.beginPath();
      ctx.moveTo(44, 80);
      ctx.quadraticCurveTo(56, 72, 64, 82);
      ctx.quadraticCurveTo(72, 90, 84, 80);
      ctx.stroke();

      // Heavy drunken blush
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(26, 62, 10, 0, Math.PI * 2);
      ctx.arc(102, 62, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (faceType === 4) {
      // 5. Angry Troll / Jojo Menacing Glares (｀Д´)
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#1e1b4b';
      ctx.fillStyle = '#1e1b4b';

      // Slanted fierce eyebrows & eyes
      ctx.beginPath();
      ctx.moveTo(26, 42); ctx.lineTo(52, 52);
      ctx.moveTo(102, 42); ctx.lineTo(76, 52);
      ctx.stroke();

      // Open roaring mouth
      ctx.beginPath();
      ctx.arc(64, 80, 15, 0, Math.PI);
      ctx.fill();
    } else {
      // 6. Cool Sunglasses Boss (😎 Thug Life)
      ctx.fillStyle = '#0f172a';
      // Shades
      ctx.fillRect(24, 44, 36, 20);
      ctx.fillRect(68, 44, 36, 20);
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(60, 52); ctx.lineTo(68, 52);
      ctx.stroke();

      // Smug smile
      ctx.beginPath();
      ctx.arc(64, 76, 14, 0.2, Math.PI * 0.8);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function getTile3DPosition(index: number): [number, number, number] {
  const step = 1.0;
  const half = 3.5;

  if (index >= 0 && index <= 7) {
    return [-half + index * step, 0, -half];
  } else if (index >= 8 && index <= 13) {
    const row = index - 7;
    return [half, 0, -half + row * step];
  } else if (index >= 14 && index <= 21) {
    const col = index - 14;
    return [half - col * step, 0, half];
  } else {
    const row = index - 21;
    return [-half, 0, half - row * step];
  }
}

const tileTextureCache = new Map<string, THREE.CanvasTexture>();

function createTileTopTexture(tile: MonopolyTileRecord, index: number, bgColor: string): THREE.CanvasTexture {
  const icon = getTileIcon(tile);
  const cacheKey = `${index}_${icon}_${tile.title}_${bgColor}`;
  if (tileTextureCache.has(cacheKey)) {
    return tileTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Wood plank / rich background with gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, bgColor);
    grad.addColorStop(1, '#110502');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // 2. Ornate gold / brass inner frame border
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(8, 8, 240, 240);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fef08a';
    ctx.strokeRect(14, 14, 228, 228);

    // 3. 4 Corner Brass Rivets
    ctx.fillStyle = '#fde047';
    [
      [22, 22],
      [234, 22],
      [22, 234],
      [234, 234],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Header Bar: Tile Number Badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.beginPath();
    ctx.roundRect(18, 18, 70, 36, 10);
    ctx.fill();

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`#${index}`, 53, 36);

    // 5. Centered Large RPG Emoji / Icon
    ctx.font = '76px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, 128, 105);

    // 6. Title Banner Plaque
    ctx.fillStyle = 'rgba(15, 6, 2, 0.85)';
    ctx.beginPath();
    ctx.roundRect(16, 168, 224, 68, 12);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    // 7. Title text
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const title = tile.title;
    if (title.length > 12) {
      // Split into 2 lines if long
      const mid = Math.ceil(title.length / 2);
      const line1 = title.slice(0, mid);
      const line2 = title.slice(mid);
      ctx.fillText(line1, 128, 188);
      ctx.fillText(line2, 128, 216);
    } else {
      ctx.fillText(title, 128, 202);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  tileTextureCache.set(cacheKey, texture);
  return texture;
}

const Tile3D: React.FC<{
  tile: MonopolyTileRecord;
  index: number;
  isHighlighted: boolean;
  position: [number, number, number];
}> = ({ tile, index, isHighlighted, position }) => {
  const tileColor = useMemo(() => {
    switch (tile.tile_type) {
      case 'drink':
        return '#881337'; // Wine / Ruby
      case 'order_others':
        return '#92400e'; // Warm Amber
      case 'challenge':
        return '#581c87'; // Mystic Purple
      default:
        return '#166534'; // Emerald Green
    }
  }, [tile.tile_type]);

  const topTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createTileTopTexture(tile, index, tileColor);
  }, [tile, index, tileColor]);

  const yOffset = isHighlighted ? 0.22 : 0;

  return (
    <group position={[position[0], position[1] + yOffset, position[2]]}>
      {/* 1. Main Wooden Pedestal Block with Gold/Color Edge */}
      <mesh castShadow receiveShadow position={[0, 0.1, 0]}>
        <boxGeometry args={[0.94, 0.22, 0.94]} />
        <meshStandardMaterial
          color={isHighlighted ? '#f59e0b' : '#321408'}
          roughness={0.45}
          metalness={isHighlighted ? 0.8 : 0.2}
        />
      </mesh>

      {/* 2. Top Decorative Surface Face with Canvas Icon & Title */}
      {topTexture && (
        <mesh position={[0, 0.215, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.88, 0.88]} />
          <meshStandardMaterial
            map={topTexture}
            roughness={0.4}
            metalness={0.1}
          />
        </mesh>
      )}

      {/* 3. Highlighted golden pillar of light when landing on tile */}
      {isHighlighted && (
        <pointLight
          position={[0, 0.6, 0]}
          color="#fde047"
          intensity={3.5}
          distance={2.5}
        />
      )}
    </group>
  );
};

const PlayerToken3D: React.FC<{
  player: PlayerRecord;
  targetTileIndex: number;
  playerIndex: number;
  costumeId: number;
  isCurrentTurn: boolean;
}> = ({ targetTileIndex, playerIndex, costumeId, isCurrentTurn }) => {
  const meshRef = useRef<THREE.Group>(null);
  const turnBeamRef = useRef<THREE.Group>(null);
  const basePos = getTile3DPosition(targetTileIndex);

  // Distribute players dynamically around tile so they never fully overlap
  const totalOffsetSlots = 12;
  const ring = Math.floor(playerIndex / totalOffsetSlots);
  const slot = playerIndex % totalOffsetSlots;
  const radius = 0.18 + ring * 0.14;
  const angle = (slot * Math.PI * 2) / Math.min(totalOffsetSlots, 12);
  const offsetX = Math.cos(angle) * radius;
  const offsetZ = Math.sin(angle) * radius;

  const targetX = basePos[0] + offsetX;
  const targetZ = basePos[2] + offsetZ;
  const color = PLAYER_COLORS[costumeId % PLAYER_COLORS.length];

  const faceTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createFunnyFaceTexture(costumeId);
  }, [costumeId]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * 12);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, delta * 12);

    // Distance to target determines hop bounce
    const dist = Math.hypot(meshRef.current.position.x - targetX, meshRef.current.position.z - targetZ);
    const hopHeight = dist > 0.08 ? Math.sin(Math.min(dist * 4, Math.PI)) * 0.32 : 0;
    
    // Extra excited bounce if it's this player's turn
    const turnBob = isCurrentTurn ? Math.sin(Date.now() * 0.009) * 0.06 : 0;
    meshRef.current.position.y = 0.4 + hopHeight + Math.sin(Date.now() * 0.005 + playerIndex) * 0.03 + turnBob;

    // Bob the floating turn arrow over head
    if (turnBeamRef.current) {
      turnBeamRef.current.rotation.y += delta * 2.8;
      turnBeamRef.current.position.y = 0.88 + Math.sin(Date.now() * 0.008) * 0.08;
    }
  });

  return (
    <group ref={meshRef} position={[targetX, 0.4, targetZ]}>
      {/* 👑 Floating 3D Turn Pointer Indicator over character's head */}
      {isCurrentTurn && (
        <group ref={turnBeamRef} position={[0, 0.88, 0]}>
          {/* Subtle soft spotlight directly on the character */}
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

// Texture cache to prevent recreating textures on each render
const diceTextureCache = new Map<number, THREE.CanvasTexture>();

function createConcaveDiceTexture(value: number): THREE.CanvasTexture {
  if (diceTextureCache.has(value)) {
    return diceTextureCache.get(value)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Warm ivory/cream background with subtle radial shading
    const bg = ctx.createRadialGradient(128, 128, 30, 128, 128, 160);
    bg.addColorStop(0, '#faf7ee');
    bg.addColorStop(0.7, '#f4ece0');
    bg.addColorStop(1, '#e8ddcb');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 256, 256);

    // 2. Subtle corner bevel darkening around edges
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ded3c2';
    ctx.strokeRect(5, 5, 246, 246);

    // 3. Dot positions
    const dotRadius = value === 1 ? 29 : 20;
    const d = 69;
    const c = 128;
    let positions: [number, number][] = [];

    switch (value) {
      case 1:
        positions = [[c, c]];
        break;
      case 2:
        positions = [[c - d, c - d], [c + d, c + d]];
        break;
      case 3:
        positions = [[c - d, c - d], [c, c], [c + d, c + d]];
        break;
      case 4:
        positions = [
          [c - d, c - d], [c + d, c - d],
          [c - d, c + d], [c + d, c + d],
        ];
        break;
      case 5:
        positions = [
          [c - d, c - d], [c + d, c - d],
          [c, c],
          [c - d, c + d], [c + d, c + d],
        ];
        break;
      case 6:
        positions = [
          [c - d, c - d], [c + d, c - d],
          [c - d, c],     [c + d, c],
          [c - d, c + d], [c + d, c + d],
        ];
        break;
      default:
        positions = [[c, c]];
    }

    // Render physically accurate CONCAVE (sunken hole) illusion:
    positions.forEach(([x, y]) => {
      // 1. Bottom-rim highlight (light reflecting on lower lip of concave hole)
      ctx.beginPath();
      ctx.arc(x, y + 2, dotRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fill();

      // 2. Top-rim cast shadow (upper edge blocking light)
      ctx.beginPath();
      ctx.arc(x, y - 2, dotRadius + 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.fill();

      // 3. Deep concave hole core (dark gradient with shadow at top)
      const holeGrad = ctx.createRadialGradient(x, y - dotRadius * 0.35, dotRadius * 0.1, x, y + dotRadius * 0.1, dotRadius);
      holeGrad.addColorStop(0, '#000000');
      holeGrad.addColorStop(0.65, '#0d0d11');
      holeGrad.addColorStop(1, '#232328');

      ctx.beginPath();
      ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = holeGrad;
      ctx.fill();

      // 4. Inner sharp dark perimeter
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#050505';
      ctx.stroke();
    });
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  diceTextureCache.set(value, texture);
  return texture;
}

const CenterDice3D: React.FC<{
  isRolling: boolean;
  diceResult: number;
}> = ({ isRolling, diceResult }) => {
  const diceRef = useRef<THREE.Group>(null);

  // Create authentic RoundedBoxGeometry with beveled curved corners
  const geometry = useMemo(() => {
    return new RoundedBoxGeometry(0.86, 0.86, 0.86, 4, 0.14);
  }, []);

  const materials = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return [
      new THREE.MeshStandardMaterial({ map: createConcaveDiceTexture(3), roughness: 0.22, metalness: 0.05 }), // +X (3)
      new THREE.MeshStandardMaterial({ map: createConcaveDiceTexture(4), roughness: 0.22, metalness: 0.05 }), // -X (4)
      new THREE.MeshStandardMaterial({ map: createConcaveDiceTexture(1), roughness: 0.22, metalness: 0.05 }), // +Y (1)
      new THREE.MeshStandardMaterial({ map: createConcaveDiceTexture(6), roughness: 0.22, metalness: 0.05 }), // -Y (6)
      new THREE.MeshStandardMaterial({ map: createConcaveDiceTexture(2), roughness: 0.22, metalness: 0.05 }), // +Z (2)
      new THREE.MeshStandardMaterial({ map: createConcaveDiceTexture(5), roughness: 0.22, metalness: 0.05 }), // -Z (5)
    ];
  }, []);

  // Exact flat Euler rotations [rx, ry, rz] to orient each face to the Top (+Y):
  // Face 1 (+Y) -> [0, 0, 0]
  // Face 2 (+Z) -> [-Math.PI / 2, 0, 0]
  // Face 3 (+X) -> [0, 0, Math.PI / 2]
  // Face 4 (-X) -> [0, 0, -Math.PI / 2]
  // Face 5 (-Z) -> [Math.PI / 2, 0, 0]
  // Face 6 (-Y) -> [Math.PI, 0, 0]
  const faceRotations: Record<number, [number, number, number]> = {
    1: [0, 0, 0],
    2: [-Math.PI / 2, 0, 0],
    3: [0, 0, Math.PI / 2],
    4: [0, 0, -Math.PI / 2],
    5: [Math.PI / 2, 0, 0],
    6: [Math.PI, 0, 0],
  };

  const prevRollingRef = useRef(false);
  // When resting, keep the dice slightly offset towards the bottom-right or elevated with a small compact size so the artwork shines through!
  const restingY = 0.42;

  useFrame((_, delta) => {
    if (!diceRef.current) return;

    if (isRolling) {
      prevRollingRef.current = true;
      diceRef.current.rotation.x += delta * 18;
      diceRef.current.rotation.y += delta * 22;
      diceRef.current.rotation.z += delta * 15;
      diceRef.current.position.set(0, 1.35 + Math.abs(Math.sin(Date.now() * 0.015)) * 0.5, 0);
    } else {
      const [tx, ty, tz] = faceRotations[diceResult] || faceRotations[1];
      diceRef.current.rotation.x = tx;
      diceRef.current.rotation.y = ty;
      diceRef.current.rotation.z = tz;
      // Positioned neatly in center with slight elevation above the canvas art
      diceRef.current.position.set(0, restingY, 0);
      prevRollingRef.current = false;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Soft Dice ground contact shadow */}
      <mesh position={[0, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.52, 32]} />
        <meshBasicMaterial color="#0a0301" opacity={0.4} transparent />
      </mesh>

      {/* 3D Rounded Beveled Dice with Inward-Carved Concave Dots */}
      <group ref={diceRef} position={[0, restingY, 0]} scale={[0.88, 0.88, 0.88]}>
        <mesh
          castShadow
          receiveShadow
          geometry={geometry}
          material={materials.length === 6 ? materials : undefined}
        >
          {materials.length !== 6 && (
            <meshStandardMaterial color="#faf7ef" roughness={0.2} metalness={0.05} />
          )}
        </mesh>
      </group>
    </group>
  );
};

export const Board3D: React.FC<Board3DProps> = ({
  tiles,
  positions,
  players,
  highlightTileIndex,
  isRolling,
  diceResult,
  costumes,
  currentTurnPlayerId,
}) => {
  return (
    <div className="w-full h-full relative aspect-square max-w-[min(98vw,80vh,760px)] mx-auto rounded-3xl overflow-hidden wood-panel shadow-[0_20px_50px_rgba(0,0,0,0.95)]">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [0, 8.0, 4.8], fov: 49 }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight
          position={[6, 14, 8]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
        />
        <pointLight position={[0, 4, 0]} intensity={2.2} color="#fef08a" distance={12} />
        <pointLight position={[0, 1.5, 0]} intensity={1.5} color="#fb923c" distance={9} />

        <OrbitControls
          enableZoom={true}
          maxPolarAngle={Math.PI / 2.3}
          minPolarAngle={Math.PI / 7}
          maxDistance={15}
          minDistance={5}
        />

        {/* Outer Wooden Board Frame */}
        <mesh receiveShadow position={[0, -0.2, 0]}>
          <boxGeometry args={[8.6, 0.4, 8.6]} />
          <meshStandardMaterial color="#3a1604" roughness={0.6} metalness={0.15} />
        </mesh>

        {/* Center Felt / Wood Base */}
        <mesh receiveShadow position={[0, -0.05, 0]}>
          <boxGeometry args={[6.1, 0.15, 6.1]} />
          <meshStandardMaterial color="#1f0902" roughness={0.85} />
        </mesh>

        {/* Clean Elegant Gold Concentric Rings (No image, no text) */}
        <group position={[0, 0.04, 0]}>
          {/* Heavy Outer Gold Ring */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.75, 1.86, 64]} />
            <meshStandardMaterial color="#d4af37" metalness={0.92} roughness={0.18} />
          </mesh>

          {/* Middle Fine Gold Ring */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.42, 1.48, 64]} />
            <meshStandardMaterial color="#fef08a" metalness={0.88} roughness={0.22} />
          </mesh>

          {/* Inner Golden Ring */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.05, 1.1, 64]} />
            <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Clean Inner Felt Disc (Smooth, dark mahogany) */}
          <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
            <circleGeometry args={[1.75, 64]} />
            <meshStandardMaterial color="#1b0802" roughness={0.85} metalness={0.1} />
          </mesh>

          {/* Elegant Circular Gold Rune Studs */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((ang, i) => {
            const rad = (ang * Math.PI) / 180;
            return (
              <mesh key={i} position={[Math.cos(rad) * 1.6, 0.015, Math.sin(rad) * 1.6]}>
                <sphereGeometry args={[0.038, 12, 12]} />
                <meshStandardMaterial color="#fcd34d" metalness={0.95} roughness={0.15} />
              </mesh>
            );
          })}
        </group>

        {/* 4 Corner Medieval Tavern Torches with Warm Flickering Glow */}
        {[
          [-4.1, -4.1],
          [4.1, -4.1],
          [-4.1, 4.1],
          [4.1, 4.1],
        ].map(([tx, tz], i) => (
          <group key={`torch-${i}`} position={[tx, 0, tz]}>
            {/* Wooden Torch Pillar Base */}
            <mesh position={[0, 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.22, 0.5, 8]} />
              <meshStandardMaterial color="#2b1104" roughness={0.7} />
            </mesh>
            {/* Brass Brazier Bowl */}
            <mesh position={[0, 0.52, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.12, 0.16, 12]} />
              <meshStandardMaterial color="#b45309" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* Glowing Flame Core */}
            <mesh position={[0, 0.65, 0]}>
              <octahedronGeometry args={[0.12, 0]} />
              <meshStandardMaterial
                color="#f97316"
                emissive="#ea580c"
                emissiveIntensity={1.8}
              />
            </mesh>
            {/* Warm Torch Fire Pointlight */}
            <pointLight
              position={[0, 0.85, 0]}
              color="#fb923c"
              intensity={1.6}
              distance={4.2}
            />
          </group>
        ))}

        {tiles.map((tile, idx) => (
          <Tile3D
            key={tile.tile_index}
            tile={tile}
            index={idx}
            isHighlighted={highlightTileIndex === idx}
            position={getTile3DPosition(idx)}
          />
        ))}

        {players.map((p, idx) => {
          const costumeId = costumes?.[p.id] ?? (idx % 20);
          const isCurrentTurn = p.id === currentTurnPlayerId;
          return (
            <PlayerToken3D
              key={p.id}
              player={p}
              targetTileIndex={positions[p.id] ?? 0}
              playerIndex={idx}
              costumeId={costumeId}
              isCurrentTurn={isCurrentTurn}
            />
          );
        })}

        <CenterDice3D isRolling={isRolling} diceResult={diceResult} />
      </Canvas>
    </div>
  );
};
