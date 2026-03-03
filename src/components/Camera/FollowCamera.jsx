import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const _target = new THREE.Vector3()
const _desiredPosition = new THREE.Vector3()

export function FollowCamera() {
  useFrame((state, delta) => {
    const { activePlayer, playerPosition, playerYaw, player2Position, player2Yaw } =
      useGameStore.getState()

    const position = activePlayer === 1 ? playerPosition : player2Position
    const yaw = activePlayer === 1 ? playerYaw : player2Yaw

    _target.set(
      position[0] + CAMERA.LOOK_OFFSET[0],
      position[1] + CAMERA.LOOK_OFFSET[1],
      position[2] + CAMERA.LOOK_OFFSET[2]
    )

    // Rotate the camera offset around the player based on yaw
    const offsetX = CAMERA.OFFSET[0]
    const offsetY = CAMERA.OFFSET[1]
    const offsetZ = CAMERA.OFFSET[2]

    const rotatedX = offsetX * Math.cos(yaw) + offsetZ * Math.sin(yaw)
    const rotatedZ = -offsetX * Math.sin(yaw) + offsetZ * Math.cos(yaw)

    _desiredPosition.set(
      position[0] + rotatedX,
      position[1] + offsetY,
      position[2] + rotatedZ
    )

    state.camera.position.lerp(_desiredPosition, 1 - Math.exp(-CAMERA.LERP_SPEED * delta))
    state.camera.lookAt(_target)
  })

  return null
}
