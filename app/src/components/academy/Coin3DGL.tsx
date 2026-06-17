"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { GLYPHS, type Tier, type GlyphKey } from "@/components/academy/Emblem";

const METAL: Record<Tier, { color: string; rough: number; rim: string; rimDark: string; glyph: string }> = {
  bronce: { color: "#b87333", rough: 0.34, rim: "#e6ab78", rimDark: "#6e4420", glyph: "#f2c79e" },
  plata: { color: "#c7ced6", rough: 0.22, rim: "#f3f7fb", rimDark: "#7b8694", glyph: "#ffffff" },
  oro: { color: "#d4af37", rough: 0.24, rim: "#ffe9a8", rimDark: "#8a6508", glyph: "#fff3c0" },
  platino: { color: "#e2eaf2", rough: 0.14, rim: "#ffffff", rimDark: "#9fb1c2", glyph: "#ffffff" },
};

function makeFaceTexture(tier: Tier, glyphD: string, back: boolean): THREE.CanvasTexture {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  const m = METAL[tier];

  // Aro metálico
  const rim = x.createRadialGradient(S * 0.4, S * 0.34, S * 0.08, S / 2, S / 2, S / 2);
  rim.addColorStop(0, m.rim); rim.addColorStop(0.6, m.color); rim.addColorStop(1, m.rimDark);
  x.fillStyle = rim; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, Math.PI * 2); x.fill();

  // Cara oscura
  const face = x.createRadialGradient(S * 0.4, S * 0.32, S * 0.1, S / 2, S / 2, S * 0.42);
  face.addColorStop(0, "#2b313a"); face.addColorStop(0.5, "#141a21"); face.addColorStop(1, "#070b10");
  x.fillStyle = face; x.beginPath(); x.arc(S / 2, S / 2, S * 0.4, 0, Math.PI * 2); x.fill();

  // Glifo grabado
  const scale = (S * 0.46) / 24;
  x.save();
  x.translate(S / 2 - 12 * scale, S / 2 - 12 * scale);
  x.scale(scale, scale);
  x.lineWidth = 1.7; x.strokeStyle = m.glyph; x.lineJoin = "round"; x.lineCap = "round";
  x.shadowColor = "rgba(0,0,0,0.55)"; x.shadowBlur = 0; x.shadowOffsetY = 0.6;
  try { x.stroke(new Path2D(back ? "M7 6h10l-9.5 12H17" : glyphD)); } catch { /* noop */ }
  x.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Coin({ tier, glyph }: { tier: Tier; glyph: GlyphKey }) {
  const spin = useRef<THREE.Group>(null);
  const m = METAL[tier];
  const front = useMemo(() => makeFaceTexture(tier, GLYPHS[glyph], false), [tier, glyph]);
  const back = useMemo(() => makeFaceTexture(tier, GLYPHS[glyph], true), [tier]);
  useFrame((_, d) => { if (spin.current) spin.current.rotation.y += d * 0.7; });
  return (
    <group ref={spin} rotation={[-0.16, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 1, 0.14, 180]} />
        <meshPhysicalMaterial attach="material-0" color={m.color} metalness={1} roughness={m.rough} envMapIntensity={2.2} clearcoat={0.4} clearcoatRoughness={0.3} />
        <meshStandardMaterial attach="material-1" map={front} metalness={0.85} roughness={0.42} envMapIntensity={1.3} />
        <meshStandardMaterial attach="material-2" map={back} metalness={0.85} roughness={0.42} envMapIntensity={1.3} />
      </mesh>
    </group>
  );
}

export function Coin3DGL({ tier, glyph, size = 220 }: { tier: Tier; glyph: GlyphKey; size?: number }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 32 }} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 5]} intensity={1.3} />
        <directionalLight position={[-4, -2, 2]} intensity={0.5} color="#bcd3ff" />
        <Coin tier={tier} glyph={glyph} />
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[2, 3, 3]} scale={[5, 5, 1]} />
          <Lightformer form="rect" intensity={1.4} position={[-3, 1, 3]} scale={[4, 4, 1]} color="#cfe0ff" />
          <Lightformer form="ring" intensity={2.4} position={[0, -1, 5]} scale={3.5} />
        </Environment>
      </Canvas>
    </div>
  );
}
