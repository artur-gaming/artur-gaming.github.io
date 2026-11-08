/**
 * Główny kontroler gry edukacyjnej Delfia 24 OD
 * Obsługuje pętlę symulacji, wejście z klawiatury (1, 2, 3, W, S),
 * reguły czasu 60s, tolerancję 20% oraz edukacyjną ocenę wyników.
 */

class GameApp {
  constructor() {
    this.physics = new SailingPhysics();
    this.audio = new AudioManager();

    this.canvas = document.getElementById('sail-canvas');
    this.compassCanvas = document.getElementById('compass-canvas');
    this.renderer = new SailRenderer(this.canvas, this.compassCanvas, this.physics);

    // Stan gry
    this.gameState = 'START'; // 'START' | 'RUNNING' | 'WON' | 'LOST'
    this.activeStation = 2;   // Domyślnie stanowisko 2: Szot grota
    this.timeRemaining = 60.0;
    this.elapsedTime = 0.0;
    this.stableHoldTimer = 0.0;
    this.requiredHoldTime = 2.0; // Wymagany czas stabilnego trymu w strefie tolerancji

    // Klawisze wciśnięte
    this.keys = {
      w: false,
      s: false
    };

    // Elementy DOM
    this.dom = {
      trueWind: document.getElementById('hud-true-wind'),
      courseName: document.getElementById('hud-wind-course-name'),
      apparentWind: document.getElementById('hud-apparent-wind'),
      boatSpeed: document.getElementById('hud-boat-speed'),
      targetSpeed: document.getElementById('hud-target-speed'),
      timer: document.getElementById('hud-timer'),
      timerBar: document.getElementById('timer-bar'),
      timerBox: document.getElementById('timer-box'),

      effFill: document.getElementById('trim-efficiency-fill'),
      effVal: document.getElementById('trim-efficiency-val'),
      effStatus: document.getElementById('trim-status-desc'),

      ttJibDot: document.getElementById('tt-jib-dot'),
      ttJibMsg: document.getElementById('tt-jib-msg'),
      ttMainDot: document.getElementById('tt-main-dot'),
      ttMainMsg: document.getElementById('tt-main-msg'),

      stationCards: [
        null,
        document.getElementById('station-1'),
        document.getElementById('station-2'),
        document.getElementById('station-3')
      ],
      pointers: [
        null,
        document.getElementById('pointer-1'),
        document.getElementById('pointer-2'),
        document.getElementById('pointer-3')
      ],
      zones: [
        null,
        document.getElementById('zone-1'),
        document.getElementById('zone-2'),
        document.getElementById('zone-3')
      ],
      readouts: [
        null,
        document.getElementById('readout-1'),
        document.getElementById('readout-2'),
        document.getElementById('readout-3')
      ],
      hints: [
        null,
        document.getElementById('hint-1'),
        document.getElementById('hint-2'),
        document.getElementById('hint-3')
      ],

      btnEase: document.getElementById('btn-ease'),
      btnTrim: document.getElementById('btn-trim'),

      overlay: document.getElementById('overlay-screen'),
      modalTitle: document.getElementById('modal-title'),
      modalContent: document.getElementById('modal-content'),
      btnStart: document.getElementById('btn-start'),
      btnSound: document.getElementById('btn-sound-toggle')
    };

    this.initEvents();
    this.updateHUDStatic();
  }

  initEvents() {
    // Obsługa klawiatury
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));

    // Kliknięcia w stanowiska 1, 2, 3
    for (let i = 1; i <= 3; i++) {
      this.dom.stationCards[i].addEventListener('click', () => {
        this.selectStation(i);
      });
    }

    // Przyciski akcji W i S w dolnym pasku
    const startEase = (e) => { e.preventDefault(); this.keys.w = true; this.dom.btnEase.classList.add('pressed'); };
    const endEase = (e) => { e.preventDefault(); this.keys.w = false; this.dom.btnEase.classList.remove('pressed'); };
    const startTrim = (e) => { e.preventDefault(); this.keys.s = true; this.dom.btnTrim.classList.add('pressed'); };
    const endTrim = (e) => { e.preventDefault(); this.keys.s = false; this.dom.btnTrim.classList.remove('pressed'); };

    this.dom.btnEase.addEventListener('mousedown', startEase);
    this.dom.btnEase.addEventListener('mouseup', endEase);
    this.dom.btnEase.addEventListener('mouseleave', endEase);
    this.dom.btnEase.addEventListener('touchstart', startEase);
    this.dom.btnEase.addEventListener('touchend', endEase);

    this.dom.btnTrim.addEventListener('mousedown', startTrim);
    this.dom.btnTrim.addEventListener('mouseup', endTrim);
    this.dom.btnTrim.addEventListener('mouseleave', endTrim);
    this.dom.btnTrim.addEventListener('touchstart', startTrim);
    this.dom.btnTrim.addEventListener('touchend', endTrim);

    // Przycisk Start / Nowa Runda
    this.dom.btnStart.addEventListener('click', () => {
      this.audio.init();
      this.startRound();
    });

    // Przycisk dźwięku
    this.dom.btnSound.addEventListener('click', () => {
      this.audio.init();
      const unmuted = this.audio.toggleMute();
      this.dom.btnSound.textContent = unmuted ? 'DŹWIĘK: WŁĄCZONY 🔊' : 'DŹWIĘK: WYCISZONY 🔇';
    });
  }

  onKeyDown(e) {
    // Spacja odpala nową grę gdy modal jest aktywny
    if (e.code === 'Space' && this.gameState !== 'RUNNING') {
      e.preventDefault();
      this.audio.init();
      this.startRound();
      return;
    }

    // Wybór stanowisk klawiszami 1, 2, 3
    if (e.key === '1') {
      this.selectStation(1);
    } else if (e.key === '2') {
      this.selectStation(2);
    } else if (e.key === '3') {
      this.selectStation(3);
    }

    // Trym klawiszami W (luzuj) i S (wybieraj)
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      this.keys.w = true;
      this.dom.btnEase.classList.add('pressed');
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      this.keys.s = true;
      this.dom.btnTrim.classList.add('pressed');
    }
  }

  onKeyUp(e) {
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      this.keys.w = false;
      this.dom.btnEase.classList.remove('pressed');
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      this.keys.s = false;
      this.dom.btnTrim.classList.remove('pressed');
    }
  }

  selectStation(idx) {
    this.activeStation = idx;
    for (let i = 1; i <= 3; i++) {
      if (i === idx) {
        this.dom.stationCards[i].classList.add('active');
      } else {
        this.dom.stationCards[i].classList.remove('active');
      }
    }
  }

  startRound() {
    this.physics.resetScenario();
    this.timeRemaining = 60.0;
    this.elapsedTime = 0.0;
    this.stableHoldTimer = 0.0;
    this.gameState = 'RUNNING';

    this.dom.overlay.classList.add('hidden');
    this.updateHUDStatic();
  }

  // Uruchomienie głównej pętli gry
  run() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000.0);
      lastTime = currentTime;

      this.update(dt);
      this.renderer.render(this.activeStation);

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }

  update(dt) {
    if (this.gameState === 'RUNNING') {
      // 1. Zmiana wybranego stanowiska
      if (this.keys.w) {
        // Klawisz W: puszczanie żagla (luzowanie)
        this.physics.adjustStation(this.activeStation, -1, dt);
        this.audio.playEaseSound();
      }
      if (this.keys.s) {
        // Klawisz S: ciągnięcie żagla (wybieranie)
        this.physics.adjustStation(this.activeStation, 1, dt);
        this.audio.playWinchClick();
      }

      // 2. Aktualizacja fizyki
      this.physics.update(dt);

      // 3. Sprawdzanie zegara 60 sekund
      this.timeRemaining -= dt;
      this.elapsedTime += dt;

      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        this.handleFailure();
      }

      // 4. Sprawdzanie czy żagle są w tolerancji 20%
      const allOptimal = this.physics.areAllOptimal();
      if (allOptimal) {
        this.stableHoldTimer += dt;
        if (this.stableHoldTimer >= this.requiredHoldTime) {
          this.handleSuccess();
        }
      } else {
        this.stableHoldTimer = Math.max(0, this.stableHoldTimer - dt * 1.5);
      }

      // 5. Aktualizacja audio
      this.audio.update(this.physics.boatSpeed, this.physics.apparentWindSpeed, this.physics.luffingAmount);
    }

    // Aktualizacja wskaźników UI
    this.updateHUDDynamic();
  }

  // Sukces gracza: żagle ustawione w tolerancji 20%
  handleSuccess() {
    this.gameState = 'WON';
    this.audio.playSuccess();

    let rankClass = 'rank-master';
    let rankTitle = 'MISTRZ TRYMU DELFIA 24 OD 🏆';
    let rankComment = 'Perfekcyjne wyczucie aerodynamiki! Żagle pracują w pełnym przepływie laminarnym.';

    if (this.elapsedTime > 35) {
      rankClass = 'rank-good';
      rankTitle = 'SPRAWNY TRYMER REGATOWY 🥈';
      rankComment = 'Dobre opanowanie łodzi, choć w ferworze regat każda sekunda jest na wagę złota.';
    } else if (this.elapsedTime > 20) {
      rankClass = 'rank-master';
      rankTitle = 'DOŚWIADCZONY SKIPPER 🥇';
      rankComment = 'Świetny czas reakcji! Jacht od razu wszedł na maksymalną prędkość biegu.';
    }

    const modalHTML = `
      <div class="rank-badge ${rankClass}">${rankTitle}</div>
      <p style="text-align: center; margin-bottom: 12px;">${rankComment}</p>

      <div class="result-stats-box">
        <div class="stat-item">
          <div class="stat-label">CZAS USTAWIANIA</div>
          <div class="stat-value">${this.elapsedTime.toFixed(1)} s</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">OSIĄGNIĘTA PRĘDKOŚĆ</div>
          <div class="stat-value">${this.physics.boatSpeed.toFixed(1)} kn</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">KURS WZGLĘDEM WIATRU</div>
          <div class="stat-value">${this.physics.courseName.split(' ')[0]}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">SPRAWNOŚĆ OŻAGLOWANIA</div>
          <div class="stat-value">${Math.round(this.physics.totalEfficiency * 100)}%</div>
        </div>
      </div>

      <div style="font-size: 0.85rem; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; line-height: 1.5;">
        <strong>Wyjaśnienie żeglarskie:</strong><br>
        Dla kursu <em>${this.physics.courseName}</em> przy wietrze rzeczywistym <strong>${this.physics.tws.toFixed(1)} kn</strong> (kąt TWA ${Math.round(this.physics.twa)}°),
        wiatr pozorny (AWS) wynosił <strong>${this.physics.apparentWindSpeed.toFixed(1)} kn</strong> pod kątem AWA ${Math.round(this.physics.apparentWindAngle)}°.
        Prawidłowo zrównoważyłeś siłę ciągu grota i foka, zachowując wymagany skręt żagla (twist).
      </div>
    `;

    this.dom.modalTitle.textContent = 'ZADANIE WYKONANE!';
    this.dom.modalTitle.style.color = 'var(--accent-green)';
    this.dom.modalContent.innerHTML = modalHTML;
    this.dom.btnStart.textContent = 'KOLEJNY WIATR (SPACJA)';
    this.dom.overlay.classList.remove('hidden');
  }

  // Porażka: upłynęła 1 minuta
  handleFailure() {
    this.gameState = 'LOST';
    this.audio.playFailure();

    const modalHTML = `
      <div class="rank-badge rank-fail">CZAS MINĄŁ (POWYŻEJ 60s) ❌</div>
      <p style="text-align: center; color: #f87171;">Nie udało się ustawić żagli w optymalnym zakresie w czasie 1 minuty.</p>

      <div class="result-stats-box">
        <div class="stat-item">
          <div class="stat-label">STAN FOKA</div>
          <div class="stat-value" style="color: ${this.physics.isStationOptimal(1) ? '#22c55e' : '#ef4444'}">
            ${Math.round(this.physics.jibTrim)}% (cel: ${Math.round(this.physics.optimalJib)}%)
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">STAN GROTA</div>
          <div class="stat-value" style="color: ${this.physics.isStationOptimal(2) ? '#22c55e' : '#ef4444'}">
            ${Math.round(this.physics.mainTrim)}% (cel: ${Math.round(this.physics.optimalMain)}%)
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">STAN OBCIĄGACZA</div>
          <div class="stat-value" style="color: ${this.physics.isStationOptimal(3) ? '#22c55e' : '#ef4444'}">
            ${Math.round(this.physics.vangTrim)}% (cel: ${Math.round(this.physics.optimalVang)}%)
          </div>
        </div>
        <div class="stat-item">
          <div class="stat-label">SPRAWNOŚĆ KOŃCOWA</div>
          <div class="stat-value">${Math.round(this.physics.totalEfficiency * 100)}%</div>
        </div>
      </div>

      <div style="font-size: 0.85rem; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; line-height: 1.5;">
        <strong>Wskazówka edukacyjna:</strong><br>
        Obserwuj zielone strefy na paskach poszczególnych stanowisk! Gdy wiatr wieje z przodu (kursy ostre), żagle wybieraj mocno (klawisz <strong>S</strong>).
        Gdy wiatr wieje z tyłu lub boku (półwiatr, baksztag, fordepech), puszczaj żagle szerzej (klawisz <strong>W</strong>).
      </div>
    `;

    this.dom.modalTitle.textContent = 'PRZEGRANA!';
    this.dom.modalTitle.style.color = 'var(--accent-red)';
    this.dom.modalContent.innerHTML = modalHTML;
    this.dom.btnStart.textContent = 'SPRÓBUJ PONOWNIE (SPACJA)';
    this.dom.overlay.classList.remove('hidden');
  }

  // Aktualizacja statycznych informacji na HUD (przy resecie scenariusza)
  updateHUDStatic() {
    this.dom.trueWind.textContent = `${this.physics.tws.toFixed(1)} kn | ${Math.round(this.physics.twa)}°`;
    this.dom.courseName.textContent = `Kurs: ${this.physics.courseName}`;

    // Ustawienie zielonych stref optymalnych na paskach (±20% tolerancji)
    const setZone = (zoneEl, optVal) => {
      const minP = Math.max(0, optVal - this.physics.tolerance);
      const maxP = Math.min(100, optVal + this.physics.tolerance);
      zoneEl.style.left = `${minP}%`;
      zoneEl.style.width = `${maxP - minP}%`;
    };

    setZone(this.dom.zones[1], this.physics.optimalJib);
    setZone(this.dom.zones[2], this.physics.optimalMain);
    setZone(this.dom.zones[3], this.physics.optimalVang);

    this.dom.hints[1].textContent = `Optimum: ~${Math.round(this.physics.optimalJib)}% (±20%)`;
    this.dom.hints[2].textContent = `Optimum: ~${Math.round(this.physics.optimalMain)}% (±20%)`;
    this.dom.hints[3].textContent = `Optimum: ~${Math.round(this.physics.optimalVang)}% (±20%)`;
  }

  // Dynamiczne odświeżanie wskaźników co klatkę
  updateHUDDynamic() {
    // 1. Wiatr pozorny i prędkość łodzi
    this.dom.apparentWind.textContent = `${this.physics.apparentWindSpeed.toFixed(1)} kn | ${Math.round(this.physics.apparentWindAngle)}°`;
    this.dom.boatSpeed.textContent = `${this.physics.boatSpeed.toFixed(1)} kn`;
    this.dom.targetSpeed.textContent = `Optimum: ${this.physics.targetSpeed.toFixed(1)} kn`;

    // 2. Timer 60 sekund
    this.dom.timer.textContent = `${this.timeRemaining.toFixed(1)}s`;
    const timeFrac = Math.max(0, this.timeRemaining / 60.0);
    this.dom.timerBar.style.width = `${timeFrac * 100}%`;

    if (this.timeRemaining < 15) {
      this.dom.timer.style.color = '#ef4444';
      this.dom.timerBar.style.background = '#ef4444';
    } else {
      this.dom.timer.style.color = 'var(--accent-amber)';
      this.dom.timerBar.style.background = 'linear-gradient(90deg, var(--accent-green), var(--accent-amber))';
    }

    // 3. Wskaźnik sprawności
    const effPercent = Math.round(this.physics.totalEfficiency * 100);
    this.dom.effFill.style.width = `${effPercent}%`;
    this.dom.effVal.textContent = `${effPercent}%`;

    if (this.physics.areAllOptimal()) {
      if (this.stableHoldTimer > 0) {
        this.dom.effStatus.innerHTML = `<span style="color: #22c55e;">Utrzymaj trym: ${(this.requiredHoldTime - this.stableHoldTimer).toFixed(1)}s!</span>`;
      } else {
        this.dom.effStatus.innerHTML = `<span style="color: #22c55e;">Żagle w strefie optymalnej!</span>`;
      }
    } else {
      this.dom.effStatus.textContent = 'Dostrajaj żagle klawiszami W i S...';
    }

    // 4. Paski stanowisk 1, 2, 3
    const updateStationUI = (idx, currentVal, isOpt) => {
      this.dom.pointers[idx].style.left = `${currentVal}%`;
      const actionName = currentVal < 20 ? 'Wybrany mocno' : (currentVal > 75 ? 'Poluzowany szeroko' : 'Wybrany średnio');
      this.dom.readouts[idx].textContent = `Luz: ${Math.round(currentVal)}% (${actionName})`;

      if (isOpt) {
        this.dom.stationCards[idx].classList.add('optimal');
      } else {
        this.dom.stationCards[idx].classList.remove('optimal');
      }
    };

    updateStationUI(1, this.physics.jibTrim, this.physics.isStationOptimal(1));
    updateStationUI(2, this.physics.mainTrim, this.physics.isStationOptimal(2));
    updateStationUI(3, this.physics.vangTrim, this.physics.isStationOptimal(3));

    // 5. Ickery (Tell-tales) komunikat
    const updateTTUI = (dotEl, msgEl, name, state) => {
      dotEl.className = 'tt-dot';
      if (state === 'optimal') {
        dotEl.classList.add('good');
        msgEl.textContent = `${name}: Idealny przepływ laminarny`;
      } else if (state === 'luffing') {
        dotEl.classList.add('bad');
        msgEl.textContent = `${name}: Za mocno poluzowany (łopoce!) -> CIĄGNIJ [S]`;
      } else {
        dotEl.classList.add('warn');
        msgEl.textContent = `${name}: Za mocno wybrany (przyduszony) -> PUŚĆ [W]`;
      }
    };

    updateTTUI(this.dom.ttJibDot, this.dom.ttJibMsg, 'Fok', this.physics.jibTellTaleState);
    updateTTUI(this.dom.ttMainDot, this.dom.ttMainMsg, 'Grot', this.physics.mainTellTaleState);
  }
}

// Uruchomienie aplikacji po załadowaniu DOM
window.addEventListener('DOMContentLoaded', () => {
  const app = new GameApp();
  app.run();
});
