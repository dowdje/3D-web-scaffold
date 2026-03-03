import { create } from 'zustand'

/**
 * Central game state store.
 * Extend this as you add new game systems (health, inventory, score, etc.)
 */
export const useGameStore = create((set, get) => ({
  // --- Debug ---
  debugPhysics: false,
  toggleDebugPhysics: () => set((s) => ({ debugPhysics: !s.debugPhysics })),

  // --- Player state ---
  playerPosition: [0, 5, 0],
  playerVelocity: [0, 0, 0],
  isGrounded: false,
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerVelocity: (vel) => set({ playerVelocity: vel }),
  setIsGrounded: (grounded) => set({ isGrounded: grounded }),
  playerYaw: 0,
  setPlayerYaw: (yaw) => set({ playerYaw: yaw }),

  // --- Game phase ---
  phase: 'playing', // 'menu' | 'playing' | 'paused' | 'gameover'
  setPhase: (phase) => set({ phase }),

  // --- Camera ---
  cameraMode: 'thirdPerson', // 'thirdPerson' | 'firstPerson' | 'orbit'
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // --- Respawn ---
  respawnPoint: [0, 5, 0],
  setRespawnPoint: (point) => set({ respawnPoint: point }),
  respawn: () => set((s) => ({ playerPosition: [...s.respawnPoint] })),
}))
