# CLAUDE.md — Project Context for Claude Code

## Project Overview

This is a **3D platformer game development playground** — a reusable scaffold for rapidly prototyping platformer-style games. It is not a finished game; it's foundational infrastructure meant to be forked and extended into different game projects.

## Tech Stack

- **Vite** — dev server and bundler
- **React 18** — component architecture
- **React Three Fiber (R3F)** — declarative Three.js wrapper
- **@react-three/rapier** — Rapier3D WASM physics engine bindings
- **@react-three/drei** — R3F utility components (Sky, Text, KeyboardControls, etc.)
- **Zustand** — global state management (no Redux, no context providers)
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
- `src/components/{Domain}/{Component}.jsx` — React components grouped by domain (Player, Level, Camera, UI, Environment)
- `src/systems/` — Non-visual game logic: state store, constants, control mappings
- `src/hooks/` — Reusable React hooks for game systems
- `src/utils/` — Pure helper functions
- `src/assets/` — Static assets (models, textures, sounds)

### Player Controller (`src/components/Player/Player.jsx`)
This is the most complex and sensitive file. It handles:
- Physics-based movement using a **capsule RigidBody** with locked rotations
- Camera-relative directional input (forward = toward camera facing direction)
- Ground detection via **raycasting** downward from the capsule bottom
- **Coyote time** — brief jump grace period after leaving an edge
- **Jump buffering** — pre-landing jump inputs are queued and executed on ground contact
- **Air control** — reduced movement multiplier while airborne
- Auto-respawn when falling below `PLAYER.RESPAWN_Y`

When modifying the player controller, be careful with:
- The `useFrame` loop runs every frame; avoid allocations inside it (reuse the module-level temp vectors like `_direction`, `_frontVector`, etc.)
- `rigidBodyRef.current` can be null during initialization — always null-check
- `enabledRotations={[false, false, false]}` on the RigidBody prevents physics from tumbling the capsule; rotation is handled manually on the visual model only

### State Management
All shared game state lives in **Zustand** (`src/systems/gameStore.js`). Access patterns:
- Inside React components: `const value = useGameStore((s) => s.field)` (selector pattern for minimal re-renders)
- Inside `useFrame` or non-React code: `useGameStore.getState().field` (no subscription, no re-render)
- Never call `useGameStore()` without a selector in render paths — it causes re-renders on every state change

### Constants & Tuning (`src/systems/constants.js`)
All gameplay-affecting numbers (speeds, forces, distances, sizes) are centralized here. When adding new mechanics, define tunable values as named constants in this file rather than hardcoding in components.

### Level Design Pattern
Levels are React components that compose `<Platform>` and `<RigidBody>` elements. The `Platform` component (`src/components/Level/Platform.jsx`) is the reusable building block — it wraps a box mesh + fixed RigidBody + optional label.

To create a new level:
1. Create a new file in `src/components/Level/`
2. Compose platforms and physics bodies
3. Swap it into `App.jsx` in place of `<Sandbox />`

### Physics Notes
- Physics world runs with `gravity={[0, -30, 0]}` — higher than real gravity for snappier platformer feel
- `timeStep="vary"` ties physics to frame delta — fine for a single-player game, would need fixed step for multiplayer
- All static level geometry uses `type="fixed"` RigidBodies
- The player is `type="dynamic"` with manual velocity control (not force-based)
- For moving platforms, use `type="kinematicPosition"` and update position in `useFrame`
- Sensors (`sensor` prop on colliders) are used for triggers/collectibles — they detect overlap without physical collision

### Camera System
The `FollowCamera` runs in `useFrame` and lerps toward an offset position behind/above the player. It reads player position directly from the Zustand store via `getState()` (not via React subscription) to avoid render overhead.

## Code Style & Conventions

- Functional components only, no class components
- Hooks for all stateful logic
- Named exports for components (not default, except `App`)
- JSDoc comments on component files describing purpose and props
- Temp/scratch vectors allocated at module scope and reused in frame loops to avoid GC pressure
- Import Three.js as `import * as THREE from 'three'` when needed directly

## Common Extension Tasks

**Adding collectibles**: Create a component with `<RigidBody type="fixed" sensor>`, use `onIntersectionEnter` to detect player overlap, update store.

**Adding enemies/NPCs**: New component with its own `<RigidBody>`, AI logic in `useFrame`, collision detection for player interaction.

**Swapping the player model**: Replace the contents of `PlayerModel.jsx` with a GLTF import via `useGLTF` from drei. Keep the `<group>` wrapper for rotation.

**Adding sound**: Use `drei`'s `<PositionalAudio>` or the Web Audio API. Trigger from game store state changes.

## Things to Avoid

- Don't use `useState` for per-frame game state — use Zustand or refs
- Don't allocate objects (new Vector3, new Quaternion, etc.) inside `useFrame` — reuse module-level instances
- Don't add `<OrbitControls>` alongside the FollowCamera without disabling one — they'll fight
- Don't set `type="dynamic"` on level geometry — it will fall under gravity. Use `"fixed"` for static, `"kinematicPosition"` for moving platforms
- Don't import from `@dimforge/rapier3d-compat` directly in components — use the `@react-three/rapier` abstractions and `useRapier()` hook when you need raw Rapier access
