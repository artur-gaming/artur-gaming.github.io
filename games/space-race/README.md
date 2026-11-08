# SPACE RACE: Orbital Defense (Sega 1981 Arcade Style)

An authentic retro Sega arcade space shooter inspired by *Space Invaders*, *Galaga*, and *Space Harrier*. Defend Earth orbit piloting the historical **NASA Space Shuttle Orbiter Atlantis** against an invasion of modern **SpaceX Starships** and **Falcon Heavy** rocket clusters launching swarms of **Starlink satellites**!

---

## 🎮 Play Immediately
Open `index.html` in any modern web browser (Chrome, Safari, Edge, Firefox). No build tools, internet connection, or external dependencies required!

```bash
open index.html # On macOS
```

---

## 🕹️ Controls
| Action | Keyboard | Touch / Mobile |
| :--- | :--- | :--- |
| **Move Left** | `←` or `A` | `◀` On-screen button |
| **Move Right** | `→` or `D` | `▶` On-screen button |
| **Fire Plasma** | `SPACEBAR` or `W` / `↑` | `FIRE` Button |
| **Start / 1UP** | `ENTER` or `SPACEBAR` | `1UP` Button |
| **Toggle Sound** | `M` | `SOUND` Header button |
| **Toggle CRT** | Click Header Button | `CRT ON/OFF` Header button |

---

## 🚀 Key Gameplay Features

### 1. Player: NASA Space Shuttle Orbiter
- Handcrafted vector/pixel sprite featuring authentic delta wings, black thermal protection heat shield underside, cockpit glass, RCS steering puffs, and glowing SSME/OMS engine plumes.
- Starts with **3 Shuttles** (lives).
- Starts with **Single Center Plasma Cannon**.

### 2. Weapon Upgrades
Periodic **P-Capsules** dropped by defeated invaders or orbital supply pods upgrade your weapon arsenal:
- **Level 1**: *Single Plasma Cannon* (rapid single center beam)
- **Level 2**: *Dual Plasma Cannons* (twin heavy wing-mounted plasma bolts)
- **Level 3**: *Triple Spread Cannon* (forward + dual 15° angled plasma bursts)
- **Level 4**: *Burst Hyper Cannon* (quad alternating hyper-velocity plasma barrage)

### 3. Damage & Starlink Threat
- **Each contact with a Starlink satellite strips exactly 1/3 of your Shuttle's hull integrity!**
- 3/3 = 100% (Pristine Deflector Shield - Green)
- 2/3 = 66% (Heat Shield Tile Damage - Yellow)
- 1/3 = 33% (Critical Hull Breach Warning - Flashing Red + Klaxon)
- 0/3 = Shuttle destroyed, life lost!

### 4. Orbital Service Station (Docking Repairs)
- Periodically, an **Orbital Service Station** (inspired by Mir, Freedom, and Skylab) cruises across low Earth orbit with rotating solar arrays and a flashing green tractor beam corridor.
- Fly your Space Shuttle directly underneath the station into the green docking beam to initiate automated emergency repairs (+1/3 or full hull restoration + 500 bonus points!).

### 5. Multi-Angle Orbital Earth Globe
The curved Earth globe features prominently in the background beneath your orbital dogfight, complete with atmospheric Rayleigh scattering, orbital day/night terminator shading, and drifting storm fronts. Each stage showcases Earth from a distinct orbital perspective:
- **Stage 1**: *Cape Canaveral / The Americas & Caribbean* (vibrant blue waters, Florida coastline, Amazon basin)
- **Stage 2**: *Mediterranean & Sahara Desert* (golden African dunes, European landmass, Nile delta)
- **Stage 3**: *Pacific Ring & East Asia* (vast deep ocean, Japanese archipelago, cyclonic typhoons)
- **Stage 4**: *Night Side & Aurora Borealis* (indigo ocean shadow, glowing city light grids of major megalopolises, dancing green/violet auroral curtains)
- **Stage 5**: *Orbital Dawn & Australia Outback* (red desert outback, solar dawn horizon lens flare)

### 6. Sega Arcade Audio & CRT Engine
- Zero-asset Web Audio API FM/PSG sound generator: 16th-note synth basslines, drum machine noise rhythms, pitch-shifted laser pulses, and rumbling sub-bass explosions.
- Robotic voice synthesizer for mission briefings and alerts.
- Toggleable scanline filter with authentic monitor curvature and phosphorus bloom.
