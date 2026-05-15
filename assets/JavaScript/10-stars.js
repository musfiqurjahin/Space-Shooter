/* ═══════════════════════════════════════════════════════════════════════════
  #10 STAR FIELD
   ───────────────
   180 stars with individual twinkle speed, brightness, radius, and
   occasional colour (15% chance of a blue/purple tint).
   makeStars() rebuilds the field after each resize (called from startGame).
   ═══════════════════════════════════════════════════════════════════════════ */

function makeStars() {
    stars = Array.from({ length: 180 }, () => ({
        x: rnd(0, W),
        y: rnd(0, H),
        r: rnd(0.3, 1.8),
        brightness: rnd(0.1, 0.85),
        twinkleSpeed: rnd(0.008, 0.035),
        twinkleOffset: rnd(0, Math.PI * 2),
        hue: Math.random() < 0.15 ? rnd(200, 260) : 0  // 15% colored
    }));
}