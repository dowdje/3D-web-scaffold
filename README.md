# Third-Person Shooter Scaffold

A 3D third-person shooter scaffold built with **React Three Fiber** + **Rapier Physics**. Features mouse-look controls, dual weapons (hitscan + projectile), enemy drones, destructible objects, and an arena level.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, click to lock your mouse, and start shooting.

## Controls

| Input | Action |
|---|---|
| Mouse | Look around |
| Left Click | Fire weapon |
| Right Click | Aim |
| W / Up Arrow | Move forward |
| S / Down Arrow | Move backward |
| A / Left Arrow | Strafe left |
| D / Right Arrow | Strafe right |
| Space | Jump |
| Shift | Sprint |
| Q | Swap weapon |
| R | Reload |
| ESC | Release mouse |

## Weapons

| Weapon | Type | Damage | Fire Rate | Mag Size |
|---|---|---|---|---|
| Rifle | Hitscan (instant) | 15 | 8 rps | 30 |
| Launcher | Projectile (travels) | 60 | 1 rps | 4 |

## Tech Stack

- **Vite** — Fast dev server and build tool
- **React 18** — Component architecture
- **React Three Fiber** — Declarative Three.js
- **@react-three/rapier** — Rapier3D physics bindings
- **@react-three/drei** — Useful R3F helpers
- **Zustand** — Lightweight state management (slice architecture)
- **Leva** — Runtime parameter tweaking UI

## Project Structure

```
src/
├── App.jsx                              # Scene composition root
├── main.jsx                             # React entry point
├── components/
│   ├── Camera/
│   │   ├── TPSCamera.jsx                # Mouse-look third-person camera
│   │   └── FollowCamera.jsx             # Legacy yaw-follow camera (reference)
│   ├── Combat/
│   │   ├── ProjectileManager.jsx        # Renders rocket projectiles
│   │   ├── HitscanTracer.jsx            # Brief line from muzzle to hit
│   │   └── ExplosionEffect.jsx          # Expanding sphere visual
│   ├── Enemy/
│   │   ├── Drone.jsx                    # Octahedron drone with AI
│   │   └── EnemyManager.jsx             # Spawn timer + drone lifecycle
│   ├── Environment/
│   │   └── Environment.jsx              # Lighting, sky, fog
│   ├── Level/
│   │   ├── Platform.jsx                 # Reusable platform building block
│   │   ├── Arena.jsx                    # Walled combat arena with cover
│   │   ├── Crate.jsx                    # Destructible crate
│   │   ├── ExplosiveBarrel.jsx          # Explodes on death, area damage
│   │   └── Sandbox.jsx                  # Legacy test level (reference)
│   ├── Player/
│   │   ├── Player.jsx                   # Player controller (physics + input + firing)
│   │   └── PlayerModel.jsx              # Visual model (swap for GLTF)
│   └── UI/
│       ├── HUD.jsx                      # Health, ammo, score, debug info
│       ├── Crosshair.jsx                # Centered dot with hit flash
│       ├── DeathScreen.jsx              # Death overlay with score + respawn
│       ├── HitMarker.jsx                # "X" flash on hit/kill
│       └── LockScreen.jsx               # "Click to play" overlay
├── hooks/
│   ├── MouseLookContext.jsx             # React context for mouse refs
│   └── useMouseLook.js                  # Pointer lock + mouse input
├── systems/
│   ├── constants.js                     # All tunable gameplay values
│   ├── controls.js                      # Keyboard mapping
│   ├── gameStore.js                     # Re-export from store/
│   ├── weapons.js                       # Weapon definitions
│   └── store/
│       ├── index.js                     # Compose slices into store
│       ├── playerSlice.js               # Position, health, death
│       ├── weaponSlice.js               # Ammo, reload, swap
│       ├── combatSlice.js               # Projectiles, enemies, score
│       └── gameSlice.js                 # Phase, debug flags
├── utils/
│   ├── entityRegistry.js               # Collider → entity mapping
│   └── explosion.js                     # Area damage with falloff
└── assets/                              # Models, textures, sounds
```

## Game Systems

### Weapon Types
- **Hitscan (Rifle)**: Uses Rapier `world.castRay()` for instant hit detection. Resolves hit colliders to game entities via the entity registry.
- **Projectile (Launcher)**: Spawns physics sensor spheres that travel and explode on impact. Explosions use `world.intersectionsWithShape()` for area damage with distance falloff.

### Entity Registry
A lightweight `Map<colliderHandle, entity>` that bridges Rapier physics to game logic. Components register on mount via `useEntityRegistry` hook. Enables hitscan hits and explosion damage to resolve to the correct game object.

### Enemy AI
Drones are `kinematicPosition` bodies that chase the player horizontally, hover at a set height, and attack on a cooldown when within range.

### Destructibles
- **Crates**: Dynamic physics bodies with health. Break when shot.
- **Explosive Barrels**: Like crates but trigger area-of-effect explosions on destruction. Can chain-react with other barrels.

## How to Extend

### Add a new weapon
1. Add definition to `WEAPON_DEFS` in `src/systems/weapons.js`
2. Add to `WEAPON_ORDER` array
3. Weapon slice handles ammo/reload automatically

### Add a new enemy type
1. Create component in `src/components/Enemy/`
2. Use `useEntityRegistry` for hit detection
3. Add spawn logic to `EnemyManager`

### Add a new level
1. Create `src/components/Level/MyLevel.jsx`
2. Compose platforms, destructibles, spawn points
3. Swap `<Arena />` for `<MyLevel />` in `App.jsx`

### Swap the player model
Replace `PlayerModel.jsx` contents with a GLTF import via `useGLTF` from drei.

## Runtime Tweaking

The **Leva** panel (top-right corner) lets you tweak settings live. Add controls in any component:

```jsx
import { useControls } from 'leva'
const { speed } = useControls('Player', {
  speed: { value: 8, min: 1, max: 30 },
})
```
