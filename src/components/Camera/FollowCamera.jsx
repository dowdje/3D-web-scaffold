import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const _target = new THREE.Vector3()
const _desiredPosition = new THREE.Vector3()

export function FollowCamera() {
  useFrame((state, delta) => {
    const { playerPosition, playerYaw } = useGameStore.getState()

    _target.set(
      playerPosition[0] + CAMERA.LOOK_OFFSET[0],
      playerPosition[1] + CAMERA.LOOK_OFFSET[1],
      playerPosition[2] + CAMERA.LOOK_OFFSET[2]
    )

    // Rotate the camera offset around the player based on yaw
    // OFFSET is [x, y, z] where z is "behind" — rotate the xz part by yaw
    const offsetX = CAMERA.OFFSET[0]
    const offsetY = CAMERA.OFFSET[1]
    const offsetZ = CAMERA.OFFSET[2]

    const rotatedX = offsetX * Math.cos(playerYaw) + offsetZ * Math.sin(playerYaw)
    const rotatedZ = -offsetX * Math.sin(playerYaw) + offsetZ * Math.cos(playerYaw)

    _desiredPosition.set(
      playerPosition[0] + rotatedX,
      playerPosition[1] + offsetY,
      playerPosition[2] + rotatedZ
    )

    state.camera.position.lerp(_desiredPosition, 1 - Math.exp(-CAMERA.LERP_SPEED * delta))
    state.camera.lookAt(_target)
  })

  return null
}
