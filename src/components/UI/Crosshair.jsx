import React from 'react'
import { useGameStore } from '../../systems/gameStore'

export function Crosshair() {
  const isDead = useGameStore((s) => s.isDead)

  if (isDead) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}
