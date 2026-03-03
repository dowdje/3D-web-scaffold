import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/gameStore'

const SKIN_COLOR = '#c4956a'

/**
 * Humanoid model built from primitives.
 * Procedural walk animation: swings legs/arms based on horizontal velocity.
 */
export function HumanModel() {
  const leftArmRef = useRef()
  const rightArmRef = useRef()
  const leftLegRef = useRef()
  const rightLegRef = useRef()

  const phaseRef = useRef(0)
  const prevPosRef = useRef(null)

  useFrame((state, delta) => {
    // Derive horizontal speed from position delta
    const pos = useGameStore.getState().player2Position
    let hSpeed = 0

    if (prevPosRef.current && delta > 0) {
      const dx = pos[0] - prevPosRef.current[0]
      const dz = pos[2] - prevPosRef.current[2]
      hSpeed = Math.sqrt(dx * dx + dz * dz) / delta
    }
    prevPosRef.current = [pos[0], pos[1], pos[2]]

    // Swing animation driven by speed
    const swingSpeed = 10
    const legAmplitude = Math.min(hSpeed * 0.1, 0.7)
    const armAmplitude = Math.min(hSpeed * 0.08, 0.5)

    if (hSpeed > 0.3) {
      phaseRef.current += delta * swingSpeed
    } else {
      // Ease limbs back to rest
      phaseRef.current *= 0.85
    }

    const swing = Math.sin(phaseRef.current)

    if (leftLegRef.current) leftLegRef.current.rotation.x = swing * legAmplitude
    if (rightLegRef.current) rightLegRef.current.rotation.x = -swing * legAmplitude
    if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * armAmplitude
    if (rightArmRef.current) rightArmRef.current.rotation.x = swing * armAmplitude
  })

  return (
    <group position={[0, -0.45, 0]}>
      {/* Head */}
      <mesh castShadow position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color={SKIN_COLOR} roughness={0.6} />
      </mesh>

      {/* Torso */}
      <mesh castShadow position={[0, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.5, 0.2]} />
        <meshStandardMaterial color="#5566aa" roughness={0.5} />
      </mesh>

      {/* Left Arm — pivot at shoulder */}
      <group position={[-0.235, 0.55, 0]} ref={leftArmRef}>
        <mesh castShadow position={[0, -0.225, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.6} />
        </mesh>
      </group>

      {/* Right Arm — pivot at shoulder */}
      <group position={[0.235, 0.55, 0]} ref={rightArmRef}>
        <mesh castShadow position={[0, -0.225, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.45, 8]} />
          <meshStandardMaterial color={SKIN_COLOR} roughness={0.6} />
        </mesh>
      </group>

      {/* Left Leg — pivot at hip */}
      <group position={[-0.1, 0.1, 0]} ref={leftLegRef}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
          <meshStandardMaterial color="#444466" roughness={0.5} />
        </mesh>
      </group>

      {/* Right Leg — pivot at hip */}
      <group position={[0.1, 0.1, 0]} ref={rightLegRef}>
        <mesh castShadow position={[0, -0.25, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 8]} />
          <meshStandardMaterial color="#444466" roughness={0.5} />
        </mesh>
      </group>
    </group>
  )
}
