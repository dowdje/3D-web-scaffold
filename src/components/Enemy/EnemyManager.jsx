import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '../../systems/gameStore'
import { SPAWNER } from '../../systems/constants'
import { Drone } from './Drone'

export function EnemyManager() {
  const enemies = useGameStore((s) => s.enemies)
  const spawnTimer = useRef(0)

  useFrame((state, delta) => {
    const store = useGameStore.getState()
    if (store.isDead) return

    spawnTimer.current += delta

    if (spawnTimer.current >= SPAWNER.SPAWN_INTERVAL && store.enemies.length < SPAWNER.MAX_ENEMIES) {
      spawnTimer.current = 0

      // Spawn in a ring around the player
      const angle = Math.random() * Math.PI * 2
      const radius = SPAWNER.SPAWN_RADIUS
      const pos = [
        store.playerPosition[0] + Math.cos(angle) * radius,
        3,
        store.playerPosition[2] + Math.sin(angle) * radius,
      ]

      store.spawnEnemy(pos)
    }
  })

  return (
    <>
      {enemies.map((enemy) => (
        <Drone key={enemy.id} enemy={enemy} />
      ))}
    </>
  )
}
