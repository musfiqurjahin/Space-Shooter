/* ═══════════════════════════════════════════════════════════════════════════
  #8  GAME STATE VARIABLES
   ─────────────────────────
   All mutable game state is declared here in one place so it's easy to
   find and reset on a new game.
   ═══════════════════════════════════════════════════════════════════════════ */

let keys = {};                     // held keyboard keys: { 'KeyW': true, ... }
let gameState = 'idle';            // 'idle' | 'playing' | 'paused' | 'dead'

let score = 0, lives = 3, level = 1;

// Object arrays
let ship, bullets, asteroids, particles, stars, powerups;

// Timers / cooldowns (in frames at ~60fps)
let shieldTimer = 0;             // used to drain shield slowly (not instantly)
let shootCooldown = 0;             // frames until next shot is allowed

// Combo / multiplier
let combo = 0, comboTimer = 0, multiplier = 1;

// Feature flags (toggled by settings panel)
let shakeEnabled = true, particlesEnabled = true;

// Screen shake state
let shakeX = 0, shakeY = 0, shakeMag = 0;

// Active powerup timers (frames remaining)
let multishotActive = 0, rapidActive = 0;

// requestAnimationFrame handle
let raf;

// Global frame counter for twinkling, shield pulses, etc.
let t = 0;

const rocketImg = new Image();
rocketImg.src = 'rocket.png'; // or paste base64 string here