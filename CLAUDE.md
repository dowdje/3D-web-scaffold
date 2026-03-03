# CLAUDE.md — Project Context for Claude Code

## Project Overview

This is a **third-person shooter (TPS) scaffold** — foundational systems for a 3D shooter built on top of a platformer base. It includes mouse-look controls, dual weapon types (hitscan rifle + projectile launcher), enemy drones with AI, destructible objects, health/death/respawn, and an arena level. It is not a polished game; it's clean, extensible infrastructure meant to be forked and expanded.

## Tech Stack

- **Vite** — dev server and bundler
- **React 18** — component architecture
- **React Three Fiber (R3F)** — declarative Three.js wrapper
- **@react-three/rapier** — Rapier3D WASM physics engine bindings
- **@react-three/drei** — R3F utility components (Sky, Text, KeyboardControls, etc.)
- **Zustand** — global state management (slice-based architecture)
- **Leva** — runtime debug parameter UI
- **Three.js** — underlying 3D engine (accessed through R3F, rarely directly)

## Commands

```bash
npm run dev      # Start dev server on localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build
```

## Architecture & Key Patterns

### File Structure Convention
- `src/components/{Domain}/{Component}.jsx` — React components grouped by domain (Player, Level, Camera, UI, Environment, Combat, Enemy)
- `src/systems/` — Non-visual game logic: state store, constants, control mappings, weapon definitions
- `src/systems/store/` — Zustand store slices (player, weapon, combat, game) composed in `index.js`
- `src/hooks/` — React hooks and context (MouseLookContext, useMouseLook)
- `src/utils/` — Pure helpers (entityRegistry, explosion)
- `src/assets/` — Static assets (models, textures, sounds)

### Controls (TPS Mouse-Look)
- **Mouse**: Look (yaw/pitch), left-click = fire, right-click = aim
- **WASD**: Move relative to mouse direction (standard FPS-style)
- **Q**: Weapon swap, **R**: Reload
- **Space**: Jump, **Shift**: Sprint
- Pointer lock on click, ESC to unlock

### Mouse Look System
- `MouseLookContext` holds stable refs (`yawRef`, `pitchRef`, `isFireDownRef`, `isAimDownRef`) — zero re-renders per frame
- `useMouseLook` hook handles pointer lock, mousemove, mousedown/up events
- Player and TPSCamera read from these refs in their `useFrame` loops

### Player Controller (`src/components/Player/Player.jsx`)
This is the most complex file. It handles:
- Physics-based movement using a **capsule RigidBody** with locked rotations
- **Mouse-look movement** — WASD relative to mouse yaw direction
- Ground detection via **raycasting** downward from the capsule bottom
- **Coyote time**, **jump buffering**, **air control**
- **Weapon firing** — hitscan raycasts via Rapier `world.castRay()`, projectile spawning
- **Weapon swap** (Q) and **reload** (R) with single-press detection
- Auto-respawn when falling below `PLAYER.RESPAWN_Y`
- Skips input when `isDead`

### Weapon System
Two weapon types demonstrating different patterns:
- **Rifle (hitscan)**: Instant `world.castRay()` from eye position along aim vector. Resolves hit collider → entity registry → `takeDamage()`. Spawns tracer visual.
- **Launcher (projectile)**: Spawns `<RigidBody sensor>` sphere with velocity. On `onIntersectionEnter`, triggers explosion via `world.intersectionsWithShape()` with distance falloff.

Weapon state in `weaponSlice.js`: ammo, reserve, reloading flag, `setTimeout`-based reload timer with cancellation.

### Entity Registry (`src/utils/entityRegistry.js`)
A `Map<colliderHandle, { type, id, takeDamage }>` bridging Rapier physics hits to game logic. Components register on mount via `useEntityRegistry` hook, unregister on unmount. Used by hitscan raycasts and explosion area damage.

### State Management (Slice Architecture)
Store is composed from slices in `src/systems/store/index.js`:
- `playerSlice` — position, health, death/respawn
- `weaponSlice` — active weapon, ammo, reload, swap
- `combatSlice` — projectiles, tracers, explosions, hit markers, enemies, score
- `gameSlice` — phase, debug flags, camera mode

`src/systems/gameStore.js` re-exports from the slice store for backward compatibility.

Access patterns:
- React components: `useGameStore((s) => s.field)` (selector pattern)
- `useFrame` / non-React: `useGameStore.getState().field` (no subscription)

### Enemy System
- **Drone** (`src/components/Enemy/Drone.jsx`): `kinematicPosition` RigidBody, chases player, attacks on cooldown when in range. Registers in entity registry.
- **EnemyManager**: Spawns drones in a ring around the player on a timer. Manages enemy array in store.

### Destructibles
- **Crate**: Dynamic RigidBody, local health state, disappears when destroyed
- **ExplosiveBarrel**: Like crate but triggers area explosion on death via `triggerExplosion()`

### Camera System
**TPSCamera** orbits the player using yaw + pitch from mouse look context. Spherical coordinates: `x = dist * cos(pitch) * sin(yaw)`, etc. Lerps position for smooth following.

**FollowCamera** (legacy, kept for reference) orbits behind player using tank yaw.

### Constants & Tuning (`src/systems/constants.js`)
All gameplay-affecting numbers centralized: PLAYER, CAMERA, ENEMY, SPAWNER, DESTRUCTIBLE sections.

### Level Design Pattern
Levels compose `<Platform>`, `<Crate>`, `<ExplosiveBarrel>`, and `<RigidBody>` elements. The **Arena** is an 80x80 walled area with cover walls, pillars, elevated platforms, crate clusters, and barrel placements.

## Code Style & Conventions

- Functional components only, no class components
- Hooks for all stateful logic
- Named exports for components (not default, except `App`)
- Temp/scratch vectors allocated at module scope and reused in frame loops to avoid GC pressure
- Import Three.js as `import * as THREE from 'three'` when needed directly

## Things to Avoid

- Don't use `useState` for per-frame game state — use Zustand or refs
- Don't allocate objects (new Vector3, etc.) inside `useFrame` — reuse module-level instances
- Don't add `<OrbitControls>` alongside TPSCamera — they'll fight
- Don't set `type="dynamic"` on level geometry — use `"fixed"` for static, `"kinematicPosition"` for moving
- Don't import from `@dimforge/rapier3d-compat` directly — use `@react-three/rapier` abstractions
- Don't store per-frame mouse data in Zustand — use refs via MouseLookContext
