import React from 'react'
import { useGameStore } from '../../systems/gameStore'

export function HUD() {
  const activePlayer = useGameStore((s) => s.activePlayer)
  const playerPosition = useGameStore((s) =>
    s.activePlayer === 1 ? s.playerPosition : s.player2Position
  )
  const isGrounded = useGameStore((s) => s.isGrounded)
  const nearRope = useGameStore((s) => s.nearRope)
  const isGrabbing = useGameStore((s) => {
    const grabs = s.ropeGrabs
    return grabs[s.activePlayer] != null
  })
  const golfMode = useGameStore((s) => s.golfMode)
  const golfPower = useGameStore((s) => s.golfPower)
  const nearWorm = useGameStore((s) => s.nearWorm)
  const wormMounted = useGameStore((s) => s.wormMounted)
  const nearBike = useGameStore((s) => s.nearBike)
  const bikeMounted = useGameStore((s) => s.bikeMounted)
  const bikeSpeed = useGameStore((s) => s.bikeSpeed)
  const nearCarSmash = useGameStore((s) => s.nearCarSmash)
  const carSmashMounted = useGameStore((s) => s.carSmashMounted)
  const nearBasketball = useGameStore((s) => s.nearBasketball)
  const basketballHeld = useGameStore((s) => s.basketballHeld)
  const basketballPower = useGameStore((s) => s.basketballPower)
  const nearBatting = useGameStore((s) => s.nearBatting)
  const battingMounted = useGameStore((s) => s.battingMounted)

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
      <div style={{ marginBottom: 4, fontWeight: 'bold' }}>
        Player {activePlayer}{' '}
        <span style={{ color: activePlayer === 1 ? '#4488ff' : '#c4956a' }}>
          {activePlayer === 1 ? '[Capsule]' : '[Human]'}
        </span>
        <span style={{ opacity: 0.5, marginLeft: 8 }}>1/2 to switch</span>
      </div>
      <div>
        pos: {playerPosition.map((v) => v.toFixed(1)).join(', ')}
      </div>
      <div>grounded: {isGrounded ? 'yes' : 'no'}</div>
      {nearRope && !isGrabbing && (
        <div style={{ marginTop: 4, color: '#DAA520' }}>F — grab rope</div>
      )}
      {isGrabbing && (
        <div style={{ marginTop: 4, color: '#DAA520' }}>Space — release</div>
      )}
      {!golfMode && !isGrabbing && (
        <div style={{ marginTop: 4, color: '#90EE90' }}>G — golf mode</div>
      )}
      {nearWorm && !wormMounted && (
        <div style={{ marginTop: 4, color: '#8BC34A' }}>C — mount worm</div>
      )}
      {wormMounted && (
        <div style={{ marginTop: 4 }}>
          <div style={{ color: '#8BC34A' }}>C — dismount</div>
          <div style={{ color: '#8BC34A' }}>WASD — ride</div>
        </div>
      )}
      {nearBike && !bikeMounted && (
        <div style={{ marginTop: 4, color: '#FF6600' }}>C — mount dirt bike</div>
      )}
      {bikeMounted && (
        <div style={{ marginTop: 4 }}>
          <div style={{ color: '#FF6600' }}>C — dismount</div>
          <div style={{ color: '#FF6600' }}>W — accelerate | S — brake</div>
          <div style={{ color: '#FF6600' }}>A/D — steer</div>
          <div style={{ color: '#FF6600', fontWeight: 'bold' }}>
            {Math.round(bikeSpeed)} m/s
          </div>
        </div>
      )}
      {nearCarSmash && !carSmashMounted && (
        <div style={{ marginTop: 4, color: '#FF4444' }}>C — enter car smash</div>
      )}
      {carSmashMounted && (
        <div style={{ marginTop: 4 }}>
          <div style={{ color: '#FF4444', fontWeight: 'bold', marginBottom: 4 }}>Car Smash</div>
          <div style={{ color: '#FF4444' }}>H — swing | A/D — aim</div>
          <div style={{ color: '#FF4444' }}>R — reset | C — exit</div>
        </div>
      )}
      {golfMode && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#90EE90', fontWeight: 'bold', marginBottom: 4 }}>Golf Mode</div>
          <div style={{
            width: 120,
            height: 10,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 4,
          }}>
            <div style={{
              width: `${golfPower * 100}%`,
              height: '100%',
              background: golfPower < 0.5 ? '#4CAF50' : golfPower < 0.8 ? '#FF9800' : '#F44336',
              borderRadius: 3,
              transition: 'width 0.05s linear',
            }} />
          </div>
          <div style={{ color: '#DAA520' }}>H — hold to charge, release to swing</div>
          <div style={{ color: '#DAA520' }}>A/D — aim</div>
        </div>
      )}
      {nearBasketball && !basketballHeld && (
        <div style={{ marginTop: 4, color: '#FF6600' }}>F — pick up ball</div>
      )}
      {basketballHeld && (
        <div style={{ marginTop: 8 }}>
          <div style={{ color: '#FF6600', fontWeight: 'bold', marginBottom: 4 }}>Basketball</div>
          <div style={{
            width: 120,
            height: 10,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 3,
            overflow: 'hidden',
            marginBottom: 4,
          }}>
            <div style={{
              width: `${basketballPower * 100}%`,
              height: '100%',
              background: basketballPower < 0.5 ? '#4CAF50' : basketballPower < 0.8 ? '#FF9800' : '#F44336',
              borderRadius: 3,
              transition: 'width 0.05s linear',
            }} />
          </div>
          <div style={{ color: '#FF6600' }}>H — charge & shoot</div>
          <div style={{ color: '#FF6600' }}>F — drop</div>
        </div>
      )}
      {nearBatting && !battingMounted && (
        <div style={{ marginTop: 4, color: '#ffaa00' }}>C — step up to bat</div>
      )}
      {battingMounted && (
        <div style={{ marginTop: 4 }}>
          <div style={{ color: '#ffaa00', fontWeight: 'bold', marginBottom: 4 }}>Batting Cage</div>
          <div style={{ color: '#ffaa00' }}>H — swing bat | C — exit</div>
        </div>
      )}
    </div>
  )
}
