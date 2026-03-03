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

// Aquarium
export const AQUARIUM = {
  POSITION: [-18, 0, 8],
  TANK_WIDTH: 16,
  TANK_HEIGHT: 8,
  TANK_DEPTH: 12,
  WALL_THICKNESS: 0.3,
  GLASS_OPACITY: 0.25,
  GLASS_COLOR: '#88ccee',
  WATER_COLOR: '#1a6b8a',
  WATER_OPACITY: 0.35,
  FISH_TURN_SPEED: 2.0,
  FISH_MARGIN: 1.5,
}

// Car Smash
export const CAR_SMASH = {
  POSITION: [15, 0, -8],
  INTERACT_DISTANCE: 4.0,
  ORBIT_RADIUS: 3.5,
  ORBIT_HEIGHT: 1.0,
  SWING_COOLDOWN: 0.6,
  DAMAGE_PER_HIT: 0.3,
  MAX_DENT_OFFSET: 0.5,
  MAX_DENT_ROTATION: 0.4,
  DETACH_THRESHOLD: 0.85,     // Damage level at which panel flies off
  DETACH_FORCE: 8,             // Base launch speed for detached panels
  DETACH_SPIN: 12,             // Angular velocity for flying panels
  DEBRIS_COUNT: 6,             // Sparks/chunks spawned per hit
  DEBRIS_SPEED: 5,
  DEBRIS_LIFETIME: 1.5,
  // Hammer swing phases (seconds)
  SWING_WINDUP: 0.25,
  SWING_STRIKE: 0.08,
  SWING_IMPACT_HOLD: 0.06,
  SWING_RECOIL: 0.2,
}

// Basketball
export const BASKETBALL = {
  COURT_POSITION: [30, 0, 8],
  HOOP_OFFSET_Z: -6,
  HOOP_HEIGHT: 3.05,
  BACKBOARD_WIDTH: 1.8,
  BACKBOARD_HEIGHT: 1.05,
  BALL_RADIUS: 0.12,
  BALL_MASS: 0.62,
  CHARGE_TIME: 2.0,
  MAX_FORCE: 18.0,
  MIN_FORCE: 3.0,
  LAUNCH_ANGLE: 0.7,        // ~40 degrees
  PICKUP_DISTANCE: 2.0,
  BALL_RESTITUTION: 0.7,
  BALL_SPAWN: [30, 1, 8],   // initial ball position
  HOLD_OFFSET_Y: 0.8,       // ball height relative to player center
  HOLD_OFFSET_FORWARD: 0.6, // ball distance in front of player
}

// Batting Cage
export const BATTING = {
  POSITION: [-50, 0, 15],
  CAGE_LENGTH: 18,
  CAGE_WIDTH: 6,
  CAGE_HEIGHT: 5,
  INTERACT_DISTANCE: 5.0,
  BATTER_OFFSET_Z: 7,
  BATTER_OFFSET_X: 0.8,            // stands beside the pitch line, not on it
  BATTER_FACING_YAW: Math.PI / 2,  // perpendicular to pitch — faces -X across plate
  PITCHER_OFFSET_Z: -7,
  PITCH_INTERVAL: 3.5,
  PITCH_SPEED: 18,
  PITCH_HEIGHT: 1.2,
  PITCH_VARIATION_X: 0.3,
  PITCH_VARIATION_Y: 0.2,
  BALL_RADIUS: 0.05,
  BALL_MASS: 0.145,
  BAT_LENGTH: 1.0,
  SWING_DURATION: 0.35,
  SWING_WINDUP: 0.08,
  SWING_STRIKE_START: 0.08,
  SWING_STRIKE_END: 0.28,
  SWING_COOLDOWN: 0.5,
  HIT_DISTANCE: 0.8,
  HIT_BASE_SPEED: 25,
  HIT_MAX_SPEED: 40,
  HIT_LAUNCH_ANGLE: 0.4,
  MAX_BALLS: 8,
  BALL_LIFETIME: 8,
  BALL_CLEANUP_DISTANCE: 60,
}

// Tube Man (wacky waving inflatable)
export const TUBE_MAN = {
  SEGMENT_COUNT: 7,
  SEGMENT_HEIGHT: 0.6,
  BASE_RADIUS: 0.35,
  TOP_RADIUS: 0.15,
  HEAD_RADIUS: 0.25,
  ARM_SEGMENTS: 3,
  ARM_SEGMENT_LENGTH: 0.4,
  ARM_RADIUS: 0.08,
  ARM_ATTACH_SEGMENT: 5,
  GRAVITY_SCALE: 0.3,
  ARM_GRAVITY_SCALE: 0.15,
  LINEAR_DAMPING: 3.0,
  ANGULAR_DAMPING: 2.0,
  WIND_BASE_FORCE: 0.08,
  WIND_GUST_FORCE: 0.04,
  WIND_HEIGHT_MULT: 1.5,
  MASS_PER_SEGMENT: 0.3,
}

// World
export const WORLD = {
  GROUND_SIZE: [200, 1, 200],
  KILL_PLANE_Y: -50,
}
