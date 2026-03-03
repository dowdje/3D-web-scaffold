import { useEffect } from 'react'
import { useMouseLookContext } from './MouseLookContext'
import { CAMERA } from '../systems/constants'

/**
 * Handles pointer lock, mouse movement for look, and fire/aim mouse buttons.
 * Updates refs from MouseLookContext — zero re-renders per frame.
 */
export function useMouseLook() {
  const { yawRef, pitchRef, isFireDownRef, isAimDownRef, isLockedRef } = useMouseLookContext()

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const requestLock = () => {
      if (!document.pointerLockElement) {
        canvas.requestPointerLock()
      }
    }

    const onLockChange = () => {
      isLockedRef.current = document.pointerLockElement === canvas
    }

    const onMouseMove = (e) => {
      if (!isLockedRef.current) return
      yawRef.current -= e.movementX * CAMERA.MOUSE_SENSITIVITY
      pitchRef.current -= e.movementY * CAMERA.MOUSE_SENSITIVITY
      // Clamp pitch
      pitchRef.current = Math.max(CAMERA.MIN_PITCH, Math.min(CAMERA.MAX_PITCH, pitchRef.current))
    }

    const onMouseDown = (e) => {
      if (!isLockedRef.current) return
      if (e.button === 0) isFireDownRef.current = true
      if (e.button === 2) isAimDownRef.current = true
    }

    const onMouseUp = (e) => {
      if (e.button === 0) isFireDownRef.current = false
      if (e.button === 2) isAimDownRef.current = false
    }

    const onContextMenu = (e) => e.preventDefault()

    canvas.addEventListener('click', requestLock)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup', onMouseUp)
    document.addEventListener('contextmenu', onContextMenu)

    return () => {
      canvas.removeEventListener('click', requestLock)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('contextmenu', onContextMenu)
    }
  }, [yawRef, pitchRef, isFireDownRef, isAimDownRef, isLockedRef])

  return { yawRef, pitchRef, isFireDownRef, isAimDownRef, isLockedRef }
}
