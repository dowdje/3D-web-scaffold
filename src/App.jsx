import React, { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { KeyboardControls } from '@react-three/drei'
import { Leva } from 'leva'

import { Player } from './components/Player/Player'
import { Arena } from './components/Level/Arena'
import { Environment } from './components/Environment/Environment'
import { FollowCamera } from './components/Camera/FollowCamera'
import { HUD } from './components/UI/HUD'
import { Crosshair } from './components/UI/Crosshair'
import { DeathScreen } from './components/UI/DeathScreen'
import { HitMarker } from './components/UI/HitMarker'
import { ProjectileManager } from './components/Combat/ProjectileManager'
import { HitscanTracer } from './components/Combat/HitscanTracer'
import { ExplosionEffect } from './components/Combat/ExplosionEffect'
import { EnemyManager } from './components/Enemy/EnemyManager'
import { CONTROLS_MAP } from './systems/controls'
import { useGameStore } from './systems/gameStore'

export default function App() {
  const debugPhysics = useGameStore((s) => s.debugPhysics)

  return (
    <>
      <Leva collapsed />
      <HUD />
      <Crosshair />
      <DeathScreen />
      <HitMarker />
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
              <Arena />
              <ProjectileManager />
              <EnemyManager />
            </Physics>
            <FollowCamera />
            <HitscanTracer />
            <ExplosionEffect />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </>
  )
}
