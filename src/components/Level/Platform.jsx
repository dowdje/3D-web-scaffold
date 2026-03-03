import React from 'react'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'

export function Platform({ position = [0, 0, 0], size = [2, 1, 2], color = '#888888', label }) {
  return (
    <RigidBody type="fixed" position={position} friction={1} restitution={0}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {label && (
        <Text
          position={[0, size[1] / 2 + 0.3, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="bottom"
        >
          {label}
        </Text>
      )}
    </RigidBody>
  )
}
