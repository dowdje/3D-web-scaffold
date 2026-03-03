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

  // --- Active player ---
  activePlayer: 1,
  setActivePlayer: (n) => set({ activePlayer: n }),

  // --- Player 2 state ---
  player2Position: [3, 5, 0],
  setPlayer2Position: (pos) => set({ player2Position: pos }),
  player2Yaw: 0,
  setPlayer2Yaw: (yaw) => set({ player2Yaw: yaw }),

  // --- Game phase ---
  phase: 'playing', // 'menu' | 'playing' | 'paused' | 'gameover'
  setPhase: (phase) => set({ phase }),

  // --- Camera ---
  cameraMode: 'thirdPerson', // 'thirdPerson' | 'firstPerson' | 'orbit'
  setCameraMode: (mode) => set({ cameraMode: mode }),

  // --- Rope swings ---
  ropeRegistry: {},
  registerRope: (id, entry) =>
    set((s) => ({ ropeRegistry: { ...s.ropeRegistry, [id]: entry } })),
  unregisterRope: (id) =>
    set((s) => {
      const { [id]: _, ...rest } = s.ropeRegistry
      return { ropeRegistry: rest }
    }),
  ropeGrabs: {},
  setRopeGrab: (playerId, data) =>
    set((s) => ({ ropeGrabs: { ...s.ropeGrabs, [playerId]: data } })),
  clearRopeGrab: (playerId) =>
    set((s) => {
      const { [playerId]: _, ...rest } = s.ropeGrabs
      return { ropeGrabs: rest }
    }),
  nearRope: false,
  setNearRope: (v) => set({ nearRope: v }),

  // --- Golf ---
  golfMode: false,
  setGolfMode: (v) => set({ golfMode: v }),
  golfPower: 0,
  setGolfPower: (v) => set({ golfPower: v }),

  // --- Worm ---
  wormMounted: false,
  setWormMounted: (v) => set({ wormMounted: v }),
  wormHeadRef: null,
  setWormHeadRef: (ref) => set({ wormHeadRef: ref }),
  wormYaw: 0,
  setWormYaw: (yaw) => set({ wormYaw: yaw }),
  nearWorm: false,
  setNearWorm: (v) => set({ nearWorm: v }),

  // --- Dirt Bike ---
  bikeMounted: false,
  setBikeMounted: (v) => set({ bikeMounted: v }),
  bikeRef: null,
  setBikeRef: (ref) => set({ bikeRef: ref }),
  bikeYaw: 0,
  setBikeYaw: (yaw) => set({ bikeYaw: yaw }),
  nearBike: false,
  setNearBike: (v) => set({ nearBike: v }),
  bikeSpeed: 0,
  setBikeSpeed: (v) => set({ bikeSpeed: v }),

  // --- Car Smash ---
  carSmashMounted: false,
  setCarSmashMounted: (v) => set({ carSmashMounted: v }),
  carSmashRef: null,
  setCarSmashRef: (ref) => set({ carSmashRef: ref }),
  nearCarSmash: false,
  setNearCarSmash: (v) => set({ nearCarSmash: v }),
  carSmashYaw: 0,
  setCarSmashYaw: (yaw) => set({ carSmashYaw: yaw }),
  carSmashSwing: false,
  setCarSmashSwing: (v) => set({ carSmashSwing: v }),
  carSmashImpact: false,
  setCarSmashImpact: (v) => set({ carSmashImpact: v }),
  carSmashReset: false,
  setCarSmashReset: (v) => set({ carSmashReset: v }),

  // --- Basketball ---
  basketballHeld: false,
  setBasketballHeld: (v) => set({ basketballHeld: v }),
  basketballPower: 0,
  setBasketballPower: (v) => set({ basketballPower: v }),
  nearBasketball: false,
  setNearBasketball: (v) => set({ nearBasketball: v }),
  basketballRef: null,
  setBasketballRef: (ref) => set({ basketballRef: ref }),

  // --- Batting Cage ---
  battingMounted: false,
  setBattingMounted: (v) => set({ battingMounted: v }),
  nearBatting: false,
  setNearBatting: (v) => set({ nearBatting: v }),
  battingRef: null,
  setBattingRef: (ref) => set({ battingRef: ref }),
  battingSwing: false,
  setBattingSwing: (v) => set({ battingSwing: v }),
  battingLastHitDist: 0,
  setBattingLastHitDist: (v) => set({ battingLastHitDist: v }),

  // --- Respawn ---
  respawnPoint: [0, 5, 0],
  setRespawnPoint: (point) => set({ respawnPoint: point }),
  respawn: () => set((s) => ({ playerPosition: [...s.respawnPoint] })),
}))
