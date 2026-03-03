import { PLAYER } from '../constants'

export const createPlayerSlice = (set, get) => ({
  // Position & movement
  playerPosition: [0, 5, 0],
  playerVelocity: [0, 0, 0],
  isGrounded: false,
  playerYaw: 0,
  setPlayerPosition: (pos) => set({ playerPosition: pos }),
  setPlayerVelocity: (vel) => set({ playerVelocity: vel }),
  setIsGrounded: (grounded) => set({ isGrounded: grounded }),
  setPlayerYaw: (yaw) => set({ playerYaw: yaw }),

  // Respawn
  respawnPoint: [0, 5, 0],
  setRespawnPoint: (point) => set({ respawnPoint: point }),
  respawn: () => set((s) => ({ playerPosition: [...s.respawnPoint] })),

  // Health
  health: PLAYER.MAX_HEALTH,
  maxHealth: PLAYER.MAX_HEALTH,
  isDead: false,

  takeDamage: (amount) => {
    // Death disabled for now
    return
  },

  die: () => {
    set({ isDead: true, phase: 'dead' })
    get().cancelReload?.()
  },

  respawnPlayer: () => {
    set({
      health: PLAYER.MAX_HEALTH,
      isDead: false,
      phase: 'playing',
      playerPosition: [0, 5, 0],
    })
    // Reset weapons
    get().resetWeapons?.()
  },
})
