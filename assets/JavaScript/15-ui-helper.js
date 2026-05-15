/* ═══════════════════════════════════════════════════════════════════════════
  #15 UI HELPERS
   ───────────────
   Small DOM/canvas utilities used during gameplay.
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Create a floating score number that animates upward from (x, y).
 * The element removes itself after the CSS animation completes.
 */
function scorePopup(x, y, val, col) {
    const d = document.createElement('div');
    d.className = 'score-pop';
    d.style.cssText = `left:${x}px;top:${y}px;color:${col || '#CCD6FF'};text-shadow:0 0 12px ${col || '#CCD6FF'}`;
    d.textContent = (val > 0 ? '+' : '') + val + (multiplier > 1 ? ` ×${multiplier}` : '');
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 1200);
}

/**
 * Flash a large centred message (e.g. "LEVEL 2") for 1.6 seconds.
 * Uses the CSS .show class to fade in/out.
 */
function showLevelFlash(txt) {
    levelFlashText.textContent = txt;
    levelFlash.classList.add('show');
    setTimeout(() => levelFlash.classList.remove('show'), 1600);
}

/**
 * Request a screen shake of the given magnitude.
 * Takes the maximum so overlapping shakes don't stack multiplicatively.
 */
function addShake(mag) {
    if (shakeEnabled) shakeMag = Math.max(shakeMag, mag);
}