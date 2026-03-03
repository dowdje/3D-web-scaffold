import React from 'react'
import { useGameStore } from '../../systems/gameStore'

export function HUD() {
  const playerPosition = useGameStore((s) => s.playerPosition)
  const isGrounded = useGameStore((s) => s.isGrounded)

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: 12,
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 12px',
        borderRadius: 6,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <div>
        pos: {playerPosition.map((v) => v.toFixed(1)).join(', ')}
      </div>
      <div>grounded: {isGrounded ? 'yes' : 'no'}</div>
    </div>
  )
}
