# 🌟 Veloura

Veloura is a premium, high-fidelity local music synthesizer and audio playback experience designed with elegance and extreme visual polish. Encased in a simulated native Android frame, it delivers a deeply immersive, sensory-rich acoustic journey for digital audiophiles.

Veloura is handcrafted and developed by **Aakrit Mandal**.

---

## 🎨 Design Concept: "Visual Rhythm"
Veloura leverages **Adaptive Artwork Theming**, where the user interface dynamically extracts acoustic palettes from each song's artwork. This results in a gorgeous, shifting color scheme—ranging from deep, warm sunset purples of **Veloura Dusk** to the energetic neon greens of **Bio Synth**—complete with ambient background glow and responsive track highlights.

---

## 🚀 Key Features

### 🎚️ 1. Professional 5-Band Parametric Equalizer
Tailor your sonic landscape with a hardware-modeled 5-band Equalizer interface. Open it from the settings shade or directly from the player view:
- **7 Expert Sound Profiles:** Flat, Bass Boost, Acoustic, Vocal, Electronic, Classical, and Lofi.
- **Parametric Sliders:** Manually fine-tune the decibel gains across 5 critical frequency bands:
  - **Bass (60 Hz)** — Sub-bass punch and depth.
  - **Mid-Bass (230 Hz)** — Body, warmth, and resonance.
  - **Mids (910 Hz)** — Vocal clarity and instrument presence.
  - **Presence (4 kHz)** — Attack, crispness, and definition.
  - **Treble (14 kHz)** — Air, brilliance, and high-frequency sparkle.
- **Dynamic Bezier Spline Visualization:** A real-time vector path maps your filter curves dynamically.
- **Master Bypass Switch:** Instantly compare your enhanced audio profile with standard flat output (A/B testing).

### 🌌 2. Adaptive Artwork Themes
Every single song in your library gets its own customized color personality mapped from its dynamic vector thumbnail art. The background, text highlights, playing status badges, and active control rings morph to match the vibe of the currently loaded track.

### 🎛️ 3. Hybrid Web Audio Synthesizer
Beneath the surface, Veloura utilizes custom Web Audio API architectures. Instead of relying purely on heavy static audio files, a dynamic synthesizer sequences real-time chord progressions, MIDI tracks, and instrument voices directly inside the browser using clean synth nodes.

### 📁 4. Comprehensive Music Library Hub
Explore, sort, and search your music files seamlessly:
- **Rich Categories:** Quickly browse by *Songs*, *Albums*, *Artists*, *Playlists*, *Favorites*, and *Folders*.
- **Curated Playlists:** Create new playlists, add or remove tracks, and reorder titles on-the-fly.
- **Persistent Favorites:** Heart your loved tracks to keep them saved securely.
- **Smart Analytics:** Dedicated views showing your *Most Played* tracks and *Recently Played* sessions.
- **Local Scanner:** Scan storage directories to automatically fetch, index, and load local media with metadata.

---

## 🛠️ How It Works (Acoustic Engineering)

1. **Audio Node Routing Architecture:**
   ```
   [Synth Sequencer / Audio Source] ──> [Master Gain] ──> [60Hz Low-Shelf Filter] ──> [230Hz Peaking Filter] ──> [910Hz Peaking Filter] ──> [4kHz Peaking Filter] ──> [14kHz High-Shelf Filter] ──> [Audio Destination]
   ```
   All audio is processed in real-time through standard Web Audio API contexts. The custom equalizer injects five sequential `BiquadFilterNode` modules directly behind the master output gain node to manipulate frequencies without latency.

2. **Adaptive Color Hashing:**
   The theme algorithm hashes song metadata (Title + Artist) into consistent deterministic integers. These values map each song to one of six custom-curated color themes.
   
3. **Local Storage Synchronization:**
   User preferences (including custom equalizer gains, current sound profile, favorite lists, and custom playlists) are stored persistently using lightweight local state adapters, ensuring that your customized audio setups survive browser reloads.

---

## 👨‍💻 Created & Authored By
Veloura is fully created, engineered, and beautifully designed by **Aakrit Mandal**. 

---

## 📐 Technology Stack
- **Framework:** React 18+ with Vite
- **Language:** TypeScript (Strict Type Safety)
- **Styling:** Tailwind CSS (Fluid responsive containers, custom glassmorphic panels)
- **Animation:** `motion` (`motion/react`) for spring-driven UI transitions and smooth card sheets
- **Icons:** `lucide-react` for streamlined modern glyph representations
- **Audio:** Web Audio API (`AudioContext`, `BiquadFilterNode`, `GainNode`)
