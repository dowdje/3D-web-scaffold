# 3D Physics Playground

An open-world 3D sandbox built with **React Three Fiber** + **Rapier Physics**. Explore a 200x200 world with rideable vehicles, rope swings, terrain zones, and physics toys.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` and start exploring.

## Controls

| Key | Action |
|---|---|
| W/S | Move forward / backward |
| A/D | Turn left / right |
| Q/E | Strafe left / right |
| Space | Jump |
| Shift | Sprint |
| C | Mount / dismount (vehicle, car smash, batting cage) |
| F | Grab rope / pick up basketball |
| G | Toggle golf mode |
| H | Swing (golf club, hammer, bat) |
| R | Reset (car smash) |
| 1/2 | Switch player character |

## What's in the World

- **Dirt Track** — 14m-wide loop around the map perimeter with ramps, hills, and terrain zones (water, ice, mud, sand) that affect bike handling
- **Dirt Bike** — rideable motorcycle with speed-dependent turning, ramp launching, and terrain friction response
- **Giant Worm** — rideable multi-segment creature
- **Rope Swings** — 3 grab-and-swing ropes with physics-based pendulum motion
- **Trampoline Zone** — bouncy floors and platforms that launch you skyward
- **Ice Rink** — near-zero friction surface with sliding pucks and crates
- **Golf** — club and ball with charge-based power shots
- **Aquarium** — large glass tank with swimming fish
- **Car Smash** — smash a car with a sledgehammer, panels deform and fly off
- **Basketball** — pick up and shoot a ball at a hoop with charge-based power
- **Batting Cage** — step up to the plate, swing at pitches from an auto-pitching machine (timing-based hit detection)
- **Perimeter Wall** — keeps everything contained

## Tech Stack

- **Vite** — fast dev server and build tool
- **React 18** — component architecture
- **React Three Fiber** — declarative Three.js
- **@react-three/rapier** — Rapier3D physics bindings
- **@react-three/drei** — R3F utilities (Sky, Text, KeyboardControls, etc.)
- **Zustand** — lightweight state management
- **Leva** — runtime parameter tweaking UI

## Project Structure

```
src/
  App.jsx                          # Scene composition root
  main.jsx                         # React entry point
  components/
    Camera/
      FollowCamera.jsx             # Third-person follow camera (player/bike/worm)
    Environment/
      Environment.jsx              # Lighting, sky, fog
    Level/
      Sandbox.jsx                  # Main level: track, zones, ramps, walls
      DirtBike.jsx                 # Rideable dirt bike with terrain friction
      RopeSwing.jsx                # Grab-and-swing rope physics
      Worm.jsx                     # Giant rideable worm
      Aquarium.jsx                 # Glass tank with fish
      CarSmash.jsx                 # Destructible car with hammer
      Basketball.jsx               # Court with hoop and ball
      BattingCage.jsx              # Pitching machine + bat swing
      Platform.jsx                 # Reusable platform building block
    Player/
      Player.jsx                   # Player controller (physics + input)
      PlayerModel.jsx              # Capsule player model
      HumanModel.jsx               # Humanoid player model
      GolfClub.jsx                 # Golf club with charge swing
      GolfBall.jsx                 # Physics golf ball
    UI/
      HUD.jsx                      # Overlay: speed, mount prompts, debug
  systems/
    constants.js                   # All tunable gameplay values
    controls.js                    # Keyboard mappings
    gameStore.js                   # Zustand global state
```

## How to Extend

### Add a new level
1. Create `src/components/Level/MyLevel.jsx`
2. Compose platforms, triggers, hazards using `<RigidBody>` + meshes
3. Swap `<Sandbox />` for `<MyLevel />` in `App.jsx`

### Add a new vehicle
Follow the DirtBike pattern:
1. Create a `kinematicPosition` RigidBody with raycast ground-following
2. Add mount/dismount via proximity check + C key
3. Store mount state in `gameStore.js`

### Add a new terrain type
1. Add a `<RigidBody>` with a distinct friction value at `y=0.08` on the track
2. Add a friction threshold check in `DirtBike.jsx`'s terrain modifier block

### Add collectibles
1. Create a component with `<RigidBody type="fixed" sensor>`
2. Use `onIntersectionEnter` to detect player overlap
3. Update the game store (score, inventory, etc.)

### Swap the player model
Replace contents of `PlayerModel.jsx` or `HumanModel.jsx` with a GLTF import:
```jsx
import { useGLTF } from '@react-three/drei'
const { scene } = useGLTF('/models/character.glb')
return <primitive object={scene} scale={0.5} />
```

## Runtime Tweaking

The **Leva** panel (top-right corner) lets you tweak environment settings live. Add your own:

```jsx
import { useControls } from 'leva'
const { speed } = useControls('Player', {
  speed: { value: 8, min: 1, max: 30 },
})
```

## Tips

- **Physics debug**: Toggle in the HUD to visualize all colliders
- **Performance**: Rapier runs in WASM — physics are fast, but keep collider count reasonable
- **Shadows**: Expensive on large scenes — reduce shadow map size or limit shadow-casting objects
- **Hot reload**: Vite preserves state on save for instant feedback
