import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, useRapier } from '@react-three/rapier'
import * as THREE from 'three'

import { Controls } from '../../systems/controls'
import { DIRT_BIKE } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const _quat = new THREE.Quaternion()
const _euler = new THREE.Euler()

const GRAVITY = 30
const HALF_HEIGHT = DIRT_BIKE.BODY_HEIGHT / 2

/**
 * Rideable dirt bike entity.
 * Kinematic body with NO collider (so raycasts never hit itself).
 * Ground detection via downward raycast.
 */
export function DirtBike({ position = DIRT_BIKE.SPAWN_POSITION }) {
  const bodyRef = useRef()
  const yawRef = useRef(0)
  const currentSpeed = useRef(0)
  const verticalVel = useRef(0)
  const grounded = useRef(true)
  const surfaceFriction = useRef(0.8)
  const [, getKeys] = useKeyboardControls()
  const { rapier, world } = useRapier()

  useEffect(() => {
    useGameStore.getState().setBikeRef(bodyRef)
    return () => useGameStore.getState().setBikeRef(null)
  }, [])

  useFrame((state, delta) => {
    const rb = bodyRef.current
    if (!rb) return

    const bikeMounted = useGameStore.getState().bikeMounted
    if (!bikeMounted) return

    const keys = getKeys()
    const forward = keys[Controls.forward]
    const backward = keys[Controls.backward]
    const left = keys[Controls.left]
    const right = keys[Controls.right]

    // Throttle / brake / coast — modulated by surface friction
    const sf = surfaceFriction.current
    let maxSpeed = DIRT_BIKE.MAX_SPEED
    let accel = DIRT_BIKE.ACCELERATION
    let coastDecel = DIRT_BIKE.COAST_DECEL
    let turnMult = 1.0

    if (sf < 0.1) {
      // Ice — slide freely, barely decelerate, poor turning
      coastDecel = 0.5
      turnMult = 0.25
      maxSpeed = DIRT_BIKE.MAX_SPEED * 0.9
    } else if (sf < 0.3) {
      // Water — lower max speed, more drag
      maxSpeed = DIRT_BIKE.MAX_SPEED * 0.6
      coastDecel = DIRT_BIKE.COAST_DECEL * 2
      turnMult = 0.7
    } else if (sf > 1.5) {
      // Mud / Sand — cap speed, heavy drag
      maxSpeed = DIRT_BIKE.MAX_SPEED * 0.45
      coastDecel = DIRT_BIKE.COAST_DECEL * 3
      accel = DIRT_BIKE.ACCELERATION * 0.5
    }

    if (forward) {
      currentSpeed.current = Math.min(currentSpeed.current + accel * delta, maxSpeed)
    } else if (backward) {
      currentSpeed.current = Math.max(currentSpeed.current - DIRT_BIKE.BRAKING * delta, 0)
    } else {
      currentSpeed.current = Math.max(currentSpeed.current - coastDecel * delta, 0)
    }
    // Clamp to terrain max speed even if already going faster
    if (currentSpeed.current > maxSpeed) {
      currentSpeed.current = Math.max(currentSpeed.current - coastDecel * 2 * delta, maxSpeed)
    }

    // Speed-dependent turning
    const speedRatio = currentSpeed.current / DIRT_BIKE.MAX_SPEED
    if (left) yawRef.current += DIRT_BIKE.TURN_SPEED * speedRatio * turnMult * delta
    if (right) yawRef.current -= DIRT_BIKE.TURN_SPEED * speedRatio * turnMult * delta

    // Rotate bike
    _euler.set(0, yawRef.current, 0)
    _quat.setFromEuler(_euler)
    rb.setNextKinematicRotation({ x: _quat.x, y: _quat.y, z: _quat.z, w: _quat.w })

    // Compute next XZ
    const pos = rb.translation()
    const dx = -Math.sin(yawRef.current) * currentSpeed.current * delta
    const dz = -Math.cos(yawRef.current) * currentSpeed.current * delta
    const nextX = pos.x + dx
    const nextZ = pos.z + dz

    // Raycast downward — only accept fixed bodies (ground, ramps)
    // This excludes the player capsule and any other dynamic bodies
    const rayOriginY = pos.y + 5.0
    const ray = new rapier.Ray({ x: nextX, y: rayOriginY, z: nextZ }, { x: 0, y: -1, z: 0 })
    const hit = world.castRay(
      ray, 15.0, true,
      undefined, undefined, undefined, undefined,
      (collider) => {
        const parent = collider.parent()
        return parent ? parent.isFixed() : true
      }
    )

    let nextY
    if (hit !== null && hit.timeOfImpact >= 0) {
      // Read surface friction from the collider we hit
      const hitCollider = world.castRayAndGetNormal(
        ray, 15.0, true,
        undefined, undefined, undefined, undefined,
        (collider) => {
          const parent = collider.parent()
          return parent ? parent.isFixed() : true
        }
      )
      if (hitCollider) {
        const col = hitCollider.collider
        if (col && typeof col.friction === 'function') {
          surfaceFriction.current = col.friction()
        }
      }

      const surfaceY = rayOriginY - hit.timeOfImpact
      const targetY = surfaceY + HALF_HEIGHT

      if (grounded.current) {
        const drop = pos.y - targetY
        if (drop > 0.5 && verticalVel.current > 1) {
          // Surface dropped away (ramp edge) while we were climbing — launch!
          grounded.current = false
          verticalVel.current = Math.min(verticalVel.current, 25)
          verticalVel.current -= GRAVITY * delta
          nextY = pos.y + verticalVel.current * delta
        } else {
          // Normal ground following (flat or ramp surface)
          // Track climb rate before snapping so we know launch velocity
          verticalVel.current = (targetY - pos.y) / delta
          nextY = targetY
        }
      } else {
        // Airborne — apply gravity
        verticalVel.current -= GRAVITY * delta
        nextY = pos.y + verticalVel.current * delta
        // Land when we reach surface
        if (nextY <= targetY) {
          nextY = targetY
          verticalVel.current = 0
          grounded.current = true
        }
      }
    } else {
      // No ground — freefall
      if (grounded.current) {
        grounded.current = false
        verticalVel.current = Math.min(verticalVel.current, 25)
        if (verticalVel.current < 0) verticalVel.current = 0
      }
      verticalVel.current -= GRAVITY * delta
      nextY = pos.y + verticalVel.current * delta
    }

    rb.setNextKinematicTranslation({ x: nextX, y: nextY, z: nextZ })

    useGameStore.getState().setBikeYaw(yawRef.current)
    useGameStore.getState().setBikeSpeed(currentSpeed.current)
  })

  return (
    <group>
      <RigidBody
        ref={bodyRef}
        type="kinematicPosition"
        position={position}
        colliders={false}
        name="dirt-bike"
      >
        {/* Main body frame */}
        <mesh castShadow>
          <boxGeometry args={[DIRT_BIKE.BODY_WIDTH, DIRT_BIKE.BODY_HEIGHT, DIRT_BIKE.BODY_LENGTH]} />
          <meshStandardMaterial color="#8B2500" roughness={0.6} />
        </mesh>

        {/* Seat */}
        <mesh castShadow position={[0, HALF_HEIGHT + 0.1, 0.2]}>
          <boxGeometry args={[DIRT_BIKE.BODY_WIDTH * 0.8, 0.15, 0.8]} />
          <meshStandardMaterial color="#222222" roughness={0.9} />
        </mesh>

        {/* Handlebars */}
        <mesh castShadow position={[0, HALF_HEIGHT + 0.3, -DIRT_BIKE.BODY_LENGTH / 2 + 0.3]}>
          <boxGeometry args={[0.8, 0.08, 0.08]} />
          <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh castShadow position={[0, HALF_HEIGHT + 0.15, -DIRT_BIKE.BODY_LENGTH / 2 + 0.3]}>
          <boxGeometry args={[0.06, 0.3, 0.06]} />
          <meshStandardMaterial color="#444444" metalness={0.7} roughness={0.3} />
        </mesh>

        {/* Front wheel */}
        <mesh castShadow position={[0, -HALF_HEIGHT, -DIRT_BIKE.BODY_LENGTH / 2 + DIRT_BIKE.WHEEL_RADIUS]}>
          <cylinderGeometry args={[DIRT_BIKE.WHEEL_RADIUS, DIRT_BIKE.WHEEL_RADIUS, DIRT_BIKE.BODY_WIDTH * 0.5, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>

        {/* Rear wheel */}
        <mesh castShadow position={[0, -HALF_HEIGHT, DIRT_BIKE.BODY_LENGTH / 2 - DIRT_BIKE.WHEEL_RADIUS]}>
          <cylinderGeometry args={[DIRT_BIKE.WHEEL_RADIUS, DIRT_BIKE.WHEEL_RADIUS, DIRT_BIKE.BODY_WIDTH * 0.5, 16]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>

        {/* Engine block */}
        <mesh castShadow position={[0, -0.1, 0]}>
          <boxGeometry args={[DIRT_BIKE.BODY_WIDTH * 0.7, DIRT_BIKE.BODY_HEIGHT * 0.5, DIRT_BIKE.BODY_LENGTH * 0.4]} />
          <meshStandardMaterial color="#CC3300" roughness={0.5} metalness={0.3} />
        </mesh>

        {/* Exhaust pipe */}
        <mesh castShadow position={[DIRT_BIKE.BODY_WIDTH / 2 + 0.08, -0.15, DIRT_BIKE.BODY_LENGTH / 2 - 0.3]}>
          <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
          <meshStandardMaterial color="#666666" metalness={0.8} roughness={0.2} />
        </mesh>
      </RigidBody>
    </group>
  )
}
