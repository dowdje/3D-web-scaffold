import React from 'react'
import { Sky } from '@react-three/drei'

export function Environment() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <Sky sunPosition={[100, 50, 100]} />
      <fog attach="fog" args={['#b0d0f0', 80, 200]} />
    </>
  )
}
