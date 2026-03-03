/**
 * Centralized game constants.
 * Tune these to change the feel of the game.
 */

// Player
export const PLAYER = {
  WALK_SPEED: 8,
  SPRINT_SPEED: 14,
  JUMP_FORCE: 12,
  AIR_CONTROL: 0.3,
  MAX_FALL_SPEED: -50,
  CAPSULE_RADIUS: 0.4,
  CAPSULE_HALF_HEIGHT: 0.6,
  GROUND_CHECK_DIST: 0.15,
  MASS: 1,
  LINEAR_DAMPING: 0.5,
  COYOTE_TIME: 0.12,
  JUMP_BUFFER: 0.1,
  RESPAWN_Y: -20,
  TURN_SPEED: 3.0,
  MAX_HEALTH: 100,
  EYE_HEIGHT: 0.8,
}

// Camera
export const CAMERA = {
  OFFSET: [0, 4, 8],
  LOOK_OFFSET: [0, 1.5, 0],
  LERP_SPEED: 5,
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 20,
}

// World
export const WORLD = {
  GROUND_SIZE: [200, 1, 200],
  KILL_PLANE_Y: -50,
}

// Enemies
export const ENEMY = {
  DRONE_HEALTH: 30,
  DRONE_SPEED: 6,
  DRONE_DAMAGE: 10,
  DRONE_ATTACK_RANGE: 15,
  DRONE_ATTACK_COOLDOWN: 2.0,
  DRONE_HOVER_HEIGHT: 3,
}

// Spawner
export const SPAWNER = {
  MAX_ENEMIES: 10,
  SPAWN_INTERVAL: 5,
  SPAWN_RADIUS: 30,
}

// Destructibles
export const DESTRUCTIBLE = {
  CRATE_HEALTH: 40,
  BARREL_HEALTH: 20,
  BARREL_EXPLOSION_RADIUS: 8,
  BARREL_EXPLOSION_DAMAGE: 50,
}
