import React, { useRef, useEffect, useState, createRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

import { Controls } from '../../systems/controls'
import { PLAYER, ROPE, GOLF, WORM, DIRT_BIKE } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'
import { PlayerModel } from './PlayerModel'
import { GolfBall } from './GolfBall'
import { GolfClub } from './GolfClub'

const _direction = new THREE.Vector3()

export function Player({
  playerId = 1,
  config = PLAYER,
  spawnPosition = [0, 3, 0],
  children,
}) {
  const rigidBodyRef = useRef()
  const modelRef = useRef()
  const yawRef = useRef(0)

  const [, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()

  // Jump state
  const grounded = useRef(false)
  const coyoteTimer = useRef(0)
  const jumpBuffered = useRef(false)
  const jumpBufferTimer = useRef(0)
  const canJump = useRef(true)
  const airJumpsUsed = useRef(0) // Track air jumps for double-jump
  const jumpGraceTimer = useRef(0) // skip ground damping briefly after jumping

  // Rope grab state
  const grabbedRope = useRef(null)  // { ropeId, handleRef }
  const grabKeyWasDown = useRef(false)
  const justReleasedRope = useRef(false) // skip movement on release frame

  // Worm mount state
  const mountedWorm = useRef(false)
  const mountKeyWasDown = useRef(false)

  // Dirt bike mount state
  const mountedBike = useRef(false)

  // Golf state
  const golfActive = useRef(false)
  const golfPower = useRef(0)
  const golfKeyWasDown = useRef(false)
  const swingKeyWasDown = useRef(false)
  const golfSavedPos = useRef({ x: 0, y: 0, z: 0 })
  const golfBallRef = useRef(null)
  const [golfBalls, setGolfBalls] = useState([])

  // Ground surface friction (detected via raycast)
  const surfaceFriction = useRef(1)

  // Cast a ray downward from the player to detect ground + surface friction
  const checkGrounded = () => {
    const rb = rigidBodyRef.current
    if (!rb) return false

    const pos = rb.translation()
    const origin = {
      x: pos.x,
      y: pos.y - config.CAPSULE_HALF_HEIGHT - config.CAPSULE_RADIUS,
      z: pos.z,
    }
    const direction = { x: 0, y: -1, z: 0 }

    const ray = new rapier.Ray(origin, direction)
    const hit = world.castRay(ray, config.GROUND_CHECK_DIST, true)

    if (hit !== null) {
      const collider = hit.collider
      if (collider) {
        surfaceFriction.current = collider.friction()
      }
      return true
    }

    return false
  }

  const tryGrab = () => {
    const rb = rigidBodyRef.current
    if (!rb || grabbedRope.current) return

    const pos = rb.translation()
    const { ropeRegistry } = useGameStore.getState()

    let closestId = null
    let closestDist = ROPE.GRAB_DISTANCE
    let closestEntry = null

    for (const [ropeId, entry] of Object.entries(ropeRegistry)) {
      const handlePos = entry.getWorldPosition()
      if (!handlePos) continue
      const dx = handlePos[0] - pos.x
      const dy = handlePos[1] - pos.y
      const dz = handlePos[2] - pos.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      if (dist < closestDist) {
        closestDist = dist
        closestId = ropeId
        closestEntry = entry
      }
    }

    if (!closestId || !closestEntry) return

    grabbedRope.current = { ropeId: closestId, handleRef: closestEntry.handleRef }
    useGameStore.getState().setRopeGrab(playerId, { ropeId: closestId })
  }

  const releaseGrab = () => {
    if (!grabbedRope.current) return
    // Launch player with the handle's current velocity + upward boost
    const rb = rigidBodyRef.current
    const handleRb = grabbedRope.current.handleRef.current
    if (rb && handleRb) {
      const hv = handleRb.linvel()
      rb.setLinvel({ x: hv.x, y: Math.max(hv.y, 0) + config.JUMP_FORCE, z: hv.z }, true)
    }
    grabbedRope.current = null
    justReleasedRope.current = true
    jumpGraceTimer.current = 0.3
    useGameStore.getState().clearRopeGrab(playerId)
  }

  const enterGolfMode = (playerPos) => {
    golfActive.current = true
    golfPower.current = 0
    swingKeyWasDown.current = false
    golfSavedPos.current = { x: playerPos.x, y: playerPos.y, z: playerPos.z }

    const spawnX = playerPos.x - Math.sin(yawRef.current) * GOLF.BALL_SPAWN_DISTANCE
    const spawnZ = playerPos.z - Math.cos(yawRef.current) * GOLF.BALL_SPAWN_DISTANCE
    const spawnY = playerPos.y - config.CAPSULE_HALF_HEIGHT - config.CAPSULE_RADIUS + GOLF.BALL_RADIUS

    const newBall = { id: Date.now(), position: [spawnX, spawnY, spawnZ], ref: createRef() }
    golfBallRef.current = newBall.ref
    setGolfBalls((prev) => [...prev, newBall])
    useGameStore.getState().setGolfMode(true)
    useGameStore.getState().setGolfPower(0)
  }

  const executeSwing = () => {
    const power = golfPower.current
    const force = GOLF.MIN_FORCE + power * (GOLF.MAX_FORCE - GOLF.MIN_FORCE)

    const ballRb = golfBallRef.current?.current
    if (ballRb) {
      const yaw = yawRef.current
      const cosAngle = Math.cos(GOLF.LAUNCH_ANGLE)
      const sinAngle = Math.sin(GOLF.LAUNCH_ANGLE)
      ballRb.setLinvel({
        x: -Math.sin(yaw) * cosAngle * force / GOLF.BALL_MASS,
        y: sinAngle * force / GOLF.BALL_MASS,
        z: -Math.cos(yaw) * cosAngle * force / GOLF.BALL_MASS,
      }, true)
    }

    golfActive.current = false
    golfPower.current = 0
    golfBallRef.current = null
    useGameStore.getState().setGolfMode(false)
    useGameStore.getState().setGolfPower(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      grabbedRope.current = null
      useGameStore.getState().clearRopeGrab(playerId)
      if (golfActive.current) {
        golfActive.current = false
        useGameStore.getState().setGolfMode(false)
      }
    }
  }, [])

  useFrame((state, delta) => {
    const rb = rigidBodyRef.current
    if (!rb) return

    const { activePlayer } = useGameStore.getState()
    const isActive = activePlayer === playerId

    // Store selectors based on playerId
    const setPosition = playerId === 1
      ? useGameStore.getState().setPlayerPosition
      : useGameStore.getState().setPlayer2Position
    const setYaw = playerId === 1
      ? useGameStore.getState().setPlayerYaw
      : useGameStore.getState().setPlayer2Yaw

    const velocity = rb.linvel()
    const position = rb.translation()

    // --- Respawn if fallen off ---
    const respawnPoint = useGameStore.getState().respawnPoint
    if (position.y < config.RESPAWN_Y) {
      rb.setTranslation(
        { x: spawnPosition[0], y: spawnPosition[1], z: spawnPosition[2] },
        true
      )
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
      return
    }

    // --- Ground check ---
    const isOnGround = checkGrounded()
    grounded.current = isOnGround
    if (playerId === 1) {
      useGameStore.getState().setIsGrounded(isOnGround)
    }

    // Coyote time
    if (isOnGround) {
      coyoteTimer.current = config.COYOTE_TIME
      canJump.current = true
      airJumpsUsed.current = 0
    } else {
      coyoteTimer.current = Math.max(0, coyoteTimer.current - delta)
    }

    // Jump grace timer countdown (prevents ground damping from killing jump momentum)
    if (jumpGraceTimer.current > 0) {
      jumpGraceTimer.current -= delta
    }

    // --- Only process input if this is the active player ---
    if (isActive) {
      const { forward, backward, left, right, strafeLeft, strafeRight, jump, sprint, grab, golfMode: golfKey, swing: swingKey, mount: mountKey } = getKeys()

      // --- Worm mount/dismount ---
      const mountDown = !!mountKey
      const mountPressed = mountDown && !mountKeyWasDown.current
      mountKeyWasDown.current = mountDown

      if (mountPressed) {
        if (mountedWorm.current) {
          // Dismount worm
          mountedWorm.current = false
          useGameStore.getState().setWormMounted(false)
          const wormHeadRef = useGameStore.getState().wormHeadRef
          if (wormHeadRef?.current) {
            const headPos = wormHeadRef.current.translation()
            rb.setTranslation({ x: headPos.x + 2, y: headPos.y + 1, z: headPos.z }, true)
            rb.setLinvel({ x: 0, y: 2, z: 0 }, true)
          }
        } else if (mountedBike.current) {
          // Dismount bike
          mountedBike.current = false
          useGameStore.getState().setBikeMounted(false)
          useGameStore.getState().setBikeSpeed(0)
          const bikeRef = useGameStore.getState().bikeRef
          if (bikeRef?.current) {
            const bikePos = bikeRef.current.translation()
            rb.setTranslation({ x: bikePos.x + 2, y: bikePos.y + 1, z: bikePos.z }, true)
            rb.setLinvel({ x: 0, y: 2, z: 0 }, true)
          }
        } else if (useGameStore.getState().nearWorm) {
          // Mount worm
          mountedWorm.current = true
          useGameStore.getState().setWormMounted(true)
        } else if (useGameStore.getState().nearBike) {
          // Mount bike
          mountedBike.current = true
          useGameStore.getState().setBikeMounted(true)
        }
      }

      // While mounted on worm — lock player to worm head, skip all other movement
      if (mountedWorm.current) {
        const wormHeadRef = useGameStore.getState().wormHeadRef
        if (wormHeadRef?.current) {
          const headPos = wormHeadRef.current.translation()
          rb.setTranslation({ x: headPos.x, y: headPos.y + WORM.MOUNT_OFFSET_Y, z: headPos.z }, true)
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }
        // Sync player yaw to worm yaw so camera orbits behind worm
        const wormYaw = useGameStore.getState().wormYaw
        yawRef.current = wormYaw
        // Update store position/yaw and rotate model
        const updatedPos = rb.translation()
        setPosition([updatedPos.x, updatedPos.y, updatedPos.z])
        setYaw(wormYaw)
        if (modelRef.current) modelRef.current.rotation.y = wormYaw
        return
      }

      // While mounted on bike — lock player to bike, skip all other movement
      if (mountedBike.current) {
        const bikeRef = useGameStore.getState().bikeRef
        if (bikeRef?.current) {
          const bikePos = bikeRef.current.translation()
          rb.setTranslation({ x: bikePos.x, y: bikePos.y + DIRT_BIKE.MOUNT_OFFSET_Y, z: bikePos.z }, true)
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }
        const bikeYaw = useGameStore.getState().bikeYaw
        yawRef.current = bikeYaw
        const updatedPos = rb.translation()
        setPosition([updatedPos.x, updatedPos.y, updatedPos.z])
        setYaw(bikeYaw)
        if (modelRef.current) modelRef.current.rotation.y = bikeYaw
        return
      }

      // --- Golf mode ---
      const golfDown = !!golfKey
      const golfPressed = golfDown && !golfKeyWasDown.current
      golfKeyWasDown.current = golfDown

      if (golfPressed && !golfActive.current && !grabbedRope.current) {
        enterGolfMode(position)
      }

      if (golfActive.current) {
        // Lock position
        const saved = golfSavedPos.current
        rb.setTranslation({ x: saved.x, y: saved.y, z: saved.z }, true)
        rb.setLinvel({ x: 0, y: 0, z: 0 }, true)

        // A/D still rotate (aim)
        if (left) yawRef.current += config.TURN_SPEED * delta
        if (right) yawRef.current -= config.TURN_SPEED * delta

        // Charge swing
        const swingDown = !!swingKey
        if (swingDown) {
          golfPower.current += delta / GOLF.CHARGE_TIME
          if (golfPower.current >= 1) {
            golfPower.current = 0
          }
          swingKeyWasDown.current = true
        } else if (swingKeyWasDown.current) {
          // Released H — execute swing
          executeSwing()
          swingKeyWasDown.current = false
        }

        // Update store for HUD
        useGameStore.getState().setGolfPower(golfPower.current)

        // Skip normal movement while in golf mode
      } else {

      // --- Rope grab/release (checked first so grab overrides normal movement) ---
      const grabDown = !!grab
      const grabPressed = grabDown && !grabKeyWasDown.current
      grabKeyWasDown.current = grabDown

      // F to grab (only when not already grabbing)
      if (grabPressed && !grabbedRope.current) {
        tryGrab()
      }

      // Space to release (launches player with handle velocity)
      if (jump && grabbedRope.current) {
        releaseGrab()
      }

      if (grabbedRope.current) {
        // --- While grabbing: attach player to handle, swing with movement ---
        const handleRb = grabbedRope.current.handleRef.current
        if (handleRb) {
          // Allow turning while on rope
          if (left) yawRef.current += config.TURN_SPEED * delta
          if (right) yawRef.current -= config.TURN_SPEED * delta

          const forwardX = -Math.sin(yawRef.current)
          const forwardZ = -Math.cos(yawRef.current)

          // Position the player below the handle
          const [ox, oy, oz] = ROPE.GRAB_ANCHOR_OFFSET
          const ht = handleRb.translation()
          rb.setTranslation({ x: ht.x - ox, y: ht.y - oy, z: ht.z - oz }, true)
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true)

          // Apply player movement input as impulses on the handle to swing it
          const swingForce = 12
          if (forward) handleRb.applyImpulse({ x: forwardX * swingForce * delta, y: 0, z: forwardZ * swingForce * delta }, true)
          if (backward) handleRb.applyImpulse({ x: -forwardX * swingForce * delta, y: 0, z: -forwardZ * swingForce * delta }, true)
          if (strafeLeft) handleRb.applyImpulse({ x: forwardZ * swingForce * delta, y: 0, z: -forwardX * swingForce * delta }, true)
          if (strafeRight) handleRb.applyImpulse({ x: -forwardZ * swingForce * delta, y: 0, z: forwardX * swingForce * delta }, true)
        }
      } else if (justReleasedRope.current) {
        // Skip movement on the frame we released — velocity was already set by releaseGrab
        justReleasedRope.current = false
      } else {
        // --- Normal ground/air movement ---

        // Jump buffer
        if (jump && !isOnGround) {
          jumpBuffered.current = true
          jumpBufferTimer.current = config.JUMP_BUFFER
        }
        if (jumpBufferTimer.current > 0) {
          jumpBufferTimer.current -= delta
          if (jumpBufferTimer.current <= 0) jumpBuffered.current = false
        }

        // --- Tank controls: A/D rotate, W/S move along facing direction ---
        if (left) yawRef.current += config.TURN_SPEED * delta
        if (right) yawRef.current -= config.TURN_SPEED * delta

        // Forward vector from yaw
        const forwardX = -Math.sin(yawRef.current)
        const forwardZ = -Math.cos(yawRef.current)

        let moveInput = 0
        if (forward) moveInput += 1
        if (backward) moveInput -= 1

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
        const isSprinting = config.SPRINT_DEFAULT ? !sprint : sprint
        const speed = isSprinting ? config.SPRINT_SPEED : config.WALK_SPEED
        const controlMultiplier = isOnGround ? 1 : config.AIR_CONTROL

        // --- Surface-aware movement ---
        const grip = Math.min(1, surfaceFriction.current)
        const hasInput = _direction.length() > 0

        const targetX = _direction.x * speed * controlMultiplier
        const targetZ = _direction.z * speed * controlMultiplier

        if (hasInput) {
          let lerpFactor
          if (isOnGround) {
            // Ground: snap or lerp to target based on config
            lerpFactor = config.ACCELERATION !== undefined
              ? config.ACCELERATION * grip
              : grip
          } else {
            // Air: gentle nudge — preserves momentum from jumps, bounces, rope swings
            lerpFactor = 0.8 * delta
          }
          const newVx = velocity.x + (targetX - velocity.x) * lerpFactor
          const newVz = velocity.z + (targetZ - velocity.z) * lerpFactor

          rb.setLinvel({ x: newVx, y: velocity.y, z: newVz }, true)
        } else if (isOnGround && jumpGraceTimer.current <= 0) {
          const damping = config.LINEAR_DAMPING * grip
          rb.setLinvel(
            {
              x: velocity.x * (1 - damping),
              y: velocity.y,
              z: velocity.z * (1 - damping),
            },
            true
          )
        }

        // --- Jump ---
        const maxAirJumps = config.MAX_AIR_JUMPS || 0
        const shouldGroundJump =
          (jump && coyoteTimer.current > 0 && canJump.current) ||
          (jumpBuffered.current && isOnGround && canJump.current)
        const shouldAirJump =
          jump && canJump.current && !isOnGround && coyoteTimer.current <= 0 &&
          airJumpsUsed.current < maxAirJumps

        if (shouldGroundJump) {
          rb.setLinvel({ x: velocity.x, y: config.JUMP_FORCE, z: velocity.z }, true)
          coyoteTimer.current = 0
          canJump.current = false
          jumpBuffered.current = false
          jumpGraceTimer.current = 0.2
        } else if (shouldAirJump) {
          rb.setLinvel({ x: velocity.x, y: config.JUMP_FORCE, z: velocity.z }, true)
          airJumpsUsed.current += 1
          canJump.current = false
          jumpBuffered.current = false
          jumpGraceTimer.current = 0.2
        }

        // Allow jump again when key released
        if (!jump) {
          canJump.current = true
        }
      }
      } // end golf else

      // Update nearRope in store for HUD prompt
      const { ropeRegistry } = useGameStore.getState()
      let isNear = false
      for (const entry of Object.values(ropeRegistry)) {
        const handlePos = entry.getWorldPosition()
        if (!handlePos) continue
        const dx = handlePos[0] - position.x
        const dy = handlePos[1] - position.y
        const dz = handlePos[2] - position.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < ROPE.GRAB_DISTANCE) {
          isNear = true
          break
        }
      }
      useGameStore.getState().setNearRope(isNear)

      // Update nearWorm in store for HUD prompt
      const wormHeadRef = useGameStore.getState().wormHeadRef
      let isNearWorm = false
      if (wormHeadRef?.current && !mountedWorm.current) {
        const headPos = wormHeadRef.current.translation()
        const wdx = headPos.x - position.x
        const wdy = headPos.y - position.y
        const wdz = headPos.z - position.z
        const wDist = Math.sqrt(wdx * wdx + wdy * wdy + wdz * wdz)
        if (wDist < WORM.MOUNT_DISTANCE) {
          isNearWorm = true
        }
      }
      useGameStore.getState().setNearWorm(isNearWorm)

      // Update nearBike in store for HUD prompt
      const bikeRef = useGameStore.getState().bikeRef
      let isNearBike = false
      if (bikeRef?.current && !mountedBike.current) {
        const bikePos = bikeRef.current.translation()
        const bdx = bikePos.x - position.x
        const bdy = bikePos.y - position.y
        const bdz = bikePos.z - position.z
        const bDist = Math.sqrt(bdx * bdx + bdy * bdy + bdz * bdz)
        if (bDist < DIRT_BIKE.MOUNT_DISTANCE) {
          isNearBike = true
        }
      }
      useGameStore.getState().setNearBike(isNearBike)
    }

    // Clamp fall speed
    if (velocity.y < config.MAX_FALL_SPEED) {
      rb.setLinvel({ x: velocity.x, y: config.MAX_FALL_SPEED, z: velocity.z }, true)
    }

    // --- Update store ---
    setPosition([position.x, position.y, position.z])
    setYaw(yawRef.current)

    // --- Rotate model to match yaw ---
    if (modelRef.current) {
      modelRef.current.rotation.y = yawRef.current
    }
  })

  return (
    <>
      <RigidBody
        ref={rigidBodyRef}
        type="dynamic"
        colliders={false}
        mass={config.MASS}
        position={spawnPosition}
        enabledRotations={[false, false, false]}
        linearDamping={0}
        angularDamping={0}
        name={`player${playerId}`}
      >
        <CapsuleCollider
          args={[config.CAPSULE_HALF_HEIGHT, config.CAPSULE_RADIUS]}
          friction={0.7}
          restitution={0.3}
        />
        <group ref={modelRef}>
          {children || <PlayerModel />}
          <GolfClub />
        </group>
      </RigidBody>
      {golfBalls.map((ball) => (
        <GolfBall key={ball.id} ref={ball.ref} position={ball.position} />
      ))}
    </>
  )
}
