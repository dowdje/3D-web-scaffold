import React, { forwardRef } from 'react'
import { RigidBody, BallCollider } from '@react-three/rapier'
import { GOLF } from '../../systems/constants'

export const GolfBall = forwardRef(function GolfBall({ position }, ref) {
  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      position={position}
      mass={GOLF.BALL_MASS}
      linearDamping={0.15}
      angularDamping={2.0}
      name="golfBall"
    >
      <BallCollider args={[GOLF.BALL_RADIUS]} restitution={0.15} friction={0.6} />
      <mesh castShadow>
        <sphereGeometry args={[GOLF.BALL_RADIUS, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </RigidBody>
  )
})
