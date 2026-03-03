import React, { createContext, useContext, useRef, useMemo } from 'react'

const MouseLookContext = createContext(null)

export function MouseLookProvider({ children }) {
  const yawRef = useRef(0)
  const pitchRef = useRef(0)
  const isFireDownRef = useRef(false)
  const isAimDownRef = useRef(false)
  const isLockedRef = useRef(false)

  const value = useMemo(() => ({
    yawRef,
    pitchRef,
    isFireDownRef,
    isAimDownRef,
    isLockedRef,
  }), [])

  return (
    <MouseLookContext.Provider value={value}>
      {children}
    </MouseLookContext.Provider>
  )
}

export function useMouseLookContext() {
  const ctx = useContext(MouseLookContext)
  if (!ctx) throw new Error('useMouseLookContext must be used within MouseLookProvider')
  return ctx
}
