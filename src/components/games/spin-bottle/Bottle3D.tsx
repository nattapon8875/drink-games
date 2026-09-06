'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerRecord } from '@/types/database';
import { PLAYER_COLORS, createFunnyFaceTexture } from '../monopoly/Board3D';

interface Bottle3DProps {
  players: PlayerRecord[];
  rotationAngle: number;
  isSpinning: boolean;
  selectedPlayerId: string | null;
  onSpinClick?: () => void;
  canSpin: boolean;
  costumes?: Record<string, number>;
  currentTurnPlayerId?: string | null;
}

// 3D Glass Bottle Component
function GlassBottle({
  rotationAngle,
  isSpinning,
}: {
  rotationAngle: number;
  isSpinning: boolean;
}) {
  const bottleRef = useRef<THREE.Group>(null);
  
  // Looking from top (+Y):
  // Player 0 is at (x=0, z=-radius) which is rotation 0 (angleRad = -PI/2 in PlayerPodium).
  // In 2D CSS rotate: clockwise rotation increases angle in degrees (+).
  // In Three.js: positive rotation around Y is counter-clockwise (Right-Hand Rule: thumb pointing up +Y).
  // Therefore, clockwise rotation around Y is NEGATIVE angle.
  const targetRad = -(rotationAngle * Math.PI) / 180;

  // Animation state references
  const startRadRef = useRef<number>(0);
  const endRadRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef<boolean>(false);
  const animDurationRef = useRef<number>(3200);

  // When rotationAngle or isSpinning changes, trigger animation
  React.useEffect(() => {
    if (!bottleRef.current) return;

    startRadRef.current = bottleRef.current.rotation.y;
    endRadRef.current = targetRad;
    startTimeRef.current = performance.now();
    animDurationRef.current = isSpinning ? 3200 : 400;
    isAnimatingRef.current = true;
  }, [rotationAngle, isSpinning, targetRad]);

  useFrame(() => {
    if (!bottleRef.current) return;

    if (isAnimatingRef.current) {
      const now = performance.now();
      const elapsed = Math.min(now - startTimeRef.current, animDurationRef.current);
      const progress = animDurationRef.current > 0 ? elapsed / animDurationRef.current : 1;

      // Ease out cubic (or matching CSS cubic-bezier(0.2, 0.7, 0.25, 1))
      // progress ease out: 1 - Math.pow(1 - progress, 3.2)
      const easeProgress = 1 - Math.pow(1 - progress, 3.2);

      bottleRef.current.rotation.y =
        startRadRef.current + (endRadRef.current - startRadRef.current) * easeProgress;

      if (progress >= 1) {
        isAnimatingRef.current = false;
        bottleRef.current.rotation.y = endRadRef.current;
      }
    }
  });

  // Bottle geometry & materials
  const bottleMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#064e3b', // Deep emerald green
        roughness: 0.1,
        metalness: 0.1,
        transmission: 0.75, // Glass transparency
        ior: 1.5,
        thickness: 0.6,
        specularIntensity: 1,
        specularColor: new THREE.Color('#ffffff'),
      }),
    []
  );

  const goldCapMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f59e0b',
        metalness: 0.85,
        roughness: 0.25,
      }),
    []
  );

  const labelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fef3c7',
        roughness: 0.6,
      }),
    []
  );

  return (
    <group ref={bottleRef} position={[0, 0.4, 0]}>
      {/* Bottle lays flat on the table, pointing towards -Z (North/Top) when rotation is 0 */}
      {/* Rotate by -Math.PI / 2 around X so that the neck (+Y) tilts into -Z */}
      <group rotation={[-Math.PI / 2, 0, 0]}>
        {/* Main Lower Bottle Body */}
        <mesh position={[0, -0.6, 0]} material={bottleMaterial} castShadow>
          <cylinderGeometry args={[0.42, 0.44, 1.4, 32]} />
        </mesh>

        {/* Paper Label around bottle */}
        <mesh position={[0, -0.6, 0]} rotation={[0, Math.PI * 0.75, 0]} material={labelMaterial}>
          <cylinderGeometry args={[0.445, 0.445, 0.75, 32, 1, true, 0, Math.PI * 1.5]} />
        </mesh>

        {/* Bottle Shoulder (Cone taper) */}
        <mesh position={[0, 0.4, 0]} material={bottleMaterial} castShadow>
          <cylinderGeometry args={[0.18, 0.42, 0.6, 32]} />
        </mesh>

        {/* Bottle Neck */}
        <mesh position={[0, 1.0, 0]} material={bottleMaterial} castShadow>
          <cylinderGeometry args={[0.16, 0.18, 0.7, 32]} />
        </mesh>

        {/* Bottle Lip & Gold Cap */}
        <mesh position={[0, 1.4, 0]} material={goldCapMaterial} castShadow>
          <cylinderGeometry args={[0.18, 0.18, 0.15, 32]} />
        </mesh>

        {/* Bottle Base indentation */}
        <mesh position={[0, -1.32, 0]} material={bottleMaterial}>
          <cylinderGeometry args={[0.44, 0.38, 0.1, 32]} />
        </mesh>
      </group>

      {/* Target Arrow / Marker floating at tip of bottle */}
      <group position={[0, 0.8, -1.6]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 0.35, 16]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        <pointLight color="#f59e0b" intensity={2} distance={3} />
      </group>
    </group>
  );
}

// 3D Player Podium around the Table with Chibi Character & Anime Costumes
function PlayerPodium({
  player,
  index,
  total,
  isSelected,
  costumeId,
  isCurrentTurn,
}: {
  player: PlayerRecord;
  index: number;
  total: number;
  isSelected: boolean;
  costumeId: number;
  isCurrentTurn: boolean;
}) {
  const angleDeg = (index / total) * 360;
  // Position around circle radius 3.6
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  const radius = 3.6;
  const x = radius * Math.cos(angleRad);
  const z = radius * Math.sin(angleRad);

  const color = PLAYER_COLORS[costumeId % PLAYER_COLORS.length];

  // In 3D podium, rotate character to face inwards toward table center (0,0)
  // angle around Y: -angleRad - Math.PI / 2
  const lookAtCenterRotY = -angleRad - Math.PI / 2;

  const faceTexture = useMemo(() => {
    if (typeof window === 'undefined') return null;
    return createFunnyFaceTexture(costumeId);
  }, [costumeId]);

  return (
    <group position={[x, 0, z]}>
      {/* Pedestal Base */}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[0.55, 0.62, 0.2, 24]} />
        <meshStandardMaterial
          color={isSelected ? '#fbbf24' : '#292524'}
          roughness={0.4}
          metalness={isSelected ? 0.7 : 0.2}
          emissive={isSelected ? '#d97706' : '#000000'}
          emissiveIntensity={isSelected ? 0.4 : 0}
        />
      </mesh>

      {/* Highlighting Column Beam when selected by bottle */}
      {isSelected && (
        <group position={[0, 1.4, 0]}>
          <mesh>
            <cylinderGeometry args={[0.6, 0.6, 2.6, 24, 1, true]} />
            <meshBasicMaterial
              color="#f59e0b"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight color="#fbbf24" intensity={4} distance={5} />
        </group>
      )}

      {/* 👑 Floating Turn Pointer Indicator if it's this player's turn to spin */}
      {isCurrentTurn && (
        <group position={[0, 1.75, 0]}>
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
          <pointLight color="#fde047" intensity={2.0} distance={2.5} />
        </group>
      )}

      {/* 3D Chibi Anime Character facing inwards */}
      <group position={[0, 0.2, 0]} rotation={[0, lookAtCenterRotY, 0]} scale={[1.15, 1.15, 1.15]}>
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

      {/* Name Text Floating Above Head */}
      <Text
        position={[0, 1.25, 0]}
        fontSize={0.28}
        color={isSelected ? '#fbbf24' : '#ffffff'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.035}
        outlineColor="#000000"
      >
        {player.display_name}
      </Text>

      {/* Drinks Badge */}
      {player.drinks_count > 0 && (
        <Text
          position={[0, 1.0, 0]}
          fontSize={0.22}
          color="#f43f5e"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.025}
          outlineColor="#000000"
        >
          {`🍺 ${player.drinks_count}`}
        </Text>
      )}
    </group>
  );
}

// 3D Circular Tavern Table
function TavernTable() {
  return (
    <group position={[0, -0.2, 0]}>
      {/* Table Top (Circular Wood Platter) */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[2.7, 2.7, 0.3, 48]} />
        <meshStandardMaterial
          color="#451a03" // Rich wood mahogany
          roughness={0.7}
          metalness={0.1}
        />
      </mesh>

      {/* Gold Ring Trim */}
      <mesh position={[0, 0.16, 0]}>
        <ringGeometry args={[2.5, 2.65, 48]} />
        <meshStandardMaterial
          color="#d97706"
          roughness={0.3}
          metalness={0.8}
        />
      </mesh>

      {/* Inner Inlay Ring */}
      <mesh position={[0, 0.16, 0]}>
        <ringGeometry args={[0.9, 0.95, 48]} />
        <meshStandardMaterial
          color="#b45309"
          roughness={0.4}
          metalness={0.6}
        />
      </mesh>

      {/* Center Coaster */}
      <mesh position={[0, 0.16, 0]}>
        <circleGeometry args={[0.8, 36]} />
        <meshStandardMaterial
          color="#1c1917"
          roughness={0.8}
        />
      </mesh>

      {/* Table Pillar */}
      <mesh position={[0, -1.2, 0]}>
        <cylinderGeometry args={[0.7, 1.1, 2.2, 32]} />
        <meshStandardMaterial
          color="#292524"
          roughness={0.8}
        />
      </mesh>

      {/* Stone Tavern Floor */}
      <mesh position={[0, -2.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshStandardMaterial
          color="#140f0c"
          roughness={0.9}
        />
      </mesh>
    </group>
  );
}

export const Bottle3D: React.FC<Bottle3DProps> = ({
  players,
  rotationAngle,
  isSpinning,
  selectedPlayerId,
  onSpinClick,
  canSpin,
  costumes,
  currentTurnPlayerId,
}) => {
  return (
    <div className="relative w-full h-[460px] md:h-[540px] rounded-3xl overflow-hidden bg-[#0c0806] border border-amber-900/40 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
      <Canvas
        shadows
        camera={{ position: [0, 5.5, 4.5], fov: 48 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[5, 9, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-4, 4, -4]} intensity={0.8} color="#f59e0b" />
        <pointLight position={[0, 2, 0]} intensity={0.5} color="#fbbf24" />

        {/* Tavern Table */}
        <TavernTable />

        {/* Rotating 3D Bottle */}
        <GlassBottle rotationAngle={rotationAngle} isSpinning={isSpinning} />

        {/* Players distributed around circle with 3D Anime Characters */}
        {players.map((player, idx) => {
          const costumeId = costumes?.[player.id] ?? (idx % 20);
          const isCurrentTurn = player.id === currentTurnPlayerId;
          return (
            <PlayerPodium
              key={player.id}
              player={player}
              index={idx}
              total={Math.max(players.length, 1)}
              isSelected={player.id === selectedPlayerId}
              costumeId={costumeId}
              isCurrentTurn={isCurrentTurn}
            />
          );
        })}

        <OrbitControls
          enableZoom={true}
          maxDistance={10}
          minDistance={3.5}
          maxPolarAngle={Math.PI / 2.1}
          minPolarAngle={Math.PI / 6}
          target={[0, 0.4, 0]}
        />
      </Canvas>

      {/* Floating Spin Button in 3D scene */}
      {canSpin && !isSpinning && onSpinClick && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={onSpinClick}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-black text-sm md:text-base tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.7)] border border-amber-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 animate-bounce"
          >
            <span>🍾</span>
            <span>หมุนขวดเลย!</span>
          </button>
        </div>
      )}
    </div>
  );
};
