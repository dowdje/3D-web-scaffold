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
const _frontVector = new THREE.Vector3()
const _sideVector = new THREE.Vector3()
const _cameraDirection = new THREE.Vector3()

export function Player({ spawnPosition = [0, 3, 0] }) {
  const rigidBodyRef = useRef()
  const modelRef = useRef()

  const [, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()

  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition)
  const setIsGrounded = useGameStore((s) => s.setIsGrounded)
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

    const { forward, backward, left, right, jump, sprint } = getKeys()
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

    // --- Movement direction relative to camera ---
    const camera = state.camera
    camera.getWorldDirection(_cameraDirection)
    _cameraDirection.y = 0
    _cameraDirection.normalize()

    const cameraRight = new THREE.Vector3()
      .crossVectors(_cameraDirection, THREE.Object3D.DEFAULT_UP)
      .normalize()

    _frontVector.set(0, 0, 0)
    _sideVector.set(0, 0, 0)

    if (forward) _frontVector.add(_cameraDirection)
    if (backward) _frontVector.sub(_cameraDirection)
    if (left) _sideVector.sub(cameraRight)
    if (right) _sideVector.add(cameraRight)

    _direction.copy(_frontVector).add(_sideVector).normalize()

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

    // --- Rotate model to face movement direction ---
    if (modelRef.current && _direction.length() > 0.1) {
      const targetAngle = Math.atan2(_direction.x, _direction.z)
      const currentRotation = modelRef.current.rotation.y
      const lerpedAngle = THREE.MathUtils.lerp(currentRotation, targetAngle, 0.15)
      modelRef.current.rotation.y = lerpedAngle
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
