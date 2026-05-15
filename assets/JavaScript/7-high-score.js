/* ═══════════════════════════════════════════════════════════════════════════
  #7  HI-SCORE PERSISTENCE
   ─────────────────────────
   Stored in localStorage so it survives page refreshes.
   ═══════════════════════════════════════════════════════════════════════════ */

let hiScore = parseInt(localStorage.getItem('abHi') || '0');
hiEl.textContent = hiScore;
