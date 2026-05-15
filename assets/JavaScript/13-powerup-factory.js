/* ═══════════════════════════════════════════════════════════════════════════
  #13 POWERUP FACTORY
   ────────────────────
   Four powerup types with distinct colours and icons:
     shield    — +1 shield charge
     multishot — 3-way spread for 5 seconds
     rapid     — halved shoot cooldown for 5 seconds
     bomb      — instantly clears all asteroids
   spawnPowerup(x, y) picks a random type and creates a drifting pickup.
   ═══════════════════════════════════════════════════════════════════════════ */

const POWERUP_TYPES = ['shield', 'multishot', 'rapid', 'bomb'];
const POWERUP_COLORS = { shield: '#3399FF', multishot: '#FFD700', rapid: '#FF6633', bomb: '#CC44FF' };
const POWERUP_ICONS = { shield: '⬡', multishot: '✦', rapid: '►', bomb: '✸' };

function spawnPowerup(x, y) {
    const type = POWERUP_TYPES[rndInt(0, POWERUP_TYPES.length - 1)];
    return {
        x, y,
        vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5),
        type,
        life: 600,           // disappears after ~10 seconds
        rot: 0, rotSpeed: rnd(0.02, 0.04),
        pulse: rnd(0, Math.PI * 2)
    };
}