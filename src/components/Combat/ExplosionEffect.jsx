import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/gameStore'

const EXPLOSION_DURATION = 300 // ms

function Explosion({ data }) {
  const meshRef = useRef()

  useFrame(() => {
    if (!meshRef.current) return
    const elapsed = performance.now() - data.time
    const t = Math.min(1, elapsed / EXPLOSION_DURATION)

    // Expand and fade
    const scale = 1 + t * 6
    meshRef.current.scale.setScalar(scale)
    meshRef.current.material.opacity = 1 - t
  })

  return (
    <mesh ref={meshRef} position={data.position}>
      <sphereGeometry args={[0.5, 12, 12]} />
      <meshStandardMaterial
        color="#ff6600"
        emissive="#ff4400"
        emissiveIntensity={3}
        transparent
        opacity={1}
      />
    </mesh>
  )
}

export function ExplosionEffect() {
  const explosions = useGameStore((s) => s.explosions)

  useFrame(() => {
    const store = useGameStore.getState()
    const now = performance.now()
    const expired = store.explosions.filter((e) => now - e.time > EXPLOSION_DURATION)
    for (const e of expired) {
      store.removeExplosion(e)
    }
  })

  return (
    <>
      {explosions.map((e, i) => (
        <Explosion key={i} data={e} />
      ))}
    </>
  )
}
