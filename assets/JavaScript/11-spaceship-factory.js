/* ═══════════════════════════════════════════════════════════════════════════
  #11 SHIP FACTORY
   ─────────────────
   makeShip() returns a fresh player object at the center of the screen.
   Called at game start and after each respawn.
   ═══════════════════════════════════════════════════════════════════════════ */

function makeShip() {
    return {
        x: W / 2, y: H / 2,       // start at center
        vx: 0, vy: 0,              // at rest
        angle: -Math.PI / 2,       // pointing upward (angle 0 = right)
        thrusting: false,
        shieldLeft: 3,             // 3 shield charges max
        shieldOn: false,
        inv: 0                     // invincibility frames after respawn
    };
}