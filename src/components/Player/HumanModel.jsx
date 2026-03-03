import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/gameStore'

// ── Color palette ──
const SKIN = '#e8c090'
const SKIN_SHADOW = '#c4956a'
const HAIR = '#d4a017'
const HAIR_DARK = '#b8880f'
const EYE_BLUE = '#00ccff'
const EYE_PUPIL = '#003344'
const EYEBROW = '#a07010'
const MOUTH = '#9a6050'
const SHIRT = '#3b2d6b'
const SHIRT_DARK = '#2a1e4e'
const SHIRT_ACCENT = '#5040a0'
const COLLAR = '#2a2255'
const BELT = '#6b4226'
const BELT_DARK = '#4a2d18'
const BUCKLE = '#c0a040'
const SUSPENDER = '#3a3a3a'
const PANTS = '#2a2244'
const PANTS_DARK = '#1e1835'
const BOOTS = '#5c3a1e'
const BOOTS_SOLE = '#2a1a0e'
const BOOTS_STRAP = '#4a2a10'
const GLOVE = '#3a2a1a'
const GLOVE_BAND = '#c0a040'
const SWORD_BLADE = '#8899aa'
const SWORD_EDGE = '#b0c0d0'
const SWORD_FLAT = '#667788'
const SWORD_HILT = '#4a3a2a'
const SWORD_WRAP = '#2a2020'
const SWORD_GUARD = '#c0a040'
const MATERIA_GREEN = '#00ff66'
const MATERIA_YELLOW = '#ffcc00'

/**
 * Cloud Strife (FF7 field model) built from primitives.
 * Chibi proportions with detailed features: spiky hair, SOLDIER uniform,
 * leather gloves, combat boots, and Buster Sword with materia slots.
 * Model faces -Z (game forward direction).
 */
export function HumanModel() {
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()

  const phaseRef = useRef(0)
  const prevPosRef = useRef(null)

  useFrame((state, delta) => {
    const pos = useGameStore.getState().player2Position
    let hSpeed = 0

    if (prevPosRef.current && delta > 0) {
      const dx = pos[0] - prevPosRef.current[0]
      const dz = pos[2] - prevPosRef.current[2]
      hSpeed = Math.sqrt(dx * dx + dz * dz) / delta
    }
    prevPosRef.current = [pos[0], pos[1], pos[2]]

    const swingSpeed = 10
    const legAmplitude = Math.min(hSpeed * 0.1, 0.7)
    const armAmplitude = Math.min(hSpeed * 0.08, 0.5)

    if (hSpeed > 0.3) {
      phaseRef.current += delta * swingSpeed
    } else {
      phaseRef.current *= 0.85
    }

    const swing = Math.sin(phaseRef.current)

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * legAmplitude
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * legAmplitude
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * armAmplitude
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * armAmplitude
  })

  return (
    // Rotate PI so model faces -Z (game forward)
    <group position={[0, -0.45, 0]} rotation={[0, Math.PI, 0]}>
      {/* ═══════════════ HEAD ═══════════════ */}
      <group position={[0, 0.78, 0]}>
        {/* Main head — rounded */}
        <mesh castShadow>
          <sphereGeometry args={[0.16, 16, 14]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {/* Jaw / chin — slightly elongated downward */}
        <mesh castShadow position={[0, -0.06, 0.03]}>
          <sphereGeometry args={[0.12, 12, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {/* Cheeks */}
        <mesh position={[-0.08, -0.02, 0.1]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>
        <mesh position={[0.08, -0.02, 0.1]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>
        {/* Nose bridge */}
        <mesh position={[0, -0.01, 0.155]}>
          <boxGeometry args={[0.025, 0.04, 0.02]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>
        {/* Nose tip */}
        <mesh position={[0, -0.03, 0.16]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>

        {/* ── EYES — Mako-blue glow ── */}
        {/* Left eye white */}
        <mesh position={[-0.055, 0.02, 0.145]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
        </mesh>
        {/* Left iris */}
        <mesh position={[-0.055, 0.02, 0.165]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color={EYE_BLUE} roughness={0.2} emissive={EYE_BLUE} emissiveIntensity={0.3} />
        </mesh>
        {/* Left pupil */}
        <mesh position={[-0.055, 0.02, 0.172]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color={EYE_PUPIL} />
        </mesh>
        {/* Right eye white */}
        <mesh position={[0.055, 0.02, 0.145]}>
          <sphereGeometry args={[0.025, 10, 10]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
        </mesh>
        {/* Right iris */}
        <mesh position={[0.055, 0.02, 0.165]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color={EYE_BLUE} roughness={0.2} emissive={EYE_BLUE} emissiveIntensity={0.3} />
        </mesh>
        {/* Right pupil */}
        <mesh position={[0.055, 0.02, 0.172]}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshStandardMaterial color={EYE_PUPIL} />
        </mesh>

        {/* ── EYEBROWS — angled, determined look ── */}
        <mesh position={[-0.055, 0.055, 0.15]} rotation={[0, 0, -0.15]}>
          <boxGeometry args={[0.05, 0.012, 0.015]} />
          <meshStandardMaterial color={EYEBROW} roughness={0.8} />
        </mesh>
        <mesh position={[0.055, 0.055, 0.15]} rotation={[0, 0, 0.15]}>
          <boxGeometry args={[0.05, 0.012, 0.015]} />
          <meshStandardMaterial color={EYEBROW} roughness={0.8} />
        </mesh>

        {/* ── MOUTH — thin line ── */}
        <mesh position={[0, -0.06, 0.14]}>
          <boxGeometry args={[0.04, 0.008, 0.01]} />
          <meshStandardMaterial color={MOUTH} roughness={0.7} />
        </mesh>

        {/* ── EARS ── */}
        <mesh position={[-0.155, 0.0, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>
        <mesh position={[0.155, 0.0, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>

        {/* ═══════════════ SPIKY HAIR ═══════════════ */}
        {/* Base hair volume — covers top and back of head */}
        <mesh castShadow position={[0, 0.06, -0.02]}>
          <sphereGeometry args={[0.18, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.65]} />
          <meshStandardMaterial color={HAIR} roughness={0.85} />
        </mesh>
        {/* Side hair volume */}
        <mesh castShadow position={[-0.1, 0.02, 0.02]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.85} />
        </mesh>
        <mesh castShadow position={[0.1, 0.02, 0.02]}>
          <sphereGeometry args={[0.1, 10, 8]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.85} />
        </mesh>

        {/* ── Main top spikes (5) — tallest, dramatic ── */}
        <mesh castShadow position={[0, 0.3, -0.06]} rotation={[0.35, 0, 0]}>
          <coneGeometry args={[0.055, 0.26, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.06, 0.28, -0.03]} rotation={[0.2, 0, 0.25]}>
          <coneGeometry args={[0.045, 0.22, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.06, 0.28, -0.03]} rotation={[0.2, 0, -0.25]}>
          <coneGeometry args={[0.045, 0.22, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.03, 0.26, 0.02]} rotation={[0.1, 0, 0.12]}>
          <coneGeometry args={[0.04, 0.2, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.03, 0.26, 0.02]} rotation={[0.1, 0, -0.12]}>
          <coneGeometry args={[0.04, 0.2, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>

        {/* ── Left spike cluster (4) — fanning outward ── */}
        <mesh castShadow position={[-0.15, 0.2, -0.04]} rotation={[0.2, 0, 0.55]}>
          <coneGeometry args={[0.045, 0.22, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.21, 0.12, -0.02]} rotation={[0.1, 0, 0.95]}>
          <coneGeometry args={[0.04, 0.2, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.18, 0.22, 0.04]} rotation={[-0.1, 0, 0.65]}>
          <coneGeometry args={[0.035, 0.17, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.22, 0.06, 0.0]} rotation={[0, 0, 1.1]}>
          <coneGeometry args={[0.035, 0.16, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>

        {/* ── Right spike cluster (4) — mirrored ── */}
        <mesh castShadow position={[0.15, 0.2, -0.04]} rotation={[0.2, 0, -0.55]}>
          <coneGeometry args={[0.045, 0.22, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.21, 0.12, -0.02]} rotation={[0.1, 0, -0.95]}>
          <coneGeometry args={[0.04, 0.2, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.18, 0.22, 0.04]} rotation={[-0.1, 0, -0.65]}>
          <coneGeometry args={[0.035, 0.17, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.22, 0.06, 0.0]} rotation={[0, 0, -1.1]}>
          <coneGeometry args={[0.035, 0.16, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>

        {/* ── Back spikes (4) — swept backward ── */}
        <mesh castShadow position={[-0.08, 0.18, -0.15]} rotation={[-0.6, 0, 0.25]}>
          <coneGeometry args={[0.04, 0.18, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.08, 0.18, -0.15]} rotation={[-0.6, 0, -0.25]}>
          <coneGeometry args={[0.04, 0.18, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.2, -0.16]} rotation={[-0.7, 0, 0]}>
          <coneGeometry args={[0.035, 0.16, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0, 0.1, -0.17]} rotation={[-0.9, 0, 0]}>
          <coneGeometry args={[0.03, 0.14, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>

        {/* ── Front bangs (3) — hanging over forehead ── */}
        <mesh castShadow position={[-0.07, 0.1, 0.14]} rotation={[-0.5, 0.1, 0.2]}>
          <coneGeometry args={[0.03, 0.14, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[0.03, 0.12, 0.14]} rotation={[-0.4, -0.1, -0.15]}>
          <coneGeometry args={[0.028, 0.12, 5]} />
          <meshStandardMaterial color={HAIR} roughness={0.8} />
        </mesh>
        <mesh castShadow position={[-0.02, 0.13, 0.13]} rotation={[-0.35, 0, 0.08]}>
          <coneGeometry args={[0.025, 0.1, 5]} />
          <meshStandardMaterial color={HAIR_DARK} roughness={0.8} />
        </mesh>
      </group>

      {/* ═══════════════ NECK ═══════════════ */}
      <mesh castShadow position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.05, 0.06, 0.06, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>

      {/* ═══════════════ TORSO ═══════════════ */}
      {/* Main torso — SOLDIER sleeveless top */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.32, 0.36, 0.18]} />
        <meshStandardMaterial color={SHIRT} roughness={0.6} />
      </mesh>
      {/* Chest shading / depth */}
      <mesh position={[0, 0.42, 0.091]}>
        <boxGeometry args={[0.26, 0.2, 0.005]} />
        <meshStandardMaterial color={SHIRT_ACCENT} roughness={0.5} />
      </mesh>
      {/* Center zipper line */}
      <mesh position={[0, 0.4, 0.092]}>
        <boxGeometry args={[0.015, 0.32, 0.005]} />
        <meshStandardMaterial color={SHIRT_DARK} roughness={0.7} />
      </mesh>
      {/* Collar — V-neck */}
      <mesh position={[-0.04, 0.565, 0.06]} rotation={[0.3, 0, 0.25]}>
        <boxGeometry args={[0.08, 0.04, 0.04]} />
        <meshStandardMaterial color={COLLAR} roughness={0.6} />
      </mesh>
      <mesh position={[0.04, 0.565, 0.06]} rotation={[0.3, 0, -0.25]}>
        <boxGeometry args={[0.08, 0.04, 0.04]} />
        <meshStandardMaterial color={COLLAR} roughness={0.6} />
      </mesh>

      {/* ── Suspender / harness straps ── */}
      {/* Left strap front */}
      <mesh position={[-0.08, 0.42, 0.092]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.03, 0.3, 0.006]} />
        <meshStandardMaterial color={SUSPENDER} roughness={0.7} />
      </mesh>
      {/* Right strap front */}
      <mesh position={[0.08, 0.42, 0.092]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.03, 0.3, 0.006]} />
        <meshStandardMaterial color={SUSPENDER} roughness={0.7} />
      </mesh>
      {/* Left strap back */}
      <mesh position={[-0.08, 0.42, -0.092]} rotation={[0, 0, 0.08]}>
        <boxGeometry args={[0.03, 0.3, 0.006]} />
        <meshStandardMaterial color={SUSPENDER} roughness={0.7} />
      </mesh>
      {/* Right strap back */}
      <mesh position={[0.08, 0.42, -0.092]} rotation={[0, 0, -0.08]}>
        <boxGeometry args={[0.03, 0.3, 0.006]} />
        <meshStandardMaterial color={SUSPENDER} roughness={0.7} />
      </mesh>

      {/* Shoulder pads */}
      <mesh castShadow position={[-0.19, 0.56, 0]}>
        <boxGeometry args={[0.08, 0.05, 0.14]} />
        <meshStandardMaterial color={SHIRT} roughness={0.5} />
      </mesh>
      <mesh castShadow position={[0.19, 0.56, 0]}>
        <boxGeometry args={[0.08, 0.05, 0.14]} />
        <meshStandardMaterial color={SHIRT} roughness={0.5} />
      </mesh>
      {/* Shoulder pad trim */}
      <mesh position={[-0.19, 0.545, 0]}>
        <boxGeometry args={[0.082, 0.012, 0.142]} />
        <meshStandardMaterial color={SHIRT_DARK} roughness={0.6} />
      </mesh>
      <mesh position={[0.19, 0.545, 0]}>
        <boxGeometry args={[0.082, 0.012, 0.142]} />
        <meshStandardMaterial color={SHIRT_DARK} roughness={0.6} />
      </mesh>

      {/* ── Belt system ── */}
      <mesh castShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.33, 0.055, 0.19]} />
        <meshStandardMaterial color={BELT} roughness={0.6} />
      </mesh>
      {/* Belt edge trim */}
      <mesh position={[0, 0.225, 0]}>
        <boxGeometry args={[0.335, 0.01, 0.195]} />
        <meshStandardMaterial color={BELT_DARK} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.175, 0]}>
        <boxGeometry args={[0.335, 0.01, 0.195]} />
        <meshStandardMaterial color={BELT_DARK} roughness={0.7} />
      </mesh>
      {/* Buckle — wolf emblem */}
      <mesh position={[0, 0.2, 0.097]}>
        <boxGeometry args={[0.06, 0.045, 0.01]} />
        <meshStandardMaterial color={BUCKLE} roughness={0.2} metalness={0.8} />
      </mesh>
      {/* Buckle detail */}
      <mesh position={[0, 0.2, 0.103]}>
        <boxGeometry args={[0.03, 0.025, 0.005]} />
        <meshStandardMaterial color={BELT_DARK} roughness={0.3} metalness={0.5} />
      </mesh>
      {/* Side pouches */}
      <mesh castShadow position={[-0.15, 0.19, 0.06]}>
        <boxGeometry args={[0.05, 0.04, 0.04]} />
        <meshStandardMaterial color={BELT_DARK} roughness={0.7} />
      </mesh>
      <mesh castShadow position={[0.15, 0.19, 0.06]}>
        <boxGeometry args={[0.05, 0.04, 0.04]} />
        <meshStandardMaterial color={BELT_DARK} roughness={0.7} />
      </mesh>

      {/* ═══════════════ LEFT ARM ═══════════════ */}
      <group position={[-0.22, 0.52, 0]} ref={leftArmRef}>
        {/* Upper arm — bare skin (sleeveless) */}
        <mesh castShadow position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.18, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {/* Bicep definition */}
        <mesh position={[0.01, -0.06, 0.02]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>
        {/* Forearm */}
        <mesh castShadow position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.038, 0.035, 0.14, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        {/* Wristband */}
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.046, 0.046, 0.025, 10]} />
          <meshStandardMaterial color={GLOVE_BAND} roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Glove */}
        <mesh castShadow position={[0, -0.33, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.07]} />
          <meshStandardMaterial color={GLOVE} roughness={0.8} />
        </mesh>
        {/* Glove cuff */}
        <mesh position={[0, -0.305, 0]}>
          <boxGeometry args={[0.065, 0.015, 0.075]} />
          <meshStandardMaterial color={GLOVE_BAND} roughness={0.3} metalness={0.6} />
        </mesh>
        {/* Finger definition */}
        <mesh position={[0, -0.36, 0.01]}>
          <boxGeometry args={[0.055, 0.01, 0.05]} />
          <meshStandardMaterial color={GLOVE} roughness={0.9} />
        </mesh>
      </group>

      {/* ═══════════════ RIGHT ARM ═══════════════ */}
      <group position={[0.22, 0.52, 0]} ref={rightArmRef}>
        <mesh castShadow position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.18, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <mesh position={[-0.01, -0.06, 0.02]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial color={SKIN_SHADOW} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.038, 0.035, 0.14, 10]} />
          <meshStandardMaterial color={SKIN} roughness={0.65} />
        </mesh>
        <mesh position={[0, -0.18, 0]}>
          <cylinderGeometry args={[0.046, 0.046, 0.025, 10]} />
          <meshStandardMaterial color={GLOVE_BAND} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh castShadow position={[0, -0.33, 0]}>
          <boxGeometry args={[0.06, 0.06, 0.07]} />
          <meshStandardMaterial color={GLOVE} roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.305, 0]}>
          <boxGeometry args={[0.065, 0.015, 0.075]} />
          <meshStandardMaterial color={GLOVE_BAND} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh position={[0, -0.36, 0.01]}>
          <boxGeometry args={[0.055, 0.01, 0.05]} />
          <meshStandardMaterial color={GLOVE} roughness={0.9} />
        </mesh>
      </group>

      {/* ═══════════════ LEFT LEG ═══════════════ */}
      <group position={[-0.09, 0.14, 0]} ref={leftLegRef}>
        {/* Thigh — baggy pants */}
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.06, 0.055, 0.2, 10]} />
          <meshStandardMaterial color={PANTS} roughness={0.6} />
        </mesh>
        {/* Knee crease */}
        <mesh position={[0, -0.2, 0.03]}>
          <boxGeometry args={[0.08, 0.015, 0.02]} />
          <meshStandardMaterial color={PANTS_DARK} roughness={0.7} />
        </mesh>
        {/* Shin */}
        <mesh castShadow position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.052, 0.048, 0.16, 10]} />
          <meshStandardMaterial color={PANTS} roughness={0.6} />
        </mesh>
        {/* ── Boot ── */}
        {/* Boot shaft */}
        <mesh castShadow position={[0, -0.4, 0.005]}>
          <boxGeometry args={[0.1, 0.08, 0.11]} />
          <meshStandardMaterial color={BOOTS} roughness={0.7} />
        </mesh>
        {/* Boot top strap */}
        <mesh position={[0, -0.365, 0.005]}>
          <boxGeometry args={[0.105, 0.015, 0.115]} />
          <meshStandardMaterial color={BOOTS_STRAP} roughness={0.6} />
        </mesh>
        {/* Boot sole — darker, slightly wider */}
        <mesh castShadow position={[0, -0.445, 0.01]}>
          <boxGeometry args={[0.11, 0.03, 0.14]} />
          <meshStandardMaterial color={BOOTS_SOLE} roughness={0.9} />
        </mesh>
        {/* Boot toe cap */}
        <mesh position={[0, -0.42, 0.065]}>
          <boxGeometry args={[0.09, 0.04, 0.03]} />
          <meshStandardMaterial color={BOOTS_STRAP} roughness={0.6} />
        </mesh>
        {/* Boot heel */}
        <mesh position={[0, -0.44, -0.05]}>
          <boxGeometry args={[0.08, 0.04, 0.03]} />
          <meshStandardMaterial color={BOOTS_SOLE} roughness={0.9} />
        </mesh>
      </group>

      {/* ═══════════════ RIGHT LEG ═══════════════ */}
      <group position={[0.09, 0.14, 0]} ref={rightLegRef}>
        <mesh castShadow position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.06, 0.055, 0.2, 10]} />
          <meshStandardMaterial color={PANTS} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.2, 0.03]}>
          <boxGeometry args={[0.08, 0.015, 0.02]} />
          <meshStandardMaterial color={PANTS_DARK} roughness={0.7} />
        </mesh>
        <mesh castShadow position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.052, 0.048, 0.16, 10]} />
          <meshStandardMaterial color={PANTS} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, -0.4, 0.005]}>
          <boxGeometry args={[0.1, 0.08, 0.11]} />
          <meshStandardMaterial color={BOOTS} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.365, 0.005]}>
          <boxGeometry args={[0.105, 0.015, 0.115]} />
          <meshStandardMaterial color={BOOTS_STRAP} roughness={0.6} />
        </mesh>
        <mesh castShadow position={[0, -0.445, 0.01]}>
          <boxGeometry args={[0.11, 0.03, 0.14]} />
          <meshStandardMaterial color={BOOTS_SOLE} roughness={0.9} />
        </mesh>
        <mesh position={[0, -0.42, 0.065]}>
          <boxGeometry args={[0.09, 0.04, 0.03]} />
          <meshStandardMaterial color={BOOTS_STRAP} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.44, -0.05]}>
          <boxGeometry args={[0.08, 0.04, 0.03]} />
          <meshStandardMaterial color={BOOTS_SOLE} roughness={0.9} />
        </mesh>
      </group>

      {/* ═══════════════ BUSTER SWORD ═══════════════ */}
      <group position={[0.1, 0.48, -0.15]} rotation={[0.12, 0, 0.06]}>
        {/* ── Blade — massive flat slab ── */}
        {/* Main blade body */}
        <mesh castShadow position={[0, 0.42, 0]}>
          <boxGeometry args={[0.2, 0.75, 0.025]} />
          <meshStandardMaterial color={SWORD_BLADE} roughness={0.15} metalness={0.85} />
        </mesh>
        {/* Blade front face — lighter */}
        <mesh position={[0, 0.42, 0.0135]}>
          <boxGeometry args={[0.18, 0.73, 0.003]} />
          <meshStandardMaterial color={SWORD_EDGE} roughness={0.1} metalness={0.9} />
        </mesh>
        {/* Blade back face — darker */}
        <mesh position={[0, 0.42, -0.0135]}>
          <boxGeometry args={[0.18, 0.73, 0.003]} />
          <meshStandardMaterial color={SWORD_FLAT} roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Center fuller (groove running up blade) */}
        <mesh position={[0, 0.42, 0.014]}>
          <boxGeometry args={[0.04, 0.6, 0.002]} />
          <meshStandardMaterial color={SWORD_FLAT} roughness={0.2} metalness={0.85} />
        </mesh>
        {/* Blade tip — angled top */}
        <mesh castShadow position={[0, 0.8, 0]} rotation={[0, 0, 0]}>
          <boxGeometry args={[0.18, 0.04, 0.025]} />
          <meshStandardMaterial color={SWORD_EDGE} roughness={0.1} metalness={0.9} />
        </mesh>

        {/* ── Materia slots (two glowing circles) ── */}
        {/* Green materia */}
        <mesh position={[-0.04, 0.15, 0.015]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshStandardMaterial color={MATERIA_GREEN} roughness={0.1} emissive={MATERIA_GREEN} emissiveIntensity={0.6} />
        </mesh>
        {/* Yellow materia */}
        <mesh position={[0.04, 0.15, 0.015]}>
          <sphereGeometry args={[0.018, 10, 10]} />
          <meshStandardMaterial color={MATERIA_YELLOW} roughness={0.1} emissive={MATERIA_YELLOW} emissiveIntensity={0.6} />
        </mesh>
        {/* Materia socket rings */}
        <mesh position={[-0.04, 0.15, 0.014]}>
          <torusGeometry args={[0.022, 0.004, 8, 16]} />
          <meshStandardMaterial color={SWORD_GUARD} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0.04, 0.15, 0.014]}>
          <torusGeometry args={[0.022, 0.004, 8, 16]} />
          <meshStandardMaterial color={SWORD_GUARD} roughness={0.3} metalness={0.7} />
        </mesh>

        {/* ── Cross guard — ornate ── */}
        <mesh castShadow position={[0, 0.04, 0]}>
          <boxGeometry args={[0.26, 0.035, 0.05]} />
          <meshStandardMaterial color={SWORD_GUARD} roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Guard end caps */}
        <mesh position={[-0.13, 0.04, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={SWORD_GUARD} roughness={0.2} metalness={0.8} />
        </mesh>
        <mesh position={[0.13, 0.04, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color={SWORD_GUARD} roughness={0.2} metalness={0.8} />
        </mesh>

        {/* ── Hilt — wrapped grip ── */}
        <mesh castShadow position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.025, 0.022, 0.16, 10]} />
          <meshStandardMaterial color={SWORD_WRAP} roughness={0.9} />
        </mesh>
        {/* Grip wrapping lines */}
        {[-0.04, -0.01, 0.02, 0.05].map((offset, i) => (
          <mesh key={`wrap-${i}`} position={[0, -0.06 + offset, 0]}>
            <torusGeometry args={[0.026, 0.003, 6, 12]} />
            <meshStandardMaterial color={SWORD_HILT} roughness={0.7} />
          </mesh>
        ))}

        {/* ── Pommel ── */}
        <mesh castShadow position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.03, 10, 10]} />
          <meshStandardMaterial color={SWORD_GUARD} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>
    </group>
  )
}
