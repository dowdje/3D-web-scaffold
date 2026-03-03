import React, { useRef, useState, useMemo, useEffect } from 'react'
import { RigidBody, useRapier } from '@react-three/rapier'
import { useEntityRegistry } from '../../utils/entityRegistry'
import { useGameStore } from '../../systems/gameStore'
import { triggerExplosion } from '../../utils/explosion'
import { DESTRUCTIBLE } from '../../systems/constants'

export function ExplosiveBarrel({ position = [0, 0.75, 0] }) {
  const rbRef = useRef()
  const [destroyed, setDestroyed] = useState(false)
  const { rapier, world } = useRapier()

  // Store last known position for explosion (read from rb before unmount)
  const lastPosRef = useRef(position)

  const entityInfo = useMemo(() => ({
    type: 'barrel',
    id: `barrel-${position.join(',')}`,
    takeDamage: (amount) => {
      // Just flag as destroyed — explosion handled in useEffect
      setDestroyed((prev) => {
        if (prev) return prev // already destroyed
        return true
      })
      // Capture position for explosion
      const rb = rbRef.current
      if (rb) {
        const pos = rb.translation()
        lastPosRef.current = [pos.x, pos.y, pos.z]
      }
    },
  }), [position])

  // Trigger explosion as a side effect, not during render
  useEffect(() => {
    if (!destroyed) return
    const pos = lastPosRef.current
    const store = useGameStore.getState()
    triggerExplosion(
      world, rapier,
      pos,
      store,
      DESTRUCTIBLE.BARREL_EXPLOSION_RADIUS,
      DESTRUCTIBLE.BARREL_EXPLOSION_DAMAGE
    )
    store.addExplosion({
      position: pos,
      time: performance.now(),
    })
  }, [destroyed, world, rapier])

  useEntityRegistry(rbRef, entityInfo)

  if (destroyed) return null

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      position={position}
      mass={8}
      name={`barrel-${position.join(',')}`}
    >
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.4, 0.4, 1.2, 12]} />
        <meshStandardMaterial color="#cc2222" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Warning stripe */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.15, 12]} />
        <meshStandardMaterial color="#ffaa00" roughness={0.5} />
      </mesh>
    </RigidBody>
  )
}
