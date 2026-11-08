// Game database with control schemes & metadata
const gamesData = {
  dywizjon303: {
    title: "DYWIZJON 303: Bitwa o Anglię 3D",
    desc: "Zasiądź za sterami legendarnego myśliwca RAF w obronie Wielkiej Brytanii. Dynamiczna walka kołowa, naloty bombowców i pełne wsparcie 3D WebGL.",
    controls: [
      { action: "Sterowanie / Zwrot", key: "W / S / A / D lub Strzałki" },
      { action: "Ogień z karabinów maszynowych", key: "Spacja / LPM" },
      { action: "Dopalacz / Przyspieszenie", key: "Shift" },
      { action: "Zmiana kamery (kokpit / z zewnątrz)", key: "C" },
      { action: "Restart / Pauza", key: "R / ESC" }
    ],
    features: "Silnik Three.js, system cząsteczek dymu i eksplozji, dynamiczne AI wrogów."
  },
  hercules: {
    title: "C-130 Hercules - Operacja Powietrznodesantowa",
    desc: "Zarządzaj potężnym wojskowym samolotem transportowym C-130 Hercules. Wykonuj precyzyjne podejścia do lądowania i zrzucaj desant ładunków w rejonie operacyjnym.",
    controls: [
      { action: "Wysokość i przechył", key: "W / S / A / D lub Strzałki" },
      { action: "Moc silników (przepustnica)", key: "Q / E" },
      { action: "Zrzut ładunku / desantu", key: "Spacja" },
      { action: "Kamera i widok", key: "V" }
    ],
    features: "Fizyka lotu, trójwymiarowy model terenu i samolotu, wskaźniki awioniki."
  },
  "morski-kurier": {
    title: "Morski Kurier - Gra Handlowa",
    desc: "Wciel się w rolę kapitana statku kupieckiego. Podróżuj między wyspami, kupuj towary w okazyjnych cenach, sprzedawaj w odległych portach i rozwijaj flotę.",
    controls: [
      { action: "Nawigacja statkiem", key: "Klawisze Strzałek / W A S D" },
      { action: "Interakcja z portem", key: "Zbliż się do doku" },
      { action: "Handel i rynek", key: "Kliknięcie w menu portu" },
      { action: "Dźwięk i muzyka", key: "Ikona głośnika na ekranie" }
    ],
    features: "Symulacja dynamicznej gospodarki portowej, zmienna pogoda, system ulepszeń statku."
  },
  delfia24: {
    title: "Symulator Żeglarski Delfia 24 OD",
    desc: "Autentyczny symulator trymowania żagli jachtu regatowego Delfia 24 One Design. Testuj reakcję kadłuba na kąt natarcia wiatru i precyzyjny dobór szotów.",
    controls: [
      { action: "Ster / Rumpel", key: "A / D lub Strzałki Lewo/Prawo" },
      { action: "Wybieranie / Luzowanie Szotów", key: "W / S lub Suwaki na ekranie" },
      { action: "Tryb wiatru", key: "Menu ustawień wiatru" },
      { action: "Telemetria i wykres biegunowy", key: "Prawy panel HUD" }
    ],
    features: "Dokładny model hydrodynamiczny i aerodynamiczny, wskaźniki wiatru pozornego i rzeczywistego."
  },
  kotek: {
    title: "Kotek na Ulicy - Gra Zręcznościowa",
    desc: "Pomóż zręcznemu kotkowi bezpiecznie przejść przez niebezpieczną, ruchliwą ulicę. Zbieraj smakołyki, rybki i unikaj pędzących samochodów!",
    controls: [
      { action: "Ruch kotka (góra, dół, lewo, prawo)", key: "Strzałki / W S A D" },
      { action: "Sterowanie dotykowe na telefonie", key: "Przeciągnięcie palcem (Swipe)" },
      { action: "Nowa gra", key: "Spacja / Przycisk na ekranie" }
    ],
    features: "Płynna animacja Canvas 2D, rosnący poziom trudności, system najlepszych wyników."
  }
};

// Filter & Search Logic
document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const gameCards = document.querySelectorAll('.game-card');
  const searchInput = document.getElementById('search-games');
  const modalOverlay = document.getElementById('info-modal');
  const modalClose = document.getElementById('modal-close-btn');
  const infoButtons = document.querySelectorAll('.btn-info');

  let currentCategory = 'all';

  function filterGames() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    gameCards.forEach(card => {
      const category = card.getAttribute('data-category') || '';
      const title = (card.querySelector('.card-title')?.textContent || '').toLowerCase();
      const desc = (card.querySelector('.card-description')?.textContent || '').toLowerCase();
      const tags = (card.querySelector('.card-tags')?.textContent || '').toLowerCase();

      const matchesCat = currentCategory === 'all' || category.includes(currentCategory);
      const matchesSearch = !query || title.includes(query) || desc.includes(query) || tags.includes(query);

      if (matchesCat && matchesSearch) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter') || 'all';
      filterGames();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterGames);
  }

  // Modal Handling
  infoButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const gameKey = btn.getAttribute('data-game');
      const game = gamesData[gameKey];
      if (!game) return;

      document.getElementById('modal-title').textContent = game.title;
      document.getElementById('modal-desc').textContent = game.desc;
      
      const controlsList = document.getElementById('modal-controls');
      controlsList.innerHTML = '';
      game.controls.forEach(c => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${c.action}</span><kbd>${c.key}</kbd>`;
        controlsList.appendChild(li);
      });

      document.getElementById('modal-features').textContent = game.features;
      document.getElementById('modal-play-btn').href = `games/${gameKey}/index.html`;

      modalOverlay.classList.add('active');
    });
  });

  if (modalClose) {
    modalClose.addEventListener('click', () => {
      modalOverlay.classList.remove('active');
    });
  }

  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      modalOverlay.classList.remove('active');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay?.classList.contains('active')) {
      modalOverlay.classList.remove('active');
    }
  });
});
