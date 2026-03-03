import React, { useRef, useState, useMemo } from 'react'
import { RigidBody } from '@react-three/rapier'
import { useEntityRegistry } from '../../utils/entityRegistry'
import { DESTRUCTIBLE } from '../../systems/constants'

export function Crate({ position = [0, 0.5, 0], size = [1, 1, 1] }) {
  const rbRef = useRef()
  const [health, setHealth] = useState(DESTRUCTIBLE.CRATE_HEALTH)
  const [destroyed, setDestroyed] = useState(false)

  const entityInfo = useMemo(() => ({
    type: 'crate',
    id: `crate-${position.join(',')}`,
    takeDamage: () => {
      setDestroyed(true)
    },
  }), [position])

  useEntityRegistry(rbRef, entityInfo)

  if (destroyed) return null

  return (
    <RigidBody
      ref={rbRef}
      type="dynamic"
      position={position}
      mass={5}
      name={`crate-${position.join(',')}`}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#8B6914" roughness={0.8} />
      </mesh>
    </RigidBody>
  )
}
