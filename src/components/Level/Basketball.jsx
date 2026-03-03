import React, { useRef, useEffect, useMemo } from 'react'
import { RigidBody, BallCollider, CuboidCollider } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { BASKETBALL } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const [CX, CY, CZ] = BASKETBALL.COURT_POSITION
const HOOP_Z = CZ + BASKETBALL.HOOP_OFFSET_Z
const HOOP_Y = BASKETBALL.HOOP_HEIGHT
const RIM_RADIUS = 0.23
const RIM_SPHERE_RADIUS = 0.04
const RIM_SPHERE_COUNT = 10

/**
 * Basketball court with hoop, backboard, rim colliders, and a persistent ball.
 */
export function Basketball() {
  const ballRef = useRef()

  // Register ball ref in store on mount
  useEffect(() => {
    useGameStore.getState().setBasketballRef(ballRef)
    return () => {
      useGameStore.getState().setBasketballRef(null)
      useGameStore.getState().setBasketballHeld(false)
      useGameStore.getState().setNearBasketball(false)
    }
  }, [])

  // Pre-compute rim sphere positions
  const rimPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < RIM_SPHERE_COUNT; i++) {
      const angle = (i / RIM_SPHERE_COUNT) * Math.PI * 2
      positions.push([
        CX + Math.cos(angle) * RIM_RADIUS,
        HOOP_Y,
        HOOP_Z + Math.sin(angle) * RIM_RADIUS,
      ])
    }
    return positions
  }, [])

  return (
    <group>
      {/* === SIGN === */}
      <Text
        position={[CX, 4.5, CZ + 5]}
        fontSize={0.8}
        color="#FF6600"
        anchorX="center"
        anchorY="bottom"
      >
        Basketball
      </Text>

      {/* === COURT SURFACE === */}
      <RigidBody type="fixed" friction={0.8} restitution={0.3}>
        <mesh receiveShadow position={[CX, 0.06, CZ]}>
          <boxGeometry args={[15, 0.1, 10]} />
          <meshStandardMaterial color="#C68642" roughness={0.6} />
        </mesh>
      </RigidBody>

      {/* Court markings — center circle */}
      <mesh position={[CX, 0.12, CZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.6, 32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>

      {/* Court markings — free throw line */}
      <mesh position={[CX, 0.12, HOOP_Z + 2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.05]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
      </mesh>

      {/* === HOOP POLE === */}
      <RigidBody type="fixed" friction={0.5} restitution={0.3}>
        <mesh castShadow position={[CX, HOOP_Y / 2, HOOP_Z - 0.5]}>
          <cylinderGeometry args={[0.08, 0.08, HOOP_Y, 8]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* === BACKBOARD === */}
      <RigidBody type="fixed" friction={0.3} restitution={0.5}>
        <mesh castShadow position={[CX, HOOP_Y + BASKETBALL.BACKBOARD_HEIGHT / 2 - 0.2, HOOP_Z - 0.5]}>
          <boxGeometry args={[BASKETBALL.BACKBOARD_WIDTH, BASKETBALL.BACKBOARD_HEIGHT, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" transparent opacity={0.85} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* === RIM — ring of small sphere colliders === */}
      {rimPositions.map((pos, i) => (
        <RigidBody key={`rim-${i}`} type="fixed" restitution={0.6} friction={0.3}>
          <mesh position={pos}>
            <sphereGeometry args={[RIM_SPHERE_RADIUS, 8, 8]} />
            <meshStandardMaterial color="#FF4400" metalness={0.6} roughness={0.3} />
          </mesh>
        </RigidBody>
      ))}

      {/* === NET (visual only) === */}
      <mesh position={[CX, HOOP_Y - 0.25, HOOP_Z]}>
        <cylinderGeometry args={[RIM_RADIUS, RIM_RADIUS * 0.5, 0.5, 12, 1, true]} />
        <meshStandardMaterial
          color="#FFFFFF"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>

      {/* === BASKETBALL (dynamic) === */}
      <RigidBody
        ref={ballRef}
        type="dynamic"
        position={BASKETBALL.BALL_SPAWN}
        restitution={BASKETBALL.BALL_RESTITUTION}
        friction={0.6}
        mass={BASKETBALL.BALL_MASS}
        linearDamping={0.3}
        angularDamping={0.5}
        colliders={false}
      >
        <BallCollider args={[BASKETBALL.BALL_RADIUS]} />
        <mesh castShadow>
          <sphereGeometry args={[BASKETBALL.BALL_RADIUS, 16, 16]} />
          <meshStandardMaterial color="#FF6600" roughness={0.7} />
        </mesh>
      </RigidBody>
    </group>
  )
}
