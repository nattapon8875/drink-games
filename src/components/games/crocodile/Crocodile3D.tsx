'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PlayerRecord } from '@/types/database';
import { generateCrocodileTeeth, ToothInfo } from './crocodileData';

interface Crocodile3DProps {
  players: PlayerRecord[];
  totalTeeth?: number;
  currentTurnPlayerId?: string | null;
  pressedTeeth: number[];
  isBitten: boolean;
  onToothClick?: (index: number) => void;
  canInteract: boolean;
}

// 3D Individual Tooth: Stays clearly visible when pressed down into the gum pocket
function Tooth3D({
  tooth,
  isPressed,
  isBitten,
  onClick,
  canClick,
}: {
  tooth: ToothInfo;
  isPressed: boolean;
  isBitten: boolean;
  onClick: (idx: number) => void;
  canClick: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = React.useState(false);

  // Position along the front rim of the lower jaw
  const rad = (tooth.angleDeg * Math.PI) / 180;
  const radiusX = 1.05;
  const radiusZ = 0.95;
  const posX = Math.sin(rad) * radiusX;
  const posZ = Math.cos(rad) * radiusZ + 0.15;

  // Target Y position:
  // Normal unpressed: height 0.08 (stands tall above the gum)
  // Pressed down: height -0.04 (sunken down halfway into the pocket, clearly still visible as pressed!)
  const targetY = isPressed ? -0.04 : 0.08;

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.position.y = THREE.MathUtils.lerp(
      meshRef.current.position.y,
      targetY,
      0.25
    );
  });

  const toothColor = useMemo(() => {
    if (isPressed) return '#cbd5e1'; // Greyed sunken plastic look
    if (hovered && canClick && !isBitten) return '#fef08a';
    return '#ffffff';
  }, [isPressed, hovered, canClick, isBitten]);

  return (
    <group position={[posX, 0.25, posZ]} rotation={[0, rad * 0.8, 0]}>
      {/* Gum Socket Hole (Dark pocket indentation) */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.07, 0.11, 16]} />
        <meshBasicMaterial color="#7f1d1d" side={THREE.DoubleSide} />
      </mesh>

      {/* Tooth Geometry */}
      <mesh
        ref={meshRef}
        position={[0, targetY, 0]}
        castShadow
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          if (canClick && !isPressed && !isBitten) {
            onClick(tooth.index);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (canClick && !isPressed && !isBitten) {
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {/* Rounded-top toy tooth shape */}
        <cylinderGeometry args={[0.07, 0.1, 0.22, 16]} />
        <meshStandardMaterial
          color={toothColor}
          roughness={isPressed ? 0.5 : 0.2}
          metalness={0.05}
          emissive={hovered && canClick && !isBitten ? '#eab308' : '#000000'}
          emissiveIntensity={hovered && canClick && !isBitten ? 0.4 : 0}
        />
      </mesh>

      {/* Number on gum */}
      <Text
        position={[0, 0.01, 0.16]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.085}
        color={isPressed ? '#94a3b8' : '#f8fafc'}
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
      >
        {tooth.label}
      </Text>
    </group>
  );
}

// Smooth Curved Water Buffalo Horn using CatmullRomCurve3 TubeGeometry
function BuffaloHorn({ isLeft }: { isLeft: boolean }) {
  const hornCurve = useMemo(() => {
    const s = isLeft ? -1 : 1;
    // Points sweeping outward, curving backward and curving back in at the sharp tip
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(s * 0.45, 0.1, 0.05),   // base at forehead
      new THREE.Vector3(s * 0.85, 0.25, -0.05), // sweeping wide out
      new THREE.Vector3(s * 1.25, 0.55, -0.15), // outer curve peak
      new THREE.Vector3(s * 1.15, 0.95, -0.1),  // curving up
      new THREE.Vector3(s * 0.85, 1.25, 0.05),  // tip pointing inward/upward
    ]);
  }, [isLeft]);

  return (
    <group>
      {/* Smooth Dark Buffalo Horn Tube */}
      <mesh castShadow>
        <tubeGeometry args={[hornCurve, 32, 0.14, 16, false]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.25} />
      </mesh>
      {/* Sharp Tapered Tip */}
      <mesh
        position={[isLeft ? -0.82 : 0.82, 1.28, 0.06]}
        rotation={[-0.2, 0, isLeft ? -0.7 : 0.7]}
        castShadow
      >
        <coneGeometry args={[0.09, 0.28, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* Golden Band Accent */}
      <mesh position={[isLeft ? -0.85 : 0.85, 0.25, -0.05]}>
        <torusGeometry args={[0.15, 0.03, 12, 24]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
      </mesh>
    </group>
  );
}

// 3D Buffy Water Buffalo Toy Model (matching tavern buffalo mascot)
function CrocodileModel({
  totalTeeth,
  pressedTeeth,
  isBitten,
  onToothClick,
  canInteract,
}: {
  totalTeeth: number;
  pressedTeeth: number[];
  isBitten: boolean;
  onToothClick?: (index: number) => void;
  canInteract: boolean;
}) {
  const upperJawRef = useRef<THREE.Group>(null);
  const teethList = useMemo(() => generateCrocodileTeeth(totalTeeth), [totalTeeth]);

  // Upper Jaw Angle around hinge:
  // When OPEN: -0.75 rad (~43 deg open mouth)
  // When BITTEN (closed): -0.20 rad (closed flush onto teeth without clipping backward)
  const targetJawAngle = isBitten ? -0.20 : -0.75;

  useFrame(() => {
    if (!upperJawRef.current) return;
    const lerpSpeed = isBitten ? 0.45 : 0.08;
    upperJawRef.current.rotation.x = THREE.MathUtils.lerp(
      upperJawRef.current.rotation.x,
      targetJawAngle,
      lerpSpeed
    );
  });

  return (
    <group position={[0, -0.3, -0.1]}>
      {/* ================= LOWER JAW / BODY TRAY ================= */}
      <group position={[0, 0, 0]}>
        {/* Main Lower Body Tray (Warm Buffalo Charcoal/Slate Tub) */}
        <group position={[0, 0, 0.2]} scale={[1.1, 1, 1.25]}>
          {/* Base Buffalo Charcoal Lower Jaw */}
          <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[1.3, 1.4, 0.45, 32]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.05} />
          </mesh>

          {/* Underjaw Trim */}
          <mesh position={[0, 0.22, 0.05]}>
            <cylinderGeometry args={[1.2, 1.25, 0.08, 32]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>

          {/* Interior Mouth Cavity (horizontal floor) */}
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[1.15, 1.15, 0.05, 32]} />
            <meshStandardMaterial color="#1e293b" roughness={0.8} />
          </mesh>
        </group>

        {/* Buffalo Cute Front Hooves on Sides */}
        <group position={[-1.4, 0.05, 0.0]} rotation={[0, 0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.35, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.15, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
        </group>
        <group position={[1.4, 0.05, 0.0]} rotation={[0, -0.25, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.22, 0.25, 0.35, 16]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh position={[0, -0.12, 0]}>
            <cylinderGeometry args={[0.24, 0.26, 0.15, 16]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} />
          </mesh>
        </group>

        {/* Deep Sunken Throat Pit */}
        <mesh position={[0, 0.22, -0.2]}>
          <cylinderGeometry args={[0.55, 0.45, 0.05, 24]} />
          <meshStandardMaterial color="#0f172a" roughness={0.9} />
        </mesh>

        {/* Cute Small Red Tongue - Visible clearly when mouth is open, rests flat inside */}
        <group position={[0, 0.23, 0.12]} scale={[1, 0.35, 1.3]}>
          <mesh castShadow>
            <sphereGeometry args={[0.26, 24, 16]} />
            <meshStandardMaterial color="#e11d48" roughness={0.3} metalness={0.05} />
          </mesh>
          {/* Subtle tongue center crease */}
          <mesh position={[0, 0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.35, 8]} />
            <meshBasicMaterial color="#be123c" />
          </mesh>
        </group>

        {/* Interactive Teeth along Lower Rim */}
        <group scale={[1.1, 1, 1.25]}>
          {teethList.map((tooth) => (
            <Tooth3D
              key={tooth.index}
              tooth={tooth}
              isPressed={pressedTeeth.includes(tooth.index)}
              isBitten={isBitten}
              onClick={(idx) => onToothClick && onToothClick(idx)}
              canClick={canInteract}
            />
          ))}
        </group>
      </group>

      {/* ================= UPPER JAW / BUFFALO HEAD (HINGED AT BACK Z = -0.7) ================= */}
      <group ref={upperJawRef} position={[0, 0.28, -0.7]} rotation={[targetJawAngle, 0, 0]}>
        <group position={[0, 0, 1.1]}>
          {/* Buffalo Cranial Skull Box & Face */}
          <group position={[0, 0.35, 0.1]}>
            {/* Buffalo Skull / Main Head */}
            <mesh position={[0, 0.05, 0]} castShadow>
              <boxGeometry args={[1.7, 0.55, 1.2]} />
              <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.05} />
            </mesh>

            {/* Forehead Crown Plateau */}
            <mesh position={[0, 0.32, 0.05]} castShadow>
              <boxGeometry args={[1.5, 0.18, 0.9]} />
              <meshStandardMaterial color="#1e293b" roughness={0.6} />
            </mesh>

            {/* Buffalo Snout / Muzzle (Natural warm camel/mocha muzzle) */}
            <mesh position={[0, -0.04, 0.68]} castShadow>
              <boxGeometry args={[1.3, 0.38, 0.55]} />
              <meshStandardMaterial color="#945832" roughness={0.6} />
            </mesh>
            <mesh position={[0, -0.04, 0.92]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.25, 0.25, 1.25, 16]} />
              <meshStandardMaterial color="#78350f" roughness={0.6} />
            </mesh>

            {/* Nostril Cavities */}
            <mesh position={[-0.32, -0.02, 0.98]} rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
              <meshBasicMaterial color="#1a0602" />
            </mesh>
            <mesh position={[0.32, -0.02, 0.98]} rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.06, 16]} />
              <meshBasicMaterial color="#1a0602" />
            </mesh>

            {/* Iconic Golden Buffalo Nose Ring! 🐃💍 */}
            <mesh position={[0, -0.16, 0.95]} rotation={[0.3, 0, 0]} castShadow>
              <torusGeometry args={[0.18, 0.038, 16, 32]} />
              <meshStandardMaterial color="#fbbf24" metalness={0.85} roughness={0.2} />
            </mesh>


          </group>

          {/* ================= SMOOTH WATER BUFFALO HORNS (เขาควายไทยแท้ ทรงโค้งตวัดกว้าง) ================= */}
          <group position={[0, 0.65, 0.15]}>
            <BuffaloHorn isLeft={true} />
            <BuffaloHorn isLeft={false} />
          </group>

          {/* ================= BUFFALO EARS ================= */}
          {/* Left Ear below horn */}
          <group position={[-1.0, 0.45, 0.05]} rotation={[0.2, -0.3, -0.45]} castShadow>
            <mesh>
              <cylinderGeometry args={[0.15, 0.05, 0.5, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.03]} scale={[0.75, 0.75, 0.5]}>
              <cylinderGeometry args={[0.11, 0.04, 0.4, 16]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.6} />
            </mesh>
          </group>

          {/* Right Ear below horn */}
          <group position={[1.0, 0.45, 0.05]} rotation={[0.2, 0.3, 0.45]} castShadow>
            <mesh>
              <cylinderGeometry args={[0.15, 0.05, 0.5, 16]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0, 0.03]} scale={[0.75, 0.75, 0.5]}>
              <cylinderGeometry args={[0.11, 0.04, 0.4, 16]} />
              <meshStandardMaterial color="#fed7aa" roughness={0.6} />
            </mesh>
          </group>

          {/* Cute Curly Hair Tuft on Forehead */}
          <group position={[0, 0.78, 0.25]}>
            <mesh castShadow>
              <sphereGeometry args={[0.16, 16, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>
            <mesh position={[-0.1, 0.03, 0.05]} castShadow>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>
            <mesh position={[0.1, 0.03, 0.05]} castShadow>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} />
            </mesh>
          </group>

          {/* ================= BIG EXPRESSIVE CARTOON EYES ================= */}
          {/* Left Eye */}
          <group position={[-0.48, 0.58, 0.48]} rotation={[-0.1, -0.15, 0]}>
            {/* White Eyeball */}
            <mesh castShadow>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
            {/* Black Rim */}
            <mesh position={[0, 0, -0.02]} scale={[1.08, 1.08, 1.08]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
            {/* Big Expressive Pupil looking forward */}
            <mesh position={[0.02, 0, 0.17]} scale={[0.85, 1.1, 0.4]}>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial color={isBitten ? '#dc2626' : '#0f172a'} />
            </mesh>
            {/* Sparkle catchlight reflections */}
            <mesh position={[-0.03, 0.05, 0.22]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.03, -0.04, 0.21]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>

          {/* Right Eye */}
          <group position={[0.48, 0.58, 0.48]} rotation={[-0.1, 0.15, 0]}>
            {/* White Eyeball */}
            <mesh castShadow>
              <sphereGeometry args={[0.22, 24, 24]} />
              <meshStandardMaterial color="#ffffff" roughness={0.1} />
            </mesh>
            {/* Black Rim */}
            <mesh position={[0, 0, -0.02]} scale={[1.08, 1.08, 1.08]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.5} />
            </mesh>
            {/* Big Expressive Pupil looking forward */}
            <mesh position={[-0.02, 0, 0.17]} scale={[0.85, 1.1, 0.4]}>
              <sphereGeometry args={[0.11, 16, 16]} />
              <meshBasicMaterial color={isBitten ? '#dc2626' : '#0f172a'} />
            </mesh>
            {/* Sparkle catchlight reflections */}
            <mesh position={[-0.05, 0.05, 0.22]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh position={[0.01, -0.04, 0.21]}>
              <sphereGeometry args={[0.02, 8, 8]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

export const Crocodile3D: React.FC<Crocodile3DProps> = ({
  players,
  totalTeeth = 10,
  currentTurnPlayerId,
  pressedTeeth,
  isBitten,
  onToothClick,
  canInteract,
}) => {
  const controlsRef = useRef<any>(null);

  const handleZoomIn = () => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    if (!camera) return;
    // Move camera 20% closer towards target
    camera.position.lerp(controlsRef.current.target, 0.2);
    controlsRef.current.update();
  };

  const handleZoomOut = () => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    if (!camera) return;
    // Move camera back away from target
    const dir = new THREE.Vector3().subVectors(camera.position, controlsRef.current.target).normalize();
    camera.position.addScaledVector(dir, 0.8);
    controlsRef.current.update();
  };

  const handleResetCamera = () => {
    if (!controlsRef.current) return;
    const camera = controlsRef.current.object;
    if (!camera) return;
    camera.position.set(0, 2.8, 3.8);
    controlsRef.current.target.set(0, 0.2, 0);
    controlsRef.current.update();
  };

  return (
    <div className="relative w-full aspect-[9/10] max-w-[480px] mx-auto rounded-3xl overflow-hidden border-2 border-amber-900/60 shadow-2xl bg-gradient-to-b from-[#1c0a02] via-[#240e04] to-[#120501] select-none">
      <Canvas
        camera={{ position: [0, 2.8, 3.8], fov: 40 }}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Lights */}
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[3, 9, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[0, 3, 1]} intensity={0.8} color="#fef08a" />
        <pointLight position={[0, 1, 3]} intensity={0.5} color="#4ade80" />

        {/* Tavern Wood Plank Table Floor */}
        <mesh position={[0, -0.55, 0]} receiveShadow>
          <cylinderGeometry args={[5.2, 5.2, 0.3, 48]} />
          <meshStandardMaterial color="#3b1d0e" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.39, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <ringGeometry args={[1.6, 5.0, 48]} />
          <meshStandardMaterial color="#4a2512" roughness={0.6} side={THREE.DoubleSide} />
        </mesh>

        {/* Crocodile Head Model */}
        <CrocodileModel
          totalTeeth={totalTeeth}
          pressedTeeth={pressedTeeth}
          isBitten={isBitten}
          onToothClick={onToothClick}
          canInteract={canInteract}
        />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          enableZoom={true}
          minDistance={2.2}
          maxDistance={7.5}
          minPolarAngle={Math.PI / 7}
          maxPolarAngle={Math.PI / 2.2}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>

      {/* Floating Zoom & Camera Control Buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-20">
        <button
          type="button"
          onClick={handleZoomIn}
          title="ซูมเข้า (+)"
          className="w-8 h-8 rounded-xl bg-black/70 hover:bg-black/90 active:scale-90 border border-amber-600/50 text-amber-300 flex items-center justify-center text-base font-black shadow-lg backdrop-blur-sm transition"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          title="ซูมออก (-)"
          className="w-8 h-8 rounded-xl bg-black/70 hover:bg-black/90 active:scale-90 border border-amber-600/50 text-amber-300 flex items-center justify-center text-base font-black shadow-lg backdrop-blur-sm transition"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleResetCamera}
          title="รีเซ็ตมุมกล้อง"
          className="w-8 h-8 rounded-xl bg-black/70 hover:bg-black/90 active:scale-90 border border-amber-600/50 text-amber-300 flex items-center justify-center text-[10px] font-black shadow-lg backdrop-blur-sm transition"
        >
          ↺
        </button>
      </div>

      {/* Control Instruction Overlay */}
      <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none">
        <span className="text-[11px] font-black text-amber-200/90 bg-black/60 px-3.5 py-1 rounded-full border border-amber-600/40 backdrop-blur-sm shadow">
          {isBitten
            ? '💥 น้องควายงับมือแล้ว! แตะเริ่มรอบใหม่'
            : canInteract
            ? '👆 แตะที่ซี่ฟันน้องควายเพื่อเสี่ยงดวง! (ซูม/หมุนดูได้)'
            : '⏳ กำลังรอผู้เล่นกดฟัน... (ซูม/หมุนดูได้)'}
        </span>
      </div>
    </div>
  );
};
