/* ═══════════════════════════════════════════════════════════════════════════
  #20 DRAW LOOP
   ──────────────
   Renders one frame using Canvas 2D API.
 
   Draw order (painter's algorithm — later = on top):
     1. Clear + dark background
     2. Nebula glow gradients
     3. Stars (twinkling)
     4. Powerups (hexagon + icon + countdown arc)
     5. Particles (debris dots + expanding rings)
     6. Asteroids (jagged polygon + glow)
     7. Bullets (radial-gradient orb)
     8. Active powerup timers (corner text)
     9. Ship (polygon fallback; shield bubble if active)
    10. Life icons (bottom-left)
    11. Combo indicator (bottom-centre)
   ═══════════════════════════════════════════════════════════════════════════ */

function draw() {
    ctx.save(); // save state before applying screen-shake translate

    /* Screen shake offset applied to entire frame */
    ctx.translate(shakeX, shakeY);

    /* ── 1. Clear + background ── */
    ctx.clearRect(-10, -10, W + 20, H + 20);
    ctx.fillStyle = '#03030d';
    ctx.fillRect(-10, -10, W + 20, H + 20);

    /* ── 2. Nebula glow: two overlapping radial gradients ── */
    const ng1 = ctx.createRadialGradient(W * .3, H * .4, 0, W * .3, H * .4, W * .6);
    ng1.addColorStop(0, 'rgba(20,10,60,0.18)'); ng1.addColorStop(1, 'transparent');
    ctx.fillStyle = ng1; ctx.fillRect(0, 0, W, H);
    const ng2 = ctx.createRadialGradient(W * .75, H * .7, 0, W * .75, H * .7, W * .5);
    ng2.addColorStop(0, 'rgba(0,30,40,0.12)'); ng2.addColorStop(1, 'transparent');
    ctx.fillStyle = ng2; ctx.fillRect(0, 0, W, H);

    /* ── 3. Stars — each twinkles via sine wave on brightness ── */
    for (const s of stars) {
        const tw = 0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset);
        ctx.globalAlpha = s.brightness * tw;
        ctx.fillStyle = s.hue ? `hsl(${s.hue},80%,80%)` : '#ffffff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── 4. Powerups — rotating hexagon with icon and arc countdown ── */
    for (const p of powerups) {
        const pulse = 0.6 + 0.4 * Math.sin(p.pulse);
        const col = POWERUP_COLORS[p.type];
        ctx.save();
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.shadowColor = col; ctx.shadowBlur = 14 * pulse;
        ctx.strokeStyle = col; ctx.lineWidth = 1.5;

        // Hexagon outline
        const r = 13;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const a = i / 6 * Math.PI * 2 - Math.PI / 6;
            ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath(); ctx.stroke();

        // Translucent fill
        ctx.globalAlpha = 0.18 * pulse; ctx.fillStyle = col; ctx.fill();
        ctx.globalAlpha = 1;

        // Centre icon
        ctx.shadowBlur = 0; ctx.fillStyle = col;
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(POWERUP_ICONS[p.type], 0, 0);

        // Countdown arc (shrinks as life decreases)
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.globalAlpha = 0.4;
        ctx.beginPath(); ctx.arc(0, 0, r + 4, 0, Math.PI * 2 * (p.life / 600)); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /* ── 5. Particles ── */
    for (const p of particles) {
        if (p.type === 'ring') {
            // Expanding ring: radius grows, alpha fades
            const ratio = 1 - p.life / p.maxLife;
            p.r = p.maxR * ratio;
            ctx.globalAlpha = (p.life / p.maxLife) * 0.65;
            ctx.strokeStyle = p.col; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = 1;
        } else {
            // Dot particle: fades out as life drops
            const alpha = Math.min(1, p.life / (p.maxLife || 30));
            ctx.globalAlpha = alpha; ctx.fillStyle = p.col;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size || 2, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;

    /* ── 6. Asteroids — jagged polygon outline with glow ── */
    for (const a of asteroids) {
        const glowPulse = 0.5 + 0.5 * Math.sin(a.glow);
        const col = a.size === 3 ? '#5DCAA5' : a.size === 2 ? '#EF9F27' : '#F0997B';
        ctx.save();
        ctx.translate(a.x, a.y); ctx.rotate(a.rot);
        ctx.shadowColor = col; ctx.shadowBlur = 10 + glowPulse * 8;
        ctx.strokeStyle = col; ctx.lineWidth = 1.8;
        // Dim fill
        ctx.globalAlpha = 0.08; ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(a.verts[0][0], a.verts[0][1]);
        for (const v of a.verts) ctx.lineTo(v[0], v[1]);
        ctx.closePath(); ctx.fill();
        // Bright outline
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(a.verts[0][0], a.verts[0][1]);
        for (const v of a.verts) ctx.lineTo(v[0], v[1]);
        ctx.closePath(); ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /* ── 7. Bullets — glowing orb using radial gradient ── */
    for (const b of bullets) {
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 5);
        grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#AFA9EC'); grad.addColorStop(1, 'transparent');
        ctx.shadowColor = '#AFA9EC'; ctx.shadowBlur = 12;
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    /* ── 8. Active powerup timers — top-left corner text ── */
    let py = 64;
    if (multishotActive > 0) {
        ctx.font = '10px "Share Tech Mono"'; ctx.fillStyle = '#FFD700'; ctx.globalAlpha = 0.9;
        ctx.fillText(`✦ MULTISHOT ${Math.ceil(multishotActive / 60)}s`, 16, py);
        ctx.globalAlpha = 1; py += 16;
    }
    if (rapidActive > 0) {
        ctx.font = '10px "Share Tech Mono"'; ctx.fillStyle = '#FF6633'; ctx.globalAlpha = 0.9;
        ctx.fillText(`► RAPID FIRE ${Math.ceil(rapidActive / 60)}s`, 16, py);
        ctx.globalAlpha = 1;
    }

    /* ── 9. Ship ── */
    // Blink during invincibility: visible every other 8-frame window
    const showShip = ship.inv <= 0 || Math.floor(ship.inv / 8) % 2 === 0;
    if (showShip) {
        ctx.save();
        ctx.translate(ship.x, ship.y);
        ctx.rotate(ship.angle + Math.PI / 2); // +π/2 so 0° angle points up

        // Shield bubble — pulsing blue rings
        if (ship.shieldOn && ship.shieldLeft > 0) {
            const sp2 = 0.6 + 0.4 * Math.sin(t * 0.15);
            ctx.globalAlpha = sp2 * 0.5; ctx.strokeStyle = '#378ADD'; ctx.lineWidth = 3;
            ctx.shadowColor = '#378ADD'; ctx.shadowBlur = 22;
            ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.stroke();
            ctx.globalAlpha = sp2 * 0.28; ctx.strokeStyle = '#85B7EB'; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.stroke();
            for (let i = 0; i < 6; i++) {
                const sa = (i / 6) * Math.PI * 2 + t * 0.04, ea = sa + Math.PI / 4;
                ctx.globalAlpha = sp2 * 0.18; ctx.strokeStyle = '#B5D4F4'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(0, 0, 28, sa, ea); ctx.stroke();
            }
            ctx.shadowBlur = 0; ctx.globalAlpha = 1;
        }

        // Ship body — rocket image with polygon fallback
        if (rocketImg.complete && rocketImg.naturalWidth > 0) {
            ctx.drawImage(rocketImg, -27, -33, 54, 66); // centered, 54×66px
        } else {
            ctx.strokeStyle = '#CECBF6'; ctx.lineWidth = 2;
            ctx.shadowColor = '#AFA9EC'; ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.moveTo(0, -24);  // nose tip
            ctx.lineTo(16, 16);  // starboard wing
            ctx.lineTo(0, 8);    // tail center notch
            ctx.lineTo(-16, 16); // port wing
            ctx.closePath(); ctx.stroke();
        }


        // Thrust flame — animated orange/yellow triangle
        if (ship.thrusting) {
            const flicker = rnd(14, 22); // random flame length for flicker effect
            ctx.shadowColor = '#FF8030'; ctx.shadowBlur = 14;
            ctx.strokeStyle = '#EF9F27'; ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-8, 14);
            ctx.lineTo(0, 14 + flicker);
            ctx.lineTo(8, 14);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /* ── 10. Life icons — small ship triangles bottom-left ── */
    for (let i = 0; i < lives; i++) {
        ctx.save();
        ctx.translate(16 + i * 24, H - 16);
        ctx.strokeStyle = '#CECBF6'; ctx.lineWidth = 1.2; ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.moveTo(0, -8);   // mini nose
        ctx.lineTo(5, 5);   // right
        ctx.lineTo(0, 2);   // tail notch
        ctx.lineTo(-5, 5);   // left
        ctx.closePath(); ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.restore();
    }

    /* ── 11. Combo indicator — bottom-centre ── */
    if (combo >= 3) {
        const comboAlpha = Math.min(1, comboTimer / 20);
        ctx.save();
        ctx.globalAlpha = comboAlpha;
        ctx.font = `bold ${clamp(13, 10, 16)}px "Orbitron"`;
        ctx.fillStyle = '#FFD700'; ctx.textAlign = 'center';
        ctx.shadowColor = '#FFD700'; ctx.shadowBlur = 16;
        ctx.fillText(`COMBO ×${multiplier}  (${combo} hits)`, W / 2, H - 30);
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    ctx.restore(); // pop the screen-shake translation
}