import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { GOLF } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

export function GolfClub() {
  const pivotRef = useRef()
  const groupRef = useRef()

  useFrame(() => {
    if (!pivotRef.current || !groupRef.current) return
    const { golfMode, golfPower } = useGameStore.getState()
    groupRef.current.visible = golfMode
    if (golfMode) {
      pivotRef.current.rotation.x = -golfPower * (Math.PI / 2)
    }
  })

  return (
    <group ref={groupRef} visible={false} position={[0.3, GOLF.CLUB_OFFSET_Y, 0]}>
      <group ref={pivotRef}>
        {/* Club shaft */}
        <mesh position={[0, 0, -GOLF.CLUB_LENGTH / 2]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, GOLF.CLUB_LENGTH, 8]} />
          <meshStandardMaterial color="#888888" />
        </mesh>
        {/* Club head */}
        <mesh position={[0, 0, -GOLF.CLUB_LENGTH]}>
          <boxGeometry args={[0.06, 0.04, 0.1]} />
          <meshStandardMaterial color="#444444" />
        </mesh>
      </group>
    </group>
  )
}
