import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { BATTING } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

// Temp vectors reused each frame
const _batHead = new THREE.Vector3()
const _ballPos = new THREE.Vector3()
const _hitDir = new THREE.Vector3()

// Swing phases
const PHASE_IDLE = 0
const PHASE_WINDUP = 1
const PHASE_STRIKE = 2
const PHASE_FOLLOW = 3

/**
 * Batting Cage — automatic pitching machine + bat swing + hit detection.
 */
export function BattingCage({ position = BATTING.POSITION }) {
  const groupRef = useRef()

  // Register ref in store
  React.useEffect(() => {
    useGameStore.getState().setBattingRef(groupRef)
    return () => useGameStore.getState().setBattingRef(null)
  }, [])

  // Shared ball pool state — array of { active, timer, hit }
  const ballPool = useRef([])
  const ballRefs = useRef([])

  // Initialize ball pool refs
  if (ballRefs.current.length === 0) {
    for (let i = 0; i < BATTING.MAX_BALLS; i++) {
      ballRefs.current.push(React.createRef())
      ballPool.current.push({ active: false, timer: 0, hit: false })
    }
  }

  return (
    <group ref={groupRef} position={position}>
      <CageFrame />
      <PitchingMachine ballPool={ballPool} ballRefs={ballRefs} />
      <Bat ballPool={ballPool} ballRefs={ballRefs} />
      <BallPool ballRefs={ballRefs} ballPool={ballPool} />

      {/* Sign */}
      <Text
        position={[0, BATTING.CAGE_HEIGHT + 0.5, BATTING.CAGE_LENGTH / 2]}
        fontSize={0.8}
        color="#ffaa00"
        anchorX="center"
        anchorY="bottom"
      >
        {'BATTING CAGE'}
      </Text>
      <Text
        position={[0, BATTING.CAGE_HEIGHT - 0.2, BATTING.CAGE_LENGTH / 2]}
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
 * CageFrame — posts + semi-transparent net panels forming the cage enclosure.
 */
function CageFrame() {
  const W = BATTING.CAGE_WIDTH
  const L = BATTING.CAGE_LENGTH
  const H = BATTING.CAGE_HEIGHT
  const postRadius = 0.08
  const netOpacity = 0.15

  // Corner positions for posts
  const corners = [
    [-W / 2, 0, -L / 2],
    [W / 2, 0, -L / 2],
    [-W / 2, 0, L / 2],
    [W / 2, 0, L / 2],
  ]

  return (
    <group>
      {/* Posts */}
      {corners.map((pos, i) => (
        <RigidBody key={`post-${i}`} type="fixed" friction={0.5} restitution={0.3}>
          <mesh castShadow position={[pos[0], H / 2, pos[2]]}>
            <cylinderGeometry args={[postRadius, postRadius, H, 8]} />
            <meshStandardMaterial color="#666666" metalness={0.6} roughness={0.4} />
          </mesh>
        </RigidBody>
      ))}

      {/* Net panels — left wall */}
      <RigidBody type="fixed" friction={0.1} restitution={0.5}>
        <mesh position={[-W / 2, H / 2, 0]}>
          <boxGeometry args={[0.05, H, L]} />
          <meshStandardMaterial color="#aaaaaa" transparent opacity={netOpacity} wireframe />
        </mesh>
      </RigidBody>

      {/* Net panels — right wall */}
      <RigidBody type="fixed" friction={0.1} restitution={0.5}>
        <mesh position={[W / 2, H / 2, 0]}>
          <boxGeometry args={[0.05, H, L]} />
          <meshStandardMaterial color="#aaaaaa" transparent opacity={netOpacity} wireframe />
        </mesh>
      </RigidBody>

      {/* Net panels — back wall (behind pitcher) */}
      <RigidBody type="fixed" friction={0.1} restitution={0.5}>
        <mesh position={[0, H / 2, -L / 2]}>
          <boxGeometry args={[W, H, 0.05]} />
          <meshStandardMaterial color="#aaaaaa" transparent opacity={netOpacity} wireframe />
        </mesh>
      </RigidBody>

      {/* Net panels — front wall (behind batter, entry side) — two halves with gap */}
      <RigidBody type="fixed" friction={0.1} restitution={0.5}>
        <mesh position={[-W / 4 - 0.25, H / 2, L / 2]}>
          <boxGeometry args={[W / 2 - 0.5, H, 0.05]} />
          <meshStandardMaterial color="#aaaaaa" transparent opacity={netOpacity} wireframe />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.1} restitution={0.5}>
        <mesh position={[W / 4 + 0.25, H / 2, L / 2]}>
          <boxGeometry args={[W / 2 - 0.5, H, 0.05]} />
          <meshStandardMaterial color="#aaaaaa" transparent opacity={netOpacity} wireframe />
        </mesh>
      </RigidBody>

      {/* Ceiling net */}
      <RigidBody type="fixed" friction={0.1} restitution={0.5}>
        <mesh position={[0, H, 0]}>
          <boxGeometry args={[W, 0.05, L]} />
          <meshStandardMaterial color="#aaaaaa" transparent opacity={netOpacity} wireframe />
        </mesh>
      </RigidBody>

      {/* Floor */}
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
    </group>
  )
}

/**
 * PitchingMachine — visual box at pitcher end; auto-throws balls when player is mounted.
 */
function PitchingMachine({ ballPool, ballRefs }) {
  const pitchTimer = useRef(1.5) // start with short delay for first pitch
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

      // Find a free ball or recycle oldest
      let idx = -1
      for (let i = 0; i < BATTING.MAX_BALLS; i++) {
        if (!ballPool.current[i].active) {
          idx = i
          break
        }
      }
      if (idx === -1) {
        // Recycle using round-robin
        idx = nextBallIndex.current
        nextBallIndex.current = (nextBallIndex.current + 1) % BATTING.MAX_BALLS
      }

      const rb = ballRefs.current[idx]?.current
      if (rb) {
        // Position at pitching machine
        const startX = (Math.random() - 0.5) * BATTING.PITCH_VARIATION_X
        const startY = BATTING.PITCH_HEIGHT + (Math.random() - 0.5) * BATTING.PITCH_VARIATION_Y
        const startZ = BATTING.PITCHER_OFFSET_Z

        rb.setTranslation({ x: startX, y: startY, z: startZ }, true)
        rb.setLinvel({ x: 0, y: 0, z: BATTING.PITCH_SPEED }, true) // toward +Z (batter)
        rb.setAngvel({ x: 0, y: 0, z: 0 }, true)
        rb.wakeUp()

        ballPool.current[idx].active = true
        ballPool.current[idx].timer = BATTING.BALL_LIFETIME
        ballPool.current[idx].hit = false
      }
    }
  })

  return (
    <group position={[0, 0, BATTING.PITCHER_OFFSET_Z]}>
      {/* Machine body */}
      <mesh castShadow position={[0, 0.8, 0]}>
        <boxGeometry args={[0.8, 1.0, 0.6]} />
        <meshStandardMaterial color="#555555" roughness={0.3} metalness={0.7} />
      </mesh>
      {/* Barrel */}
      <mesh castShadow position={[0, 0.9, 0.35]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.3, 12]} />
        <meshStandardMaterial color="#333333" roughness={0.2} metalness={0.9} />
      </mesh>
      {/* Base */}
      <mesh castShadow position={[0, 0.15, 0]}>
        <boxGeometry args={[1.0, 0.3, 0.8]} />
        <meshStandardMaterial color="#444444" roughness={0.5} metalness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Bat — visual bat mesh + swing animation state machine + hit detection.
 */
function Bat({ ballPool, ballRefs }) {
  const pivotGroupRef = useRef()
  const batTipRef = useRef() // for computing bat head world position

  const swingPhase = useRef(PHASE_IDLE)
  const phaseTimer = useRef(0)
  const cooldownTimer = useRef(0)

  // Swing rotation angles
  const IDLE_ANGLE = 1.2
  const WINDUP_ANGLE = 1.5
  const STRIKE_END_ANGLE = -1.8

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

    // Cooldown
    if (cooldownTimer.current > 0) {
      cooldownTimer.current -= delta
    }

    // Trigger swing from store flag
    if (store.battingSwing) {
      if (swingPhase.current === PHASE_IDLE && cooldownTimer.current <= 0) {
        swingPhase.current = PHASE_WINDUP
        phaseTimer.current = 0
      }
      store.setBattingSwing(false)
    }

    // Phase animation
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
        const strikeDuration = BATTING.SWING_STRIKE_END - BATTING.SWING_STRIKE_START + 0.07 // total strike arc time
        const t = Math.min(phaseTimer.current / strikeDuration, 1)
        const eased = 1 - (1 - t) * (1 - t) // ease out quad
        pivotAngle = WINDUP_ANGLE + eased * (STRIKE_END_ANGLE - WINDUP_ANGLE)

        // Hit detection during strike phase
        if (batTipRef.current && pivotGroupRef.current) {
          // Get bat tip world position
          pivotGroupRef.current.updateWorldMatrix(true, false)
          batTipRef.current.updateWorldMatrix(true, false)
          _batHead.setFromMatrixPosition(batTipRef.current.matrixWorld)

          // Check against all active balls
          for (let i = 0; i < BATTING.MAX_BALLS; i++) {
            const ball = ballPool.current[i]
            if (!ball.active || ball.hit) continue

            const rb = ballRefs.current[i]?.current
            if (!rb) continue

            const bPos = rb.translation()
            _ballPos.set(bPos.x, bPos.y, bPos.z)

            // Convert ball position to world space (balls are children of the group)
            // Ball RBs are in local cage space — need to add cage position
            const cageRef = useGameStore.getState().battingRef
            if (cageRef?.current) {
              const cagePos = cageRef.current.position
              _ballPos.set(bPos.x + cagePos.x, bPos.y + cagePos.y, bPos.z + cagePos.z)
            }

            const dist = _batHead.distanceTo(_ballPos)

            if (dist < BATTING.HIT_DISTANCE) {
              // HIT!
              ball.hit = true

              // Contact timing determines trajectory
              const contactT = t // 0=early, 1=late, 0.5=center
              const quality = 1.0 - Math.abs(contactT - 0.5) * 2.0
              const speed = BATTING.HIT_BASE_SPEED + quality * (BATTING.HIT_MAX_SPEED - BATTING.HIT_BASE_SPEED)
              const spreadAngle = (contactT - 0.5) * 1.2 // radians, early=left, late=right

              // Launch direction: batter faces -Z (BATTER_FACING_YAW = PI)
              // So hits should go toward -Z (pitcher direction)
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
        const followDuration = BATTING.SWING_DURATION - (BATTING.SWING_STRIKE_END - BATTING.SWING_STRIKE_START + 0.07) - BATTING.SWING_WINDUP
        const t = Math.min(phaseTimer.current / Math.max(followDuration, 0.05), 1)
        const eased = t * (2 - t) // ease out
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
    <group position={[0, 0, BATTING.BATTER_OFFSET_Z]} visible={false}>
      {/* Pivot at hand height — horizontal swing rotates around Y */}
      <group ref={pivotGroupRef} position={[0, BATTING.PITCH_HEIGHT, 0]}>
        {/* Bat handle */}
        <mesh castShadow position={[0, 0, -0.15]}>
          <cylinderGeometry args={[0.025, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#8B4513" roughness={0.5} />
        </mesh>
        {/* Bat barrel */}
        <mesh castShadow position={[0, 0, -(0.3 + BATTING.BAT_LENGTH / 2)]}>
          <cylinderGeometry args={[0.035, 0.055, BATTING.BAT_LENGTH, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#c49a6c" roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Invisible bat tip marker for hit detection */}
        <group ref={batTipRef} position={[0, 0, -(0.3 + BATTING.BAT_LENGTH)]} />
      </group>
    </group>
  )
}

/**
 * BallPool — pre-allocated dynamic RigidBody balls, recycled for each pitch.
 */
function BallPool({ ballRefs, ballPool }) {
  // Manage ball lifetimes
  useFrame((state, delta) => {
    for (let i = 0; i < BATTING.MAX_BALLS; i++) {
      const ball = ballPool.current[i]
      if (!ball.active) continue

      ball.timer -= delta
      const rb = ballRefs.current[i]?.current
      if (!rb) continue

      // Deactivate if expired or too far
      const pos = rb.translation()
      const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z)

      if (ball.timer <= 0 || dist > BATTING.BALL_CLEANUP_DISTANCE || pos.y < -5) {
        ball.active = false
        ball.hit = false
        // Move ball far away and sleep it
        rb.setTranslation({ x: 0, y: -20, z: 0 }, true)
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
