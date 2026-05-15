/* ═══════════════════════════════════════════════════════════════════════════
  #6  FULLSCREEN
   ───────────────
   Wraps the Fullscreen API; updates button labels on change event.
   ═══════════════════════════════════════════════════════════════════════════ */

function toggleFS() {
    resumeAC();
    if (!document.fullscreenElement)
        document.documentElement.requestFullscreen().catch(() => { });
    else
        document.exitFullscreen();
}
fsBtn.addEventListener('click', toggleFS);
fsFromSettings.addEventListener('click', toggleFS);
document.addEventListener('fullscreenchange', () => {
    const isFS = !!document.fullscreenElement;
    fsBtn.textContent = isFS ? '⮹' : '⛶';
    fsFromSettings.textContent = isFS ? '⮹ Exit Fullscreen' : '⛶ Fullscreen';
});