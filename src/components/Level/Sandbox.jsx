import React from 'react'
import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { Platform } from './Platform'
import { RopeSwing } from './RopeSwing'
import { Worm } from './Worm'
import { DirtBike } from './DirtBike'
import { Text } from '@react-three/drei'

/**
 * Physics playground level.
 * Flat ground plane with themed physics zones to explore.
 */
export function Sandbox() {
  return (
    <group>
      {/* === GROUND PLANE === */}
      <RigidBody type="fixed" friction={1} restitution={0}>
        <mesh receiveShadow position={[0, -0.5, 0]}>
          <boxGeometry args={[200, 1, 200]} />
          <meshStandardMaterial color="#3a5f3a" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* === GRID LINES ON GROUND (visual only) === */}
      <gridHelper args={[200, 40, '#2a4a2a', '#2a4a2a']} position={[0, 0.01, 0]} />

      {/* === TRAMPOLINE ZONE === */}
      <TrampolineZone position={[25, 0, -25]} />

      {/* === ROPE SWINGS === */}
      <RopeSwing id="rope-1" anchorPosition={[0, 12, 15]} segmentCount={8} segmentLength={0.6} />
      <RopeSwing id="rope-2" anchorPosition={[-8, 10, 10]} segmentCount={6} segmentLength={0.7} />
      <RopeSwing id="rope-3" anchorPosition={[10, 14, -5]} segmentCount={10} segmentLength={0.5} />

      {/* === GIANT WORM === */}
      <Worm position={[20, 1, 20]} />

      {/* === DIRT BIKE === */}
      <DirtBike position={[-87, 0.4, 85]} />

      {/* === DIRT TRACK LOOP === */}
      <DirtTrack />

      {/* === PERIMETER WALL === */}
      <PerimeterWall />

      {/* === ICE RINK === */}
      <IceRink position={[-25, 0, -25]} />
    </group>
  )
}

/**
 * Bouncy house / trampoline area.
 * High-restitution surfaces that launch the player into the air.
 */
function TrampolineZone({ position = [0, 0, 0] }) {
  const [x, y, z] = position
  const bouncy = 1.5  // >1 means you bounce HIGHER than you fell from
  const wallBouncy = 1.2

  return (
    <group position={position}>
      {/* Sign */}
      <Text
        position={[0, 8, -11]}
        fontSize={1.2}
        color="#ff66aa"
        anchorX="center"
        anchorY="bottom"
      >
        Trampoline Zone
      </Text>

      {/* === Bouncy floor === */}
      <RigidBody type="fixed" restitution={bouncy} friction={0.3}>
        <mesh receiveShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[20, 0.1, 20]} />
          <meshStandardMaterial color="#ff44aa" roughness={0.3} />
        </mesh>
      </RigidBody>

      {/* === Bouncy walls (open on one side for entry) === */}
      {/* Back wall */}
      <BouncyWall position={[0, 3, -10]} size={[20, 6, 0.5]} restitution={wallBouncy} />
      {/* Left wall */}
      <BouncyWall position={[-10, 3, 0]} size={[0.5, 6, 20]} restitution={wallBouncy} />
      {/* Right wall */}
      <BouncyWall position={[10, 3, 0]} size={[0.5, 6, 20]} restitution={wallBouncy} />
      {/* Front wall — two halves with gap for entry */}
      <BouncyWall position={[-7, 3, 10]} size={[6, 6, 0.5]} restitution={wallBouncy} />
      <BouncyWall position={[7, 3, 10]} size={[6, 6, 0.5]} restitution={wallBouncy} />

      {/* === Bouncy platforms at different heights === */}
      <BouncyPlatform position={[-4, 2, -4]} size={[3, 0.3, 3]} restitution={bouncy} />
      <BouncyPlatform position={[4, 4, -4]} size={[3, 0.3, 3]} restitution={bouncy} />
      <BouncyPlatform position={[0, 6, 0]} size={[4, 0.3, 4]} restitution={bouncy} />
      <BouncyPlatform position={[-4, 3, 4]} size={[2.5, 0.3, 2.5]} restitution={bouncy} />
      <BouncyPlatform position={[5, 5, 3]} size={[2, 0.3, 2]} restitution={bouncy} />

      {/* === Bouncy balls to kick around === */}
      <BouncyBall position={[0, 3, 2]} radius={0.5} />
      <BouncyBall position={[2, 3, -3]} radius={0.7} />
      <BouncyBall position={[-3, 3, -1]} radius={0.4} />
    </group>
  )
}

function BouncyWall({ position, size, restitution = 1.2 }) {
  return (
    <RigidBody type="fixed" restitution={restitution} friction={0.1}>
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial
          color="#ff88cc"
          roughness={0.2}
          transparent
          opacity={0.6}
        />
      </mesh>
    </RigidBody>
  )
}

function BouncyPlatform({ position, size, restitution = 1.5 }) {
  return (
    <RigidBody type="fixed" restitution={restitution} friction={0.2}>
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#ff55dd" roughness={0.2} metalness={0.3} />
      </mesh>
    </RigidBody>
  )
}

/**
 * Ice rink — near-zero friction surfaces.
 * Player slides and has trouble stopping. Crates and pucks glide freely.
 */
function IceRink({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      {/* Sign */}
      <Text
        position={[0, 4, -16]}
        fontSize={1.2}
        color="#88ccff"
        anchorX="center"
        anchorY="bottom"
      >
        Ice Rink
      </Text>

      {/* === Ice surface === */}
      <RigidBody type="fixed" friction={0.01} restitution={0.05}>
        <mesh receiveShadow position={[0, 0.05, 0]}>
          <boxGeometry args={[30, 0.1, 30]} />
          <meshStandardMaterial
            color="#cceeff"
            roughness={0.05}
            metalness={0.8}
            transparent
            opacity={0.85}
          />
        </mesh>
      </RigidBody>

      {/* === Rink boards (low walls) === */}
      <IceWall position={[0, 0.6, -15]} size={[30, 1.2, 0.3]} />
      <IceWall position={[0, 0.6, 15]} size={[30, 1.2, 0.3]} />
      <IceWall position={[-15, 0.6, 0]} size={[0.3, 1.2, 30]} />
      <IceWall position={[15, 0.6, 0]} size={[0.3, 1.2, 30]} />

      {/* === Pucks — flat cylinders that slide forever === */}
      <Puck position={[0, 0.3, 0]} />
      <Puck position={[3, 0.3, 4]} />
      <Puck position={[-5, 0.3, -3]} />

      {/* === Sliding crates === */}
      <SlidingCrate position={[6, 0.6, -6]} />
      <SlidingCrate position={[-4, 0.6, 7]} />
      <SlidingCrate position={[-7, 0.6, -8]} size={[1.5, 1.5, 1.5]} />

      {/* === Ramp to slide down onto the ice === */}
      <RigidBody type="fixed" friction={0.02} restitution={0}>
        <mesh castShadow receiveShadow position={[0, 0.8, 16.5]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[4, 0.15, 5]} />
          <meshStandardMaterial color="#aaddff" roughness={0.05} metalness={0.6} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function IceWall({ position, size }) {
  return (
    <RigidBody type="fixed" friction={0.02} restitution={0.3}>
      <mesh castShadow receiveShadow position={position}>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#4488bb" roughness={0.3} metalness={0.5} />
      </mesh>
    </RigidBody>
  )
}

function Puck({ position }) {
  return (
    <RigidBody
      type="dynamic"
      position={position}
      friction={0.005}
      restitution={0.4}
      mass={0.8}
      linearDamping={0.05}
    >
      <mesh castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.15, 16]} />
        <meshStandardMaterial color="#222222" roughness={0.3} metalness={0.7} />
      </mesh>
    </RigidBody>
  )
}

function SlidingCrate({ position, size = [1, 1, 1] }) {
  return (
    <RigidBody
      type="dynamic"
      position={position}
      friction={0.02}
      restitution={0.1}
      mass={3}
      linearDamping={0.05}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#6699bb" roughness={0.4} />
      </mesh>
    </RigidBody>
  )
}

/**
 * Dirt track loop around the map perimeter.
 * Includes ramps, hills, and terrain zones with different friction values.
 */
function DirtTrack() {
  return (
    <group>
      {/* === TRACK SURFACES (14m wide) === */}
      {/* North straight — travel along X */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh receiveShadow position={[0, 0.06, -91]}>
          <boxGeometry args={[196, 0.1, 14]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* South straight — travel along X */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh receiveShadow position={[0, 0.06, 91]}>
          <boxGeometry args={[196, 0.1, 14]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* East straight — travel along Z */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh receiveShadow position={[91, 0.06, 0]}>
          <boxGeometry args={[14, 0.1, 196]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} />
        </mesh>
      </RigidBody>
      {/* West straight — travel along Z */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh receiveShadow position={[-91, 0.06, 0]}>
          <boxGeometry args={[14, 0.1, 196]} />
          <meshStandardMaterial color="#8B7355" roughness={0.9} />
        </mesh>
      </RigidBody>

      {/* === RAMPS — tall enough to launch (high edge ~2m+ above track) === */}
      {/* North straight ramps — travel along X, slope around Z axis */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[-40, 0.8, -91]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[10, 0.2, 12]} />
          <meshStandardMaterial color="#A0522D" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[30, 1.0, -91]} rotation={[0, 0, -0.25]}>
          <boxGeometry args={[10, 0.2, 12]} />
          <meshStandardMaterial color="#A0522D" roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* South straight ramp — travel along X, slope around Z axis */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[0, 0.9, 91]} rotation={[0, 0, 0.22]}>
          <boxGeometry args={[10, 0.2, 12]} />
          <meshStandardMaterial color="#A0522D" roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* East straight ramps — travel along Z, slope around X axis */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[91, 0.8, -30]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[12, 0.2, 10]} />
          <meshStandardMaterial color="#A0522D" roughness={0.7} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[91, 1.0, 40]} rotation={[-0.25, 0, 0]}>
          <boxGeometry args={[12, 0.2, 10]} />
          <meshStandardMaterial color="#A0522D" roughness={0.7} />
        </mesh>
      </RigidBody>
      {/* West straight ramp — travel along Z, slope around X axis */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[-91, 0.9, 20]} rotation={[-0.22, 0, 0]}>
          <boxGeometry args={[12, 0.2, 10]} />
          <meshStandardMaterial color="#A0522D" roughness={0.7} />
        </mesh>
      </RigidBody>

      {/* === HILLS (up+down pairs) — taller bumps === */}
      {/* Hill 1 — North straight, travel along X, slope around Z */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[-14, 0.6, -91]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[6, 0.2, 12]} />
          <meshStandardMaterial color="#9B8565" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[-8, 0.6, -91]} rotation={[0, 0, -0.18]}>
          <boxGeometry args={[6, 0.2, 12]} />
          <meshStandardMaterial color="#9B8565" roughness={0.8} />
        </mesh>
      </RigidBody>
      {/* Hill 2 — South straight, travel along X, slope around Z */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[46, 0.7, 91]} rotation={[0, 0, 0.2]}>
          <boxGeometry args={[6, 0.2, 12]} />
          <meshStandardMaterial color="#9B8565" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[52, 0.7, 91]} rotation={[0, 0, -0.2]}>
          <boxGeometry args={[6, 0.2, 12]} />
          <meshStandardMaterial color="#9B8565" roughness={0.8} />
        </mesh>
      </RigidBody>
      {/* Hill 3 — East straight, travel along Z, slope around X */}
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[91, 0.6, -4]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[12, 0.2, 6]} />
          <meshStandardMaterial color="#9B8565" roughness={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.8} restitution={0}>
        <mesh castShadow receiveShadow position={[91, 0.6, 2]} rotation={[-0.18, 0, 0]}>
          <boxGeometry args={[12, 0.2, 6]} />
          <meshStandardMaterial color="#9B8565" roughness={0.8} />
        </mesh>
      </RigidBody>

      {/* === TERRAIN ZONES === */}
      {/* Water patches — low friction, slippery */}
      <RigidBody type="fixed" friction={0.15} restitution={0}>
        <mesh receiveShadow position={[-60, 0.08, -91]}>
          <boxGeometry args={[12, 0.1, 14]} />
          <meshStandardMaterial color="#3388cc" roughness={0.2} transparent opacity={0.8} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.15} restitution={0}>
        <mesh receiveShadow position={[91, 0.08, -60]}>
          <boxGeometry args={[14, 0.1, 12]} />
          <meshStandardMaterial color="#3388cc" roughness={0.2} transparent opacity={0.8} />
        </mesh>
      </RigidBody>

      {/* Ice patches — near-zero friction */}
      <RigidBody type="fixed" friction={0.02} restitution={0}>
        <mesh receiveShadow position={[60, 0.08, 91]}>
          <boxGeometry args={[12, 0.1, 14]} />
          <meshStandardMaterial color="#aaeeff" roughness={0.05} metalness={0.6} transparent opacity={0.85} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={0.02} restitution={0}>
        <mesh receiveShadow position={[-91, 0.08, 60]}>
          <boxGeometry args={[14, 0.1, 12]} />
          <meshStandardMaterial color="#aaeeff" roughness={0.05} metalness={0.6} transparent opacity={0.85} />
        </mesh>
      </RigidBody>

      {/* Mud patches — high friction, sticky */}
      <RigidBody type="fixed" friction={2.0} restitution={0}>
        <mesh receiveShadow position={[20, 0.08, -91]}>
          <boxGeometry args={[12, 0.1, 14]} />
          <meshStandardMaterial color="#4a3520" roughness={1.0} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={2.0} restitution={0}>
        <mesh receiveShadow position={[-91, 0.08, -30]}>
          <boxGeometry args={[14, 0.1, 12]} />
          <meshStandardMaterial color="#4a3520" roughness={1.0} />
        </mesh>
      </RigidBody>

      {/* Sand patches — moderate drag */}
      <RigidBody type="fixed" friction={1.5} restitution={0}>
        <mesh receiveShadow position={[-30, 0.08, 91]}>
          <boxGeometry args={[12, 0.1, 14]} />
          <meshStandardMaterial color="#c2b280" roughness={0.9} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={1.5} restitution={0}>
        <mesh receiveShadow position={[91, 0.08, 30]}>
          <boxGeometry args={[14, 0.1, 12]} />
          <meshStandardMaterial color="#c2b280" roughness={0.9} />
        </mesh>
      </RigidBody>
    </group>
  )
}

/**
 * Perimeter wall around the entire map.
 * Keeps the bike and player from falling off the edges.
 */
function PerimeterWall() {
  const wallHeight = 6
  const wallThickness = 1
  return (
    <group>
      {/* North wall */}
      <RigidBody type="fixed" friction={0.5} restitution={0.2}>
        <mesh castShadow receiveShadow position={[0, wallHeight / 2, -100]}>
          <boxGeometry args={[202, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#444444" roughness={0.8} transparent opacity={0.7} />
        </mesh>
      </RigidBody>
      {/* South wall */}
      <RigidBody type="fixed" friction={0.5} restitution={0.2}>
        <mesh castShadow receiveShadow position={[0, wallHeight / 2, 100]}>
          <boxGeometry args={[202, wallHeight, wallThickness]} />
          <meshStandardMaterial color="#444444" roughness={0.8} transparent opacity={0.7} />
        </mesh>
      </RigidBody>
      {/* East wall */}
      <RigidBody type="fixed" friction={0.5} restitution={0.2}>
        <mesh castShadow receiveShadow position={[100, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, 202]} />
          <meshStandardMaterial color="#444444" roughness={0.8} transparent opacity={0.7} />
        </mesh>
      </RigidBody>
      {/* West wall */}
      <RigidBody type="fixed" friction={0.5} restitution={0.2}>
        <mesh castShadow receiveShadow position={[-100, wallHeight / 2, 0]}>
          <boxGeometry args={[wallThickness, wallHeight, 202]} />
          <meshStandardMaterial color="#444444" roughness={0.8} transparent opacity={0.7} />
        </mesh>
      </RigidBody>
    </group>
  )
}

function BouncyBall({ position, radius = 0.5 }) {
  return (
    <RigidBody
      type="dynamic"
      position={position}
      restitution={1.3}
      friction={0.2}
      mass={0.5}
    >
      <mesh castShadow>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial color="#ffaaee" roughness={0.1} metalness={0.4} />
      </mesh>
    </RigidBody>
  )
}
