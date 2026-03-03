/**
 * Centralized game constants.
 * Tune these to change the feel of the game.
 * Import and use Leva controls to tweak at runtime.
 */

// Player
export const PLAYER = {
  WALK_SPEED: 8,
  SPRINT_SPEED: 14,
  JUMP_FORCE: 5,           // ~1.27m jump height with Earth gravity (v²/2g)
  AIR_CONTROL: 0.3,       // Multiplier for movement while airborne
  MAX_FALL_SPEED: -53,    // ~human terminal velocity in m/s
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

// Human Player (athletic, heavier, momentum-based)
export const HUMAN_PLAYER = {
  WALK_SPEED: 3,
  SPRINT_SPEED: 9,           // 3× walk speed (run button)
  JUMP_FORCE: 5.0,           // ~1.27m jump height
  AIR_CONTROL: 0.15,         // Less air authority
  MAX_FALL_SPEED: -53,
  CAPSULE_RADIUS: 0.3,       // Narrower
  CAPSULE_HALF_HEIGHT: 0.55, // Total capsule height ~1.7m (2*(0.55+0.3))
  GROUND_CHECK_DIST: 0.15,
  MASS: 70,
  LINEAR_DAMPING: 0.3,
  COYOTE_TIME: 0.06,         // Halved — more committed
  JUMP_BUFFER: 0.05,
  RESPAWN_Y: -20,
  TURN_SPEED: 4.0,
  ACCELERATION: 0.15,        // Lerp factor for momentum feel
  MAX_AIR_JUMPS: 1,          // One extra jump while airborne (double jump)
  SPRINT_DEFAULT: true,       // Default to running; shift to walk
}

// Camera
export const CAMERA = {
  OFFSET: [0, 4, 8],         // Default offset from player
  LOOK_OFFSET: [0, 1.5, 0],  // Point above player to look at
  LERP_SPEED: 5,              // How fast camera follows (lower = more cinematic)
  MIN_DISTANCE: 2,
  MAX_DISTANCE: 20,
}

// Rope Swings
export const ROPE = {
  SEGMENT_COUNT: 8,
  SEGMENT_LENGTH: 0.6,
  SEGMENT_RADIUS: 0.04,
  SEGMENT_MASS: 0.3,
  SEGMENT_LINEAR_DAMPING: 0.4,
  SEGMENT_ANGULAR_DAMPING: 0.8,
  HANDLE_RADIUS: 0.18,
  HANDLE_MASS: 0.5,
  GRAB_DISTANCE: 1.5,
  GRAB_ANCHOR_OFFSET: [0, 0.6, 0],
}

// Golf
export const GOLF = {
  BALL_RADIUS: 0.05,
  BALL_MASS: 0.09,
  CHARGE_TIME: 2.0,
  MAX_FORCE: 6.0,             // impulse at full charge
  MIN_FORCE: 0.5,             // impulse at minimum tap
  CLUB_LENGTH: 1.0,
  CLUB_OFFSET_Y: 0.5,
  BALL_SPAWN_DISTANCE: 0.6,
  LAUNCH_ANGLE: 0.35,
}

// Worm
export const WORM = {
  SPEED: 40,
  SEGMENT_COUNT: 10,
  SEGMENT_RADIUS: 0.8,
  SEGMENT_SPACING: 1.2,
  HEAD_RADIUS: 1.0,
  MOUNT_DISTANCE: 4.0,
  MOUNT_OFFSET_Y: 1.2,
  TURN_SPEED: 2.5,
  SPAWN_POSITION: [20, 1, 20],
}

// Dirt Bike
export const DIRT_BIKE = {
  MAX_SPEED: 50,
  ACCELERATION: 30,
  BRAKING: 40,
  COAST_DECEL: 8,
  TURN_SPEED: 2.5,
  MOUNT_DISTANCE: 3.5,
  MOUNT_OFFSET_Y: 1.0,
  SPAWN_POSITION: [-87, 0.4, 85],
  BODY_LENGTH: 2.0,
  BODY_WIDTH: 0.6,
  BODY_HEIGHT: 0.8,
  WHEEL_RADIUS: 0.4,
}

// World
export const WORLD = {
  GROUND_SIZE: [200, 1, 200],
  KILL_PLANE_Y: -50,
}
