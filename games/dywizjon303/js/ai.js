// AI Airplane Controllers: Luftwaffe Fighters (Bf 109), Stukas, and Allied Bombers

class PlaneEntity {
  constructor(mesh, type, isEnemy = true) {
    this.mesh = mesh;
    this.type = type; // 'Bf109', 'Ju87', 'Ace', 'Bomber'
    this.isEnemy = isEnemy;

    this.maxHealth = type === 'Bomber' ? 650 : (type === 'HostileAce' ? 380 : (type === 'HostileJet' ? 220 : (type === 'Ace' ? 300 : (type === 'ZeroAce' ? 280 : (type === 'Ju87' ? 160 : (type === 'Zero' ? 95 : 100))))));
    this.health = this.maxHealth;
    this.speed = type === 'Bomber' ? 45 : (type === 'HostileAce' ? 120 : (type === 'HostileJet' ? 105 : (type === 'Ju87' ? 60 : (type === 'Ace' ? 88 : (type === 'ZeroAce' ? 92 : (type === 'Zero' ? 84 : 80))))));
    this.turnSpeed = type === 'Bomber' ? 0.4 : (type === 'HostileAce' ? 2.8 : (type === 'HostileJet' ? 2.2 : (type === 'Ju87' ? 0.9 : (type === 'Ace' ? 2.4 : (type === 'ZeroAce' ? 2.7 : (type === 'Zero' ? 2.3 : 1.8))))));

    this.velocity = new THREE.Vector3();
    this.target = null;
    this.state = 'PATROL'; // PATROL, PURSUE, ATTACK, EVADE, DIVING, CRASHING
    this.stateTimer = 0;

    this.fireCooldown = 0;
    this.fireInterval = (type === 'HostileAce') ? 0.08 : ((type === 'HostileJet') ? 0.10 : ((type === 'Ace' || type === 'ZeroAce') ? 0.12 : (type === 'Ju87' ? 0.25 : (type === 'Zero' ? 0.16 : 0.18))));
    this.burstTimer = 0;
    this.isShooting = false;

    this.isDead = false;
    this.crashRotVel = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(5);
  }

  takeDamage(amount, hitPos, particleSys, soundSys) {
    if (this.isDead) return false;
    this.health -= amount;

    if (hitPos) {
      particleSys.createHitSparks(hitPos);
    }
    soundSys.playHitSound();

    if (this.health <= 0) {
      this.die(particleSys, soundSys);
      return true; // Killed
    } else if (this.health < this.maxHealth * 0.45) {
      // Trigger heavy evasive maneuver when taking serious damage
      if (this.isEnemy && this.state !== 'EVADE') {
        this.state = 'EVADE';
        this.stateTimer = 3.5;
      }
    }
    return false;
  }

  die(particleSys, soundSys) {
    this.isDead = true;
    this.health = 0;
    this.state = 'CRASHING';

    // Massive explosion
    particleSys.createExplosion(this.mesh.position, this.type === 'Bomber' ? 2.2 : 1.2);
    soundSys.playExplosion(this.type === 'Bomber' || this.type === 'Ace' || this.type === 'ZeroAce' || this.type === 'HostileAce');
  }

  update(dt, player, bombers, particleSys, soundSys) {
    if (this.isDead) {
      // Death spiral downward into ground / water
      this.mesh.position.y -= 45.0 * dt;
      this.mesh.translateZ(this.speed * 0.6 * dt);
      this.mesh.rotation.x += this.crashRotVel.x * dt;
      this.mesh.rotation.y += this.crashRotVel.y * dt;
      this.mesh.rotation.z += this.crashRotVel.z * dt;

      // Trailing thick black fire/smoke (throttled for 60 FPS)
      if (Math.random() > 0.65) {
        particleSys.spawnEngineSmoke(this.mesh.position, 1.1, true);
      }

      if (this.mesh.position.y <= 2) {
        particleSys.createExplosion(this.mesh.position, 1.4, false);
        return false; // Remove entity
      }
      return true;
    }

    // Spin propeller
    if (this.mesh.userData.propeller) {
      this.mesh.userData.propeller.rotation.z += 40 * dt;
    }
    if (this.mesh.userData.propellers) {
      this.mesh.userData.propellers.forEach(p => p.rotation.z += 35 * dt);
    }

    // Damaged smoke trail
    if (this.health < this.maxHealth * 0.45 && Math.random() > 0.8) {
      particleSys.spawnEngineSmoke(this.mesh.position, 0.7, this.health < this.maxHealth * 0.2);
    }

    this.stateTimer -= dt;
    if (this.stateTimer <= 0) {
      this.decideNextState(player, bombers);
    }

    // Execute state behavior
    if (this.type === 'Bomber') {
      this.updateBomberBehavior(dt, player, particleSys, soundSys);
    } else {
      this.updateFighterBehavior(dt, player, particleSys, soundSys);
    }

    // Move forward along plane's local forward vector
    this.mesh.translateZ(this.speed * dt);

    // Keep above minimum altitude
    if (this.mesh.position.y < 80) {
      this.mesh.rotation.x -= 1.5 * dt;
    }

    return true;
  }

  decideNextState(player, bombers) {
    if (this.type === 'Bomber') {
      this.stateTimer = 5.0;
      return;
    }

    // Distance to player
    const distToPlayer = this.mesh.position.distanceTo(player.mesh.position);

    // Pick target: either player or one of the bombers
    if (bombers.length > 0 && Math.random() > 0.6 && this.type !== 'Ace') {
      const aliveBombers = bombers.filter(b => !b.isDead);
      if (aliveBombers.length > 0) {
        this.target = aliveBombers[Math.floor(Math.random() * aliveBombers.length)].mesh;
      } else {
        this.target = player.mesh;
      }
    } else {
      this.target = player.mesh;
    }

    if (distToPlayer < 450) {
      // Check if player is on enemy's tail
      const dirToPlayer = new THREE.Vector3().subVectors(player.mesh.position, this.mesh.position).normalize();
      const myForward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
      const angle = myForward.angleTo(dirToPlayer);

      if (angle > Math.PI * 0.6) {
        // Player is behind! Break turn / Evade!
        this.state = 'EVADE';
        this.stateTimer = 2.0 + Math.random() * 2.0;
      } else {
        this.state = 'ATTACK';
        this.stateTimer = 3.0 + Math.random() * 2.5;
      }
    } else {
      this.state = 'PURSUE';
      this.stateTimer = 4.0;
    }
  }

  updateFighterBehavior(dt, player, particleSys, soundSys) {
    if (!this.target) this.target = player.mesh;

    const targetPos = this.target.position.clone();
    const myPos = this.mesh.position;

    if (this.state === 'EVADE') {
      // Barrel roll and break turn
      this.mesh.rotation.z += 3.5 * dt;
      this.mesh.rotation.x += 1.2 * dt;
      this.speed = this.type === 'Ace' ? 100 : 90;
      return;
    }

    // Lead targeting calculation
    const dist = myPos.distanceTo(targetPos);
    const bulletSpeed = 260;
    const timeToHit = dist / bulletSpeed;
    const predictedPos = targetPos.clone();
    if (this.target.userData && this.target.userData.velocity) {
      predictedPos.addScaledVector(this.target.userData.velocity, timeToHit * 0.7);
    }

    // Steer towards target using smooth slerp
    const currentRot = this.mesh.quaternion.clone();
    this.mesh.lookAt(predictedPos);
    const desiredRot = this.mesh.quaternion.clone();
    this.mesh.quaternion.copy(currentRot);

    this.mesh.quaternion.slerp(desiredRot, this.turnSpeed * dt);

    // Roll into the turn for realistic flight visual
    const localDir = new THREE.Vector3().subVectors(predictedPos, myPos).applyQuaternion(this.mesh.quaternion.clone().invert());
    const rollAngle = -localDir.x * 0.005;
    this.mesh.rotation.z = THREE.MathUtils.lerp(this.mesh.rotation.z, rollAngle, 4.0 * dt);

    // Stuka dive siren
    if (this.type === 'Ju87') {
      const pitchAngle = this.mesh.rotation.x;
      if (pitchAngle > 0.3) {
        soundSys.playStukaSiren(Math.min(1.0, pitchAngle));
      } else {
        soundSys.stopStukaSiren();
      }
    }

    // Firing logic
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    const toTarget = new THREE.Vector3().subVectors(targetPos, myPos).normalize();
    const aimAngle = forward.angleTo(toTarget);

    if (dist < 420 && aimAngle < 0.22) {
      this.fireCooldown -= dt;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = this.fireInterval;
        this.fireGuns(particleSys, soundSys, forward);
      }
    }
  }

  updateBomberBehavior(dt, player, particleSys, soundSys) {
    // Bomber formation flies steady path towards mission objective
    this.mesh.position.z += this.speed * dt;

    // Turret self-defense against German planes
    // (Checked externally in Game loop)
  }

  fireGuns(particleSys, soundSys, forwardDir) {
    const muzzles = this.mesh.userData.gunMuzzles || [new THREE.Vector3(0, 0, 2)];
    muzzles.forEach(localMuzzle => {
      const muzzleWorld = localMuzzle.clone().applyMatrix4(this.mesh.matrixWorld);
      particleSys.spawnBullet(muzzleWorld, forwardDir, 280, false, this);
    });

    if (Math.random() > 0.6) {
      soundSys.playGunfire(this.type === 'Ace');
    }
  }
}

window.PlaneEntity = PlaneEntity;
