/* ═══════════════════════════════════════════════════════════════════════════
  #12 ASTEROID FACTORY
   ─────────────────────
   asteroidVerts(r) generates a random polygon with jagged radii.
   spawnAsteroid(x, y, size) returns a full asteroid object.
     size: 3 = large (r≈46), 2 = medium (r≈26), 1 = small (r≈13)
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Generate polygon vertices for an asteroid.
 * Each vertex is at angle (i/n × 2π) with radius randomised ±40%.
 * @param {number} r — base radius
 * @returns {Array<[number,number]>} — array of [x,y] vertex pairs
 */
function asteroidVerts(r) {
    const n = rndInt(7, 13);  // 7–13 sides
    return Array.from({ length: n }, (_, i) => {
        const a = (i / n) * Math.PI * 2;
        const dr = r * rnd(0.6, 1.4); // jag
        return [Math.cos(a) * dr, Math.sin(a) * dr];
    });
}

/**
 * Spawn a single asteroid at position (x, y) of the given size tier.
 * Speed scales with level so higher levels are harder.
 */
function spawnAsteroid(x, y, size) {
    const r = size === 3 ? 46 : size === 2 ? 26 : 13;
    const angle = rnd(0, Math.PI * 2);
    const spd = rnd(0.5, 1.4) * (1 + (level - 1) * 0.08);
    return {
        x, y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        size, r,
        verts: asteroidVerts(r),
        rot: rnd(0, Math.PI * 2),
        rotSpeed: rnd(-0.03, 0.03),
        glow: rnd(0, Math.PI * 2),
        glowSpeed: rnd(0.025, 0.065)
    };
}