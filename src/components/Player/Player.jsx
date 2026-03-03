import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

import { Controls } from '../../systems/controls'
import { PLAYER } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'
import { PlayerModel } from './PlayerModel'

const _direction = new THREE.Vector3()

export function Player({ spawnPosition = [0, 3, 0] }) {
  const rigidBodyRef = useRef()
  const modelRef = useRef()
  const yawRef = useRef(0)

  const [, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()

  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition)
  const setIsGrounded = useGameStore((s) => s.setIsGrounded)
  const setPlayerYaw = useGameStore((s) => s.setPlayerYaw)
  const respawnPoint = useGameStore((s) => s.respawnPoint)

  // Jump state
  const grounded = useRef(false)
  const coyoteTimer = useRef(0)
  const jumpBuffered = useRef(false)
  const jumpBufferTimer = useRef(0)
  const canJump = useRef(true)

  // Cast a ray downward from the player to detect ground
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

    const { forward, backward, left, right, strafeLeft, strafeRight, jump, sprint } = getKeys()
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
    setIsGrounded(isOnGround)

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

    // Strafe: perpendicular to facing direction (right is 90° clockwise from forward)
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

    // Speed
    const speed = sprint ? PLAYER.SPRINT_SPEED : PLAYER.WALK_SPEED
    const controlMultiplier = isOnGround ? 1 : PLAYER.AIR_CONTROL

    // Apply movement
    const moveX = _direction.x * speed * controlMultiplier
    const moveZ = _direction.z * speed * controlMultiplier

    if (_direction.length() > 0) {
      rb.setLinvel(
        {
          x: moveX,
          y: velocity.y,
          z: moveZ,
        },
        true
      )
    } else if (isOnGround) {
      // Apply damping when no input and on ground
      rb.setLinvel(
        {
          x: velocity.x * (1 - PLAYER.LINEAR_DAMPING),
          y: velocity.y,
          z: velocity.z * (1 - PLAYER.LINEAR_DAMPING),
        },
        true
      )
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

    // Allow jump again when key released
    if (!jump) {
      canJump.current = true
    }

    // Clamp fall speed
    if (velocity.y < PLAYER.MAX_FALL_SPEED) {
      rb.setLinvel({ x: velocity.x, y: PLAYER.MAX_FALL_SPEED, z: velocity.z }, true)
    }

    // --- Update store ---
    setPlayerPosition([position.x, position.y, position.z])
    setPlayerYaw(yawRef.current)

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
