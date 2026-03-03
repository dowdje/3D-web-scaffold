import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody } from '@react-three/rapier'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { AQUARIUM } from '../../systems/constants'

// Module-level temp vectors — reused every frame to avoid GC
const _target = new THREE.Vector3()
const _dir = new THREE.Vector3()
const _pos = new THREE.Vector3()
const _lookQuat = new THREE.Quaternion()
const _mat = new THREE.Matrix4()
const _up = new THREE.Vector3(0, 1, 0)

const FISH_DEFS = [
  { color: '#ff6600', scale: 0.9, speed: 3.0 },
  { color: '#3366ff', scale: 0.7, speed: 3.5 },
  { color: '#ffcc00', scale: 0.5, speed: 4.0 },
  { color: '#ff66aa', scale: 1.0, speed: 2.5 },
  { color: '#33cc66', scale: 0.6, speed: 3.8 },
  { color: '#9933ff', scale: 0.8, speed: 2.8 },
  { color: '#ff3333', scale: 1.1, speed: 2.0 },
  { color: '#00cccc', scale: 0.45, speed: 4.5 },
  { color: '#99ff33', scale: 0.55, speed: 4.2 },
  { color: '#008888', scale: 0.75, speed: 3.2 },
  { color: '#ff9944', scale: 0.4, speed: 4.5 },
  { color: '#6699ff', scale: 0.65, speed: 3.6 },
]

/**
 * Glass wall panel — transparent fixed RigidBody.
 */
function GlassWall({ position, size }) {
  return (
    <RigidBody type="fixed" friction={0.3} restitution={0.1}>
      <mesh position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color={AQUARIUM.GLASS_COLOR}
          transparent
          opacity={AQUARIUM.GLASS_OPACITY}
          side={THREE.DoubleSide}
          roughness={0.1}
          metalness={0.2}
        />
      </mesh>
    </RigidBody>
  )
}

/**
 * Semi-transparent water volume inside the tank.
 * Uses BackSide rendering so fish inside aren't occluded by the near face.
 */
function WaterVolume() {
  const { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, WALL_THICKNESS } = AQUARIUM
  const innerW = TANK_WIDTH - WALL_THICKNESS * 2
  const innerD = TANK_DEPTH - WALL_THICKNESS * 2
  return (
    <mesh position={[0, TANK_HEIGHT / 2, 0]}>
      <boxGeometry args={[innerW, TANK_HEIGHT - 0.1, innerD]} />
      <meshStandardMaterial
        color={AQUARIUM.WATER_COLOR}
        transparent
        opacity={AQUARIUM.WATER_OPACITY}
        side={THREE.BackSide}
        roughness={0.6}
      />
    </mesh>
  )
}

/**
 * Animated fish with waypoint-seeking behavior.
 * Picks random targets inside the tank and slerps toward them.
 */
function Fish({ color, scale, speed, index }) {
  const ref = useRef()
  const { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, WALL_THICKNESS, FISH_MARGIN, FISH_TURN_SPEED } = AQUARIUM

  const halfW = TANK_WIDTH / 2 - WALL_THICKNESS - FISH_MARGIN
  const halfD = TANK_DEPTH / 2 - WALL_THICKNESS - FISH_MARGIN
  const minY = FISH_MARGIN
  const maxY = TANK_HEIGHT - FISH_MARGIN

  const state = useMemo(() => {
    const phase = (index / FISH_DEFS.length) * Math.PI * 2
    const startX = (Math.random() * 2 - 1) * halfW
    const startY = minY + Math.random() * (maxY - minY)
    const startZ = (Math.random() * 2 - 1) * halfD
    return {
      target: new THREE.Vector3(
        (Math.random() * 2 - 1) * halfW,
        minY + Math.random() * (maxY - minY),
        (Math.random() * 2 - 1) * halfD,
      ),
      phase,
      startPos: new THREE.Vector3(startX, startY, startZ),
    }
  }, [halfW, halfD, minY, maxY, index])

  const pickNewTarget = () => {
    state.target.set(
      (Math.random() * 2 - 1) * halfW,
      minY + Math.random() * (maxY - minY),
      (Math.random() * 2 - 1) * halfD,
    )
  }

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return

    // Get current position in local space
    _pos.copy(mesh.position)

    // Direction to target
    _dir.copy(state.target).sub(_pos)
    const dist = _dir.length()

    // Pick new target when close
    if (dist < 1.0) {
      pickNewTarget()
      _dir.copy(state.target).sub(_pos)
    }

    _dir.normalize()

    // Build look-at quaternion toward target
    _mat.lookAt(_pos, state.target, _up)
    _lookQuat.setFromRotationMatrix(_mat)

    // Slerp toward target orientation
    mesh.quaternion.slerp(_lookQuat, Math.min(1, FISH_TURN_SPEED * delta))

    // Move forward along facing direction
    _target.set(0, 0, 1).applyQuaternion(mesh.quaternion)
    mesh.position.addScaledVector(_target, speed * delta)

    // Gentle sine-wave Y bobbing
    const time = performance.now() * 0.001
    mesh.position.y += Math.sin(time * 1.5 + state.phase) * 0.003

    // Clamp to tank bounds
    mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, -halfW, halfW)
    mesh.position.y = THREE.MathUtils.clamp(mesh.position.y, minY, maxY)
    mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, -halfD, halfD)
  })

  return (
    <group ref={ref} position={state.startPos.toArray()}>
      {/* Body — stretched sphere */}
      <mesh scale={[1, 0.4, 0.3]} castShadow>
        <sphereGeometry args={[scale, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
      </mesh>
      {/* Tail fin — cone */}
      <mesh position={[-scale * 0.9, 0, 0]} rotation={[0, 0, Math.PI / 2]} scale={[0.3 * scale, 0.5 * scale, 0.3 * scale]}>
        <coneGeometry args={[1, 1, 4]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  )
}

/**
 * Aquarium — glass tank with animated fish.
 * Transparent walls, semi-transparent water volume, and 12 waypoint-seeking fish.
 */
export function Aquarium() {
  const [px, py, pz] = AQUARIUM.POSITION
  const { TANK_WIDTH, TANK_HEIGHT, TANK_DEPTH, WALL_THICKNESS } = AQUARIUM

  const halfW = TANK_WIDTH / 2
  const halfH = TANK_HEIGHT / 2
  const halfD = TANK_DEPTH / 2

  return (
    <group position={[px, py, pz]}>
      {/* Sign */}
      <Text
        position={[0, TANK_HEIGHT + 1, -halfD - 0.5]}
        fontSize={1.0}
        color="#88ccee"
        anchorX="center"
        anchorY="bottom"
      >
        Aquarium
      </Text>

      {/* === Floor === */}
      <RigidBody type="fixed" friction={0.5} restitution={0}>
        <mesh receiveShadow position={[0, WALL_THICKNESS / 2, 0]}>
          <boxGeometry args={[TANK_WIDTH, WALL_THICKNESS, TANK_DEPTH]} />
          <meshStandardMaterial color="#556677" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* === Glass Walls === */}
      {/* Front wall (−Z) */}
      <GlassWall
        position={[0, halfH, -halfD + WALL_THICKNESS / 2]}
        size={[TANK_WIDTH, TANK_HEIGHT, WALL_THICKNESS]}
      />
      {/* Back wall (+Z) */}
      <GlassWall
        position={[0, halfH, halfD - WALL_THICKNESS / 2]}
        size={[TANK_WIDTH, TANK_HEIGHT, WALL_THICKNESS]}
      />
      {/* Left wall (−X) */}
      <GlassWall
        position={[-halfW + WALL_THICKNESS / 2, halfH, 0]}
        size={[WALL_THICKNESS, TANK_HEIGHT, TANK_DEPTH]}
      />
      {/* Right wall (+X) */}
      <GlassWall
        position={[halfW - WALL_THICKNESS / 2, halfH, 0]}
        size={[WALL_THICKNESS, TANK_HEIGHT, TANK_DEPTH]}
      />

      {/* === Water Volume === */}
      <WaterVolume />

      {/* === Fish === */}
      {FISH_DEFS.map((def, i) => (
        <Fish key={i} color={def.color} scale={def.scale} speed={def.speed} index={i} />
      ))}
    </group>
  )
}
