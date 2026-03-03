import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider } from '@react-three/rapier'
import * as THREE from 'three'
import { useGameStore } from '../../systems/gameStore'
import { useEntityRegistry } from '../../utils/entityRegistry'
import { ENEMY } from '../../systems/constants'

const _toPlayer = new THREE.Vector3()

export function Drone({ enemy }) {
  const rbRef = useRef()
  const meshRef = useRef()
  const attackCooldown = useRef(0)

  const entityInfo = useMemo(() => ({
    type: 'enemy',
    id: enemy.id,
    takeDamage: (amount) => {
      useGameStore.getState().damageEnemy(enemy.id, amount)
    },
  }), [enemy.id])

  useEntityRegistry(rbRef, entityInfo)

  useFrame((state, delta) => {
    const rb = rbRef.current
    if (!rb) return

    const { playerPosition, isDead } = useGameStore.getState()
    const pos = rb.translation()

    // Move toward player
    _toPlayer.set(
      playerPosition[0] - pos.x,
      0,
      playerPosition[2] - pos.z
    )
    const horizontalDist = _toPlayer.length()

    if (horizontalDist > 1) {
      _toPlayer.normalize()
      const speed = ENEMY.DRONE_SPEED
      rb.setNextKinematicTranslation({
        x: pos.x + _toPlayer.x * speed * delta,
        y: ENEMY.DRONE_HOVER_HEIGHT + Math.sin(state.clock.elapsedTime * 2 + enemy.id) * 0.3,
        z: pos.z + _toPlayer.z * speed * delta,
      })
    } else {
      rb.setNextKinematicTranslation({
        x: pos.x,
        y: ENEMY.DRONE_HOVER_HEIGHT + Math.sin(state.clock.elapsedTime * 2 + enemy.id) * 0.3,
        z: pos.z,
      })
    }

    // Rotate to face player
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.atan2(
        playerPosition[0] - pos.x,
        playerPosition[2] - pos.z
      )
      // Spin the octahedron slightly
      meshRef.current.rotation.x = state.clock.elapsedTime * 1.5
    }

    // Attack when in range
    attackCooldown.current -= delta
    if (horizontalDist < ENEMY.DRONE_ATTACK_RANGE && attackCooldown.current <= 0 && !isDead) {
      attackCooldown.current = ENEMY.DRONE_ATTACK_COOLDOWN
      useGameStore.getState().takeDamage(ENEMY.DRONE_DAMAGE)
    }
  })

  const healthPct = enemy.health / ENEMY.DRONE_HEALTH

  return (
    <RigidBody
      ref={rbRef}
      type="kinematicPosition"
      position={enemy.position}
      colliders={false}
      name={`enemy-${enemy.id}`}
    >
      <BallCollider args={[0.6]} />
      <group ref={meshRef}>
        {/* Drone body */}
        <mesh castShadow>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial color="#cc2222" emissive="#660000" emissiveIntensity={0.5} metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* Health bar */}
      <group position={[0, 1.2, 0]}>
        {/* Background */}
        <mesh>
          <planeGeometry args={[1, 0.1]} />
          <meshBasicMaterial color="#333333" transparent opacity={0.7} />
        </mesh>
        {/* Health fill */}
        <mesh position={[(healthPct - 1) * 0.5, 0, 0.001]}>
          <planeGeometry args={[healthPct, 0.08]} />
          <meshBasicMaterial color={healthPct > 0.5 ? '#44ff44' : '#ff4444'} />
        </mesh>
      </group>
    </RigidBody>
  )
}
