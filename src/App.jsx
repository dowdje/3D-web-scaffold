import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'

import { Player } from './components/Player/Player'
import { Sandbox } from './components/Level/Sandbox'
import { Environment } from './components/Environment/Environment'
import { FollowCamera } from './components/Camera/FollowCamera'
import { HUD } from './components/UI/HUD'
import { CONTROLS_MAP } from './systems/controls'
import { useGameStore } from './systems/gameStore'

export default function App() {
  const debugPhysics = useGameStore((s) => s.debugPhysics)

  return (
    <>
      <Leva collapsed />
      <HUD />
      <KeyboardControls map={CONTROLS_MAP}>
        <Canvas
          shadows
          camera={{ fov: 60, near: 0.1, far: 500 }}
          gl={{ antialias: true }}
          style={{ width: '100vw', height: '100vh' }}
        >
          <Suspense fallback={null}>
            <Physics
              gravity={[0, -30, 0]}
              debug={debugPhysics}
              timeStep="vary"
            >
              <Environment />
              <Player />
              <Sandbox />
            </Physics>
            <FollowCamera />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  )
}
