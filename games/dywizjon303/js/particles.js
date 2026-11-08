// High-Performance VFX & Particle System (Zero Runtime Material/Shader Allocations)

class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.bullets = [];
    this.bombs = [];
    this.particles = [];
    this.debrisList = [];

    // Shared pre-allocated geometries (created ONCE, never recreated)
    this.bulletGeo = new THREE.CylinderGeometry(0.08, 0.08, 2.6, 5);
    this.bulletGeo.rotateX(Math.PI / 2);

    this.bombGeo = new THREE.CylinderGeometry(0.32, 0.22, 2.2, 8);
    this.bombGeo.rotateX(Math.PI / 2);

    this.particleGeo = new THREE.IcosahedronGeometry(0.55, 0);
    this.sparkGeo = new THREE.BoxGeometry(0.22, 0.22, 0.22);
    this.debrisGeo = new THREE.BoxGeometry(1.1, 0.18, 0.8);

    // Shared pre-allocated materials (prevents WebGL shader recompilation & GC lag)
    this.tracerMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
    this.enemyTracerMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    this.bombMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    this.sparkMat = new THREE.MeshBasicMaterial({ color: 0xfffb00 });
    this.debrisMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });

    // 3D Bombing Aim Ring on water/ground
    const sightGeo = new THREE.CircleGeometry(18, 20);
    sightGeo.rotateX(-Math.PI / 2);
    const sightMat = new THREE.MeshBasicMaterial({
      color: 0xff4400,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    this.bombSightMesh = new THREE.Mesh(sightGeo, sightMat);
    this.bombSightMesh.position.y = 1.2;
    this.bombSightMesh.visible = false;
    this.scene.add(this.bombSightMesh);

    this.fireMat1 = new THREE.MeshBasicMaterial({ color: 0xff5500 });
    this.fireMat2 = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
    this.smokeMat1 = new THREE.MeshBasicMaterial({ color: 0x262f3d });
    this.smokeMat2 = new THREE.MeshBasicMaterial({ color: 0x3b4252 });

    // Nuclear blast shockwave ring
    this.shockwaveGeo = new THREE.RingGeometry(1, 3.5, 32);
    this.shockwaveGeo.rotateX(-Math.PI / 2);
    this.shockwaveMat = new THREE.MeshBasicMaterial({
      color: 0xffedd5,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide
    });
    this.nukeShockwaves = [];
    this.nukeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.nukeFireMat = new THREE.MeshBasicMaterial({ color: 0xff3b00 });

    // Guided Homing Missiles (AIM-9 Sidewinder / AIM-120 AMRAAM)
    this.missiles = [];
    this.missileGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8);
    this.missileGeo.rotateX(Math.PI / 2);
    this.missileNoseGeo = new THREE.ConeGeometry(0.12, 0.45, 8);
    this.missileNoseGeo.rotateX(-Math.PI / 2);
    this.missileFinGeo = new THREE.BoxGeometry(0.65, 0.02, 0.35);
    this.missileCanardGeo = new THREE.BoxGeometry(0.42, 0.02, 0.22);
    this.missileFlameGeo = new THREE.ConeGeometry(0.16, 0.9, 8);
    this.missileFlameGeo.rotateX(-Math.PI / 2);

    this.missileMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.25
    });
    this.missileNoseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.3
    });
    this.missileFinMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4
    });
    this.missileFlameMat = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.95
    });

    // Reusable temp vector
    this._tempVec = new THREE.Vector3();
  }

  createMissileMesh() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(this.missileGeo, this.missileMat);
    group.add(body);

    const nose = new THREE.Mesh(this.missileNoseGeo, this.missileNoseMat);
    nose.position.z = 1.5;
    group.add(nose);

    const fin1 = new THREE.Mesh(this.missileFinGeo, this.missileFinMat);
    fin1.position.z = -1.05;
    group.add(fin1);
    const fin2 = fin1.clone();
    fin2.rotation.z = Math.PI / 2;
    group.add(fin2);

    const canard1 = new THREE.Mesh(this.missileCanardGeo, this.missileFinMat);
    canard1.position.z = 0.8;
    group.add(canard1);
    const canard2 = canard1.clone();
    canard2.rotation.z = Math.PI / 2;
    group.add(canard2);

    const flame = new THREE.Mesh(this.missileFlameGeo, this.missileFlameMat);
    flame.position.z = -1.6;
    group.add(flame);

    return group;
  }

  // Spawn guided homing missile (AIM-9 / AIM-120)
  spawnMissile(position, direction, target, isPlayer = true, initialSpeed = 120) {
    if (this.missiles.length > 20) {
      const oldest = this.missiles.shift();
      this.scene.remove(oldest.mesh);
    }

    const mesh = this.createMissileMesh();
    mesh.position.copy(position);

    const dir = direction.clone().normalize();
    this._tempVec.copy(position).add(dir);
    mesh.lookAt(this._tempVec);

    const velocity = dir.clone().multiplyScalar(initialSpeed);

    const missile = {
      mesh: mesh,
      velocity: velocity,
      speed: initialSpeed,
      target: target,
      isPlayer: isPlayer,
      life: 0,
      maxLife: 6.5,
      radius: 2.5,
      damage: 340,
      smokeTimer: 0
    };

    this.scene.add(mesh);
    this.missiles.push(missile);
    return missile;
  }

  // Rocket exhaust smoke puffs
  spawnRocketSmoke(position) {
    if (this.particles.length > 150) {
      const old = this.particles.shift();
      this.scene.remove(old.mesh);
    }
    const pMesh = new THREE.Mesh(this.particleGeo, Math.random() > 0.4 ? this.nukeWhiteMat : this.smokeMat2);
    pMesh.position.copy(position);
    const s = 0.45 + Math.random() * 0.35;
    pMesh.scale.set(s, s, s);

    this.scene.add(pMesh);
    this.particles.push({
      mesh: pMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 1.5
      ),
      drag: 0.94,
      shrinkAfter: 0.15,
      life: 0,
      maxLife: 0.55
    });
  }

  // Spawn machine gun bullet
  spawnBullet(position, direction, speed, isPlayer = true, owner = null) {
    if (this.bullets.length > 120) {
      const oldest = this.bullets.shift();
      this.scene.remove(oldest.mesh);
    }

    const mesh = new THREE.Mesh(this.bulletGeo, isPlayer ? this.tracerMat : this.enemyTracerMat);
    mesh.position.copy(position);

    this._tempVec.copy(position).add(direction);
    mesh.lookAt(this._tempVec);

    const velocity = direction.clone().normalize().multiplyScalar(speed);

    const bullet = {
      mesh: mesh,
      velocity: velocity,
      isPlayer: isPlayer,
      owner: owner,
      life: 0,
      maxLife: 1.8,
      radius: 1.2,
      damage: isPlayer ? 35 : 12
    };

    this.scene.add(mesh);
    this.bullets.push(bullet);
    return bullet;
  }

  // Spawn heavy aerial bomb or atomic bomb dropped with 'B'
  spawnBomb(position, planeVelocity, blastRadius = 95, damage = 500, isNuclear = false) {
    let mesh;
    if (isNuclear) {
      mesh = PlaneModels.createAtomicBomb();
    } else {
      mesh = new THREE.Mesh(this.bombGeo, this.bombMat);
    }
    mesh.position.copy(position);

    const vel = planeVelocity.clone();
    vel.y -= 12.0; // Initial downward drop release

    const bomb = {
      mesh: mesh,
      velocity: vel,
      blastRadius: blastRadius,
      damage: damage,
      isNuclear: isNuclear,
      life: 0,
      maxLife: 16.0
    };

    this.scene.add(mesh);
    this.bombs.push(bomb);
    return bomb;
  }

  // Update 3D Bombing Aim Ring on the water surface
  updateBombSight(playerPos, playerVel) {
    if (!this.bombSightMesh || !playerPos || !playerVel) return;
    const g = 45.0;
    const py = Math.max(1, playerPos.y - 1.2);
    const vy = playerVel.y - 12.0;
    const disc = vy * vy + 2 * g * py;
    if (disc <= 0) {
      this.bombSightMesh.visible = false;
      return;
    }
    const t = (vy + Math.sqrt(disc)) / g;
    this.bombSightMesh.position.set(
      playerPos.x + playerVel.x * t,
      1.2,
      playerPos.z + playerVel.z * t
    );
    this.bombSightMesh.visible = true;
  }

  // Create Colossal Atomic Blast with Rising Mushroom Cloud, Blinding Flash and Surface Shockwaves
  createNuclearExplosion(position) {
    // 1. Trigger Fullscreen Blinding White Flash via DOM overlay
    const flashEl = document.getElementById('nuke-flash');
    if (flashEl) {
      flashEl.classList.remove('active');
      void flashEl.offsetWidth; // trigger reflow
      flashEl.classList.add('active');
    }

    // 2. High-speed Expanding Surface Water Shockwave Ring
    const shockwaveMesh = new THREE.Mesh(this.shockwaveGeo, this.shockwaveMat.clone());
    shockwaveMesh.position.set(position.x, 2.5, position.z);
    this.scene.add(shockwaveMesh);
    this.nukeShockwaves.push({
      mesh: shockwaveMesh,
      scale: 10,
      maxScale: 850,
      speed: 360,
      life: 0,
      maxLife: 2.8
    });

    // 3. Spawning the Nuclear Mushroom Cloud Structure (optimized ~55 particles total for locked 60 FPS)
    // Part A: Rising Fiery Stem / Trunk (wznoszący się słup ognia i dymu)
    const stemCount = 24;
    for (let i = 0; i < stemCount; i++) {
      const mat = i < 8 ? this.nukeWhiteMat : (i < 16 ? this.nukeFireMat : this.smokeMat1);
      const pMesh = new THREE.Mesh(this.particleGeo, mat);
      const startY = 3.0 + i * 14;
      pMesh.position.set(
        position.x + (Math.random() - 0.5) * 22,
        startY,
        position.z + (Math.random() - 0.5) * 22
      );

      const r = 5.0 + Math.random() * 6.5;
      pMesh.scale.set(r, r * 1.4, r);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        65.0 + Math.random() * 45.0, // Strong upward convective lift
        (Math.random() - 0.5) * 12
      );

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: vel,
        drag: 0.96,
        shrinkAfter: 1.8,
        life: 0,
        maxLife: 3.5 + Math.random() * 1.5
      });
    }

    // Part B: Toroidal Mushroom Cap / Anvil Cloud (kapelusz grzyba atomowego)
    const capCount = 32;
    for (let i = 0; i < capCount; i++) {
      const angle = (i / capCount) * Math.PI * 2;
      const dist = 18 + Math.random() * 35;
      const mat = Math.random() > 0.4 ? this.fireMat1 : (Math.random() > 0.5 ? this.smokeMat1 : this.smokeMat2);

      const pMesh = new THREE.Mesh(this.particleGeo, mat);
      pMesh.position.set(
        position.x + Math.cos(angle) * dist,
        position.y + 120 + Math.random() * 60,
        position.z + Math.sin(angle) * dist
      );

      const r = 8.5 + Math.random() * 10;
      pMesh.scale.set(r * 1.3, r * 0.8, r * 1.3);

      // Billow outward and upward
      const vel = new THREE.Vector3(
        Math.cos(angle) * (55.0 + Math.random() * 35.0),
        40.0 + Math.random() * 25.0,
        Math.sin(angle) * (55.0 + Math.random() * 35.0)
      );

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: vel,
        drag: 0.94,
        shrinkAfter: 2.2,
        life: 0,
        maxLife: 4.2 + Math.random() * 1.8
      });
    }

    // Part C: Ground-level massive fire burst
    this.createExplosion(position, 3.8, false);
  }

  // Create fiery explosion WITHOUT adding/removing PointLights (which stalls WebGL with shader recompiles)
  createExplosion(position, scale = 1.0, spawnDebris = true) {
    // Cap total particles to guarantee 60 FPS
    const particleCount = Math.min(14, Math.floor(12 * scale));
    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length > 150) {
        const oldP = this.particles.shift();
        this.scene.remove(oldP.mesh);
      }

      const isFire = Math.random() > 0.4;
      const mat = isFire
        ? (Math.random() > 0.5 ? this.fireMat1 : this.fireMat2)
        : (Math.random() > 0.5 ? this.smokeMat1 : this.smokeMat2);

      const pMesh = new THREE.Mesh(this.particleGeo, mat);
      pMesh.position.copy(position);

      const radius = (0.8 + Math.random() * 1.1) * scale;
      pMesh.scale.set(radius, radius, radius);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 26 * scale,
        (Math.random() - 0.5) * 26 * scale + 3,
        (Math.random() - 0.5) * 26 * scale
      );

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: vel,
        drag: 0.92,
        shrinkAfter: 0.35,
        life: 0,
        maxLife: 0.65 + Math.random() * 0.45
      });
    }

    // Shattered aircraft debris chunks (only on primary plane explosion, NO recursive chain reaction!)
    if (spawnDebris && scale >= 0.8) {
      const debrisCount = Math.min(4, Math.floor(4 * scale));
      for (let i = 0; i < debrisCount; i++) {
        if (this.debrisList.length > 20) {
          const oldD = this.debrisList.shift();
          this.scene.remove(oldD.mesh);
        }

        const dMesh = new THREE.Mesh(this.debrisGeo, this.debrisMat);
        dMesh.position.copy(position);
        const s = 0.6 + Math.random() * 0.8;
        dMesh.scale.set(s, s, s);

        const vel = new THREE.Vector3(
          (Math.random() - 0.5) * 32 * scale,
          Math.random() * 16 * scale + 4,
          (Math.random() - 0.5) * 32 * scale
        );

        const rotVel = new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 12
        );

        this.scene.add(dMesh);
        this.debrisList.push({
          mesh: dMesh,
          velocity: vel,
          rotVel: rotVel,
          smokeTimer: 0,
          life: 0,
          maxLife: 2.2
        });
      }
    }
  }

  // Hit spark effect using shared geometry & material
  createHitSparks(position) {
    for (let i = 0; i < 4; i++) {
      if (this.particles.length > 150) break;
      const pMesh = new THREE.Mesh(this.sparkGeo, this.sparkMat);
      pMesh.position.copy(position);

      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14,
        (Math.random() - 0.5) * 14
      );

      this.scene.add(pMesh);
      this.particles.push({
        mesh: pMesh,
        velocity: vel,
        drag: 0.88,
        shrinkAfter: 0.1,
        life: 0,
        maxLife: 0.25
      });
    }
  }

  // Spawn smoke puff behind smoking engine (throttled & shared materials)
  spawnEngineSmoke(position, scale = 0.6, isFire = false) {
    if (this.particles.length > 140) return;

    const mat = isFire ? this.fireMat1 : this.smokeMat1;
    const pMesh = new THREE.Mesh(this.particleGeo, mat);
    pMesh.position.copy(position);
    pMesh.scale.set(scale, scale, scale);

    this.scene.add(pMesh);
    this.particles.push({
      mesh: pMesh,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2 + 1.5,
        (Math.random() - 0.5) * 2
      ),
      drag: 0.95,
      shrinkAfter: 0.3,
      life: 0,
      maxLife: 0.65
    });
  }

  update(dt) {
    // 1. Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.life += dt;
      b.mesh.position.addScaledVector(b.velocity, dt);

      if (b.life >= b.maxLife || b.mesh.position.y < 5) {
        this.scene.remove(b.mesh);
        this.bullets.splice(i, 1);
      }
    }

    // 1b. Update falling bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const bomb = this.bombs[i];
      bomb.life += dt;
      bomb.velocity.y -= 45.0 * dt; // Gravity
      bomb.mesh.position.addScaledVector(bomb.velocity, dt);

      this._tempVec.copy(bomb.mesh.position).add(bomb.velocity);
      bomb.mesh.lookAt(this._tempVec);
    }

    // 1c. Update Guided Homing Missiles (AIM-9 / AIM-120)
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      m.life += dt;

      // Rocket acceleration
      m.speed = Math.min(390, m.speed + 175 * dt);

      // Proportional navigation homing steering toward target
      if (m.target && !m.target.isDead && m.target.mesh) {
        const targetPos = m.target.mesh.position;
        const dist = m.mesh.position.distanceTo(targetPos);
        const timeToHit = Math.max(0.04, dist / m.speed);

        const targetVel = m.target.velocity || new THREE.Vector3(0, 0, m.target.speed || 80);
        const predictedPos = targetPos.clone().addScaledVector(targetVel, timeToHit * 0.5);
        const desiredDir = new THREE.Vector3().subVectors(predictedPos, m.mesh.position).normalize();

        const currentDir = m.velocity.clone().normalize();
        const maxSteer = 5.2 * dt;
        currentDir.lerp(desiredDir, Math.min(1.0, maxSteer)).normalize();
        m.velocity.copy(currentDir).multiplyScalar(m.speed);
      }

      // Move missile
      m.mesh.position.addScaledVector(m.velocity, dt);

      // Orient mesh along velocity
      this._tempVec.copy(m.mesh.position).add(m.velocity);
      m.mesh.lookAt(this._tempVec);

      // Rocket exhaust trail
      m.smokeTimer += dt;
      if (m.smokeTimer >= 0.032) {
        m.smokeTimer = 0;
        this.spawnRocketSmoke(m.mesh.position);
      }

      // Detonate on ground or water surface
      if (m.mesh.position.y <= 2.2) {
        this.createExplosion(m.mesh.position, 1.8, true);
        window.soundSystem.playExplosion(true);
        this.scene.remove(m.mesh);
        this.missiles.splice(i, 1);
        continue;
      }

      // Fuel exhaustion
      if (m.life >= m.maxLife) {
        this.createExplosion(m.mesh.position, 1.2, false);
        this.scene.remove(m.mesh);
        this.missiles.splice(i, 1);
      }
    }

    // 2. Update particles (scale-based fade instead of cloning materials)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.multiplyScalar(p.drag);

      if (p.life > p.shrinkAfter) {
        p.mesh.scale.multiplyScalar(0.9);
      } else {
        p.mesh.scale.multiplyScalar(1.03);
      }

      if (p.life >= p.maxLife || p.mesh.scale.x < 0.08) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    // 3. Update tumbling debris chunks
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.life += dt;
      d.velocity.y -= 25.0 * dt;
      d.mesh.position.addScaledVector(d.velocity, dt);

      d.mesh.rotation.x += d.rotVel.x * dt;
      d.mesh.rotation.y += d.rotVel.y * dt;
      d.mesh.rotation.z += d.rotVel.z * dt;

      d.smokeTimer += dt;
      if (d.smokeTimer > 0.12) {
        d.smokeTimer = 0;
        this.spawnEngineSmoke(d.mesh.position, 0.45, true);
      }

      if (d.mesh.position.y <= 2 || d.life >= d.maxLife) {
        this.scene.remove(d.mesh);
        this.debrisList.splice(i, 1);
      }
    }

    // 4. Update Expanding Nuclear Shockwaves on sea surface
    for (let i = this.nukeShockwaves.length - 1; i >= 0; i--) {
      const sw = this.nukeShockwaves[i];
      sw.life += dt;
      sw.scale += sw.speed * dt;
      sw.mesh.scale.set(sw.scale, 1, sw.scale);
      const fade = Math.max(0, 1.0 - sw.life / sw.maxLife);
      sw.mesh.material.opacity = fade * 0.85;

      if (sw.life >= sw.maxLife) {
        this.scene.remove(sw.mesh);
        this.nukeShockwaves.splice(i, 1);
      }
    }
  }

  cleanup() {
    this.bullets.forEach(b => this.scene.remove(b.mesh));
    this.bombs.forEach(b => this.scene.remove(b.mesh));
    this.missiles.forEach(m => this.scene.remove(m.mesh));
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.debrisList.forEach(d => this.scene.remove(d.mesh));
    this.nukeShockwaves.forEach(s => this.scene.remove(s.mesh));
    this.bullets = [];
    this.bombs = [];
    this.missiles = [];
    this.particles = [];
    this.debrisList = [];
    this.nukeShockwaves = [];
  }
}

window.ParticleSystem = ParticleSystem;
