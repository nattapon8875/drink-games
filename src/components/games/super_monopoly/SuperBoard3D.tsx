'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { SuperPropertyTile, PropertyOwnership, PlayerRecord } from '@/types/database';
import { SUPER_MONOPOLY_TILES, formatMoneyM } from './superMonopolyData';

interface SuperBoard3DProps {
  positions: Record<string, number>;
  properties: Record<number, PropertyOwnership>;
  players: PlayerRecord[];
  currentTurnPlayerId: string | null;
  onTileClick: (tile: SuperPropertyTile) => void;
}

export const PLAYER_3D_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber Gold
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

// Coordinate mapping for 32 tiles around 9x9 perimeter
export function getSuperTile3DPosition(index: number): [number, number, number] {
  const step = 1.0;
  const half = 4.0;

  if (index >= 0 && index <= 8) {
    // Bottom row (0 -> 8): right to left
    return [half - index * step, 0, half];
  } else if (index >= 8 && index <= 16) {
    // Left col (8 -> 16): bottom to top
    return [-half, 0, half - (index - 8) * step];
  } else if (index >= 16 && index <= 24) {
    // Top row (16 -> 24): left to right
    return [-half + (index - 16) * step, 0, -half];
  } else {
    // Right col (24 -> 31): top to bottom
    return [half, 0, -half + (index - 24) * step];
  }
}

// 3D House Model
const House3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* House Body (White / Cream) */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshStandardMaterial color="#fef9c3" roughness={0.4} />
      </mesh>
      {/* Roof (Vibrant Green) */}
      <mesh position={[0, 0.20, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[0.14, 0.12, 4]} />
        <meshStandardMaterial color="#10b981" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Tiny Chimney */}
      <mesh position={[0.04, 0.22, 0.04]}>
        <boxGeometry args={[0.03, 0.08, 0.03]} />
        <meshStandardMaterial color="#b91c1c" />
      </mesh>
    </group>
  );
};

// 3D Hotel Model (Glorious Red & Gold)
const Hotel3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  return (
    <group position={position}>
      {/* Main Building Base */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.22]} />
        <meshStandardMaterial color="#b91c1c" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Hotel Roof (Golden trim) */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[0.34, 0.06, 0.24]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Windows glow */}
      <mesh position={[0, 0.16, 0.115]}>
        <planeGeometry args={[0.26, 0.22]} />
        <meshBasicMaterial color="#fef08a" />
      </mesh>
    </group>
  );
};

// Procedural Canvas Texture for 3D Tile
const tileTextureCache = new Map<string, THREE.CanvasTexture>();

function createSuperTileTexture(tile: SuperPropertyTile): THREE.CanvasTexture {
  const cacheKey = `${tile.index}_${tile.name}_${tile.color || 'none'}`;
  if (tileTextureCache.has(cacheKey)) {
    return tileTextureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    // 1. Background Ivory / Antique Paper texture
    const isCorner = tile.index % 8 === 0;
    ctx.fillStyle = isCorner ? '#fff2b2' : '#fffae8';
    ctx.fillRect(0, 0, 256, 256);

    // 2. Wood-style border
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#3d1b06';
    ctx.strokeRect(5, 5, 246, 246);

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d4af37';
    ctx.strokeRect(12, 12, 232, 232);

    // 3. Property Color Banner
    if (tile.type === 'property' && tile.color) {
      ctx.fillStyle = tile.color;
      ctx.fillRect(14, 14, 228, 54);

      ctx.lineWidth = 3;
      ctx.strokeStyle = '#270e02';
      ctx.strokeRect(14, 14, 228, 54);
    }

    // 4. Tile Icon
    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(tile.icon || '🏠', 128, tile.type === 'property' ? 120 : 100);

    // 5. Tile Name
    ctx.fillStyle = '#1c0802';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(tile.name, 128, tile.type === 'property' ? 175 : 165);

    // 6. Cost or Subtitle
    if (tile.cost) {
      ctx.fillStyle = '#047857';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(formatMoneyM(tile.cost), 128, 215);
    } else if (tile.type === 'start') {
      ctx.fillStyle = '#b45309';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('+2.0M', 128, 215);
    } else if (tile.type === 'tax') {
      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('จ่าย 1.0M', 128, 215);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  tileTextureCache.set(cacheKey, texture);
  return texture;
}

// 3D Tile Component
const Tile3D: React.FC<{
  tile: SuperPropertyTile;
  ownership: PropertyOwnership | null;
  ownerColor: string | null;
  onClick: () => void;
}> = ({ tile, ownership, ownerColor, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const [x, y, z] = getSuperTile3DPosition(tile.index);
  const isCorner = tile.index % 8 === 0;

  const topTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createSuperTileTexture(tile);
  }, [tile]);

  const tileGeo = useMemo(() => {
    return new RoundedBoxGeometry(0.96, 0.22, 0.96, 2, 0.04);
  }, []);

  const houses = ownership?.houses || 0;
  const hasHotel = houses === 4;

  return (
    <group position={[x, y, z]}>
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
          roughness={0.4}
          metalness={0.1}
          color={hovered ? '#ffffff' : '#f8f4eb'}
          emissive={hovered ? '#fef08a' : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Owner Color Base Pin / Border */}
      {ownerColor && (
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[1.0, 0.12, 1.0]} />
          <meshStandardMaterial color={ownerColor} roughness={0.3} metalness={0.4} />
        </mesh>
      )}

      {/* 3D Houses / Hotel sitting on Tile */}
      {houses > 0 && (
        <group position={[0, 0.11, 0]}>
          {hasHotel ? (
            <Hotel3D position={[0, 0, 0]} />
          ) : (
            <>
              {houses >= 1 && <House3D position={[-0.26, 0, 0]} />}
              {houses >= 2 && <House3D position={[0, 0, 0]} />}
              {houses >= 3 && <House3D position={[0.26, 0, 0]} />}
            </>
          )}
        </group>
      )}
    </group>
  );
};

// 3D Player Token / Pawn
const PlayerToken3D: React.FC<{
  player: PlayerRecord;
  targetTileIndex: number;
  playerIndex: number;
  isCurrentTurn: boolean;
}> = ({ targetTileIndex, playerIndex, isCurrentTurn }) => {
  const meshRef = useRef<THREE.Group>(null);
  const turnBeamRef = useRef<THREE.Group>(null);
  const basePos = getSuperTile3DPosition(targetTileIndex);

  // Offset players so they don't overlap on the same tile
  const totalSlots = 8;
  const slot = playerIndex % totalSlots;
  const radius = 0.22;
  const angle = (slot * Math.PI * 2) / totalSlots;
  const offsetX = Math.cos(angle) * radius;
  const offsetZ = Math.sin(angle) * radius;

  const targetX = basePos[0] + offsetX;
  const targetZ = basePos[2] + offsetZ;
  const color = PLAYER_3D_COLORS[playerIndex % PLAYER_3D_COLORS.length];

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, delta * 12);
    meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, delta * 12);

    const dist = Math.hypot(meshRef.current.position.x - targetX, meshRef.current.position.z - targetZ);
    const hop = dist > 0.06 ? Math.sin(Math.min(dist * 4, Math.PI)) * 0.35 : 0;
    const turnBob = isCurrentTurn ? Math.sin(Date.now() * 0.008) * 0.05 : 0;

    meshRef.current.position.y = 0.35 + hop + turnBob;

    if (turnBeamRef.current) {
      turnBeamRef.current.rotation.y += delta * 2.5;
      turnBeamRef.current.position.y = 0.85 + Math.sin(Date.now() * 0.007) * 0.06;
    }
  });

  return (
    <group ref={meshRef} position={[targetX, 0.35, targetZ]}>
      {/* Turn Indicator Arrow */}
      {isCurrentTurn && (
        <group ref={turnBeamRef} position={[0, 0.85, 0]}>
          <pointLight color="#fde047" intensity={2.0} distance={1.2} />
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.11, 0.22, 4]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}

      {/* Pawn Base */}
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 0.12, 16]} />
        <meshStandardMaterial color="#1e0b02" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Pawn Body */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.14, 0.24, 16]} />
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Pawn Head */}
      <mesh position={[0, 0.40, 0]} castShadow>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#fef08a" roughness={0.2} />
      </mesh>

      {/* Buffalo Horns or Hat */}
      <mesh position={[-0.09, 0.47, 0]} rotation={[0, 0, Math.PI / 4]}>
        <coneGeometry args={[0.035, 0.12, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.6} />
      </mesh>
      <mesh position={[0.09, 0.47, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <coneGeometry args={[0.035, 0.12, 8]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.6} />
      </mesh>
    </group>
  );
};

// 3D Center Deck & Emblem
const CenterDeck3D: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Center Mahogany Board Surface */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[7.0, 0.15, 7.0]} />
        <meshStandardMaterial color="#1f0a02" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Center Gold Trim Ring */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.0, 2.08, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Buffalo Mascot 3D Coin in Center */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.08, 32]} />
        <meshStandardMaterial color="#3d1806" roughness={0.4} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.10, 0]}>
        <cylinderGeometry args={[1.05, 1.05, 0.04, 32]} />
        <meshStandardMaterial color="#f59e0b" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* 3D Chest Cards Deck (Left Center) */}
      <group position={[-1.8, 0.15, -0.8]} rotation={[0, 0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.22, 1.4]} />
          <meshStandardMaterial color="#ec4899" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[1.12, 0.02, 1.42]} />
          <meshStandardMaterial color="#fbcfe8" roughness={0.3} />
        </mesh>
      </group>

      {/* 3D Chance Cards Deck (Right Center) */}
      <group position={[1.8, 0.15, 0.8]} rotation={[0, -0.1, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.1, 0.22, 1.4]} />
          <meshStandardMaterial color="#eab308" roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[1.12, 0.02, 1.42]} />
          <meshStandardMaterial color="#fef08a" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
};

export const SuperBoard3D: React.FC<SuperBoard3DProps> = ({
  positions,
  properties,
  players,
  currentTurnPlayerId,
  onTileClick,
}) => {
  return (
    <div className="w-full h-full min-h-[460px] sm:min-h-[560px] lg:min-h-[640px] aspect-square rounded-2xl overflow-hidden shadow-2xl relative bg-[#0a0301] border-2 border-[#471904]">
      <Canvas
        shadows
        camera={{ position: [0, 9.2, 7.8], fov: 48 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#0c0401']} />

        {/* Ambient & Directional Warm Tavern Lighting */}
        <ambientLight intensity={0.8} color="#fff1e6" />
        <directionalLight
          position={[6, 14, 8]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          color="#fffdf5"
        />
        <pointLight position={[0, 4, 0]} intensity={1.2} color="#fef08a" distance={10} />

        {/* Orbit Camera Controls (Smooth and constrained) */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={6}
          maxDistance={15}
          maxPolarAngle={Math.PI / 2.15}
          minPolarAngle={Math.PI / 6}
        />

        {/* Center Board & Emblem */}
        <CenterDeck3D />

        {/* 32 Tiles around board */}
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
              onClick={() => onTileClick(tile)}
            />
          );
        })}

        {/* 3D Animated Player Pawns */}
        {players.map((p, idx) => {
          const targetIndex = positions[p.id] ?? 0;
          const isTurn = p.id === currentTurnPlayerId;

          return (
            <PlayerToken3D
              key={p.id}
              player={p}
              targetTileIndex={targetIndex}
              playerIndex={idx}
              isCurrentTurn={isTurn}
            />
          );
        })}
      </Canvas>

      {/* Overlay Hint */}
      <div className="absolute bottom-2 left-2 pointer-events-none px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur border border-amber-500/30 text-[10px] text-amber-200/80 font-bold">
        🖱️ คลิกซ้ายลากเพื่อหมุนกระดาน 3D • เลื่อนลูกกลิ้งเพื่อซูม
      </div>
    </div>
  );
};
