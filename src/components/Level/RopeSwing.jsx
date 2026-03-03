import React, { useRef, useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, BallCollider, useRopeJoint, interactionGroups } from '@react-three/rapier'
import * as THREE from 'three'

import { ROPE } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

// Reusable temp vectors (module-level to avoid GC)
const _anchorPos = new THREE.Vector3()
const _handlePos = new THREE.Vector3()
const _mid = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _up = new THREE.Vector3(0, 1, 0)
const _quat = new THREE.Quaternion()

/**
 * Rope joint sub-component — constrains the handle to stay within ropeLength of the anchor.
 * The handle is free to swing in any direction like a pendulum.
 */
function PendulumJoint({ anchorRef, handleRef, ropeLength }) {
  useRopeJoint(anchorRef, handleRef, [
    [0, 0, 0],
    [0, 0, 0],
    ropeLength,
  ])
  return null
}

/**
 * RopeSwing — a pendulum-style swingable rope.
 * Fixed anchor at the top, single dynamic handle at the bottom, connected by a spherical joint.
 * Visual rope segments are drawn between them each frame.
 */
export function RopeSwing({
  id,
  anchorPosition = [0, 10, 0],
  segmentCount = ROPE.SEGMENT_COUNT,
  segmentLength = ROPE.SEGMENT_LENGTH,
}) {
  const anchorRef = useRef()
  const handleRef = useRef()
  const ropeLineRef = useRef()

  const ropeLength = segmentCount * segmentLength
  const [ax, ay, az] = anchorPosition
  const handleStartPosition = useMemo(() => [ax, ay - ropeLength, az], [ax, ay, az, ropeLength])

  // Number of visual segments to draw
  const visualSegments = segmentCount
  const meshRefs = useRef([])

  // Register/unregister with the rope store
  useEffect(() => {
    const { registerRope, unregisterRope } = useGameStore.getState()
    registerRope(id, {
      handleRef,
      getWorldPosition: () => {
        const rb = handleRef.current
        if (!rb) return null
        const t = rb.translation()
        return [t.x, t.y, t.z]
      },
    })
    return () => unregisterRope(id)
  }, [id])

  // Update visual rope each frame
  useFrame(() => {
    const anchorRb = anchorRef.current
    const handleRb = handleRef.current
    if (!anchorRb || !handleRb) return

    const aT = anchorRb.translation()
    const hT = handleRb.translation()
    _anchorPos.set(aT.x, aT.y, aT.z)
    _handlePos.set(hT.x, hT.y, hT.z)

    // Draw cylinders along the rope from anchor to handle
    for (let i = 0; i < visualSegments; i++) {
      const mesh = meshRefs.current[i]
      if (!mesh) continue

      const t0 = i / visualSegments
      const t1 = (i + 1) / visualSegments

      const x0 = _anchorPos.x + (_handlePos.x - _anchorPos.x) * t0
      const y0 = _anchorPos.y + (_handlePos.y - _anchorPos.y) * t0
      const z0 = _anchorPos.z + (_handlePos.z - _anchorPos.z) * t0

      const x1 = _anchorPos.x + (_handlePos.x - _anchorPos.x) * t1
      const y1 = _anchorPos.y + (_handlePos.y - _anchorPos.y) * t1
      const z1 = _anchorPos.z + (_handlePos.z - _anchorPos.z) * t1

      mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)

      _dir.set(x1 - x0, y1 - y0, z1 - z0)
      const len = _dir.length()
      _dir.normalize()
      _quat.setFromUnitVectors(_up, _dir)
      mesh.quaternion.copy(_quat)
      mesh.scale.set(1, len / segmentLength, 1)
    }
  })

  return (
    <group>
      {/* Fixed anchor at top */}
      <RigidBody
        ref={anchorRef}
        type="fixed"
        position={anchorPosition}
        name={`${id}-anchor`}
        colliders={false}
      >
        <BallCollider args={[ROPE.SEGMENT_RADIUS * 2]} collisionGroups={interactionGroups([1], [])} />
        <mesh>
          <sphereGeometry args={[ROPE.SEGMENT_RADIUS * 3, 8, 8]} />
          <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Dynamic handle (pendulum bob) */}
      <RigidBody
        ref={handleRef}
        type="dynamic"
        position={handleStartPosition}
        mass={ROPE.HANDLE_MASS}
        linearDamping={0.05}
        angularDamping={0.1}
        colliders={false}
        enabledRotations={[false, false, false]}
        name={`${id}-handle`}
      >
        <BallCollider args={[ROPE.HANDLE_RADIUS]} collisionGroups={interactionGroups([1], [])} />
        <mesh>
          <sphereGeometry args={[ROPE.HANDLE_RADIUS, 12, 12]} />
          <meshStandardMaterial color="#DAA520" metalness={0.4} roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* Spherical joint creates the pendulum constraint */}
      <PendulumJoint anchorRef={anchorRef} handleRef={handleRef} ropeLength={ropeLength} />

      {/* Visual rope segments (cylinders from anchor to handle) */}
      {Array.from({ length: visualSegments }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { meshRefs.current[i] = el }}
        >
          <cylinderGeometry args={[ROPE.SEGMENT_RADIUS, ROPE.SEGMENT_RADIUS, segmentLength, 6]} />
          <meshStandardMaterial color="#8B6914" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}
