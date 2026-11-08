// Flight Controls: Smooth Euler YXZ Flight Model (Mouse Aim + Keyboard WASD/Arrows)

class FlightControls {
  constructor(domElement, playerPlane) {
    this.domElement = domElement;
    this.player = playerPlane;

    if (this.player && this.player.mesh) {
      this.player.mesh.rotation.order = 'YXZ';
    }

    this.keys = {};
    this.mouse = { x: 0, y: 0, down: false, active: false };
    this.isMouseAimActive = true;
    this.invertY = false;

    // Clean Euler angles (YXZ order: yaw around world Y, pitch around local X, roll around local Z)
    this.yaw = 0;
    this.pitch = 0;
    this.roll = 0;

    // Angular velocities for buttery-smooth damping
    this.pitchRateVel = 0;
    this.yawRateVel = 0;

    // Speed & Throttle
    this.throttle = 0.65; // 0 to 1
    this.isBoosting = false;
    this.currentSpeed = 75; // m/s
    this.baseSpeed = 75;
    this.maxSpeed = 130;
    this.minSpeed = 38;
    this.turnMultiplier = 1.0;

    this.cameraMode = 'chase'; // 'chase' or 'cockpit'

    this.initListeners();
  }

  initListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;

      // Toggle camera view (Chase <-> Cockpit)
      if (e.code === 'KeyC') {
        this.cameraMode = this.cameraMode === 'chase' ? 'cockpit' : 'chase';
        const overlay = document.getElementById('cockpit-overlay');
        if (overlay) {
          overlay.classList.toggle('active', this.cameraMode === 'cockpit');
        }
      }

      // Toggle Mouse Aim on/off with 'M'
      if (e.code === 'KeyM') {
        this.isMouseAimActive = !this.isMouseAimActive;
        this.mouse.x = 0;
        this.mouse.y = 0;
        this.updateMouseReticleUI();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseAimActive) return;

      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      // Normalize relative to a comfortable control radius around screen center
      const maxRadius = Math.min(halfW, halfH) * 0.65;
      const dx = (e.clientX - halfW) / maxRadius;
      const dy = (e.clientY - halfH) / maxRadius;

      // Clamp to unit circle
      const len = Math.hypot(dx, dy);
      if (len > 1.0) {
        this.mouse.x = dx / len;
        this.mouse.y = dy / len;
      } else {
        this.mouse.x = dx;
        this.mouse.y = dy;
      }
      this.mouse.active = true;
      this.updateMouseReticleUI();
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.down = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.down = false;
      }
    });
  }

  updateMouseReticleUI() {
    const cursorEl = document.getElementById('mouse-aim-cursor');
    if (!cursorEl) return;

    if (!this.isMouseAimActive || !this.mouse.active) {
      cursorEl.style.opacity = '0';
      return;
    }

    const halfW = window.innerWidth / 2;
    const halfH = window.innerHeight / 2;
    const maxRadius = Math.min(halfW, halfH) * 0.65;
    const screenX = halfW + this.mouse.x * maxRadius;
    const screenY = halfH + this.mouse.y * maxRadius;

    cursorEl.style.opacity = '1';
    cursorEl.style.left = screenX + 'px';
    cursorEl.style.top = screenY + 'px';
  }

  update(dt, isPlaying) {
    if (!isPlaying || !this.player || !this.player.mesh) return;

    // --- 1. THROTTLE & BOOST ---
    if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) {
      this.throttle = Math.min(1.0, this.throttle + 0.55 * dt);
      this.isBoosting = true;
    } else if (this.keys['ControlLeft'] || this.keys['ControlRight']) {
      this.throttle = Math.max(0.2, this.throttle - 0.55 * dt);
      this.isBoosting = false;
    } else {
      this.isBoosting = false;
    }

    const targetSpeed = this.minSpeed + this.throttle * (this.maxSpeed - this.minSpeed);
    this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, targetSpeed, 3.0 * dt);

    // --- 2. KEYBOARD & MOUSE INPUTS ---
    // Note on signs with model facing +Z and Euler order 'YXZ':
    // - yaw > 0 turns LEFT (+X), yaw < 0 turns RIGHT (-X)
    // - pitch < 0 climbs UP (+Y), pitch > 0 dives DOWN (-Y)
    // - roll > 0 banks RIGHT, roll < 0 banks LEFT

    let turnInput = 0;       // -1 = Left, +1 = Right
    let climbInput = 0;      // +1 = Climb Up, -1 = Dive Down
    let manualRollInput = 0; // -1 = Roll Left, +1 = Roll Right

    const kbTurnLeft = this.keys['KeyA'] || this.keys['ArrowLeft'];
    const kbTurnRight = this.keys['KeyD'] || this.keys['ArrowRight'];
    const kbClimb = this.keys['KeyW'] || this.keys['ArrowUp'];
    const kbDive = this.keys['KeyS'] || this.keys['ArrowDown'];
    const kbRollLeft = this.keys['KeyQ'];
    const kbRollRight = this.keys['KeyE'];

    const anyKeyboardSteering = kbTurnLeft || kbTurnRight || kbClimb || kbDive || kbRollLeft || kbRollRight;

    if (kbTurnLeft) turnInput -= 1.0;
    if (kbTurnRight) turnInput += 1.0;
    if (kbClimb) climbInput += 1.0;
    if (kbDive) climbInput -= 1.0;
    if (kbRollLeft) manualRollInput -= 1.0;
    if (kbRollRight) manualRollInput += 1.0;

    // If player uses keyboard flight keys, smoothly center the mouse virtual joystick so it never fights keyboard input
    if (anyKeyboardSteering) {
      this.mouse.x = THREE.MathUtils.lerp(this.mouse.x, 0, 8.0 * dt);
      this.mouse.y = THREE.MathUtils.lerp(this.mouse.y, 0, 8.0 * dt);
      this.updateMouseReticleUI();
    } else if (this.isMouseAimActive && this.mouse.active) {
      const deadzone = 0.06;
      const mx = Math.abs(this.mouse.x) > deadzone ? (this.mouse.x - Math.sign(this.mouse.x) * deadzone) / (1 - deadzone) : 0;
      const my = Math.abs(this.mouse.y) > deadzone ? (this.mouse.y - Math.sign(this.mouse.y) * deadzone) / (1 - deadzone) : 0;

      // Non-linear response curve for fine precision near center crosshair
      const curvedX = Math.sign(mx) * Math.pow(Math.abs(mx), 1.35);
      const curvedY = Math.sign(my) * Math.pow(Math.abs(my), 1.35);

      const pitchDir = this.invertY ? 1 : -1;
      turnInput += curvedX;
      climbInput += curvedY * pitchDir;
    }

    turnInput = THREE.MathUtils.clamp(turnInput, -1.2, 1.2);
    climbInput = THREE.MathUtils.clamp(climbInput, -1.2, 1.2);

    // --- 3. SMOOTH ANGULAR RATES & SELF-LEVELING BANK ---
    const maxYawRate = 1.35 * this.turnMultiplier;   // rad/s
    const maxPitchRate = 1.25 * this.turnMultiplier; // rad/s

    const targetYawRate = -turnInput * maxYawRate;      // Right (+turnInput) -> negative yaw
    const targetPitchRate = -climbInput * maxPitchRate; // Climb (+climbInput) -> negative pitch

    this.yawRateVel = THREE.MathUtils.lerp(this.yawRateVel, targetYawRate, 8.0 * dt);
    this.pitchRateVel = THREE.MathUtils.lerp(this.pitchRateVel, targetPitchRate, 8.0 * dt);

    this.yaw += this.yawRateVel * dt;
    this.pitch += this.pitchRateVel * dt;

    // Clamp pitch to prevent flipping upside-down (-72 deg to +72 deg)
    const maxPitchAngle = 1.25;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -maxPitchAngle, maxPitchAngle);

    // Coordinated bank angle (auto-rolls into turn up to ~48 degrees, plus manual Q/E roll)
    const maxBankAngle = 0.85;
    const desiredRoll = THREE.MathUtils.clamp(
      turnInput * maxBankAngle + manualRollInput * 0.65,
      -1.2,
      1.2
    );
    this.roll = THREE.MathUtils.lerp(this.roll, desiredRoll, 6.0 * dt);

    // Apply clean Euler rotation
    this.player.mesh.rotation.order = 'YXZ';
    this.player.mesh.rotation.set(this.pitch, this.yaw, this.roll);

    // --- 4. MOVE FORWARD ---
    this.player.mesh.translateZ(this.currentSpeed * dt);

    // Update world matrix immediately so camera & guns use exact current frame transform
    this.player.mesh.updateMatrixWorld(true);

    // Store world velocity vector for lead calculations
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.player.mesh.quaternion);
    this.player.mesh.userData.velocity = forward.multiplyScalar(this.currentSpeed);
  }

  isFiring() {
    return this.mouse.down || this.keys['Space'];
  }
}

window.FlightControls = FlightControls;
