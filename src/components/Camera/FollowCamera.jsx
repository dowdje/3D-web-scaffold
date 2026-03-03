import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const _target = new THREE.Vector3()
const _desiredPosition = new THREE.Vector3()

export function FollowCamera() {
  useFrame((state, delta) => {
    const playerPosition = useGameStore.getState().playerPosition

    _target.set(
      playerPosition[0] + CAMERA.LOOK_OFFSET[0],
      playerPosition[1] + CAMERA.LOOK_OFFSET[1],
      playerPosition[2] + CAMERA.LOOK_OFFSET[2]
    )

    _desiredPosition.set(
      playerPosition[0] + CAMERA.OFFSET[0],
      playerPosition[1] + CAMERA.OFFSET[1],
      playerPosition[2] + CAMERA.OFFSET[2]
    )

    state.camera.position.lerp(_desiredPosition, 1 - Math.exp(-CAMERA.LERP_SPEED * delta))
    state.camera.lookAt(_target)
  })

  return null
}
