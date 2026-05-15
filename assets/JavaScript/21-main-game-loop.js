/* ═══════════════════════════════════════════════════════════════════════════
  #21 MAIN GAME LOOP
   ───────────────────
   requestAnimationFrame guarantees ~60fps and automatically pauses when
   the browser tab is hidden (no wasted CPU when not visible).
   ═══════════════════════════════════════════════════════════════════════════ */

function loop() {
    update(); // physics + game logic
    draw();   // canvas rendering
    raf = requestAnimationFrame(loop); // schedule next frame
}
