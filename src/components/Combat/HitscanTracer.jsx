import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGameStore } from '../../systems/gameStore'

const TRACER_DURATION = 80 // ms

export function HitscanTracer() {
  const groupRef = useRef()

  useFrame(() => {
    const store = useGameStore.getState()
    const now = performance.now()

    // Clean up expired tracers
    const expired = store.tracers.filter((t) => now - t.time > TRACER_DURATION)
    for (const t of expired) {
      store.removeTracer(t)
    }
  })

  const tracers = useGameStore((s) => s.tracers)

  return (
    <group ref={groupRef}>
      {tracers.map((tracer, i) => (
        <TracerLine key={i} from={tracer.from} to={tracer.to} startTime={tracer.time} />
      ))}
    </group>
  )
}

function TracerLine({ from, to, startTime }) {
  const lineRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array([...from, ...to])
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geo
  }, [from, to])

  useFrame(() => {
    if (lineRef.current) {
      const elapsed = performance.now() - startTime
      const opacity = Math.max(0, 1 - elapsed / TRACER_DURATION)
      lineRef.current.material.opacity = opacity
    }
  })

  return (
    <line ref={lineRef} geometry={geometry}>
      <lineBasicMaterial color="#ffff00" transparent opacity={1} linewidth={2} />
    </line>
  )
}
