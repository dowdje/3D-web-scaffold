import React, { useState, useEffect } from 'react'

/**
 * "Click to play" overlay shown when pointer is not locked.
 */
export function LockScreen() {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const onChange = () => {
      setLocked(!!document.pointerLockElement)
    }
    document.addEventListener('pointerlockchange', onChange)
    return () => document.removeEventListener('pointerlockchange', onChange)
  }, [])

  if (locked) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        zIndex: 100,
        cursor: 'pointer',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ color: 'white', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>Click to Play</div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>WASD = Move | Mouse = Look | Left Click = Fire</div>
      </div>
    </div>
  )
}
