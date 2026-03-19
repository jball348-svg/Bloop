# Bloop v3

Bloop is a visual modular audio sandbox built with Next.js, React Flow, and Tone.js. Users drag audio nodes onto a canvas, snap them into place, and shape playable signal chains in real time — no music theory or technical knowledge required.

---

## V3 Feature Set

### Controllers (fire note events — no audio output)

| Node | Type | Description |
|---|---|---|
| **Arp** | Multi-instance | Arpeggiator. Cycles through a selected scale at tempo, fires note events to downstream nodes. |
| **Keys** | Multi-instance | QWERTY keyboard. Maps A–K to piano keys across 7 octaves, with on-screen visual feedback. Black/white theme. |
| **ADSR** | Multi-instance | Envelope controller. Sits between a Controller and a Generator/Drum. Shapes attack, decay, sustain, release. Pass-through for note events. |
| **Chord** | Multi-instance | Transforms a single incoming note into a full chord voicing (Major, Minor, Dom7, Maj7, Min7, Sus2, Sus4, Dim, Aug). |

### Signals (produce or process audio)

| Node | Type | Description |
|---|---|---|
| **Generator** | Multi-instance | Polyphonic oscillator. Waveforms: sine, square, triangle, sawtooth, noise (white). Receives note events. |
| **Drum** | Multi-instance | Drum machine. Hits mode (tap-to-trigger) and Grid mode (16-step sequencer). Kick, snare, closed hat, open hat. |
| **Effect** | Multi-instance | Swappable audio processor: Reverb, Delay, Distortion, Phaser, BitCrusher. Each has Mix and type-specific controls. |
| **Unison** | Multi-instance | Chorus-based voice stacking. Adds warmth and width via depth, speed, and mix controls. |
| **Detune** | Multi-instance | Pitch shift node. Fine pitch offset in semitones with wet/dry mix. |
| **Visualiser** | Multi-instance | Real-time signal display. Waveform (oscilloscope) and Spectrum (FFT frequency bars) modes. Audio passes through unmodified. |

### Global (singletons — no cables)

| Node | Type | Description |
|---|---|---|
| **Tempo** | Singleton | Global BPM broadcaster. Controls Tone.Transport — all rhythmic nodes follow it automatically. |
| **Amplifier** | Singleton | Global master output. Controls master volume. All audio routes here without cables. |

### Canvas & Interaction
- **Empty canvas on load** — start from a blank slate every session
- **New / Clear button** — System menu wipes the canvas and disposes all audio cleanly
- **Undo / Redo** — `Cmd/Ctrl+Z` and `Cmd/Ctrl+Shift+Z`, plus on-canvas buttons. 50-step history.
- **Drag-and-drop** from four contextual edge menus
- **15px grid snapping** across the whole canvas
- **Anti-overlap lego placement** — dragging onto an occupied position snaps nodes flush beside each other
- **Adjacency detection** — nodes within 48px horizontally and 100px vertically qualify as adjacent
- **Cyan adjacency glow** — visual indicator that nodes are close enough to auto-route
- **Hidden auto-wiring** — adjacent nodes are connected with invisible edges that route audio without drawing cables
- **Manual wiring** — visible cable connections still available for explicit routing
- **Drag-to-trash deletion** — drag any node to the bin in the bottom-right corner
- **In-node delete button** — × button on each node for direct removal
- **Extended zoom range** — zoom out to 5% for a full patch overview

### Four Contextual Menus

| Menu | Position | Contents |
|---|---|---|
| **Signals** | Top centre | Generator, Effect, Drum, Unison, Detune, Visualiser |
| **Controllers** | Left centre | Arp, Keys, ADSR, Chord |
| **Global** | Right centre | Tempo, Amplifier (greyed out when already on canvas) |
| **System** | Bottom centre | New (clears canvas), Undo, Redo |

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Canvas | React Flow 11 |
| Audio Engine | Tone.js 15 |
| State | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Music Theory | @tonaljs/tonal |
| Language | TypeScript |

---

## Project Structure

```
bloop/
├── app/
│   ├── page.tsx              # Canvas, drag/drop, snapping, overlap resolution, adjacency
│   └── layout.tsx            # Root layout, fonts, metadata
├── components/
│   ├── SignalMenu.tsx         # Top menu — Generator, Effect, Drum, Unison, Detune, Visualiser
│   ├── ControllerMenu.tsx     # Left menu — Arp, Keys, ADSR, Chord
│   ├── GlobalMenu.tsx         # Right menu — Tempo, Amplifier (singletons)
│   ├── SystemMenu.tsx         # Bottom menu — New/Clear, Undo/Redo
│   ├── ControllerNode.tsx     # Arpeggiator — fires note events
│   ├── KeysNode.tsx           # QWERTY keyboard controller — black/white theme
│   ├── AdsrNode.tsx           # ADSR envelope controller — pass-through with live diagram
│   ├── ChordNode.tsx          # Note-to-chord transformer
│   ├── GeneratorNode.tsx      # Polyphonic oscillator, 5 waveforms including noise
│   ├── DrumNode.tsx           # Drum machine — Hits and Grid modes
│   ├── EffectNode.tsx         # Swappable FX processor
│   ├── UnisonNode.tsx         # Chorus-based unison/width node
│   ├── DetuneNode.tsx         # Pitch shift node
│   ├── VisualiserNode.tsx     # Real-time waveform/spectrum display
│   ├── TempoNode.tsx          # Global BPM — singleton
│   ├── SpeakerNode.tsx        # Global output volume — singleton (Amplifier)
│   └── EngineControl.tsx      # Audio unlock overlay
├── store/
│   └── useStore.ts            # All audio lifecycle, routing, undo/redo, adjacency, and state
├── AGENTS.md                  # AI agent briefing — read before touching code
├── STYLE_GUIDE.md             # Node colour registry and design system
├── TICKETS.md                 # Ticket status and work order
└── PROJECT_OVERVIEW.md        # Full technical deep-dive
```

---

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and click **START AUDIO ENGINE** before testing any sound.

`npm run dev` clears a stale `:3000` lock before launching, which helps during repeated local restarts.
