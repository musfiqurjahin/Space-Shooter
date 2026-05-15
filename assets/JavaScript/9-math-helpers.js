/* ═══════════════════════════════════════════════════════════════════════════
  #9  MATH HELPERS
   ─────────────────
   Small utility functions used throughout the game.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Random float in [a, b) */
const rnd = (a, b) => Math.random() * (b - a) + a;
/** Random integer in [a, b] (inclusive) */
const rndInt = (a, b) => Math.floor(rnd(a, b + 1));
/** Wrap value within [0, max) — used for toroidal space wrap-around */
const wrap = (v, max) => ((v % max) + max) % max;
/** Clamp value between lo and hi */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));