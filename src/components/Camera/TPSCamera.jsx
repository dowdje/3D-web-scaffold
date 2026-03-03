import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'
import { useMouseLookContext } from '../../hooks/MouseLookContext'

const _desiredPosition = new THREE.Vector3()
const _target = new THREE.Vector3()

/**
 * Third-person shooter camera.
 * Orbits around the player using yaw + pitch from mouse look context.
 */
export function TPSCamera() {
  const { yawRef, pitchRef } = useMouseLookContext()

  useFrame((state, delta) => {
    const { playerPosition } = useGameStore.getState()

    const yaw = yawRef.current
    const pitch = pitchRef.current

    // Look target — slightly above player
    _target.set(
      playerPosition[0] + CAMERA.LOOK_OFFSET[0],
      playerPosition[1] + CAMERA.LOOK_OFFSET[1],
      playerPosition[2] + CAMERA.LOOK_OFFSET[2]
    )

    // Spherical offset from player
    const dist = CAMERA.TPS_DISTANCE
    const height = CAMERA.TPS_HEIGHT

    _desiredPosition.set(
      playerPosition[0] + dist * Math.cos(pitch) * Math.sin(yaw),
      playerPosition[1] + height + dist * Math.sin(pitch),
      playerPosition[2] + dist * Math.cos(pitch) * Math.cos(yaw)
    )

    state.camera.position.lerp(_desiredPosition, 1 - Math.exp(-CAMERA.LERP_SPEED * delta))
    state.camera.lookAt(_target)
  })

  return null
}
