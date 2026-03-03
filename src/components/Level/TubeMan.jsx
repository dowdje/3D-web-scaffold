import React, { useRef, useMemo, createRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CylinderCollider, BallCollider, useSphericalJoint } from '@react-three/rapier'
import * as THREE from 'three'

import { TUBE_MAN } from '../../systems/constants'

// Reusable temp vector for impulses (module-level to avoid GC)
const _impulse = new THREE.Vector3()

/**
 * Spherical joint connecting two adjacent tube segments.
 * Anchors at top of lower body, bottom of upper body.
 */
function SegmentJoint({ bodyA, bodyB, anchorHeight }) {
  useSphericalJoint(bodyA, bodyB, [
    [0, anchorHeight / 2, 0],   // top of lower segment
    [0, -anchorHeight / 2, 0],  // bottom of upper segment
  ])
  return null
}

/**
 * Spherical joint connecting an arm segment to a parent body.
 */
function ArmJoint({ parentRef, childRef, parentAnchor, childAnchor }) {
  useSphericalJoint(parentRef, childRef, [parentAnchor, childAnchor])
  return null
}

/**
 * A single arm chain branching horizontally from a body segment.
 */
function Arm({ side, parentRef, parentAnchorY, color, segmentRefs, startIndex, position }) {
  const C = TUBE_MAN
  const sideX = side === 'left' ? -1 : 1

  const segments = useMemo(() => {
    const segs = []
    for (let i = 0; i < C.ARM_SEGMENTS; i++) {
      segs.push({
        index: i,
        x: sideX * (C.ARM_SEGMENT_LENGTH * (i + 1)),
        radius: C.ARM_RADIUS * (1 - i * 0.15),
      })
    }
    return segs
  }, [sideX])

  return (
    <group>
      {segments.map((seg, i) => {
        const ref = segmentRefs[startIndex + i]
        const posX = position[0] + seg.x
        const posY = position[1] + parentAnchorY
        const posZ = position[2]

        return (
          <RigidBody
            key={`arm-${side}-${i}`}
            ref={ref}
            type="dynamic"
            position={[posX, posY, posZ]}
            gravityScale={C.ARM_GRAVITY_SCALE}
            linearDamping={C.LINEAR_DAMPING + 1}
            angularDamping={C.ANGULAR_DAMPING + 1}
            mass={C.MASS_PER_SEGMENT * 0.5}
            restitution={0}
            friction={1}
            colliders={false}
          >
            <CylinderCollider
              args={[C.ARM_SEGMENT_LENGTH / 2, seg.radius]}
              rotation={[0, 0, Math.PI / 2]}
            />
            <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[seg.radius, seg.radius, C.ARM_SEGMENT_LENGTH, 6]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                transparent
                opacity={0.85}
              />
            </mesh>
          </RigidBody>
        )
      })}

      {/* Joint from parent body to first arm segment */}
      {segmentRefs[startIndex]?.current !== undefined && (
        <ArmJoint
          parentRef={parentRef}
          childRef={segmentRefs[startIndex]}
          parentAnchor={[sideX * 0.2, parentAnchorY - (TUBE_MAN.SEGMENT_HEIGHT * 0.3), 0]}
          childAnchor={[-sideX * C.ARM_SEGMENT_LENGTH / 2, 0, 0]}
        />
      )}

      {/* Joints between arm segments */}
      {segments.slice(1).map((_, i) => (
        <ArmJoint
          key={`arm-joint-${side}-${i}`}
          parentRef={segmentRefs[startIndex + i]}
          childRef={segmentRefs[startIndex + i + 1]}
          parentAnchor={[sideX * C.ARM_SEGMENT_LENGTH / 2, 0, 0]}
          childAnchor={[-sideX * C.ARM_SEGMENT_LENGTH / 2, 0, 0]}
        />
      ))}
    </group>
  )
}

/**
 * Wacky waving inflatable tube man.
 * Chain of rigid bodies connected by spherical joints with wind impulses.
 * @param {{ position: [number, number, number], color: string }} props
 */
export function TubeMan({ position = [0, 0, 0], color = '#ff2222' }) {
  const C = TUBE_MAN
  const [px, py, pz] = position

  // Total refs: body segments + left arm segments + right arm segments
  const totalRefs = C.SEGMENT_COUNT + C.ARM_SEGMENTS * 2
  const segmentRefs = useMemo(
    () => Array.from({ length: totalRefs }, () => createRef()),
    []
  )

  // Precompute segment radii (linear taper from base to top)
  const segmentRadii = useMemo(() => {
    return Array.from({ length: C.SEGMENT_COUNT }, (_, i) => {
      const t = i / (C.SEGMENT_COUNT - 1)
      return C.BASE_RADIUS + (C.TOP_RADIUS - C.BASE_RADIUS) * t
    })
  }, [])

  // Unique time offset per tube man so they don't move in sync
  const timeOffset = useMemo(() => px * 7.3 + pz * 3.1, [px, pz])

  // Apply wind impulses each frame
  useFrame((_, delta) => {
    const time = performance.now() / 1000 + timeOffset
    const clampedDelta = Math.min(delta, 0.05)

    // Body segments (skip index 0 — it's fixed)
    for (let i = 1; i < C.SEGMENT_COUNT; i++) {
      const rb = segmentRefs[i]?.current
      if (!rb) continue

      const heightMult = 1 + (i / C.SEGMENT_COUNT) * (C.WIND_HEIGHT_MULT - 1)

      const windX = Math.sin(time * 2.1 + i * 0.7) * C.WIND_BASE_FORCE * heightMult
        + Math.sin(time * 5.3 + i * 1.1) * C.WIND_GUST_FORCE
      const windZ = Math.cos(time * 1.7 + i * 0.9) * C.WIND_BASE_FORCE * heightMult * 0.6
        + Math.cos(time * 4.1 + i * 1.3) * C.WIND_GUST_FORCE * 0.5

      _impulse.set(windX * clampedDelta, 0, windZ * clampedDelta)
      rb.applyImpulse(_impulse, true)
    }

    // Arm segments
    const armStart = C.SEGMENT_COUNT
    for (let a = 0; a < C.ARM_SEGMENTS * 2; a++) {
      const rb = segmentRefs[armStart + a]?.current
      if (!rb) continue

      const armIndex = a % C.ARM_SEGMENTS
      const armSide = a < C.ARM_SEGMENTS ? 1 : -1
      const heightMult = C.WIND_HEIGHT_MULT

      const windX = Math.sin(time * 3.2 + armIndex * 1.5 + armSide) * C.WIND_BASE_FORCE * heightMult * 1.2
        + Math.sin(time * 6.7 + armIndex * 0.8) * C.WIND_GUST_FORCE * 1.5
      const windY = Math.sin(time * 4.5 + armIndex * 1.2 + armSide * 2) * C.WIND_GUST_FORCE * 0.8
      const windZ = Math.cos(time * 2.8 + armIndex * 1.1 + armSide * 0.5) * C.WIND_BASE_FORCE * heightMult * 0.8

      _impulse.set(windX * clampedDelta, windY * clampedDelta, windZ * clampedDelta)
      rb.applyImpulse(_impulse, true)
    }
  })

  // Cumulative Y positions for each segment center
  const segmentPositions = useMemo(() => {
    const positions = []
    for (let i = 0; i < C.SEGMENT_COUNT; i++) {
      // Base platform is 0.4 tall, so segments start at 0.4 + half segment height
      positions.push(py + 0.4 + C.SEGMENT_HEIGHT * i + C.SEGMENT_HEIGHT / 2)
    }
    return positions
  }, [py])

  const armAttachY = segmentPositions[C.ARM_ATTACH_SEGMENT] || segmentPositions[C.SEGMENT_COUNT - 2]

  return (
    <group>
      {/* === Black base box (fan housing) === */}
      <RigidBody type="fixed" position={[px, py + 0.2, pz]} restitution={0} friction={1}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.8, 0.4, 0.8]} />
          <meshStandardMaterial color="#111111" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* === Body segments === */}
      {Array.from({ length: C.SEGMENT_COUNT }, (_, i) => {
        const radius = segmentRadii[i]
        const isBase = i === 0

        return (
          <RigidBody
            key={`seg-${i}`}
            ref={segmentRefs[i]}
            type={isBase ? 'fixed' : 'dynamic'}
            position={[px, segmentPositions[i], pz]}
            gravityScale={isBase ? 1 : C.GRAVITY_SCALE}
            linearDamping={C.LINEAR_DAMPING}
            angularDamping={C.ANGULAR_DAMPING}
            mass={C.MASS_PER_SEGMENT}
            restitution={0}
            friction={1}
            colliders={false}
          >
            <CylinderCollider args={[C.SEGMENT_HEIGHT / 2, radius]} />
            <mesh castShadow>
              <cylinderGeometry args={[
                segmentRadii[Math.min(i + 1, C.SEGMENT_COUNT - 1)],
                radius,
                C.SEGMENT_HEIGHT,
                8,
              ]} />
              <meshStandardMaterial
                color={color}
                roughness={0.4}
                transparent
                opacity={0.85}
              />
            </mesh>

            {/* Head sphere on top segment */}
            {i === C.SEGMENT_COUNT - 1 && (
              <mesh castShadow position={[0, C.SEGMENT_HEIGHT / 2 + C.HEAD_RADIUS * 0.8, 0]}>
                <sphereGeometry args={[C.HEAD_RADIUS, 12, 12]} />
                <meshStandardMaterial
                  color={color}
                  roughness={0.4}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            )}
          </RigidBody>
        )
      })}

      {/* === Body segment joints === */}
      {Array.from({ length: C.SEGMENT_COUNT - 1 }, (_, i) => (
        <SegmentJoint
          key={`joint-${i}`}
          bodyA={segmentRefs[i]}
          bodyB={segmentRefs[i + 1]}
          anchorHeight={C.SEGMENT_HEIGHT}
        />
      ))}

      {/* === Arms === */}
      <Arm
        side="left"
        parentRef={segmentRefs[C.ARM_ATTACH_SEGMENT]}
        parentAnchorY={0}
        color={color}
        segmentRefs={segmentRefs}
        startIndex={C.SEGMENT_COUNT}
        position={[px, armAttachY, pz]}
      />
      <Arm
        side="right"
        parentRef={segmentRefs[C.ARM_ATTACH_SEGMENT]}
        parentAnchorY={0}
        color={color}
        segmentRefs={segmentRefs}
        startIndex={C.SEGMENT_COUNT + C.ARM_SEGMENTS}
        position={[px, armAttachY, pz]}
      />
    </group>
  )
}
