import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

import { Controls } from '../../systems/controls'
import { PLAYER } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'
import { PlayerModel } from './PlayerModel'
import { getEntityByCollider } from '../../utils/entityRegistry'

const _direction = new THREE.Vector3()

export function Player({ spawnPosition = [0, 3, 0] }) {
  const rigidBodyRef = useRef()
  const modelRef = useRef()
  const yawRef = useRef(0)

  const [, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()

  const respawnPoint = useGameStore((s) => s.respawnPoint)

  // Jump state
  const grounded = useRef(false)
  const coyoteTimer = useRef(0)
  const jumpBuffered = useRef(false)
  const jumpBufferTimer = useRef(0)
  const canJump = useRef(true)

  // Weapon swap/reload — single-press tracking
  const prevWeaponSwap = useRef(false)
  const prevReload = useRef(false)
  const prevFire = useRef(false)

  // Firing timing
  const lastFireTime = useRef(0)

  const checkGrounded = () => {
    const rb = rigidBodyRef.current
    if (!rb) return false

    const pos = rb.translation()
    const origin = {
      x: pos.x,
      y: pos.y - PLAYER.CAPSULE_HALF_HEIGHT - PLAYER.CAPSULE_RADIUS,
      z: pos.z,
    }
    const direction = { x: 0, y: -1, z: 0 }

    const ray = new rapier.Ray(origin, direction)
    const hit = world.castRay(ray, PLAYER.GROUND_CHECK_DIST, true)

    return hit !== null
  }

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current
    if (!rb) return

    const store = useGameStore.getState()
    if (store.isDead) return

    const { forward, backward, left, right, strafeLeft, strafeRight, jump, sprint, weaponSwap, reload, fire } = getKeys()
    const velocity = rb.linvel()
    const position = rb.translation()

    // --- Respawn if fallen off ---
    if (position.y < PLAYER.RESPAWN_Y) {
      rb.setTranslation(
        { x: respawnPoint[0], y: respawnPoint[1], z: respawnPoint[2] },
        true
      )
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // --- Ground check ---
    const isOnGround = checkGrounded()
    grounded.current = isOnGround

    // Coyote time
    if (isOnGround) {
      coyoteTimer.current = PLAYER.COYOTE_TIME
      canJump.current = true
    } else {
      coyoteTimer.current = Math.max(0, coyoteTimer.current - delta)
    }

    // Jump buffer
    if (jump && !isOnGround) {
      jumpBuffered.current = true
      jumpBufferTimer.current = PLAYER.JUMP_BUFFER
    }
    if (jumpBufferTimer.current > 0) {
      jumpBufferTimer.current -= delta
      if (jumpBufferTimer.current <= 0) jumpBuffered.current = false
    }

    // --- Tank controls: A/D rotate, W/S move along facing direction ---
    if (left) yawRef.current += PLAYER.TURN_SPEED * delta
    if (right) yawRef.current -= PLAYER.TURN_SPEED * delta

    // Forward vector from yaw
    const forwardX = -Math.sin(yawRef.current)
    const forwardZ = -Math.cos(yawRef.current)

    let moveInput = 0
    if (forward) moveInput += 1
    if (backward) moveInput -= 1

    // Strafe: perpendicular to facing direction
    let strafeInput = 0
    if (strafeRight) strafeInput += 1
    if (strafeLeft) strafeInput -= 1

    const rightX = -forwardZ
    const rightZ = forwardX

    _direction.set(
      forwardX * moveInput + rightX * strafeInput,
      0,
      forwardZ * moveInput + rightZ * strafeInput
    )
    if (_direction.length() > 1) _direction.normalize()

    const speed = sprint ? PLAYER.SPRINT_SPEED : PLAYER.WALK_SPEED
    const controlMultiplier = isOnGround ? 1 : PLAYER.AIR_CONTROL

    const moveX = _direction.x * speed * controlMultiplier
    const moveZ = _direction.z * speed * controlMultiplier

    if (_direction.length() > 0) {
      rb.setLinvel({ x: moveX, y: velocity.y, z: moveZ }, true)
    } else if (isOnGround) {
      rb.setLinvel({
        x: velocity.x * (1 - PLAYER.LINEAR_DAMPING),
        y: velocity.y,
        z: velocity.z * (1 - PLAYER.LINEAR_DAMPING),
      }, true)
    }

    // --- Jump ---
    const shouldJump =
      (jump && coyoteTimer.current > 0 && canJump.current) ||
      (jumpBuffered.current && isOnGround && canJump.current)

    if (shouldJump) {
      rb.setLinvel({ x: velocity.x, y: PLAYER.JUMP_FORCE, z: velocity.z }, true)
      coyoteTimer.current = 0
      canJump.current = false
      jumpBuffered.current = false
    }

    if (!jump) {
      canJump.current = true
    }

    // Clamp fall speed
    if (velocity.y < PLAYER.MAX_FALL_SPEED) {
      rb.setLinvel({ x: velocity.x, y: PLAYER.MAX_FALL_SPEED, z: velocity.z }, true)
    }

    // --- Weapon swap (single press) ---
    if (weaponSwap && !prevWeaponSwap.current) {
      store.swapWeapon?.()
    }
    prevWeaponSwap.current = weaponSwap

    // --- Reload (single press) ---
    if (reload && !prevReload.current) {
      store.startReload?.()
    }
    prevReload.current = reload

    // --- Fire (K key) — fires projectile straight ahead ---
    if (fire && !prevFire.current) {
      const now = performance.now()
      const weapon = store.weapons?.[store.activeWeapon]
      const weaponDef = store.getWeaponDef?.()

      if (weapon && weaponDef && !store.reloading && weapon.ammo > 0) {
        const fireInterval = 1000 / weaponDef.fireRate
        if (now - lastFireTime.current >= fireInterval) {
          store.fire()
          lastFireTime.current = now

          const spawnY = position.y + PLAYER.EYE_HEIGHT
          const projSpeed = weaponDef.projectileSpeed || 40

          store.addProjectile?.({
            position: [
              position.x + forwardX * 1.5,
              spawnY,
              position.z + forwardZ * 1.5,
            ],
            velocity: [
              forwardX * projSpeed,
              0,
              forwardZ * projSpeed,
            ],
            damage: weaponDef.damage,
            splashRadius: weaponDef.splashRadius || 8,
            time: now,
          })
        }
      }
    }
    prevFire.current = fire

    // --- Update store (single batched call to minimize subscriber notifications) ---
    useGameStore.setState({
      playerPosition: [position.x, position.y, position.z],
      playerYaw: yawRef.current,
      isGrounded: isOnGround,
    })

    // --- Rotate model to match yaw ---
    if (modelRef.current) {
      modelRef.current.rotation.y = yawRef.current
    }
  })

  return (
    <RigidBody
      ref={rigidBodyRef}
      type="dynamic"
      colliders={false}
      mass={PLAYER.MASS}
      position={spawnPosition}
      enabledRotations={[false, false, false]}
      linearDamping={0}
      angularDamping={0}
      name="player"
    >
      <CapsuleCollider
        args={[PLAYER.CAPSULE_HALF_HEIGHT, PLAYER.CAPSULE_RADIUS]}
        friction={0.7}
        restitution={0}
      />
      <group ref={modelRef}>
        <PlayerModel />
      </group>
    </RigidBody>
  )
}
