/* ═══════════════════════════════════════════════════════════════════════════
  #4  CANVAS / RESIZE
   ─────────────────────
   The canvas was already in the HTML (<canvas id="gc">). We size it to fill
   the full viewport and listen for resize events.
   ═══════════════════════════════════════════════════════════════════════════ */

const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');
let W, H; // viewport dimensions — updated every resize

function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);