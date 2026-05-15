/* ═══════════════════════════════════════════════════════════════════════════
  #14 LEVEL INIT
   ───────────────
   Reset all per-level arrays, spawn the asteroid wave, and re-create the
   ship with invincibility frames.
   Wave size: 3 + (level - 1), so level 1 has 3 rocks, level 5 has 7, etc.
   ═══════════════════════════════════════════════════════════════════════════ */

function initLevel() {
    bullets = []; particles = []; powerups = [];
    shieldTimer = 0; shootCooldown = 0;
    multishotActive = 0; rapidActive = 0;
    combo = 0; comboTimer = 0; multiplier = 1;
    multEl.textContent = '×1';

    // Respawn ship in centre with invincibility
    ship = makeShip();
    ship.inv = 180;

    // Spawn 3 + (level-1) large asteroids, each at least 150px from centre
    asteroids = [];
    const count = 3 + (level - 1);
    for (let i = 0; i < count; i++) {
        let x, y;
        do { x = rnd(0, W); y = rnd(0, H); }
        while (Math.hypot(x - W / 2, y - H / 2) < 150);
        asteroids.push(spawnAsteroid(x, y, 3));
    }
}