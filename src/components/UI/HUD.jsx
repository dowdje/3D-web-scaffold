import React, { useRef, useEffect } from 'react'
import { useGameStore } from '../../systems/gameStore'
import { WEAPON_DEFS } from '../../systems/weapons'

export function HUD() {
  const isDead = useGameStore((s) => s.isDead)
  const activeWeapon = useGameStore((s) => s.activeWeapon)
  const weapons = useGameStore((s) => s.weapons)
  const reloading = useGameStore((s) => s.reloading)
  const score = useGameStore((s) => s.score)
  const kills = useGameStore((s) => s.kills)
  const health = useGameStore((s) => s.health)
  const maxHealth = useGameStore((s) => s.maxHealth)

  // Direct DOM updates for rapidly-changing values to avoid re-render floods
  const posRef = useRef(null)
  const groundedRef = useRef(null)
  const healthBarRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => {
      const state = useGameStore.getState()
      if (posRef.current) {
        const p = state.playerPosition
        posRef.current.textContent = `pos: ${p[0].toFixed(1)}, ${p[1].toFixed(1)}, ${p[2].toFixed(1)}`
      }
      if (groundedRef.current) {
        groundedRef.current.textContent = `grounded: ${state.isGrounded ? 'yes' : 'no'}`
      }
    }, 100)
    return () => clearInterval(id)
  }, [])

  if (isDead) return null

  const weapon = weapons[activeWeapon]
  const weaponDef = WEAPON_DEFS[activeWeapon]
  const healthPct = (health / maxHealth) * 100
  const healthColor = healthPct > 50 ? '#44ff44' : healthPct > 25 ? '#ffaa00' : '#ff4444'

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: 16,
        right: 16,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: 13,
        zIndex: 10,
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
      }}
    >
      {/* Left: Health + Debug */}
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 12px', borderRadius: 6 }}>
        <div style={{ marginBottom: 4 }}>
          <div style={{
            width: 160, height: 12,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 3, overflow: 'hidden',
          }}>
            <div ref={healthBarRef} style={{
              width: `${healthPct}%`, height: '100%',
              background: healthColor,
              transition: 'width 0.2s, background 0.2s',
            }} />
          </div>
          <div style={{ fontSize: 11, marginTop: 2 }}>HP: {health}/{maxHealth}</div>
        </div>
        <div ref={posRef} style={{ fontSize: 11, opacity: 0.6 }}>pos: 0.0, 0.0, 0.0</div>
        <div ref={groundedRef} style={{ fontSize: 11, opacity: 0.6 }}>grounded: no</div>
      </div>

      {/* Center: Score */}
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 16px', borderRadius: 6, textAlign: 'center' }}>
        <div style={{ fontSize: 16 }}>Score: {score}</div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>Kills: {kills}</div>
      </div>

      {/* Right: Weapon + Ammo */}
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '8px 12px', borderRadius: 6, textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 'bold' }}>{weaponDef.name}</div>
        <div style={{ fontSize: 20 }}>
          {weapon.ammo} <span style={{ fontSize: 13, opacity: 0.6 }}>/ {weapon.reserve}</span>
        </div>
        {reloading && <div style={{ color: '#ffaa00', fontSize: 12 }}>RELOADING...</div>}
        <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>F: swap | R: reload | K: fire</div>
      </div>
    </div>
  )
}
