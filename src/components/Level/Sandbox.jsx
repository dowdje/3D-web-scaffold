import React from 'react'
import { RigidBody } from '@react-three/rapier'
import { Platform } from './Platform'

/**
 * Sandbox test level.
 * A ground plane plus a variety of platforms to test movement, jumping, and physics.
 * Extend this or create new level files using the same pattern.
 */
export function Sandbox() {
  return (
    <group>
      {/* === GROUND PLANE === */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color="#3a5f3a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* === GRID LINES ON GROUND (visual only) === */}
      <gridHelper args={[200, 40, '#2a4a2a', '#2a4a2a']} position={[0, 0.01, 0]} />

      {/* === STARTER PLATFORMS === */}
      {/* Low step platforms - easy jumps */}
      <Platform position={[4, 0.5, -3]} size={[3, 1, 3]} color="#5a7a9a" />
      <Platform position={[8, 1.2, -3]} size={[2.5, 1, 2.5]} color="#5a7a9a" />
      <Platform position={[12, 2, -3]} size={[2, 1, 2]} color="#5a7a9a" />

      {/* Staircase */}
      <Platform position={[-5, 0.5, -5]} size={[4, 1, 2]} color="#8a6a4a" />
      <Platform position={[-5, 1.5, -7]} size={[4, 1, 2]} color="#8a6a4a" />
      <Platform position={[-5, 2.5, -9]} size={[4, 1, 2]} color="#8a6a4a" />
      <Platform position={[-5, 3.5, -11]} size={[4, 1, 2]} color="#8a6a4a" />
      <Platform position={[-5, 4.5, -13]} size={[6, 1, 4]} color="#aa8a5a" label="Lookout" />

      {/* Gap jump challenge */}
      <Platform position={[0, 1, -10]} size={[3, 1, 3]} color="#9a5a7a" />
      <Platform position={[0, 1, -16]} size={[3, 1, 3]} color="#9a5a7a" />
      <Platform position={[0, 1.5, -22]} size={[2, 1, 2]} color="#9a5a7a" />
      <Platform position={[0, 2, -27]} size={[4, 1, 4]} color="#aa6a8a" label="Landing Pad" />

      {/* Tall pillar platforms */}
      <Platform position={[15, 3, 0]} size={[2, 6, 2]} color="#6a6a9a" />
      <Platform position={[20, 5, 0]} size={[2, 1, 2]} color="#6a6a9a" />
      <Platform position={[25, 7, 0]} size={[3, 1, 3]} color="#7a7aaa" label="High Point" />

      {/* Wide platform with ramps */}
      <Platform position={[-15, 1, 0]} size={[10, 0.5, 10]} color="#7a9a6a" />

      {/* Floating island */}
      <Platform position={[10, 6, -15]} size={[6, 1.5, 6]} color="#aa9a6a" label="Sky Island" />

      {/* Thin balance beams */}
      <Platform position={[0, 0.5, 8]} size={[0.5, 0.5, 12]} color="#cc8844" />
      <Platform position={[5, 1, 15]} size={[12, 0.5, 0.5]} color="#cc8844" />

      {/* Walls for testing collision */}
      <Platform position={[-20, 2, -20]} size={[1, 4, 10]} color="#666666" />
      <Platform position={[-15, 2, -25]} size={[10, 4, 1]} color="#666666" />
    </group>
  )
}
