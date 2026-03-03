export const createGameSlice = (set) => ({
  // Debug
  debugPhysics: false,
  toggleDebugPhysics: () => set((s) => ({ debugPhysics: !s.debugPhysics })),

  // Game phase
  phase: 'playing',
  setPhase: (phase) => set({ phase }),

  // Camera
  cameraMode: 'thirdPerson',
  setCameraMode: (mode) => set({ cameraMode: mode }),
})
