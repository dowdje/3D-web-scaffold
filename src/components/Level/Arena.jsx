import React from 'react'
import { RigidBody } from '@react-three/rapier'
import { Platform } from './Platform'
import { Crate } from './Crate'
import { ExplosiveBarrel } from './ExplosiveBarrel'

/**
 * Arena level — walled combat arena (~80x80) with cover, platforms, and destructibles.
 */
export function Arena() {
  return (
    <group>
      {/* === GROUND PLANE === */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[80, 1, 80]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* === GRID === */}
      <gridHelper args={[80, 20, '#3a3a3a', '#3a3a3a']} position={[0, 0.01, 0]} />

      {/* === ARENA WALLS === */}
      {/* North */}
      <Platform position={[0, 3, -40]} size={[82, 6, 2]} color="#555555" />
      {/* South */}
      <Platform position={[0, 3, 40]} size={[82, 6, 2]} color="#555555" />
      {/* East */}
      <Platform position={[40, 3, 0]} size={[2, 6, 82]} color="#555555" />
      {/* West */}
      <Platform position={[-40, 3, 0]} size={[2, 6, 82]} color="#555555" />

      {/* === COVER WALLS === */}
      <Platform position={[10, 1.5, 10]} size={[6, 3, 1]} color="#6a6a6a" />
      <Platform position={[-10, 1.5, -10]} size={[1, 3, 6]} color="#6a6a6a" />
      <Platform position={[15, 1.5, -15]} size={[1, 3, 8]} color="#6a6a6a" />
      <Platform position={[-15, 1.5, 15]} size={[8, 3, 1]} color="#6a6a6a" />

      {/* === PILLARS === */}
      <Platform position={[20, 2, 0]} size={[2, 4, 2]} color="#7a7a7a" />
      <Platform position={[-20, 2, 0]} size={[2, 4, 2]} color="#7a7a7a" />
      <Platform position={[0, 2, 20]} size={[2, 4, 2]} color="#7a7a7a" />
      <Platform position={[0, 2, -20]} size={[2, 4, 2]} color="#7a7a7a" />

      {/* === ELEVATED PLATFORMS === */}
      <Platform position={[25, 3, 25]} size={[8, 0.5, 8]} color="#5a7a9a" label="Sniper Perch" />
      {/* Ramp to sniper perch */}
      <Platform position={[25, 1.5, 18]} size={[4, 0.3, 6]} color="#5a7a7a" />

      <Platform position={[-25, 4, -25]} size={[6, 0.5, 6]} color="#5a7a9a" label="High Ground" />
      {/* Steps up */}
      <Platform position={[-25, 1, -19]} size={[3, 0.5, 3]} color="#5a7a7a" />
      <Platform position={[-25, 2, -21]} size={[3, 0.5, 3]} color="#5a7a7a" />
      <Platform position={[-25, 3, -23]} size={[3, 0.5, 3]} color="#5a7a7a" />

      {/* Central raised platform */}
      <Platform position={[0, 1, 0]} size={[6, 2, 6]} color="#6a8a6a" label="Center" />

      {/* === CRATE CLUSTERS === */}
      <Crate position={[5, 0.5, -5]} />
      <Crate position={[6, 0.5, -5]} />
      <Crate position={[5.5, 1.5, -5]} />

      <Crate position={[-8, 0.5, 8]} />
      <Crate position={[-9, 0.5, 8]} />
      <Crate position={[-8, 0.5, 9]} />

      <Crate position={[30, 0.5, -10]} />
      <Crate position={[31, 0.5, -10]} />

      {/* === EXPLOSIVE BARRELS === */}
      <ExplosiveBarrel position={[12, 0.75, 5]} />
      <ExplosiveBarrel position={[-12, 0.75, -5]} />
      <ExplosiveBarrel position={[0, 0.75, 15]} />
      <ExplosiveBarrel position={[0, 0.75, -15]} />
      <ExplosiveBarrel position={[25, 0.75, -25]} />
      <ExplosiveBarrel position={[-25, 0.75, 25]} />
    </group>
  )
}
