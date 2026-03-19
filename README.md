# Bloop v2

Bloop is a visual modular audio sandbox built with Next.js, React Flow, Tone.js, and Zustand. Users drag audio nodes onto a canvas, snap them into place, and shape playable signal chains in real time — no music theory or technical knowledge required.

---

## V2 Feature Set

### Node Types

| Node | Type | Description |
|---|---|---|
| **Controller** | Multi-instance | Arpeggiator or QWERTY keyboard. Fires note events to downstream nodes. |
| **Chord** | Multi-instance | Transforms a single incoming note into a full chord voicing before passing it downstream. |
| **Generator** | Multi-instance | Polyphonic oscillator. Receives note events and produces audio. Supports sine, square, triangle, sawtooth. |
| **Drum** | Multi-instance | Drum machine with Hits mode (tap-to-trigger) and Grid mode (16-step sequencer). |
| **Effect** | Multi-instance | Swappable audio processor: Reverb, Delay, Distortion, Phaser, BitCrusher. |
| **Tempo** | Singleton | Global BPM broadcaster. Controls Tone.Transport — all rhythmic nodes follow it automatically. |
| **Amplifier** | Singleton | Global master output. Controls master volume. All audio routes here without cables. |

### Canvas & Interaction
- **Empty canvas on load** — start from a blank slate every session
- **New / Clear button** — System menu wipes the canvas and disposes all audio cleanly
- **Drag-and-drop** from four contextual edge menus (see below)
- **15px grid snapping** across the whole canvas
- **Anti-overlap lego placement** — dragging onto an occupied position snaps nodes flush beside each other
- **Adjacency detection** — nodes within 48px horizontally and 100px vertically qualify as adjacent
- **Cyan adjacency glow** — visual indicator that nodes are close enough to auto-route
- **Hidden auto-wiring** — adjacent nodes are connected with invisible edges that route audio without drawing cables
- **Manual wiring** — visible cable connections still available for explicit routing
- **Drag-to-trash deletion** — drag any node to the cyan bin in the bottom-right corner
- **In-node delete button** — X button on each node for direct removal
- **Extended zoom range** — zoom out to 5% for a full patch overview

### Four Contextual Menus

The toolbar has been replaced with four edge-docked menus:

| Menu | Position | Contents |
|---|---|---|
| **Signals** | Top centre | Generator, Effect, Drum |
| **Controllers** | Left centre | Controller, Chord |
| **Global** | Right centre | Tempo, Amplifier (singletons — greyed out when already on canvas) |
| **System** | Bottom centre | New (clears canvas) |

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
│   ├── SignalMenu.tsx         # Top menu — Generator, Effect, Drum
│   ├── ControllerMenu.tsx     # Left menu — Controller, Chord
│   ├── GlobalMenu.tsx         # Right menu — Tempo, Amplifier (singletons)
│   ├── SystemMenu.tsx         # Bottom menu — New/Clear button
│   ├── ControllerNode.tsx     # Arpeggiator + QWERTY keyboard
│   ├── ChordNode.tsx          # Note-to-chord transformer
│   ├── GeneratorNode.tsx      # Polyphonic oscillator
│   ├── DrumNode.tsx           # Drum machine — Hits and Grid modes
│   ├── EffectNode.tsx         # Swappable FX processor
│   ├── TempoNode.tsx          # Global BPM — singleton
│   ├── SpeakerNode.tsx        # Global output volume — singleton (Amplifier)
│   └── EngineControl.tsx      # Audio unlock overlay
├── store/
│   └── useStore.ts            # All audio lifecycle, routing, adjacency, and state
├── AGENTS.md                  # AI agent briefing — read before touching code
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
