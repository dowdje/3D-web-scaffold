import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, BATTING } from '../../systems/constants'
import { useGameStore } from '../../systems/gameStore'

const _target = new THREE.Vector3()
const _desiredPosition = new THREE.Vector3()

export function FollowCamera() {
  useFrame((state, delta) => {
    const store = useGameStore.getState()
    const { activePlayer, playerPosition, playerYaw, player2Position, player2Yaw } = store

    const position = activePlayer === 1 ? playerPosition : player2Position
    const yaw = activePlayer === 1 ? playerYaw : player2Yaw

    // Batting cage override: camera behind the plate, facing the pitcher
    if (store.battingMounted && store.battingRef?.current) {
      const cagePos = store.battingRef.current.position
      // Camera sits behind the batter (+Z side), elevated, looking toward pitcher (-Z)
      _desiredPosition.set(
        cagePos.x,
        cagePos.y + 3,
        cagePos.z + BATTING.BATTER_OFFSET_Z + 5
      )
      // Look toward pitching machine
      _target.set(
        cagePos.x,
        cagePos.y + BATTING.PITCH_HEIGHT,
        cagePos.z + BATTING.PITCHER_OFFSET_Z
      )

      state.camera.position.lerp(_desiredPosition, 1 - Math.exp(-CAMERA.LERP_SPEED * delta))
      state.camera.lookAt(_target)
      return
    }

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
