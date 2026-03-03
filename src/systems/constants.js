/**
 * Centralized game constants.
 * Tune these to change the feel of the game.
 * Import and use Leva controls to tweak at runtime.
 */

// Player
export const PLAYER = {
  WALK_SPEED: 8,
  SPRINT_SPEED: 14,
  JUMP_FORCE: 12,
  AIR_CONTROL: 0.3,       // Multiplier for movement while airborne
  MAX_FALL_SPEED: -50,
  CAPSULE_RADIUS: 0.4,
  CAPSULE_HALF_HEIGHT: 0.6,
  GROUND_CHECK_DIST: 0.15, // Ray distance below capsule to detect ground
  MASS: 1,
  LINEAR_DAMPING: 0.5,
  COYOTE_TIME: 0.12,       // Seconds after leaving edge where jump still works
  JUMP_BUFFER: 0.1,        // Seconds before landing where jump input is buffered
  RESPAWN_Y: -20,          // Y threshold to trigger respawn
  TURN_SPEED: 3.0,         // Radians per second for A/D rotation
}

// Camera
export const CAMERA = {
  OFFSET: [0, 4, 8],         // Default offset from player
  LOOK_OFFSET: [0, 1.5, 0],  // Point above player to look at
  LERP_SPEED: 5,              // How fast camera follows (lower = more cinematic)
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 20,
}

// World
export const WORLD = {
  GROUND_SIZE: [200, 1, 200],
  KILL_PLANE_Y: -50,
}
