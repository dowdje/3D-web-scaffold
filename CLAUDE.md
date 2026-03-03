# CLAUDE.md — Project Context for Claude Code

## Project Overview

This is a **3D physics playground** — an open-world sandbox with multiple interactive systems built on a 200x200 ground plane. Players can explore themed zones, ride vehicles, swing on ropes, and interact with physics-driven objects.

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

### Controls (`src/systems/controls.js`)
- **W/S** — forward/backward, **A/D** — turn left/right, **Q/E** — strafe
- **Space** — jump, **Shift** — sprint
- **C** — mount/dismount (worm, dirt bike, car smash, batting cage)
- **F** — grab (rope swings), pick up basketball
- **G** — toggle golf mode, **H** — swing (golf club, car smash hammer, batting cage bat)
- **1/2** — switch between player characters

### Player Controller (`src/components/Player/Player.jsx`)
This is the most complex and sensitive file. It handles:
- Physics-based movement using a **capsule RigidBody** with locked rotations
- **Tank-style controls** — A/D rotate the player (via a `yawRef`), W/S move forward/backward along the facing direction, Q/E strafe perpendicular to facing
- Two player characters switchable with 1/2 keys (different physics profiles in `PLAYER` vs `HUMAN_PLAYER` constants)
- The player's facing direction (`yaw`) is stored in a ref and published to the Zustand store (`playerYaw`) so the camera can orbit behind the player
- Ground detection via **raycasting** downward from the capsule bottom
- Surface friction detection — reads collider friction to adjust movement (ice, mud, etc.)
- **Coyote time** — brief jump grace period after leaving an edge
- **Jump buffering** — pre-landing jump inputs are queued and executed on ground contact
- **Air control** — reduced movement multiplier while airborne
- Auto-respawn when falling below `PLAYER.RESPAWN_Y`
- Mount/dismount for worm, dirt bike, car smash, and batting cage via proximity checks

When modifying the player controller, be careful with:
- The `useFrame` loop runs every frame; avoid allocations inside it (reuse the module-level temp vectors like `_direction`)
- `rigidBodyRef.current` can be null during initialization — always null-check
- `enabledRotations={[false, false, false]}` on the RigidBody prevents physics from tumbling the capsule; rotation is handled manually on the visual model only

### Vehicles & Mounts
- **Dirt Bike** (`src/components/Level/DirtBike.jsx`) — kinematicPosition body, raycast ground-following, ramp launching, terrain friction detection (ice/water/mud/sand modify speed, decel, and turning)
- **Giant Worm** (`src/components/Level/Worm.jsx`) — multi-segment kinematic body, player rides the head segment
- **Car Smash** (`src/components/Level/CarSmash.jsx`) — destructible car panels with hammer swing, damage + detach system, debris particles
- **Batting Cage** (`src/components/Level/BattingCage.jsx`) — automatic pitching machine, bat swing with timing-based hit detection, ball pool of pre-allocated RigidBodies
- All use proximity-based mounting (C key) and store mount state in Zustand

### Level: Sandbox (`src/components/Level/Sandbox.jsx`)
The main playground level containing:
- **Dirt Track** — 14m-wide rectangular loop near map perimeter (center ±91) with ramps, hills, and terrain zones (water, ice, mud, sand)
- **Perimeter Wall** — tall walls at ±100 containing the play area
- **Trampoline Zone** — high-restitution bouncy surfaces and platforms
- **Ice Rink** — near-zero friction surfaces with sliding crates and pucks
- **Rope Swings** — 3 swingable ropes with grab mechanics
- **Golf** — club + ball system
- **Aquarium** — large glass tank with fish
- **Car Smash** — destructible car with hammer swing
- **Basketball** — court with hoop and throwable ball
- **Batting Cage** — pitching machine with timing-based bat swing
- **Tube Men** — two wacky waving inflatable tube men (decorative, wind physics)

### Dirt Track Terrain System
Terrain zones are higher-y patches (y=0.08) on the track so the bike's downward raycast hits them instead of the track below. Each has a different `friction` value on its `RigidBody`:
- **Water** (blue `#3388cc`, friction=0.15) — caps speed, more drag
- **Ice** (cyan `#aaeeff`, friction=0.02) — minimal decel, poor turning
- **Mud** (dark brown `#4a3520`, friction=2.0) — heavy drag, low max speed
- **Sand** (tan `#c2b280`, friction=1.5) — moderate drag
The bike reads friction via `castRayAndGetNormal` → `collider.friction()` and adjusts acceleration, max speed, coast decel, and turn multiplier.

### State Management
All shared game state lives in **Zustand** (`src/systems/gameStore.js`). Access patterns:
- Inside React components: `const value = useGameStore((s) => s.field)` (selector pattern for minimal re-renders)
- Inside `useFrame` or non-React code: `useGameStore.getState().field` (no subscription, no re-render)
- Never call `useGameStore()` without a selector in render paths — it causes re-renders on every state change

Key state groups: player position/yaw, player2 state, mount states (worm, bike, car smash, batting cage), rope grabs, golf mode, basketball, debug flags.

### Constants & Tuning (`src/systems/constants.js`)
All gameplay-affecting numbers (speeds, forces, distances, sizes) are centralized here. Includes `PLAYER`, `HUMAN_PLAYER`, `CAMERA`, `ROPE`, `GOLF`, `WORM`, `DIRT_BIKE`, `AQUARIUM`, `CAR_SMASH`, `BASKETBALL`, `BATTING`, `TUBE_MAN`, and `WORLD` config objects. When adding new mechanics, define tunable values as named constants in this file rather than hardcoding in components.

### Level Design Pattern
Levels are React components that compose `<Platform>` and `<RigidBody>` elements. The `Platform` component (`src/components/Level/Platform.jsx`) is the reusable building block — it wraps a box mesh + fixed RigidBody + optional label.

To create a new level:
1. Create a new file in `src/components/Level/`
2. Compose platforms and physics bodies
3. Swap it into `App.jsx` in place of `<Sandbox />`

### Physics Notes
- Physics world runs with `gravity={[0, -9.81, 0]}` — realistic Earth gravity
- `timeStep="vary"` ties physics to frame delta — fine for a single-player game, would need fixed step for multiplayer
- All static level geometry uses `type="fixed"` RigidBodies
- The player is `type="dynamic"` with manual velocity control (not force-based)
- Vehicles (dirt bike, worm) use `type="kinematicPosition"` with manual position updates
- For moving platforms, use `type="kinematicPosition"` and update position in `useFrame`
- Sensors (`sensor` prop on colliders) are used for triggers/collectibles — they detect overlap without physical collision

### Camera System
The `FollowCamera` runs in `useFrame` and lerps toward an offset position behind/above the active entity (player, worm, or bike depending on mount state). It reads position and yaw from the Zustand store via `getState()` (not via React subscription) to avoid render overhead. The camera offset is rotated by the entity's yaw so it always orbits behind the facing direction.

### HUD (`src/components/UI/HUD.jsx`)
Overlay showing context-sensitive info: speed when on bike, mount prompts when near vehicles/stations, golf power meter, basketball power meter, rope grab hints, batting cage prompts.

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

**Swapping the player model**: Replace the contents of `PlayerModel.jsx` or `HumanModel.jsx` with a GLTF import via `useGLTF` from drei. Keep the `<group>` wrapper for rotation.

**Adding a new vehicle**: Follow the DirtBike pattern — kinematicPosition body, raycast ground-following, mount/dismount via proximity + C key, store mount state in gameStore.

**Adding a new terrain type**: Add a RigidBody with a distinct friction value at y=0.08 on the track. Add a friction threshold check in DirtBike.jsx's terrain modifier block.

**Adding sound**: Use `drei`'s `<PositionalAudio>` or the Web Audio API. Trigger from game store state changes.

## Things to Avoid

- Don't use `useState` for per-frame game state — use Zustand or refs
- Don't allocate objects (new Vector3, new Quaternion, etc.) inside `useFrame` — reuse module-level instances
- Don't add `<OrbitControls>` alongside the FollowCamera without disabling one — they'll fight
- Don't set `type="dynamic"` on level geometry — it will fall under gravity. Use `"fixed"` for static, `"kinematicPosition"` for moving platforms
- Don't import from `@dimforge/rapier3d-compat` directly in components — use the `@react-three/rapier` abstractions and `useRapier()` hook when you need raw Rapier access
