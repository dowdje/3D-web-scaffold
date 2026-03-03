import React from 'react'
import { PLAYER } from '../../systems/constants'

export function PlayerModel() {
  return (
    <mesh castShadow>
      <capsuleGeometry args={[PLAYER.CAPSULE_RADIUS, PLAYER.CAPSULE_HALF_HEIGHT * 2, 8, 16]} />
      <meshStandardMaterial color="#4488ff" roughness={0.4} metalness={0.3} />
    </mesh>
  )
}
