/* ═══════════════════════════════════════════════════════════════════════════
  #22 IDLE ANIMATION LOOP
   ────────────────────────
   When not actively playing (title, paused, game-over), we still want the
   star field to twinkle. This lightweight loop only draws stars — no physics.
   It stops itself as soon as gameState becomes 'playing'.
   ═══════════════════════════════════════════════════════════════════════════ */

function idleLoop() {
    if (gameState === 'playing') return; // game loop has taken over — stop
    t++;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#03030d'; ctx.fillRect(0, 0, W, H);
    for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        ctx.globalAlpha = s.brightness * tw;
        ctx.fillStyle = s.hue ? `hsl(${s.hue},80%,80%)` : '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(idleLoop);
}