export const createCombatSlice = (set, get) => ({
  // Projectiles
  projectiles: [],
  nextProjectileId: 1,

  addProjectile: (proj) => {
    const id = get().nextProjectileId
    set((s) => ({
      projectiles: [...s.projectiles, { ...proj, id }],
      nextProjectileId: id + 1,
    }))
  },

  removeProjectile: (id) => {
    set((s) => ({
      projectiles: s.projectiles.filter((p) => p.id !== id),
    }))
  },

  // Tracers (hitscan visual)
  tracers: [],
  addTracer: (tracer) => {
    set((s) => ({ tracers: [...s.tracers, tracer] }))
  },
  removeTracer: (tracer) => {
    set((s) => ({ tracers: s.tracers.filter((t) => t !== tracer) }))
  },

  // Explosions
  explosions: [],
  addExplosion: (explosion) => {
    set((s) => ({ explosions: [...s.explosions, explosion] }))
  },
  removeExplosion: (explosion) => {
    set((s) => ({ explosions: s.explosions.filter((e) => e !== explosion) }))
  },

  // Hit markers
  hitMarkers: [],
  addHitMarker: (marker) => {
    set((s) => ({ hitMarkers: [...s.hitMarkers, marker] }))
  },
  removeHitMarker: (marker) => {
    set((s) => ({ hitMarkers: s.hitMarkers.filter((m) => m !== marker) }))
  },

  // Score
  score: 0,
  kills: 0,
  addScore: (amount) => set((s) => ({ score: s.score + amount })),
  addKill: () => set((s) => ({ kills: s.kills + 1 })),

  // Enemies
  enemies: [],
  nextEnemyId: 1,

  spawnEnemy: (position) => {
    const id = get().nextEnemyId
    set((s) => ({
      enemies: [...s.enemies, { id, position, health: 30 }],
      nextEnemyId: id + 1,
    }))
    return id
  },

  damageEnemy: (id, amount) => {
    const { enemies } = get()
    const enemy = enemies.find((e) => e.id === id)
    if (!enemy) return

    const newHealth = enemy.health - amount
    if (newHealth <= 0) {
      set((s) => ({
        enemies: s.enemies.filter((e) => e.id !== id),
      }))
      get().addScore(100)
      get().addKill()
      get().addHitMarker({ time: performance.now(), kill: true })
    } else {
      set((s) => ({
        enemies: s.enemies.map((e) =>
          e.id === id ? { ...e, health: newHealth } : e
        ),
      }))
      get().addHitMarker({ time: performance.now(), kill: false })
    }
  },

  removeEnemy: (id) => {
    set((s) => ({
      enemies: s.enemies.filter((e) => e.id !== id),
    }))
  },
})
