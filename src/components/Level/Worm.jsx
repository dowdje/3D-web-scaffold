import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'
import { RigidBody, BallCollider } from '@react-three/rapier'
import * as THREE from 'three'

import { Controls } from '../../systems/controls'
import { WORM } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const _headPos = new THREE.Vector3()
const _headQuat = new THREE.Quaternion()
const _euler = new THREE.Euler()

/**
 * Giant rideable worm entity.
 * Kinematic head with trailing body segments rendered from a position history ring buffer.
 */
export function Worm({ position = WORM.SPAWN_POSITION }) {
  const headRef = useRef()
  const yawRef = useRef(0)
  const [, getKeys] = useKeyboardControls()

  // Ring buffer for position history — segments read from this
  const historySize = WORM.SEGMENT_COUNT * Math.ceil(WORM.SEGMENT_SPACING / 0.016) + 100
  const positionHistory = useRef([])
  const segmentPositions = useRef(
    Array.from({ length: WORM.SEGMENT_COUNT }, () => new THREE.Vector3(position[0], position[1], position[2]))
  )
  const segmentMeshRefs = useRef(
    Array.from({ length: WORM.SEGMENT_COUNT }, () => React.createRef())
  )

  // Initialize position history
  useEffect(() => {
    const startPos = new THREE.Vector3(position[0], position[1], position[2])
    positionHistory.current = Array.from({ length: historySize }, () => startPos.clone())
  }, [])

  // Register head ref so Player can compute distance
  useEffect(() => {
    useGameStore.getState().setWormHeadRef(headRef)
    return () => {
      useGameStore.getState().setWormHeadRef(null)
    }
  }, [])

  // How many history entries correspond to one segment spacing
  const stepsPerSegment = useRef(Math.round(WORM.SEGMENT_SPACING / 0.016))

  useFrame((state, delta) => {
    const rb = headRef.current
    if (!rb) return

    const wormMounted = useGameStore.getState().wormMounted
    let moved = false

    if (wormMounted) {
      const keys = getKeys()
      const forward = keys[Controls.forward]
      const left = keys[Controls.left]
      const right = keys[Controls.right]

      // Steering
      if (left) yawRef.current += WORM.TURN_SPEED * delta
      if (right) yawRef.current -= WORM.TURN_SPEED * delta

      // Rotate head to face yaw direction
      _euler.set(0, yawRef.current, 0)
      _headQuat.setFromEuler(_euler)
      rb.setNextKinematicRotation({ x: _headQuat.x, y: _headQuat.y, z: _headQuat.z, w: _headQuat.w })

      // Publish yaw so player + camera sync to worm facing
      useGameStore.getState().setWormYaw(yawRef.current)

      // Movement
      if (forward) {
        const pos = rb.translation()
        const dx = -Math.sin(yawRef.current) * WORM.SPEED * delta
        const dz = -Math.cos(yawRef.current) * WORM.SPEED * delta
        rb.setNextKinematicTranslation({
          x: pos.x + dx,
          y: pos.y,
          z: pos.z + dz,
        })
        moved = true
      }
    }

    // Update position history
    const pos = rb.translation()
    _headPos.set(pos.x, pos.y, pos.z)

    if (moved) {
      positionHistory.current.push(_headPos.clone())
      if (positionHistory.current.length > historySize) {
        positionHistory.current.shift()
      }
    }

    // Recalculate steps per segment based on actual delta
    stepsPerSegment.current = Math.max(1, Math.round(WORM.SEGMENT_SPACING / Math.max(delta * WORM.SPEED, 0.01)))

    // Update segment positions from history
    const history = positionHistory.current
    const len = history.length
    for (let i = 0; i < WORM.SEGMENT_COUNT; i++) {
      const historyIndex = len - 1 - (i + 1) * stepsPerSegment.current
      const idx = Math.max(0, historyIndex)
      segmentPositions.current[i].copy(history[idx])

      // Update mesh position
      const mesh = segmentMeshRefs.current[i].current
      if (mesh) {
        mesh.position.copy(history[idx])
      }
    }
  })

  // Segment color gradient (green head -> brown tail)
  const segmentColors = useMemo(() => {
    const headColor = new THREE.Color('#4a7a2e')
    const tailColor = new THREE.Color('#6b4226')
    return Array.from({ length: WORM.SEGMENT_COUNT }, (_, i) => {
      const t = i / (WORM.SEGMENT_COUNT - 1)
      return new THREE.Color().lerpColors(headColor, tailColor, t)
    })
  }, [])

  return (
    <group>
      {/* Worm Head — kinematic RigidBody */}
      <RigidBody
        ref={headRef}
        type="kinematicPosition"
        position={position}
        colliders={false}
        name="worm-head"
      >
        <BallCollider args={[WORM.HEAD_RADIUS]} />
        <mesh castShadow>
          <sphereGeometry args={[WORM.HEAD_RADIUS, 16, 16]} />
          <meshStandardMaterial color="#3d6b24" roughness={0.7} />
        </mesh>
        {/* Eyes */}
        <mesh position={[-0.35, 0.4, -0.7]} castShadow>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#eeeecc" />
        </mesh>
        <mesh position={[0.35, 0.4, -0.7]} castShadow>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color="#eeeecc" />
        </mesh>
        {/* Pupils */}
        <mesh position={[-0.35, 0.45, -0.85]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh position={[0.35, 0.45, -0.85]} castShadow>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
      </RigidBody>

      {/* Body segments — purely visual, positioned from history buffer */}
      {Array.from({ length: WORM.SEGMENT_COUNT }, (_, i) => {
        const t = (i + 1) / (WORM.SEGMENT_COUNT + 1)
        const radius = WORM.SEGMENT_RADIUS * (1 - t * 0.4)
        return (
          <mesh
            key={i}
            ref={segmentMeshRefs.current[i]}
            position={[position[0], position[1], position[2] + (i + 1) * WORM.SEGMENT_SPACING]}
            castShadow
          >
            <sphereGeometry args={[radius, 12, 12]} />
            <meshStandardMaterial color={segmentColors[i]} roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}
