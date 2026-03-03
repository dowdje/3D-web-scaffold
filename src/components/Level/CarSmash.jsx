import React, { useRef, useMemo, useEffect, useCallback, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { CAR_SMASH } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

// Temp vectors reused each frame — allocated at module scope to avoid GC
const _panelPos = new THREE.Vector3()
const _playerDir = new THREE.Vector3()
const _toPanel = new THREE.Vector3()
const _color = new THREE.Color()
const _hitDir = new THREE.Vector3()

// Colors for damage lerp
const PRISTINE_COLOR = new THREE.Color('#cc2222')
const DAMAGED_COLOR = new THREE.Color('#333333')
const GLASS_PRISTINE = new THREE.Color('#aaddff')
const GLASS_DAMAGED = new THREE.Color('#556666')

// Seeded pseudo-random for deterministic per-panel wobble
function seededRand(seed) {
  let x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Car Smash exhibit — an interactive station where the player smashes a car with a hammer.
 */
export function CarSmash({ position = CAR_SMASH.POSITION }) {
  const groupRef = useRef()

  useEffect(() => {
    useGameStore.getState().setCarSmashRef(groupRef)
    return () => useGameStore.getState().setCarSmashRef(null)
  }, [])

  return (
    <group ref={groupRef} position={position}>
      {/* Platform */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh receiveShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[10, 0.1, 10]} />
          <meshStandardMaterial color="#888888" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* Sign */}
      <Text
        position={[0, 4, -5.2]}
        fontSize={0.8}
        color="#ff4444"
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        {'CAR SMASH'}
      </Text>
      <Text
        position={[0, 3.2, -5.2]}
        fontSize={0.4}
        color="#ffcc44"
        anchorX="center"
        anchorY="bottom"
        font={undefined}
      >
        {'Press C to enter'}
      </Text>

      {/* Sign post */}
      <mesh position={[0, 2, -5.2]}>
        <boxGeometry args={[0.15, 4, 0.15]} />
        <meshStandardMaterial color="#666666" />
      </mesh>

      {/* The smashable car */}
      <SmashCar />

      {/* Hammer (visible only when mounted) */}
      <Hammer />

      {/* Debris particles */}
      <DebrisSystem />
    </group>
  )
}

// ─── Panel definitions ───────────────────────────────────────────────
const PANEL_DEFS = [
  { name: 'hood',        pos: [0, 0.9, -1.0],    size: [1.6, 0.05, 1.0], rot: [0.1, 0, 0],  isGlass: false, mass: 1.2 },
  { name: 'roof',        pos: [0, 1.3, 0.0],     size: [1.6, 0.05, 1.2], rot: [0, 0, 0],     isGlass: false, mass: 1.5 },
  { name: 'trunk',       pos: [0, 0.9, 1.0],     size: [1.6, 0.05, 0.8], rot: [-0.1, 0, 0],  isGlass: false, mass: 1.0 },
  { name: 'leftDoor',    pos: [-0.85, 0.7, 0.0], size: [0.05, 0.6, 1.8], rot: [0, 0, 0],     isGlass: false, mass: 1.8 },
  { name: 'rightDoor',   pos: [0.85, 0.7, 0.0],  size: [0.05, 0.6, 1.8], rot: [0, 0, 0],     isGlass: false, mass: 1.8 },
  { name: 'leftFender',  pos: [-0.85, 0.5, -1.2],size: [0.05, 0.4, 0.8], rot: [0, 0, 0],     isGlass: false, mass: 0.6 },
  { name: 'rightFender', pos: [0.85, 0.5, -1.2], size: [0.05, 0.4, 0.8], rot: [0, 0, 0],     isGlass: false, mass: 0.6 },
  { name: 'windshield',  pos: [0, 1.1, -0.55],   size: [1.5, 0.6, 0.05], rot: [0.4, 0, 0],   isGlass: true,  mass: 0.4 },
]

/**
 * The smashable car — 8 damageable panels that deform, then detach and fly.
 */
const SmashCar = React.forwardRef(function SmashCar(props, ref) {
  const panelRefs = useRef(PANEL_DEFS.map((def, i) => ({
    meshRef: React.createRef(),
    damage: 0,
    detached: false,
    // Flying physics state (used after detach)
    vel: new THREE.Vector3(),
    angVel: new THREE.Vector3(),
    flyPos: new THREE.Vector3(...def.pos),
    flyRot: new THREE.Euler(...def.rot),
    // Per-hit shake offset (decays each frame)
    shakeOffset: new THREE.Vector3(),
    shakeRot: new THREE.Vector3(),
    // Impact flash timer
    flashTimer: 0,
  })))

  const hitPanel = useCallback((panelIndex, hitDirection) => {
    const panel = panelRefs.current[panelIndex]
    if (!panel || panel.detached) return

    const def = PANEL_DEFS[panelIndex]
    const prevDamage = panel.damage
    panel.damage = Math.min(1, panel.damage + CAR_SMASH.DAMAGE_PER_HIT)

    // Randomized hit force variation (0.7 - 1.3x)
    const forceVariation = 0.7 + seededRand(Date.now() * (panelIndex + 1)) * 0.6

    // Impact shake — big immediate jolt that decays
    const shakeStrength = 0.15 * forceVariation
    panel.shakeOffset.set(
      (seededRand(Date.now()) - 0.5) * shakeStrength,
      (seededRand(Date.now() + 1) - 0.5) * shakeStrength,
      (seededRand(Date.now() + 2) - 0.5) * shakeStrength
    )
    panel.shakeRot.set(
      (seededRand(Date.now() + 3) - 0.5) * 0.3,
      (seededRand(Date.now() + 4) - 0.5) * 0.3,
      (seededRand(Date.now() + 5) - 0.5) * 0.3
    )
    panel.flashTimer = 0.1

    // Spawn debris sparks
    spawnDebris(def.pos, hitDirection)

    // Check if panel should detach and fly off
    if (panel.damage >= CAR_SMASH.DETACH_THRESHOLD && !panel.detached) {
      panel.detached = true
      panel.flyPos.set(
        def.pos[0] + panel.shakeOffset.x,
        def.pos[1] + panel.shakeOffset.y,
        def.pos[2] + panel.shakeOffset.z
      )
      panel.flyRot.set(def.rot[0], def.rot[1], def.rot[2])

      // Launch direction: mostly away from hit + upward + randomness
      const launchForce = CAR_SMASH.DETACH_FORCE * forceVariation / Math.max(def.mass, 0.3)
      panel.vel.set(
        hitDirection.x * launchForce + (seededRand(Date.now() + 10) - 0.5) * 3,
        3 + seededRand(Date.now() + 11) * launchForce * 0.5,
        hitDirection.z * launchForce + (seededRand(Date.now() + 12) - 0.5) * 3
      )
      // Dramatic spin
      const spinForce = CAR_SMASH.DETACH_SPIN / Math.max(def.mass, 0.3)
      panel.angVel.set(
        (seededRand(Date.now() + 20) - 0.5) * spinForce,
        (seededRand(Date.now() + 21) - 0.5) * spinForce,
        (seededRand(Date.now() + 22) - 0.5) * spinForce
      )
    }
  }, [])

  const resetAll = useCallback(() => {
    panelRefs.current.forEach((p, i) => {
      const def = PANEL_DEFS[i]
      p.damage = 0
      p.detached = false
      p.vel.set(0, 0, 0)
      p.angVel.set(0, 0, 0)
      p.flyPos.set(...def.pos)
      p.flyRot.set(...def.rot)
      p.shakeOffset.set(0, 0, 0)
      p.shakeRot.set(0, 0, 0)
      p.flashTimer = 0
    })
  }, [])

  const findClosestPanel = useCallback((orbitPos, aimDir) => {
    let bestIdx = -1
    let bestDot = -Infinity

    for (let i = 0; i < PANEL_DEFS.length; i++) {
      if (panelRefs.current[i].detached) continue
      const p = PANEL_DEFS[i]
      _toPanel.set(p.pos[0], p.pos[1], p.pos[2]).sub(orbitPos).normalize()
      const dot = _toPanel.dot(aimDir)
      if (dot > bestDot) {
        bestDot = dot
        bestIdx = i
      }
    }
    return bestIdx
  }, [])

  // Track which panel is currently targeted for highlight
  const targetedPanel = useRef(-1)

  useFrame((state, delta) => {
    const store = useGameStore.getState()

    // Always compute targeted panel when mounted (for highlight)
    if (store.carSmashMounted) {
      const yaw = store.carSmashYaw
      const orbitX = Math.sin(yaw) * CAR_SMASH.ORBIT_RADIUS
      const orbitZ = Math.cos(yaw) * CAR_SMASH.ORBIT_RADIUS
      _playerDir.set(-Math.sin(yaw), 0, -Math.cos(yaw))
      _panelPos.set(orbitX, CAR_SMASH.ORBIT_HEIGHT, orbitZ)
      targetedPanel.current = findClosestPanel(_panelPos, _playerDir)
    } else {
      targetedPanel.current = -1
    }

    // Damage is applied on impact (set by Hammer when the strike lands),
    // not when the swing starts, so the hit syncs with the animation.
    if (store.carSmashImpact) {
      const idx = targetedPanel.current
      if (idx >= 0) {
        _hitDir.copy(_playerDir)
        hitPanel(idx, _hitDir)
      }
      store.setCarSmashImpact(false)
    }

    if (store.carSmashReset) {
      resetAll()
      store.setCarSmashReset(false)
    }

    // Update panel visuals
    panelRefs.current.forEach((panelData, i) => {
      const mesh = panelData.meshRef.current
      if (!mesh) return

      const dmg = panelData.damage
      const def = PANEL_DEFS[i]

      if (panelData.detached) {
        // --- Flying panel physics ---
        panelData.vel.y -= 9.81 * delta // gravity
        panelData.flyPos.x += panelData.vel.x * delta
        panelData.flyPos.y += panelData.vel.y * delta
        panelData.flyPos.z += panelData.vel.z * delta

        panelData.flyRot.x += panelData.angVel.x * delta
        panelData.flyRot.y += panelData.angVel.y * delta
        panelData.flyRot.z += panelData.angVel.z * delta

        // Bounce off ground
        if (panelData.flyPos.y < -0.2) {
          panelData.flyPos.y = -0.2
          panelData.vel.y *= -0.3 // damped bounce
          panelData.vel.x *= 0.7
          panelData.vel.z *= 0.7
          panelData.angVel.multiplyScalar(0.5)
        }

        // Friction/drag when on ground
        if (panelData.flyPos.y <= -0.15) {
          panelData.vel.x *= (1 - 3 * delta)
          panelData.vel.z *= (1 - 3 * delta)
          panelData.angVel.multiplyScalar(1 - 2 * delta)
        }

        mesh.position.copy(panelData.flyPos)
        mesh.rotation.set(panelData.flyRot.x, panelData.flyRot.y, panelData.flyRot.z)
      } else {
        // --- Attached panel deformation ---

        // Decay shake
        panelData.shakeOffset.multiplyScalar(1 - 12 * delta)
        panelData.shakeRot.multiplyScalar(1 - 12 * delta)

        // Dent displacement — inward toward car center, more volatile with randomness
        const dentScale = dmg * CAR_SMASH.MAX_DENT_OFFSET
        const dirX = def.pos[0] === 0 ? 0 : (def.pos[0] > 0 ? -1 : 1)
        const dirY = def.pos[1] > 1.0 ? -1 : (dmg > 0.5 ? -0.5 : 0)
        const dirZ = def.pos[2] === 0 ? 0 : (def.pos[2] > 0 ? -1 : 1)

        // Each hit adds a bit of permanent random offset via seeded noise
        const permX = seededRand(i * 100 + 1) - 0.5
        const permZ = seededRand(i * 100 + 2) - 0.5
        const permJitter = dmg * 0.15

        mesh.position.set(
          def.pos[0] + dirX * dentScale + permX * permJitter + panelData.shakeOffset.x,
          def.pos[1] + dirY * dentScale + panelData.shakeOffset.y,
          def.pos[2] + dirZ * dentScale + permZ * permJitter + panelData.shakeOffset.z
        )

        // Rotation deformation — gets increasingly wild with damage
        const rotScale = dmg * CAR_SMASH.MAX_DENT_ROTATION
        const r1 = seededRand(i * 200 + 1) - 0.5
        const r2 = seededRand(i * 200 + 2) - 0.5
        const r3 = seededRand(i * 200 + 3) - 0.5
        mesh.rotation.set(
          def.rot[0] + r1 * rotScale * 2 + panelData.shakeRot.x,
          def.rot[1] + r2 * rotScale * 2 + panelData.shakeRot.y,
          def.rot[2] + r3 * rotScale * 2 + panelData.shakeRot.z
        )
      }

      // Flash white on impact, then lerp to damage color
      if (panelData.flashTimer > 0) {
        panelData.flashTimer -= delta
        const flashT = panelData.flashTimer / 0.1
        if (def.isGlass) {
          _color.set('#ffffff').lerp(GLASS_DAMAGED, 1 - flashT)
        } else {
          _color.set('#ffffff').lerp(PRISTINE_COLOR, 1 - flashT)
        }
      } else if (def.isGlass) {
        _color.copy(GLASS_PRISTINE).lerp(GLASS_DAMAGED, dmg)
      } else {
        _color.copy(PRISTINE_COLOR).lerp(DAMAGED_COLOR, dmg)
      }
      mesh.material.color.copy(_color)

      if (def.isGlass) {
        mesh.material.opacity = 0.5 - dmg * 0.3
      }

      // Targeting highlight — pulsing emissive on the aimed panel
      const isTargeted = (i === targetedPanel.current) && !panelData.detached
      if (isTargeted) {
        const pulse = 0.15 + Math.sin(state.clock.elapsedTime * 6) * 0.1
        mesh.material.emissive = mesh.material.emissive || new THREE.Color()
        mesh.material.emissive.setRGB(1, 0.6, 0)
        mesh.material.emissiveIntensity = pulse
      } else if (panelData.flashTimer <= 0) {
        mesh.material.emissiveIntensity = 0
      }
    })
  })

  return (
    <group position={[0, 0.35, 0]}>
      {/* Underbody */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <boxGeometry args={[1.7, 0.25, 3.6]} />
        <meshStandardMaterial color="#222222" roughness={0.8} />
      </mesh>

      {/* Wheels */}
      {[[-0.9, 0.2, -1.1], [0.9, 0.2, -1.1], [-0.9, 0.2, 1.1], [0.9, 0.2, 1.1]].map((pos, i) => (
        <mesh key={`wheel-${i}`} castShadow position={pos} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 0.2, 12]} />
          <meshStandardMaterial color="#111111" roughness={0.9} />
        </mesh>
      ))}

      {/* Damageable panels */}
      {PANEL_DEFS.map((def, i) => (
        <mesh
          key={def.name}
          ref={panelRefs.current[i].meshRef}
          castShadow
          receiveShadow
          position={def.pos}
          rotation={def.rot}
        >
          <boxGeometry args={def.size} />
          {def.isGlass ? (
            <meshStandardMaterial
              color={GLASS_PRISTINE}
              transparent
              opacity={0.5}
              roughness={0.1}
              metalness={0.3}
            />
          ) : (
            <meshStandardMaterial
              color={PRISTINE_COLOR}
              roughness={0.4}
              metalness={0.2}
            />
          )}
        </mesh>
      ))}
    </group>
  )
})

// ─── Debris particle system ──────────────────────────────────────────

// Module-level debris pool — CarSmash's spawnDebris writes here, DebrisSystem reads
let _debrisQueue = []

function spawnDebris(panelPos, hitDir) {
  const now = performance.now() / 1000
  for (let i = 0; i < CAR_SMASH.DEBRIS_COUNT; i++) {
    const speed = CAR_SMASH.DEBRIS_SPEED * (0.5 + seededRand(now * 1000 + i) * 1.0)
    const spread = 0.8
    _debrisQueue.push({
      pos: new THREE.Vector3(
        panelPos[0] + (seededRand(now * 1000 + i + 50) - 0.5) * 0.3,
        panelPos[1] + (seededRand(now * 1000 + i + 60) - 0.5) * 0.3 + 0.35,
        panelPos[2] + (seededRand(now * 1000 + i + 70) - 0.5) * 0.3
      ),
      vel: new THREE.Vector3(
        hitDir.x * speed + (seededRand(now * 1000 + i + 100) - 0.5) * spread * speed,
        1.5 + seededRand(now * 1000 + i + 200) * speed * 0.6,
        hitDir.z * speed + (seededRand(now * 1000 + i + 300) - 0.5) * spread * speed
      ),
      life: CAR_SMASH.DEBRIS_LIFETIME,
      maxLife: CAR_SMASH.DEBRIS_LIFETIME,
      size: 0.03 + seededRand(now * 1000 + i + 400) * 0.06,
      isSpark: seededRand(now * 1000 + i + 500) > 0.5,
    })
  }
}

const MAX_DEBRIS = 80

function DebrisSystem() {
  const particles = useRef([])
  const meshRefs = useRef([])

  // Pre-allocate mesh refs
  if (meshRefs.current.length === 0) {
    for (let i = 0; i < MAX_DEBRIS; i++) {
      meshRefs.current.push(React.createRef())
    }
  }

  useFrame((state, delta) => {
    // Pull in new debris from queue
    while (_debrisQueue.length > 0 && particles.current.length < MAX_DEBRIS) {
      particles.current.push(_debrisQueue.shift())
    }
    _debrisQueue.length = 0 // drop overflow

    // Update existing particles
    for (let i = particles.current.length - 1; i >= 0; i--) {
      const p = particles.current[i]
      p.life -= delta
      if (p.life <= 0) {
        particles.current.splice(i, 1)
        continue
      }

      p.vel.y -= 9.81 * delta
      p.pos.x += p.vel.x * delta
      p.pos.y += p.vel.y * delta
      p.pos.z += p.vel.z * delta

      // Bounce off ground
      if (p.pos.y < 0) {
        p.pos.y = 0
        p.vel.y *= -0.2
        p.vel.x *= 0.6
        p.vel.z *= 0.6
      }
    }

    // Update mesh transforms
    for (let i = 0; i < MAX_DEBRIS; i++) {
      const mesh = meshRefs.current[i]?.current
      if (!mesh) continue

      if (i < particles.current.length) {
        const p = particles.current[i]
        mesh.visible = true
        mesh.position.copy(p.pos)
        const lifeRatio = p.life / p.maxLife
        const s = p.size * lifeRatio
        mesh.scale.set(s, s, s)
        if (p.isSpark) {
          mesh.material.color.setHSL(0.1, 1, 0.3 + lifeRatio * 0.7)
          mesh.material.emissive.setHSL(0.1, 1, lifeRatio * 0.5)
        } else {
          mesh.material.color.setRGB(0.3, 0.3, 0.3)
          mesh.material.emissive.setRGB(0, 0, 0)
        }
      } else {
        mesh.visible = false
      }
    }
  })

  return (
    <group position={[0, 0.35, 0]}>
      {Array.from({ length: MAX_DEBRIS }, (_, i) => (
        <mesh key={i} ref={meshRefs.current[i]} visible={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color="#ffaa33"
            emissive="#ff6600"
            emissiveIntensity={1}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ─── Hammer ──────────────────────────────────────────────────────────
//
// Structure (outside-in):
//   positionGroup  — placed at orbit, rotated to face car center
//     lungeGroup   — translates forward (local -Z) during strike to close the gap
//       pivotGroup — at hand height; rotates around local X for the overhead arc
//         handle mesh + head mesh
//
// The handle is 1.8m so the head can arc from behind the player all the
// way to the car surface when combined with the forward lunge.

const PHASE_IDLE = 0
const PHASE_WINDUP = 1
const PHASE_STRIKE = 2
const PHASE_IMPACT = 3
const PHASE_RECOIL = 4

const HANDLE_LENGTH = 1.8
const LUNGE_DISTANCE = 1.6   // how far toward car the whole assembly moves during strike
const IDLE_TILT = 0.5        // slight backward tilt at rest so the hammer is visually "ready"

function Hammer() {
  const posGroupRef = useRef()   // orbit position + face car
  const lungeGroupRef = useRef() // forward lunge
  const pivotGroupRef = useRef() // swing arc rotation
  const headRef = useRef()       // for impact glow

  const swingPhase = useRef(PHASE_IDLE)
  const phaseTimer = useRef(0)

  useFrame((state, delta) => {
    const store = useGameStore.getState()
    if (!posGroupRef.current) return

    const mounted = store.carSmashMounted
    posGroupRef.current.visible = mounted
    if (!mounted) {
      swingPhase.current = PHASE_IDLE
      return
    }

    // ── Position + face car ──
    const yaw = store.carSmashYaw
    const orbitX = Math.sin(yaw) * CAR_SMASH.ORBIT_RADIUS
    const orbitZ = Math.cos(yaw) * CAR_SMASH.ORBIT_RADIUS
    posGroupRef.current.position.set(orbitX, CAR_SMASH.ORBIT_HEIGHT, orbitZ)
    // Rotate so local -Z points toward car center (origin)
    posGroupRef.current.rotation.set(0, yaw, 0)

    // ── Trigger ──
    // Hammer is responsible for clearing the swing flag (SmashCar only reads it)
    if (store.carSmashSwing) {
      if (swingPhase.current === PHASE_IDLE) {
        swingPhase.current = PHASE_WINDUP
        phaseTimer.current = 0
      }
      store.setCarSmashSwing(false)
    }

    // ── Phase animation ──
    phaseTimer.current += delta
    let pivotAngle = IDLE_TILT  // rotation.x on pivotGroup (positive = tilted back)
    let lunge = 0               // forward translation on lungeGroup (positive = toward car)
    let shake = 0               // lateral vibration on pivotGroup.rotation.z

    switch (swingPhase.current) {
      case PHASE_WINDUP: {
        // Pull hammer up and back over head
        const t = Math.min(phaseTimer.current / CAR_SMASH.SWING_WINDUP, 1)
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) * (-2 * t + 2) / 2 // ease in-out
        pivotAngle = IDLE_TILT + eased * 2.0   // up to ~143° back
        lunge = -eased * 0.2                     // slight pull-back
        if (t >= 1) {
          swingPhase.current = PHASE_STRIKE
          phaseTimer.current = 0
        }
        break
      }
      case PHASE_STRIKE: {
        // Fast forward slam — arc forward + lunge toward car
        const t = Math.min(phaseTimer.current / CAR_SMASH.SWING_STRIKE, 1)
        const eased = 1 - (1 - t) * (1 - t) * (1 - t) // cubic ease out (explosive start)
        const startAngle = IDLE_TILT + 2.0              // where windup ended
        const endAngle = -1.3                            // overshoot past horizontal
        pivotAngle = startAngle + eased * (endAngle - startAngle)
        lunge = -0.2 + eased * (LUNGE_DISTANCE + 0.2)   // lunge from pull-back to full forward
        if (t >= 1) {
          swingPhase.current = PHASE_IMPACT
          phaseTimer.current = 0
          // Hammer just landed — tell SmashCar to apply damage NOW
          store.setCarSmashImpact(true)
        }
        break
      }
      case PHASE_IMPACT: {
        // Hold at impact — violent vibration, head pressed against car
        const t = Math.min(phaseTimer.current / CAR_SMASH.SWING_IMPACT_HOLD, 1)
        pivotAngle = -1.3
        lunge = LUNGE_DISTANCE
        // Rapid shake that decays
        const shakeDecay = 1 - t
        shake = Math.sin(phaseTimer.current * 140) * 0.12 * shakeDecay
        // Also jitter the lunge slightly
        lunge += Math.sin(phaseTimer.current * 90) * 0.05 * shakeDecay
        if (t >= 1) {
          swingPhase.current = PHASE_RECOIL
          phaseTimer.current = 0
        }
        break
      }
      case PHASE_RECOIL: {
        // Pull back to ready position with dampened bounce
        const t = Math.min(phaseTimer.current / CAR_SMASH.SWING_RECOIL, 1)
        const eased = t * (2 - t)  // ease out
        const wobble = Math.sin(t * Math.PI * 4) * 0.2 * (1 - t)
        pivotAngle = -1.3 + eased * (-1.3 - IDLE_TILT) * -1 + wobble
        lunge = LUNGE_DISTANCE * (1 - eased)
        if (t >= 1) {
          swingPhase.current = PHASE_IDLE
          phaseTimer.current = 0
        }
        break
      }
    }

    // ── Apply transforms ──
    lungeGroupRef.current.position.z = -lunge  // local -Z = toward car
    pivotGroupRef.current.rotation.x = pivotAngle
    pivotGroupRef.current.rotation.z = shake

    // ── Head glow on impact ──
    if (headRef.current) {
      const isImpact = swingPhase.current === PHASE_IMPACT
      headRef.current.material.emissiveIntensity = isImpact ? 0.6 : 0
    }
  })

  return (
    <group ref={posGroupRef} visible={false}>
      <group ref={lungeGroupRef}>
        {/* Pivot at hand height — this is where the swing arc rotates */}
        <group ref={pivotGroupRef} position={[0, 0, 0]}>
          {/* Handle — long shaft extending upward from hands */}
          <mesh castShadow position={[0, HANDLE_LENGTH / 2, 0]}>
            <cylinderGeometry args={[0.05, 0.065, HANDLE_LENGTH, 8]} />
            <meshStandardMaterial color="#8B4513" roughness={0.6} />
          </mesh>
          {/* Grip wrapping at bottom */}
          <mesh castShadow position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.3, 8]} />
            <meshStandardMaterial color="#333333" roughness={0.9} />
          </mesh>
          {/* Head — heavy steel sledgehammer block at top of handle */}
          <group position={[0, HANDLE_LENGTH + 0.1, 0]}>
            <mesh ref={headRef} castShadow>
              <boxGeometry args={[0.22, 0.22, 0.5]} />
              <meshStandardMaterial
                color="#555555"
                roughness={0.2}
                metalness={0.9}
                emissive="#ff4400"
                emissiveIntensity={0}
              />
            </mesh>
            {/* Strike faces */}
            <mesh castShadow position={[0, 0, 0.27]}>
              <boxGeometry args={[0.24, 0.24, 0.04]} />
              <meshStandardMaterial color="#444444" roughness={0.15} metalness={0.95} />
            </mesh>
            <mesh castShadow position={[0, 0, -0.27]}>
              <boxGeometry args={[0.24, 0.24, 0.04]} />
              <meshStandardMaterial color="#444444" roughness={0.15} metalness={0.95} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}
