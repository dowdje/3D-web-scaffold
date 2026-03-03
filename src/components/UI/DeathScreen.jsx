import React from 'react'
import { useGameStore } from '../../systems/gameStore'

export function DeathScreen() {
  const phase = useGameStore((s) => s.phase)

  if (phase !== 'dead') return null

  return <DeathScreenInner />
}

function DeathScreenInner() {
  const score = useGameStore((s) => s.score)
  const kills = useGameStore((s) => s.kills)

  const handleRespawn = () => {
    useGameStore.getState().respawnPlayer()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(139, 0, 0, 0.7)',
        zIndex: 200,
      }}
    >
      <div style={{ color: 'white', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 24 }}>YOU DIED</div>
        <div style={{ fontSize: 18, marginBottom: 8 }}>Score: {score}</div>
        <div style={{ fontSize: 18, marginBottom: 32 }}>Kills: {kills}</div>
        <button
          onClick={handleRespawn}
          style={{
            padding: '12px 32px',
            fontSize: 18,
            background: '#cc0000',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Respawn
        </button>
      </div>
    </div>
  )
}
