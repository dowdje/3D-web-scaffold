import React, { Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'

import { Player } from './components/Player/Player'
import { PlayerModel } from './components/Player/PlayerModel'
import { HumanModel } from './components/Player/HumanModel'
import { Sandbox } from './components/Level/Sandbox'
import { Environment } from './components/Environment/Environment'
import { FollowCamera } from './components/Camera/FollowCamera'
import { HUD } from './components/UI/HUD'
import { CONTROLS_MAP } from './systems/controls'
import { PLAYER, HUMAN_PLAYER } from './systems/constants'
import { useGameStore } from './systems/gameStore'

function PlayerSwitcher() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Digit1') useGameStore.getState().setActivePlayer(1)
      if (e.code === 'Digit2') useGameStore.getState().setActivePlayer(2)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
  return null
}

export default function App() {
  const debugPhysics = useGameStore((s) => s.debugPhysics)

  return (
    <>
      <Leva collapsed />
      <HUD />
      <PlayerSwitcher />
      <KeyboardControls map={CONTROLS_MAP}>
        <Canvas
          shadows
          camera={{ fov: 60, near: 0.1, far: 500 }}
          gl={{ antialias: true }}
          style={{ width: '100vw', height: '100vh' }}
        >
          <Suspense fallback={null}>
            <Physics
              gravity={[0, -9.81, 0]}
              debug={debugPhysics}
              timeStep="vary"
            >
              <Environment />
              <Player playerId={1} config={PLAYER} spawnPosition={[0, 3, 0]}>
                <PlayerModel />
              </Player>
              <Player playerId={2} config={HUMAN_PLAYER} spawnPosition={[3, 3, 0]}>
                <HumanModel />
              </Player>
              <Sandbox />
            </Physics>
            <FollowCamera />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  )
}
