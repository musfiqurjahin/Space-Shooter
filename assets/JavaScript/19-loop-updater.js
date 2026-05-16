/* ═══════════════════════════════════════════════════════════════════════════
  #19 UPDATE LOOP
   ────────────────
   Called once per frame. Handles all game logic:
     • screen shake decay
     • combo timer
     • powerup duration countdown
     • player input → movement
     • rotation, thrust, drag, wrap
     • bullet firing + movement
     • asteroid movement + spin
     • powerup drift
     • particle movement + aging
     • bullet-asteroid collisions → scoring, splitting, debris
     • ship-asteroid collisions   → shield or death
     • ship-powerup collisions    → pickup effects
     • level completion check
     • shield HUD update
   ═══════════════════════════════════════════════════════════════════════════ */

function update() {
    if (gameState !== 'playing') return;
    t++; // global frame counter

    /* ── Screen shake: exponential decay each frame ── */
    shakeMag *= 0.88;
    shakeX = shakeMag * (Math.random() - 0.5) * 2;
    shakeY = shakeMag * (Math.random() - 0.5) * 2;

    /* ── Combo timer: reset combo after 90 idle frames ── */
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer === 0) { combo = 0; multiplier = 1; multEl.textContent = '×1'; }
    }

    /* ── Powerup duration countdown ── */
    if (multishotActive > 0) multishotActive--;
    if (rapidActive > 0) rapidActive--;

    /* ── Read player input ── */
    const thrustPressed = keys['KeyW'] || keys['ArrowUp'];
    ship.thrusting = thrustPressed;
    ship.shieldOn = (keys['KeyS'] || keys['ArrowDown']) && ship.shieldLeft > 0;

    /* ── Rotation — 0.09 rad/frame (snappier than typical 0.058) ── */
    const ROT = 0.09;
    if (keys['KeyA'] || keys['ArrowLeft']) ship.angle -= ROT;
    if (keys['KeyD'] || keys['ArrowRight']) ship.angle += ROT;

    /* ── Thrust & engine sound ── */
    if (thrustPressed) {
        ship.vx += Math.cos(ship.angle) * 0.22;
        ship.vy += Math.sin(ship.angle) * 0.22;
        if (!engineOn) startEngineSound();

        // Exhaust particles fire backwards from the ship nose
        if (particlesEnabled) {
            for (let k = 0; k < 3; k++) {
                const spread = rnd(-0.45, 0.45);
                const spd = rnd(1.5, 3.5);
                const ta = ship.angle + Math.PI + spread;
                particles.push({
                    x: ship.x + Math.cos(ship.angle + Math.PI) * 14,
                    y: ship.y + Math.sin(ship.angle + Math.PI) * 14,
                    vx: Math.cos(ta) * spd, vy: Math.sin(ta) * spd,
                    life: rndInt(12, 28), maxLife: 22,
                    col: Math.random() < 0.5 ? '#EF9F27' : '#F05020',
                    size: rnd(1.5, 4), type: 'thrust'
                });
            }
        }
    } else {
        if (engineOn) stopEngineSound();
    }

    /* ── Speed cap (6 px/frame) + light drag ── */
    const spd = Math.hypot(ship.vx, ship.vy);
    if (spd > 6) { ship.vx = ship.vx / spd * 6; ship.vy = ship.vy / spd * 6; }
    ship.vx *= 0.983; ship.vy *= 0.983;

    // Toroidal screen wrap
    ship.x = wrap(ship.x + ship.vx, W);
    ship.y = wrap(ship.y + ship.vy, H);

    /* ── Shield drain (holds ~3 seconds before depleting) ── */
    if (ship.shieldOn) {
        shieldTimer++;
        if (shieldTimer >= 3) { ship.shieldLeft = Math.max(0, ship.shieldLeft - 0.01); shieldTimer = 0; }
    }

    if (ship.inv > 0) ship.inv--;

    /* ── Shooting ── */
    const cooldown = rapidActive > 0 ? 5 : 12;
    shootCooldown--;
    if (keys['Space'] && shootCooldown <= 0) {
        const angles = multishotActive > 0
            ? [ship.angle - 0.15, ship.angle, ship.angle + 0.15]
            : [ship.angle];
        angles.forEach(a => {
            bullets.push({
                x: ship.x + Math.cos(a) * 16,
                y: ship.y + Math.sin(a) * 16,
                vx: Math.cos(a) * 10 + ship.vx,
                vy: Math.sin(a) * 10 + ship.vy,
                life: 56
            });
        });
        sfxShoot();
        shootCooldown = cooldown;
    }

    /* ── Move bullets; despawn off-screen ── */
    for (const b of bullets) {
        b.x += b.vx; b.y += b.vy; b.life--;
        if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) b.life = 0;
    }
    bullets = bullets.filter(b => b.life > 0);

    /* ── Move asteroids (toroidal wrap, spin, glow pulse) ── */
    for (const a of asteroids) {
        a.x = wrap(a.x + a.vx, W);
        a.y = wrap(a.y + a.vy, H);
        a.rot += a.rotSpeed;
        a.glow += a.glowSpeed;
    }

    /* ── Move powerups (toroidal wrap, spin, pulse) ── */
    for (const p of powerups) {
        p.x = wrap(p.x + p.vx, W);
        p.y = wrap(p.y + p.vy, H);
        p.rot += p.rotSpeed; p.pulse += 0.06; p.life--;
    }
    powerups = powerups.filter(p => p.life > 0);

    /* ── Age particles: apply friction and remove dead ones ── */
    for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.96; p.vy *= 0.96;
        p.life--;
    }
    particles = particles.filter(p => p.life > 0);

    /* ══════════════════════════════════════════════════════════════
       COLLISION: Bullet vs Asteroid
       We iterate backwards so splice doesn't corrupt indices.
       A 'continue outer' jumps past remaining bullets for a
       destroyed asteroid (one bullet kills one asteroid).
       ══════════════════════════════════════════════════════════════ */
    outer:
    for (let i = asteroids.length - 1; i >= 0; i--) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const a = asteroids[i], b = bullets[j];
            if (Math.hypot(a.x - b.x, a.y - b.y) < a.r) {

                // Score points with combo multiplier
                const base = a.size === 3 ? 20 : a.size === 2 ? 50 : 100;
                combo++; comboTimer = 90;
                if (combo >= 3) multiplier = Math.min(8, Math.floor(combo / 3) + 1);
                multEl.textContent = '×' + multiplier;
                const pts = base * multiplier;
                score += pts; scoreEl.textContent = score;
                if (score > hiScore) {
                    hiScore = score; hiEl.textContent = hiScore;
                    localStorage.setItem('abHi', hiScore);
                }

                const col = a.size === 3 ? '#5DCAA5' : a.size === 2 ? '#EF9F27' : '#F0997B';
                scorePopup(a.x, a.y - 20, pts, col);
                a.size === 3 ? sfxExplodeBig() : sfxExplodeSmall();
                addShake(a.size === 3 ? 7 : a.size === 2 ? 4 : 2);

                // Spawn debris particles
                if (particlesEnabled) {
                    const cnt = a.size === 3 ? 20 : a.size === 2 ? 14 : 8;
                    for (let k = 0; k < cnt; k++) {
                        const pa = rnd(0, Math.PI * 2), sp = rnd(1, 6);
                        particles.push({ x: a.x, y: a.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(20, 55), maxLife: 42, col, size: rnd(1.5, 4), type: 'debris' });
                    }
                    // Expanding ring flash
                    particles.push({ x: a.x, y: a.y, r: 0, maxR: a.r * 2.8, life: 22, maxLife: 22, col, type: 'ring' });
                }

                // Large/medium → split into two of next smaller size
                if (a.size > 1) {
                    asteroids.push(spawnAsteroid(a.x, a.y, a.size - 1));
                    asteroids.push(spawnAsteroid(a.x, a.y, a.size - 1));
                }

                // 12% + 1%/level chance to drop a powerup
                if (Math.random() < 0.12 + level * 0.01) powerups.push(spawnPowerup(a.x, a.y));

                asteroids.splice(i, 1);
                bullets.splice(j, 1);
                continue outer;
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       COLLISION: Ship vs Asteroid
       Ship collision circle radius ≈ 14px.
       If shield is active → deflect + drain.
       Otherwise → lose a life (or game over).
       ══════════════════════════════════════════════════════════════ */
    if (ship.inv <= 0) {
        for (let i = asteroids.length - 1; i >= 0; i--) {
            const a = asteroids[i];
            if (Math.hypot(a.x - ship.x, a.y - ship.y) < a.r + 14) {
                if (ship.shieldOn && ship.shieldLeft > 0) {
                    // Shield deflection
                    sfxShield();
                    ship.shieldLeft = Math.max(0, ship.shieldLeft - 0.7);
                    const nx = ship.x - a.x, ny = ship.y - a.y;
                    const nl = Math.hypot(nx, ny) || 1;
                    asteroids[i].vx = -(nx / nl) * 2.8; asteroids[i].vy = -(ny / nl) * 2.8;
                    ship.vx += (nx / nl) * 1.8; ship.vy += (ny / nl) * 1.8;
                    addShake(3);
                    if (particlesEnabled) {
                        for (let k = 0; k < 12; k++) {
                            const pa = rnd(0, Math.PI * 2), sp = rnd(2, 5);
                            particles.push({ x: ship.x, y: ship.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(15, 30), maxLife: 25, col: '#378ADD', size: rnd(1, 3), type: 'spark' });
                        }
                    }
                    break;
                }

                // No shield → death sequence
                sfxDeath(); stopEngineSound(); addShake(14);
                if (particlesEnabled) {
                    for (let k = 0; k < 30; k++) {
                        const pa = rnd(0, Math.PI * 2), sp = rnd(2, 8);
                        particles.push({ x: ship.x, y: ship.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(35, 75), maxLife: 60, col: '#7F77DD', size: rnd(2, 6), type: 'debris' });
                    }
                    particles.push({ x: ship.x, y: ship.y, r: 0, maxR: 50, life: 28, maxLife: 28, col: '#AFA9EC', type: 'ring' });
                }

                lives--; livesEl.textContent = lives;

                //Global top scorrer
                if (lives <= 0) {
                    gameState = 'dead';
                    stopMusic();

                    if (score > globalTopScore) {
                        const name = prompt(`🏆 NEW HIGH SCORE: ${score}\nEnter your name:`);
                        if (name && name.trim()) {
                            window._fb?.saveTopScore(name.trim(), score);
                            globalTopScore = score;
                            topScorerEl.textContent = `👑 ${name.trim()}  —  ${score.toLocaleString()} pts`;
                        }
                    }

                    oTitle.textContent = 'GAME OVER';
                    oSub.textContent = 'MISSION FAILED';
                    oMsg.innerHTML = `Score: <b style="color:#CCD6FF">${score}</b> &nbsp;|&nbsp; Hi: <b style="color:#7FF6FF">${hiScore}</b>`;
                    startBtn.textContent = '▶ PLAY AGAIN';
                    startBtn.style.display = 'inline-block';
                    pauseButtons.style.display = 'none';
                    overlay.style.display = 'flex';
                    return;
                }

                // Respawn with invincibility
                ship = makeShip(); ship.inv = 200;
                break;
            }
        }
    }

    /* ══════════════════════════════════════════════════════════════
       COLLISION: Ship vs Powerup  (pickup radius = 20px)
       ══════════════════════════════════════════════════════════════ */
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        if (Math.hypot(p.x - ship.x, p.y - ship.y) < 20) {
            sfxPowerup();
            switch (p.type) {
                case 'shield': ship.shieldLeft = Math.min(3, ship.shieldLeft + 1); break;
                case 'multishot': multishotActive = 300; break;  // 5 seconds
                case 'rapid': rapidActive = 300; break;
                case 'bomb':
                    // Clear every asteroid, award 10pts each
                    asteroids.forEach(a => {
                        const col = a.size === 3 ? '#5DCAA5' : a.size === 2 ? '#EF9F27' : '#F0997B';
                        if (particlesEnabled) {
                            for (let k = 0; k < 8; k++) {
                                const pa = rnd(0, Math.PI * 2), sp = rnd(1, 5);
                                particles.push({ x: a.x, y: a.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(20, 45), maxLife: 35, col, size: rnd(1.5, 3), type: 'debris' });
                            }
                        }
                        score += 10 * multiplier;
                    });
                    scoreEl.textContent = score;
                    asteroids = []; addShake(12);
                    break;
            }
            // Pickup spark burst
            if (particlesEnabled) {
                const col = POWERUP_COLORS[p.type];
                for (let k = 0; k < 16; k++) {
                    const pa = rnd(0, Math.PI * 2), sp = rnd(2, 5);
                    particles.push({ x: p.x, y: p.y, vx: Math.cos(pa) * sp, vy: Math.sin(pa) * sp, life: rndInt(20, 40), maxLife: 35, col, size: rnd(1.5, 3.5), type: 'spark' });
                }
            }
            powerups.splice(i, 1);
        }
    }

    /* ── Level complete: all asteroids destroyed → advance ── */
    if (asteroids.length === 0) {
        level++; levelEl.textContent = level;
        sfxLevelUp(); showLevelFlash('LEVEL ' + level);
        initLevel();
    }

    /* ── Update shield HUD dots (each dot = 1 charge) ── */
    sDots.forEach((d, i) => d.classList.toggle('empty', i >= Math.ceil(ship.shieldLeft)));
}