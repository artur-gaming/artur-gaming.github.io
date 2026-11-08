# C-130 Hercules - Operacja Powietrznodesantowa 🪂✈️

Wciągająca gra lotnicza 3D w przeglądarce, w której pilotujesz 4-silnikowego wojskowego **Lockheeda C-130 Hercules** i dokonujesz zrzutu spadochroniarzy w oznaczonych strefach lądowania (**Drop Zones**).

---

## 🎮 Jak uruchomić grę?

Możesz uruchomić grę na dwa proste sposoby:
1. **Dwuklik w plik `index.html`** – gra uruchomi się od razu w Twojej przeglądarce (Safari, Chrome, Firefox itp.).
2. **Dwuklik w plik `graj.command`** (lub `./graj.command` w terminalu) – uruchomi lekki lokalny serwer i otworzy grę pod adresem `http://localhost:8080`.

---

## 🕹️ Sterowanie

| Klawisz | Akcja |
| :--- | :--- |
| **`F`** | **ZRZUT SPADOCHRONIARZA** (Wciśnij raz dla pojedynczego skoczka lub przytrzymaj dla serii zrzutów) |
| **`W`** / **`S`** (lub **`▲`** / **`▼`**) | Ster wysokości (Pochylenie nosa w dół / wznoszenie) |
| **`A`** / **`D`** (lub **`◄`** / **`►`**) | Lotki (Przechył skrzydeł w lewo / prawo i zakręt w wybranym kierunku) |
| **`Q`** / **`E`** | Ster kierunku (Obrót wokół osi pionowej samolotu) |
| **`Shift`** / **`Ctrl`** | Zwiększenie / Zmniejszenie ciągu 4 silników turbowałowych |
| **`B`** | **Powrót do bazy lotniczej / odnowienie paliwa i desantu** |
| **`C`** | Zmiana kamery (**Pościgowa z zewnątrz** / **Kamera rampy ładunkowej** / **Kokpit**) |
| **`R`** | Szybkie uzupełnienie ładowni skoczkami |
| **`M`** | Wyciszenie / Włączenie dźwięku |

---

## 🎯 Nowe mechaniki

1. **Poprawione skręty i naturalna aerodynamika**:
   - Przechył skrzydeł (lotki **`A`** / **`D`**) w pełni odpowiada kierunkowi lotu – przechylenie w lewo skręca w lewo, przechylenie w prawo skręca w prawo z realistycznym sprzężeniem hydrodynamicznym.
2. **Możliwość rozbicia samolotu (katastrofa)**:
   - Lot zbyt blisko ziemi, uderzenie w zbocza górskie lub przeciągnięcie kończy się widowiskową eksplozją i ekranem katastrofy z możliwością natychmiastowego odrodzenia.
3. **Baza lotnicza, lądowanie i tankowanie**:
   - Pas startowy z wieżą kontroli lotów i hangarem znajduje się na południu mapy (oznaczony niebieskim znacznikiem **BAZA** na radarze).
   - Możesz wylądować na pasie lub wcisnąć klawisz **`B`**, aby bezpiecznie wrócić do bazy, gdzie automatycznie uzupełniane jest **paliwo (100%)** oraz ładunek **40 spadochroniarzy**.

---

## 🎯 Mechanika rozgrywki i celowanie

1. **Oznakowane strefy zrzutu (DZ - Drop Zones)**:
   - Każda strefa jest oznaczona **kolumną dymu sygnałowego**, radiolatarnią oraz **koncentrycznymi pierścieniami**:
     - 🎯 **Środek (Bullseye)**: 100 punktów
     - 🔵 **Strefa wewnętrzna**: 50 punktów
     - 🟡 **Obrzeże strefy**: 25 punktów
2. **Komputer zrzutu & Dynamiczny celownik na ziemi**:
   - Obracający się znacznik na powierzchni ziemi oblicza w czasie rzeczywistym punkt lądowania skoczka z uwzględnieniem:
     - Aktualnej wysokości lotu samolotu,
     - Prędkości postępowej samolotu,
     - Czasu opadania na czaszy,
     - **Siły i kierunku wiatru (Wind Drift)**.
   - Gdy znacznik nakłada się na strefę zrzutu, na HUD zapala się **ZIELONE ŚWIATŁO** – to idealny moment na wciśnięcie klawisza **`F`**!
3. **Fizyka desantu**:
   - Skoczkowie opuszczają tylną rampę transportową z pędem samolotu, po czym następuje otwarcie spadochronów (efekt dźwiękowy otwarcia czaszy), a wiatr znosi ich w stronę lądowiska.
4. **Syntetyzowane efekty audio**:
   - Dźwięk 4 potężnych silników turbowałowych Allison T-56 reagujący na przepustnicę.
   - Dźwiękowy sygnał alarmowy zrzutu (buzzer/klakson desantu).
   - Dźwięki otwarcia spadochronu i potwierdzenia trafienia w strefę.
