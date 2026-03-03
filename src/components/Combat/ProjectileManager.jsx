import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../../systems/gameStore'
import { triggerExplosion } from '../../utils/explosion'

const PROJECTILE_LIFETIME = 5000 // ms

function Projectile({ data, onExplode }) {
  const rbRef = useRef()
  const hasExploded = useRef(false)

  useFrame(() => {
    // Check lifetime
    if (performance.now() - data.time > PROJECTILE_LIFETIME && !hasExploded.current) {
      hasExploded.current = true
      onExplode(data.id, null)
    }
  })

  const handleIntersection = (event) => {
    if (hasExploded.current) return
    // Don't explode on player
    const otherName = event.other?.rigidBodyObject?.name
    if (otherName === 'player') return

    hasExploded.current = true
    const rb = rbRef.current
    if (rb) {
      const pos = rb.translation()
      onExplode(data.id, [pos.x, pos.y, pos.z])
    } else {
      onExplode(data.id, null)
    }
  }

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      position={data.position}
      linearVelocity={data.velocity}
      gravityScale={0.3}
      sensor
      name={`projectile-${data.id}`}
      onIntersectionEnter={handleIntersection}
    >
      <BallCollider args={[0.2]} />
      <mesh>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshStandardMaterial color="#ff4400" emissive="#ff2200" emissiveIntensity={2} />
      </mesh>
    </RigidBody>
  )
}

export function ProjectileManager() {
  const projectiles = useGameStore((s) => s.projectiles)
  const { rapier, world } = useRapier()

  const handleExplode = (id, position) => {
    const store = useGameStore.getState()
    store.removeProjectile(id)

    if (position) {
      // Trigger area damage
      triggerExplosion(world, rapier, position, store)
      // Visual explosion effect
      store.addExplosion({ position, time: performance.now() })
    }
  }

  return (
    <>
      {projectiles.map((p) => (
        <Projectile key={p.id} data={p} onExplode={handleExplode} />
      ))}
    </>
  )
}
