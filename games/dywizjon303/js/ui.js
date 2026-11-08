// HUD, Tactical Radar Minimap, and Lead Aim Computer

class GameUI {
  constructor() {
    this.radarCanvas = document.getElementById('radar-canvas');
    if (this.radarCanvas) {
      this.radarCtx = this.radarCanvas.getContext('2d');
    }

    this.speedVal = document.getElementById('speed-val');
    this.speedBar = document.getElementById('speed-bar');
    this.altVal = document.getElementById('alt-val');
    this.altBar = document.getElementById('alt-bar');
    this.healthFill = document.getElementById('health-fill');
    this.heatFill = document.getElementById('heat-fill');
    this.scoreVal = document.getElementById('score-val');
    this.waveVal = document.getElementById('wave-val');
    this.killsVal = document.getElementById('kills-val');
    this.bombsVal = document.getElementById('bombs-val');
    this.missilesVal = document.getElementById('missiles-val');
    this.theaterVal = document.getElementById('theater-val');

    this.hitMarker = document.getElementById('hit-marker');
    this.leadReticle = document.getElementById('lead-reticle');
    this.missileLockBox = document.getElementById('missile-lock-box');
    this.lockLabel = this.missileLockBox ? this.missileLockBox.querySelector('.lock-label') : null;
    this.lockDistText = document.getElementById('lock-dist-text');
    this.killAnnouncement = document.getElementById('kill-announcement');
    this.damageFlash = document.getElementById('damage-flash');
    this.missionBanner = document.getElementById('mission-banner');

    this.announcementTimeout = null;
  }

  showHitMarker() {
    if (!this.hitMarker) return;
    this.hitMarker.classList.add('active');
    setTimeout(() => {
      this.hitMarker.classList.remove('active');
    }, 90);
  }

  flashDamage() {
    if (!this.damageFlash) return;
    this.damageFlash.classList.add('flash');
    setTimeout(() => {
      this.damageFlash.classList.remove('flash');
    }, 150);
  }

  showKillAnnouncement(text) {
    if (!this.killAnnouncement) return;
    this.killAnnouncement.textContent = text;
    this.killAnnouncement.classList.add('show');

    clearTimeout(this.announcementTimeout);
    this.announcementTimeout = setTimeout(() => {
      this.killAnnouncement.classList.remove('show');
    }, 2200);
  }

  showMissionBanner(text) {
    if (!this.missionBanner) return;
    this.missionBanner.textContent = text;
    this.missionBanner.style.animation = 'none';
    this.missionBanner.offsetHeight; // trigger reflow
    this.missionBanner.style.animation = 'fadeInOut 4s forwards';
  }

  update(player, controls, enemies, bombers, camera, score, wave, kills, gunHeat, bombsText = '', ships = [], theaterText = '', lockedTarget = null, isLocked = false, missilesText = '') {
    if (!player || !player.mesh) return;

    // 1. Airspeed & Altitude Gauges
    const speedKmh = Math.round(controls.currentSpeed * 3.6);
    const altitudeM = Math.round(player.mesh.position.y);

    if (this.speedVal) this.speedVal.textContent = speedKmh;
    if (this.speedBar) this.speedBar.style.width = Math.min(100, (controls.currentSpeed / controls.maxSpeed) * 100) + '%';

    if (this.altVal) {
      this.altVal.textContent = altitudeM;
      this.altVal.style.color = altitudeM < 55 ? '#ef4444' : '#f8fafc';
    }
    if (this.altBar) this.altBar.style.width = Math.min(100, (altitudeM / 1500) * 100) + '%';

    // 2. Health & Heat Bars
    const hpPercent = Math.max(0, Math.min(100, (player.health / player.maxHealth) * 100));
    if (this.healthFill) this.healthFill.style.width = hpPercent + '%';

    const heatPercent = Math.max(0, Math.min(100, gunHeat * 100));
    if (this.heatFill) this.heatFill.style.width = heatPercent + '%';

    // 3. Score & Stats
    if (this.scoreVal) this.scoreVal.textContent = score;
    if (this.waveVal) this.waveVal.textContent = wave;
    if (this.killsVal) this.killsVal.textContent = kills;
    if (this.bombsVal && bombsText) this.bombsVal.textContent = bombsText;
    if (this.missilesVal && missilesText) this.missilesVal.textContent = missilesText;
    if (this.theaterVal && theaterText) this.theaterVal.textContent = theaterText;

    // 4. Update Radar Minimap
    this.renderRadar(player, enemies, bombers, ships);

    // 5. Update Target Lead Indicator
    this.updateLeadIndicator(player, enemies, camera);

    // 6. Update Modern Jet Missile Lock-on Reticle
    this.updateMissileLock(player, lockedTarget, camera, isLocked);
  }

  renderRadar(player, enemies, bombers, ships = []) {
    if (!this.radarCtx) return;
    const ctx = this.radarCtx;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const radarRange = 1200; // world units

    ctx.clearRect(0, 0, w, h);

    // Grid circles
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.25)';
    ctx.lineWidth = 1;
    [0.3, 0.65, 0.95].forEach(r => {
      ctx.beginPath();
      ctx.arc(cx, cy, (w / 2) * r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs
    ctx.beginPath();
    ctx.moveTo(cx, 10); ctx.lineTo(cx, h - 10);
    ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy);
    ctx.stroke();

    const playerPos = player.mesh.position;
    // Player facing angle (heading)
    const playerHeading = player.mesh.rotation.y;

    // Draw German Kriegsmarine Ships on water (Magenta/Orange targets for bombs)
    ships.forEach(s => {
      if (s.isDead) return;
      this.drawRadarBlip(ctx, playerPos, playerHeading, s.mesh.position, '#c084fc', 5, cx, cy, radarRange);
    });

    // Draw Allied Bombers (Green)
    bombers.forEach(b => {
      if (b.isDead) return;
      this.drawRadarBlip(ctx, playerPos, playerHeading, b.mesh.position, '#22c55e', 5, cx, cy, radarRange);
    });

    // Draw Luftwaffe Enemies (Red / Gold)
    enemies.forEach(e => {
      if (e.isDead) return;
      const color = e.type === 'Ace' ? '#facc15' : (e.type === 'Ju87' ? '#f97316' : '#ef4444');
      this.drawRadarBlip(ctx, playerPos, playerHeading, e.mesh.position, color, e.type === 'Ace' ? 5 : 4, cx, cy, radarRange);
    });

    // Draw Player in Center (Blue arrow pointing UP)
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 6);
    ctx.lineTo(cx - 5, cy + 5);
    ctx.lineTo(cx + 5, cy + 5);
    ctx.closePath();
    ctx.fill();
  }

  drawRadarBlip(ctx, playerPos, playerHeading, targetPos, color, size, cx, cy, radarRange) {
    const dx = targetPos.x - playerPos.x;
    const dz = targetPos.z - playerPos.z;

    // Project onto player's forward (+Z rotated by yaw) and right (-X rotated by yaw) axes
    const forwardDist = dx * Math.sin(playerHeading) + dz * Math.cos(playerHeading);
    const rightDist = -dx * Math.cos(playerHeading) + dz * Math.sin(playerHeading);

    let mapX = cx + (rightDist / radarRange) * (cx - 10);
    let mapY = cy - (forwardDist / radarRange) * (cy - 10);

    // Clamp distant targets to outer edge of radar so they are always visible
    const offsetX = mapX - cx;
    const offsetY = mapY - cy;
    const distFromCenter = Math.hypot(offsetX, offsetY);
    const maxR = cx - 7;
    if (distFromCenter > maxR) {
      mapX = cx + (offsetX / distFromCenter) * maxR;
      mapY = cy + (offsetY / distFromCenter) * maxR;
    }

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(mapX, mapY, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  updateLeadIndicator(player, enemies, camera) {
    if (!this.leadReticle) return;

    // Find closest enemy in front of player
    let bestTarget = null;
    let minAngle = 0.55; // Radians from center of view
    const playerPos = player.mesh.position;
    const playerForward = new THREE.Vector3(0, 0, 1).applyQuaternion(player.mesh.quaternion);

    enemies.forEach(e => {
      if (e.isDead) return;
      const toEnemy = new THREE.Vector3().subVectors(e.mesh.position, playerPos);
      const dist = toEnemy.length();
      if (dist > 750 || dist < 20) return;

      const angle = playerForward.angleTo(toEnemy.normalize());
      if (angle < minAngle) {
        minAngle = angle;
        bestTarget = e;
      }
    });

    if (!bestTarget) {
      this.leadReticle.style.display = 'none';
      return;
    }

    // Intercept prediction
    const targetPos = bestTarget.mesh.position.clone();
    const dist = playerPos.distanceTo(targetPos);
    const bulletSpeed = 340;
    const timeToHit = dist / bulletSpeed;

    const leadPos = targetPos.clone();
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(bestTarget.mesh.quaternion);
    leadPos.addScaledVector(forward, bestTarget.speed * timeToHit);

    // Project 3D lead point to 2D screen coordinates
    const screenPos = leadPos.clone().project(camera);

    // Check if point is in front of camera
    if (screenPos.z < 1.0 && screenPos.z > -1.0) {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      const sx = (screenPos.x * halfW) + halfW;
      const sy = -(screenPos.y * halfH) + halfH;

      this.leadReticle.style.display = 'block';
      this.leadReticle.style.left = sx + 'px';
      this.leadReticle.style.top = sy + 'px';
    } else {
      this.leadReticle.style.display = 'none';
    }
  }

  updateMissileLock(player, target, camera, isLocked) {
    if (!this.missileLockBox) return;

    if (!target || target.isDead || !target.mesh) {
      this.missileLockBox.style.display = 'none';
      return;
    }

    const targetPos = target.mesh.position.clone();
    const screenPos = targetPos.project(camera);

    if (screenPos.z < 1.0 && screenPos.z > -1.0) {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      const sx = (screenPos.x * halfW) + halfW;
      const sy = -(screenPos.y * halfH) + halfH;

      this.missileLockBox.style.display = 'block';
      this.missileLockBox.style.left = sx + 'px';
      this.missileLockBox.style.top = sy + 'px';

      const dist = Math.round(player.mesh.position.distanceTo(target.mesh.position));
      if (this.lockDistText) this.lockDistText.textContent = dist + 'm';

      if (isLocked) {
        this.missileLockBox.classList.add('locked');
        if (this.lockLabel) this.lockLabel.textContent = 'LOCK';
      } else {
        this.missileLockBox.classList.remove('locked');
        if (this.lockLabel) this.lockLabel.textContent = 'TRACKING';
      }
    } else {
      this.missileLockBox.style.display = 'none';
    }
  }
}

window.GameUI = GameUI;
