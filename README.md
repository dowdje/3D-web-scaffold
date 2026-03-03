# 🎮 Game Dev Playground

A reusable 3D platformer scaffold built with **React Three Fiber** + **Rapier Physics**. Use this as a starting point to rapidly prototype platformer-style games.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and start jumping around.

## Controls

| Key | Action |
|---|---|
| WASD / Arrow Keys | Move |
| Space | Jump |
| Shift | Sprint |

## Tech Stack

- **Vite** — Fast dev server and build tool
- **React 18** — Component architecture
- **React Three Fiber** — Declarative Three.js
- **@react-three/rapier** — Rapier3D physics bindings
- **@react-three/drei** — Useful R3F helpers (Sky, Text, KeyboardControls, etc.)
- **Zustand** — Lightweight state management
- **Leva** — Runtime parameter tweaking UI

## Project Structure

```
src/
├── App.jsx                         # Scene composition root
├── main.jsx                        # React entry point
├── components/
│   ├── Camera/
│   │   └── FollowCamera.jsx        # Third-person smooth follow camera
│   ├── Environment/
│   │   └── Environment.jsx         # Lighting, sky, fog
│   ├── Level/
│   │   ├── Platform.jsx            # Reusable platform building block
│   │   └── Sandbox.jsx             # Test level with various platforms
│   ├── Player/
│   │   ├── Player.jsx              # Player controller (physics + input)
│   │   └── PlayerModel.jsx         # Visual model (swap for GLTF)
│   └── UI/
│       └── HUD.jsx                 # Overlay: position, controls, debug
├── hooks/
│   └── usePlayerInput.js           # Input abstraction hook
├── systems/
│   ├── constants.js                # Tunable gameplay values
│   ├── controls.js                 # Keyboard mapping
│   └── gameStore.js                # Zustand global state
├── utils/                          # Helpers (add as needed)
└── assets/                         # Models, textures, sounds
```

## Architecture Overview

### Player Controller (`components/Player/Player.jsx`)
The core of the platformer feel. Uses a **capsule collider** for smooth movement over edges. Features:
- **Camera-relative movement** — Forward always means "toward where you're looking"
- **Coyote time** — Brief grace period after leaving an edge where you can still jump
- **Jump buffering** — Jump input registered slightly before landing is executed on contact
- **Air control** — Reduced but present movement while airborne
- **Auto-respawn** — Falls below kill plane → teleports to last respawn point

### Game Store (`systems/gameStore.js`)
Zustand store holding global game state. Extend for health, inventory, score, dialogue, etc.

### Constants (`systems/constants.js`)
All tunable values in one place: movement speed, jump force, camera offsets, etc. Change the game feel without touching component code.

### Levels (`components/Level/`)
Levels are just React components that compose `<Platform>` and `<RigidBody>` elements. Create a new level by copying `Sandbox.jsx` and swapping it in `App.jsx`.

## How to Extend

### Add a new level
1. Create `src/components/Level/MyLevel.jsx`
2. Compose platforms, triggers, hazards using `<RigidBody>` + meshes
3. Swap `<Sandbox />` for `<MyLevel />` in `App.jsx`

### Add a custom character model
1. Place your `.glb` file in `src/assets/`
2. In `PlayerModel.jsx`, use `useGLTF` from drei:
   ```jsx
   import { useGLTF } from '@react-three/drei'
   const { scene } = useGLTF('/models/character.glb')
   return <primitive object={scene} scale={0.5} />
   ```

### Add collectibles / pickups
1. Create a `Collectible` component with a `<RigidBody type="fixed" sensor>`
2. Listen for collision with player via `onIntersectionEnter`
3. Update the game store (score, inventory, etc.)

### Add moving platforms
```jsx
<RigidBody type="kinematicPosition">
  {/* Use useFrame to update position over time */}
</RigidBody>
```

### Add enemies / NPCs
1. Create an NPC component with its own `<RigidBody>`
2. Use `useFrame` for AI behavior (patrol, chase, etc.)
3. Detect collision with player for damage/interaction

### Swap camera modes
The store has a `cameraMode` field. You can implement:
- **Orbit camera** — Use drei's `<OrbitControls>` conditionally
- **First person** — Position camera at player head, hide model
- **Fixed angles** — Set camera position per level zone

## Runtime Tweaking

The **Leva** panel (top-right corner, click to expand) lets you tweak environment settings live. Add your own controls in any component:

```jsx
import { useControls } from 'leva'

const { speed } = useControls('Player', {
  speed: { value: 8, min: 1, max: 30 },
})
```

## Tips

- **Physics debug**: Click "Physics Debug" in the HUD to visualize all colliders
- **Performance**: Rapier runs in WASM — physics are fast, but keep collider count reasonable
- **Shadows**: Expensive on large scenes — reduce shadow map size or limit shadow-casting objects
- **Hot reload**: Vite preserves state on save, so you can tweak and see results instantly
