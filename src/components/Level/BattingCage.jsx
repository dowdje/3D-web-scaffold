import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { BATTING } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

// Temp vectors reused each frame
const _batHead = new THREE.Vector3()
const _ballPos = new THREE.Vector3()

// Swing phases
const PHASE_IDLE = 0
const PHASE_WINDUP = 1
const PHASE_STRIKE = 2
const PHASE_FOLLOW = 3

/**
 * Batting Cage — automatic pitching machine + bat swing + hit detection.
 * Open-air design (no walls/ceiling) so hit balls can fly full distance.
 */
export function BattingCage({ position = BATTING.POSITION }) {
  const groupRef = useRef()

  React.useEffect(() => {
    useGameStore.getState().setBattingRef(groupRef)
    return () => useGameStore.getState().setBattingRef(null)
  }, [])

  // Shared ball pool state: { active, timer, hit, hitOrigin:[x,y,z], landed }
  const ballPool = useRef([])
  const ballRefs = useRef([])

  if (ballRefs.current.length === 0) {
    for (let i = 0; i < BATTING.MAX_BALLS; i++) {
      ballRefs.current.push(React.createRef())
      ballPool.current.push({ active: false, timer: 0, hit: false, hitOrigin: null, landed: false, maxDist: 0 })
    }
  }

  return (
    <group ref={groupRef} position={position}>
      <CageFrame />
      <PitchingMachine ballPool={ballPool} ballRefs={ballRefs} cagePos={position} />
      <Bat ballPool={ballPool} ballRefs={ballRefs} cagePos={position} />
      <BallPool ballRefs={ballRefs} ballPool={ballPool} cagePos={position} />

      {/* Sign */}
      <Text
        position={[0, 4, BATTING.CAGE_LENGTH / 2]}
        fontSize={0.8}
        color="#ffaa00"
        anchorX="center"
        anchorY="bottom"
      >
        {'BATTING CAGE'}
      </Text>
      <Text
        position={[0, 3.2, BATTING.CAGE_LENGTH / 2]}
        fontSize={0.35}
        color="#ffcc44"
        anchorX="center"
        anchorY="bottom"
      >
        {'Press C to step up'}
      </Text>
    </group>
  )
}

/**
 * CageFrame — open-air: just the floor, plate markings, and corner posts.
 * No walls or ceiling so hit balls fly free.
 */
function CageFrame() {
  const W = BATTING.CAGE_WIDTH
  const L = BATTING.CAGE_LENGTH
  const postRadius = 0.08
  const postHeight = 3

  const corners = [
    [-W / 2, 0, -L / 2],
    [W / 2, 0, -L / 2],
    [-W / 2, 0, L / 2],
    [W / 2, 0, L / 2],
  ]

  return (
    <group>
      {/* Corner posts (visual only, no physics) */}
      {corners.map((pos, i) => (
        <mesh key={`post-${i}`} castShadow position={[pos[0], postHeight / 2, pos[2]]}>
          <cylinderGeometry args={[postRadius, postRadius, postHeight, 8]} />
          <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}

      {/* Floor — dirt area */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh receiveShadow position={[0, 0.02, 0]}>
          <boxGeometry args={[W, 0.04, L]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Batter's box marking */}
      <mesh position={[0, 0.05, BATTING.BATTER_OFFSET_Z]}>
        <boxGeometry args={[1.2, 0.01, 1.8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      {/* Home plate */}
      <mesh position={[0, 0.06, BATTING.BATTER_OFFSET_Z]}>
        <boxGeometry args={[0.4, 0.01, 0.4]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>

      {/* Pitcher's mound marking */}
      <mesh position={[0, 0.05, BATTING.PITCHER_OFFSET_Z]}>
        <cylinderGeometry args={[0.3, 0.3, 0.02, 12]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

/**
 * PitchingMachine — auto-throws balls toward the plate when mounted.
 */
function PitchingMachine({ ballPool, ballRefs, cagePos }) {
  const pitchTimer = useRef(1.5)
  const nextBallIndex = useRef(0)

  useFrame((state, delta) => {
    const mounted = useGameStore.getState().battingMounted
    if (!mounted) {
      pitchTimer.current = 1.5
      return
    }

    pitchTimer.current -= delta
    if (pitchTimer.current <= 0) {
      pitchTimer.current = BATTING.PITCH_INTERVAL

      let idx = -1
      for (let i = 0; i < BATTING.MAX_BALLS; i++) {
        if (!ballPool.current[i].active) {
          idx = i
          break
        }
      }
      if (idx === -1) {
        idx = nextBallIndex.current
        nextBallIndex.current = (nextBallIndex.current + 1) % BATTING.MAX_BALLS
      }

      const rb = ballRefs.current[idx]?.current
      if (rb) {
        const varX = (Math.random() - 0.5) * BATTING.PITCH_VARIATION_X
        const varY = (Math.random() - 0.5) * BATTING.PITCH_VARIATION_Y

        const worldX = cagePos[0] + varX
        const worldY = cagePos[1] + BATTING.PITCH_HEIGHT + varY
        const worldZ = cagePos[2] + BATTING.PITCHER_OFFSET_Z

        rb.setTranslation({ x: worldX, y: worldY, z: worldZ }, true)
        rb.setLinvel({ x: 0, y: 0, z: BATTING.PITCH_SPEED }, true)
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
        rb.wakeUp()

        ballPool.current[idx].active = true
        ballPool.current[idx].timer = BATTING.BALL_LIFETIME
        ballPool.current[idx].hit = false
        ballPool.current[idx].hitOrigin = null
        ballPool.current[idx].landed = false
        ballPool.current[idx].maxDist = 0
      }
    }
  })

  return (
    <group position={[0, 0, BATTING.PITCHER_OFFSET_Z]}>
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.6]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 12]} />
        <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[1.0, 0.3, 0.8]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.35, 0.1]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Bat — horizontal bat extending from batter across the plate.
 * Swing sweeps from camera side (+Z) toward pitcher (-Z).
 */
function Bat({ ballPool, ballRefs, cagePos }) {
  const pivotGroupRef = useRef()
  const batTipRef = useRef()

  const swingPhase = useRef(PHASE_IDLE)
  const phaseTimer = useRef(0)
  const cooldownTimer = useRef(0)

  const IDLE_ANGLE = 1.2
  const WINDUP_ANGLE = 1.5
  const STRIKE_END_ANGLE = -1.5

  useFrame((state, delta) => {
    const store = useGameStore.getState()
    if (!pivotGroupRef.current) return

    const mounted = store.battingMounted
    pivotGroupRef.current.parent.visible = mounted
    if (!mounted) {
      swingPhase.current = PHASE_IDLE
      phaseTimer.current = 0
      cooldownTimer.current = 0
      return
    }

    if (cooldownTimer.current > 0) {
      cooldownTimer.current -= delta
    }

    if (store.battingSwing) {
      if (swingPhase.current === PHASE_IDLE && cooldownTimer.current <= 0) {
        swingPhase.current = PHASE_WINDUP
        phaseTimer.current = 0
      }
      store.setBattingSwing(false)
    }

    phaseTimer.current += delta
    let pivotAngle = IDLE_ANGLE

    switch (swingPhase.current) {
      case PHASE_WINDUP: {
        const t = Math.min(phaseTimer.current / BATTING.SWING_WINDUP, 1)
        pivotAngle = IDLE_ANGLE + t * (WINDUP_ANGLE - IDLE_ANGLE)
        if (t >= 1) {
          swingPhase.current = PHASE_STRIKE
          phaseTimer.current = 0
        }
        break
      }
      case PHASE_STRIKE: {
        const strikeDuration = 0.2
        const t = Math.min(phaseTimer.current / strikeDuration, 1)
        const eased = 1 - (1 - t) * (1 - t)
        pivotAngle = WINDUP_ANGLE + eased * (STRIKE_END_ANGLE - WINDUP_ANGLE)

        // Hit detection during strike
        if (batTipRef.current && pivotGroupRef.current) {
          pivotGroupRef.current.updateWorldMatrix(true, false)
          batTipRef.current.updateWorldMatrix(true, false)
          _batHead.setFromMatrixPosition(batTipRef.current.matrixWorld)

          for (let i = 0; i < BATTING.MAX_BALLS; i++) {
            const ball = ballPool.current[i]
            if (!ball.active || ball.hit) continue

            const rb = ballRefs.current[i]?.current
            if (!rb) continue

            const bPos = rb.translation()
            _ballPos.set(bPos.x, bPos.y, bPos.z)

            const dist = _batHead.distanceTo(_ballPos)

            if (dist < BATTING.HIT_DISTANCE) {
              ball.hit = true
              // Record hit origin (world-space plate position) for distance tracking
              ball.hitOrigin = [
                cagePos[0],
                cagePos[1],
                cagePos[2] + BATTING.BATTER_OFFSET_Z,
              ]
              ball.landed = false
              ball.maxDist = 0

              const contactT = t
              const quality = 1.0 - Math.abs(contactT - 0.5) * 2.0
              const speed = BATTING.HIT_BASE_SPEED + quality * (BATTING.HIT_MAX_SPEED - BATTING.HIT_BASE_SPEED)
              const spreadAngle = (contactT - 0.5) * 1.2

              const launchX = Math.sin(spreadAngle) * Math.cos(BATTING.HIT_LAUNCH_ANGLE) * speed
              const launchY = Math.sin(BATTING.HIT_LAUNCH_ANGLE) * speed
              const launchZ = -Math.cos(spreadAngle) * Math.cos(BATTING.HIT_LAUNCH_ANGLE) * speed

              rb.setLinvel({ x: launchX, y: launchY, z: launchZ }, true)
              rb.setAngvel({
                x: (Math.random() - 0.5) * 20,
                y: (Math.random() - 0.5) * 20,
                z: (Math.random() - 0.5) * 20,
              }, true)
            }
          }
        }

        if (t >= 1) {
          swingPhase.current = PHASE_FOLLOW
          phaseTimer.current = 0
          cooldownTimer.current = BATTING.SWING_COOLDOWN
        }
        break
      }
      case PHASE_FOLLOW: {
        const followDuration = 0.12
        const t = Math.min(phaseTimer.current / followDuration, 1)
        const eased = t * (2 - t)
        pivotAngle = STRIKE_END_ANGLE + eased * (IDLE_ANGLE - STRIKE_END_ANGLE)
        if (t >= 1) {
          swingPhase.current = PHASE_IDLE
          phaseTimer.current = 0
        }
        break
      }
    }

    pivotGroupRef.current.rotation.y = pivotAngle
  })

  return (
    <group position={[BATTING.BATTER_OFFSET_X, 0, BATTING.BATTER_OFFSET_Z]} visible={false}>
      <group ref={pivotGroupRef} position={[0, BATTING.PITCH_HEIGHT, 0]}>
        {/* Handle */}
        <mesh castShadow position={[-0.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.5} />
        </mesh>
        {/* Knob */}
        <mesh castShadow position={[0.01, 0, 0]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#6B3410" roughness={0.6} />
        </mesh>
        {/* Barrel */}
        <mesh castShadow position={[-(0.3 + BATTING.BAT_LENGTH / 2), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.035, BATTING.BAT_LENGTH, 10]} />
          <meshStandardMaterial color="#c49a6c" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Barrel end cap */}
        <mesh castShadow position={[-(0.3 + BATTING.BAT_LENGTH), 0, 0]}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshStandardMaterial color="#c49a6c" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Bat tip marker */}
        <group ref={batTipRef} position={[-(0.3 + BATTING.BAT_LENGTH), 0, 0]} />
      </group>
    </group>
  )
}

/**
 * BallPool — pre-allocated balls with distance tracking.
 * Tracks how far each hit ball travels from the plate and reports to store.
 */
function BallPool({ ballRefs, ballPool, cagePos }) {
  useFrame((state, delta) => {
    for (let i = 0; i < BATTING.MAX_BALLS; i++) {
      const ball = ballPool.current[i]
      if (!ball.active) continue

      ball.timer -= delta
      const rb = ballRefs.current[i]?.current
      if (!rb) continue

      const pos = rb.translation()

      // Distance tracking for hit balls
      if (ball.hit && ball.hitOrigin) {
        const dx = pos.x - ball.hitOrigin[0]
        const dz = pos.z - ball.hitOrigin[2]
        const horizontalDist = Math.sqrt(dx * dx + dz * dz)

        // Track max distance (ball may bounce and roll further)
        if (horizontalDist > ball.maxDist) {
          ball.maxDist = horizontalDist
        }

        // Detect landing: ball was in the air and now near ground level
        const vel = rb.linvel()
        const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z)
        if (!ball.landed && pos.y <= cagePos[1] + 0.5 && vel.y < 0) {
          ball.landed = true
          useGameStore.getState().setBattingLastHitDist(Math.round(ball.maxDist))
        }
        // Also update if ball is rolling further after landing
        if (ball.landed && speed < 0.5) {
          useGameStore.getState().setBattingLastHitDist(Math.round(ball.maxDist))
        }
      }

      // Cleanup
      const dx = pos.x - cagePos[0]
      const dy = pos.y - cagePos[1]
      const dz = pos.z - cagePos[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (ball.timer <= 0 || dist > BATTING.BALL_CLEANUP_DISTANCE || pos.y < -5) {
        // Final distance update before cleanup
        if (ball.hit && ball.maxDist > 0) {
          useGameStore.getState().setBattingLastHitDist(Math.round(ball.maxDist))
        }
        ball.active = false
        ball.hit = false
        ball.hitOrigin = null
        ball.landed = false
        ball.maxDist = 0
        rb.setTranslation({ x: cagePos[0], y: -20, z: cagePos[2] }, true)
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
      }
    }
  })

  return (
    <>
      {Array.from({ length: BATTING.MAX_BALLS }, (_, i) => (
        <RigidBody
          key={`ball-${i}`}
          ref={ballRefs.current[i]}
          type="dynamic"
          position={[0, -20, 0]}
          colliders="ball"
          mass={BATTING.BALL_MASS}
          restitution={0.4}
          friction={0.5}
          linearDamping={0.1}
          angularDamping={0.3}
          gravityScale={0.15}
        >
          <mesh castShadow>
            <sphereGeometry args={[BATTING.BALL_RADIUS, 12, 12]} />
            <meshStandardMaterial color="#ffffff" roughness={0.3} />
          </mesh>
        </RigidBody>
      ))}
    </>
  )
}
