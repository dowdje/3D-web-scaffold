import React, { useRef, useEffect, useState, createRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, CapsuleCollider, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

import { Controls } from '../../systems/controls'
import { PLAYER, ROPE, GOLF, WORM, DIRT_BIKE, CAR_SMASH, BASKETBALL, BATTING } from '../../systems/constants'
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

  // Car smash state
  const mountedCarSmash = useRef(false)
  const carSmashSwingCooldown = useRef(0)

  // Batting cage state
  const mountedBatting = useRef(false)
  const battingSwingCooldown = useRef(0)

  // Golf state
  const golfActive = useRef(false)
  const golfPower = useRef(0)
  const golfKeyWasDown = useRef(false)
  const swingKeyWasDown = useRef(false)
  const golfSavedPos = useRef({ x: 0, y: 0, z: 0 })
  const golfBallRef = useRef(null)
  const [golfBalls, setGolfBalls] = useState([])

  // Basketball state
  const holdingBall = useRef(false)
  const ballPower = useRef(0)
  const ballShootKeyWasDown = useRef(false)

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
        } else if (mountedCarSmash.current) {
          // Dismount car smash
          mountedCarSmash.current = false
          useGameStore.getState().setCarSmashMounted(false)
          const csRef = useGameStore.getState().carSmashRef
          if (csRef?.current) {
            const csPos = csRef.current.position
            rb.setTranslation({ x: csPos.x + CAR_SMASH.ORBIT_RADIUS + 1, y: csPos.y + 1, z: csPos.z }, true)
            rb.setLinvel({ x: 0, y: 2, z: 0 }, true)
          }
        } else if (mountedBatting.current) {
          // Dismount batting cage
          mountedBatting.current = false
          useGameStore.getState().setBattingMounted(false)
          const batRef = useGameStore.getState().battingRef
          if (batRef?.current) {
            const batPos = batRef.current.position
            rb.setTranslation({ x: batPos.x + BATTING.CAGE_WIDTH / 2 + 1, y: batPos.y + 1, z: batPos.z + BATTING.BATTER_OFFSET_Z }, true)
            rb.setLinvel({ x: 0, y: 2, z: 0 }, true)
          }
        } else if (useGameStore.getState().nearWorm) {
          // Mount worm — auto-drop basketball
          if (holdingBall.current) { holdingBall.current = false; useGameStore.getState().setBasketballHeld(false); ballPower.current = 0; useGameStore.getState().setBasketballPower(0) }
          mountedWorm.current = true
          useGameStore.getState().setWormMounted(true)
        } else if (useGameStore.getState().nearBike) {
          // Mount bike — auto-drop basketball
          if (holdingBall.current) { holdingBall.current = false; useGameStore.getState().setBasketballHeld(false); ballPower.current = 0; useGameStore.getState().setBasketballPower(0) }
          mountedBike.current = true
          useGameStore.getState().setBikeMounted(true)
        } else if (useGameStore.getState().nearCarSmash) {
          // Mount car smash — auto-drop basketball
          if (holdingBall.current) { holdingBall.current = false; useGameStore.getState().setBasketballHeld(false); ballPower.current = 0; useGameStore.getState().setBasketballPower(0) }
          mountedCarSmash.current = true
          useGameStore.getState().setCarSmashMounted(true)
          useGameStore.getState().setCarSmashYaw(yawRef.current)
        } else if (useGameStore.getState().nearBatting) {
          // Mount batting cage — auto-drop basketball
          if (holdingBall.current) { holdingBall.current = false; useGameStore.getState().setBasketballHeld(false); ballPower.current = 0; useGameStore.getState().setBasketballPower(0) }
          mountedBatting.current = true
          useGameStore.getState().setBattingMounted(true)
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

      // While mounted on car smash — lock player to orbit around car, A/D aim, H swing, R reset
      if (mountedCarSmash.current) {
        const csRef = useGameStore.getState().carSmashRef
        if (csRef?.current) {
          const csPos = csRef.current.position
          // A/D orbit
          let csYaw = useGameStore.getState().carSmashYaw
          if (left) csYaw += config.TURN_SPEED * delta
          if (right) csYaw -= config.TURN_SPEED * delta
          useGameStore.getState().setCarSmashYaw(csYaw)
          yawRef.current = csYaw

          // Lock position to orbit
          const orbitX = csPos.x + Math.sin(csYaw) * CAR_SMASH.ORBIT_RADIUS
          const orbitZ = csPos.z + Math.cos(csYaw) * CAR_SMASH.ORBIT_RADIUS
          const orbitY = csPos.y + CAR_SMASH.ORBIT_HEIGHT
          rb.setTranslation({ x: orbitX, y: orbitY, z: orbitZ }, true)
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true)

          // Swing cooldown
          if (carSmashSwingCooldown.current > 0) {
            carSmashSwingCooldown.current -= delta
          }

          // H to swing
          const { swing: swingKey, reset: resetKey } = getKeys()
          if (swingKey && carSmashSwingCooldown.current <= 0) {
            useGameStore.getState().setCarSmashSwing(true)
            carSmashSwingCooldown.current = CAR_SMASH.SWING_COOLDOWN
          }

          // R to reset
          if (resetKey) {
            useGameStore.getState().setCarSmashReset(true)
          }
        }
        const updatedPos = rb.translation()
        setPosition([updatedPos.x, updatedPos.y, updatedPos.z])
        setYaw(yawRef.current)
        if (modelRef.current) modelRef.current.rotation.y = yawRef.current
        return
      }

      // While mounted on batting cage — lock player at plate, face pitcher, H to swing
      if (mountedBatting.current) {
        const batRef = useGameStore.getState().battingRef
        if (batRef?.current) {
          const batPos = batRef.current.position
          // Lock at batter position (offset to side of pitch line)
          rb.setTranslation({
            x: batPos.x + BATTING.BATTER_OFFSET_X,
            y: batPos.y + config.CAPSULE_HALF_HEIGHT + config.CAPSULE_RADIUS,
            z: batPos.z + BATTING.BATTER_OFFSET_Z,
          }, true)
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }

        // Force yaw to face pitcher (-Z direction)
        yawRef.current = BATTING.BATTER_FACING_YAW

        // Swing cooldown
        if (battingSwingCooldown.current > 0) {
          battingSwingCooldown.current -= delta
        }

        // H to swing
        const { swing: swingKey } = getKeys()
        if (swingKey && battingSwingCooldown.current <= 0) {
          useGameStore.getState().setBattingSwing(true)
          battingSwingCooldown.current = BATTING.SWING_COOLDOWN
        }

        const updatedPos = rb.translation()
        setPosition([updatedPos.x, updatedPos.y, updatedPos.z])
        setYaw(yawRef.current)
        if (modelRef.current) modelRef.current.rotation.y = yawRef.current
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

      // --- Rope grab/release + Basketball pickup (F key) ---
      const grabDown = !!grab
      const grabPressed = grabDown && !grabKeyWasDown.current
      grabKeyWasDown.current = grabDown

      if (grabPressed) {
        if (holdingBall.current) {
          // Drop basketball
          holdingBall.current = false
          useGameStore.getState().setBasketballHeld(false)
          ballPower.current = 0
          ballShootKeyWasDown.current = false
          useGameStore.getState().setBasketballPower(0)
        } else if (!grabbedRope.current && useGameStore.getState().nearBasketball) {
          // Pick up basketball
          const bRef = useGameStore.getState().basketballRef
          if (bRef?.current) {
            holdingBall.current = true
            useGameStore.getState().setBasketballHeld(true)
            bRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            bRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)
          }
        } else if (!grabbedRope.current) {
          // Try rope grab
          tryGrab()
        }
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
        // --- Basketball carry + shoot (while holding, player still moves normally) ---
        if (holdingBall.current) {
          const bRef = useGameStore.getState().basketballRef
          if (bRef?.current) {
            // Position ball in front of player
            const fwdX = -Math.sin(yawRef.current)
            const fwdZ = -Math.cos(yawRef.current)
            bRef.current.setTranslation({
              x: position.x + fwdX * BASKETBALL.HOLD_OFFSET_FORWARD,
              y: position.y + BASKETBALL.HOLD_OFFSET_Y,
              z: position.z + fwdZ * BASKETBALL.HOLD_OFFSET_FORWARD,
            }, true)
            bRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true)
            bRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true)

            // H key charge/shoot
            const shootDown = !!swingKey
            if (shootDown) {
              ballPower.current += delta / BASKETBALL.CHARGE_TIME
              if (ballPower.current >= 1) {
                ballPower.current = 0
              }
              ballShootKeyWasDown.current = true
              useGameStore.getState().setBasketballPower(ballPower.current)
            } else if (ballShootKeyWasDown.current) {
              // Released H — shoot the ball
              const power = ballPower.current
              const force = BASKETBALL.MIN_FORCE + power * (BASKETBALL.MAX_FORCE - BASKETBALL.MIN_FORCE)
              const cosAngle = Math.cos(BASKETBALL.LAUNCH_ANGLE)
              const sinAngle = Math.sin(BASKETBALL.LAUNCH_ANGLE)
              const yaw = yawRef.current
              bRef.current.setLinvel({
                x: -Math.sin(yaw) * cosAngle * force / BASKETBALL.BALL_MASS,
                y: sinAngle * force / BASKETBALL.BALL_MASS,
                z: -Math.cos(yaw) * cosAngle * force / BASKETBALL.BALL_MASS,
              }, true)
              holdingBall.current = false
              ballPower.current = 0
              ballShootKeyWasDown.current = false
              useGameStore.getState().setBasketballHeld(false)
              useGameStore.getState().setBasketballPower(0)
            }
          }
        }

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

      // Update nearCarSmash in store for HUD prompt
      const carSmashRef = useGameStore.getState().carSmashRef
      let isNearCarSmash = false
      if (carSmashRef?.current && !mountedCarSmash.current) {
        const csPos = carSmashRef.current.position
        const cdx = csPos.x - position.x
        const cdy = csPos.y - position.y
        const cdz = csPos.z - position.z
        const cDist = Math.sqrt(cdx * cdx + cdy * cdy + cdz * cdz)
        if (cDist < CAR_SMASH.INTERACT_DISTANCE) {
          isNearCarSmash = true
        }
      }
      useGameStore.getState().setNearCarSmash(isNearCarSmash)

      // Update nearBatting in store for HUD prompt
      const battingRef = useGameStore.getState().battingRef
      let isNearBatting = false
      if (battingRef?.current && !mountedBatting.current) {
        const batPos = battingRef.current.position
        // Check distance to batter's box entry
        const entryX = batPos.x
        const entryZ = batPos.z + BATTING.BATTER_OFFSET_Z
        const btdx = entryX - position.x
        const btdz = entryZ - position.z
        const btDist = Math.sqrt(btdx * btdx + btdz * btdz)
        if (btDist < BATTING.INTERACT_DISTANCE) {
          isNearBatting = true
        }
      }
      useGameStore.getState().setNearBatting(isNearBatting)

      // Update nearBasketball in store for HUD prompt
      const bbRef = useGameStore.getState().basketballRef
      let isNearBball = false
      if (bbRef?.current && !holdingBall.current) {
        const ballPos = bbRef.current.translation()
        const bbdx = ballPos.x - position.x
        const bbdy = ballPos.y - position.y
        const bbdz = ballPos.z - position.z
        const bbDist = Math.sqrt(bbdx * bbdx + bbdy * bbdy + bbdz * bbdz)
        if (bbDist < BASKETBALL.PICKUP_DISTANCE) {
          isNearBball = true
        }
      }
      useGameStore.getState().setNearBasketball(isNearBball)
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
