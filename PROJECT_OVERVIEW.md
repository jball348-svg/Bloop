# Bloop v2 — Project Deep-Dive

This document is the authoritative technical snapshot of Bloop at the end of V2. Read it before making any significant changes to the codebase.

---

## 1. Executive Summary

Bloop is a single-page visual audio sandbox. The core patching model combines two routing mechanisms:

- **Explicit wiring** — visible React Flow edges drawn by the user
- **Spatial auto-wiring** — hidden edges generated automatically when nodes are snapped adjacent to each other

The canvas starts empty. Users drag nodes from four edge-docked menus, position them, and the system handles routing automatically where nodes are close enough — or they can wire manually for explicit control.

---

## 2. Architecture Overview

### 2.1 Three-Layer Model

```
UI Layer          app/page.tsx + components/
State Layer       store/useStore.ts
Audio Layer       Tone.js (inside the store)
```

Components are pure UI — they read from the store and call store actions. They never own Tone.js instances directly.

### 2.2 Store as Single Source of Truth

`store/useStore.ts` owns:

| Map / Set | Contents |
|---|---|
| `nodes` | React Flow node definitions + app-specific data |
| `edges` | Manual edges + hidden auto-managed edges |
| `audioNodes` | `Map<id, Tone.ToneAudioNode>` |
| `drumRacks` | `Map<id, DrumRack>` — per-drum-node synth instances |
| `patterns` | `Map<id, DisposablePattern>` — timing objects |
| `masterOutput` | Singleton `Tone.Volume` → `Tone.Destination` |
| `activeChordVoicings` | Active chord voicing state for release tracking |
| `generatorNoteCounts` | Per-note reference counts for polyphonic release |
| `activeGenerators` | Set of generator IDs currently receiving note attacks |
| `adjacentNodeIds` | Set of node IDs currently within snapping threshold |
| `autoEdgeIds` | Set of store-managed hidden edge IDs |

---

## 3. Node Taxonomy

### 3.1 Controllers (no audio node)

**ControllerNode** — fires note events toward connected Chord or Generator nodes.
- Arpeggiator mode: uses `@tonaljs/tonal` to build note collections, runs a `setInterval` loop, fires short `noteOn`/`noteOff` bursts
- Keyboard mode: maps `A/W/S/E/D/F/T/G/Y/H/U/J/K` to chromatic notes across octaves 1–7, mirrors key state to an on-screen piano

**ChordNode** — transforms incoming single notes into full chord voicings.
- Supported qualities: Major, Minor, Dominant7, Major7, Minor7, Sus2, Sus4, Diminished, Augmented
- Uses `Note.transpose` from `@tonaljs/tonal` to build interval-based voicings
- Tracks active voicings in `activeChordVoicings` to correctly release on `noteOff`
- Has no Tone.js audio node — it transforms note events only

### 3.2 Generators (have audio nodes)

**GeneratorNode** — polyphonic oscillator source.
- Owns a `Tone.PolySynth` per instance
- Waveform: sine / square / triangle / sawtooth
- Receives note attacks via `triggerAttack` / `triggerRelease`
- Activity indicator tied to `activeGenerators` store state

**DrumNode** — drum machine with two modes.
- **Hits mode**: tap-to-trigger pads for kick, snare, closed hat, open hat
- **Grid mode**: 16-step sequencer driven by `Tone.Loop` on `16n`
- Each drum node owns a `DrumRack`: `Tone.MembraneSynth` (kick), `Tone.NoiseSynth` (snare), two `Tone.MetalSynth` instances (hats), all routed through a `Tone.Gain` output
- Step highlighting is synced to the audio thread via `Tone.getDraw()`

### 3.3 Effects (have audio nodes)

**EffectNode** — swappable audio processor.

| Subtype | Tone.js Node | Key Controls |
|---|---|---|
| Reverb | `Tone.Freeverb` | Mix, Room Size |
| Delay | `Tone.FeedbackDelay` | Mix, Time, Feedback |
| Distortion | `Tone.Distortion` | Mix, Drive |
| Phaser | `Tone.Phaser` | Mix, Speed |
| BitCrusher | `Tone.BitCrusher` | Mix, Bits |

Changing subtype disposes the old Tone node and creates a new one, then calls `rebuildAudioGraph`.

### 3.4 Singletons (global broadcast — no cables)

**TempoNode** — global BPM broadcaster.
- Sets `Tone.getTransport().bpm` directly
- Only one instance allowed on the canvas
- If removed, transport falls back to 120 BPM
- Has no audio output handle — rhythmic nodes read from Transport automatically

**SpeakerNode** (labelled Amplifier) — global master output.
- Wraps a singleton `Tone.Volume` → `Tone.Destination`
- All Generator and Drum audio nodes route to this via `rebuildAudioGraph` (no cable needed)
- Only one instance allowed
- If removed, master volume resets to default

---

## 4. Canvas Interaction Model

### 4.1 Startup

The app opens with a blank canvas. `EngineControl` overlays a full-screen gate. The user clicks **START AUDIO ENGINE** which:
- calls `Tone.start()` to satisfy browser audio unlock
- starts `Tone.Transport`
- calls `initializeDefaultNodes()` which initialises any existing nodes (empty on fresh load)

### 4.2 Four-Menu Navigation

The previous single `Toolbar.tsx` was replaced with four edge-docked menus:
- `SignalMenu.tsx` — top, draggable: Generator, Effect, Drum
- `ControllerMenu.tsx` — left, draggable: Controller, Chord
- `GlobalMenu.tsx` — right, draggable: Tempo, Amplifier (greyed out when singleton already exists)
- `SystemMenu.tsx` — bottom, button: New (clears canvas)

### 4.3 Drag and Drop

Menus set `application/reactflow` on the drag payload. On drop:
- canvas converts screen coordinates to flow coordinates
- node ID generated with `crypto.randomUUID()`
- default subtype assigned per type
- adjacency recalculated on next tick via `setTimeout`

### 4.4 Clear Canvas

The **New** button in `SystemMenu` calls `clearCanvas()` in the store, which:
- stops and disposes all patterns
- disposes all drum racks
- disposes all audio nodes
- resets all store collections to empty Maps/Sets

### 4.5 Grid Snapping

Canvas uses a 15px snap grid applied during drag interaction.

### 4.6 Anti-Overlap Lego Placement

On drag stop:
1. Trash-bin hit test runs first (drop-to-delete)
2. Wait one tick for React Flow to finalise position
3. Up to 10 passes: compare dragged node against all others
4. On overlap > 100px², push dragged node flush left or right of obstacle, align to obstacle's Y row
5. If position changed, `onNodesChange` is called to write the corrected position
6. `recalculateAdjacency()` runs to refresh glow and auto-edges

This relies on hard-coded `NODE_DIMS` that must stay in sync with the Tailwind widths/heights on each component.

### 4.7 Adjacency Detection

Thresholds (in `useStore.ts`):
- horizontal gap: `0px` to `48px` (ADJ_TOUCH_THRESHOLD)
- vertical centre distance: `≤ 100px` (ADJ_Y_THRESHOLD)
- Tempo and Speaker nodes are excluded from adjacency

When two nodes qualify: both IDs added to `adjacentNodeIds`, cards render cyan ring/glow, auto-wiring recalculates.

### 4.8 Auto-Wiring

Rules:
- auto-edge IDs are prefixed `auto-`
- stored as `hidden: true` in React Flow edges — audio routes through them, no visible cable drawn
- manually drawn edges are preserved during recalculation
- an auto-edge is skipped if a manual edge already covers the same pair

Allowed auto-wire direction pairs (`VALID_AUTO_WIRE_PAIRS`):
```
controller -> chord
controller -> generator
chord      -> generator
generator  -> effect
drum       -> effect
effect     -> effect
```

Speaker is never an auto-wire source. Signal direction is derived from `SIGNAL_ORDER` (not just left-to-right position).

---

## 5. Audio Routing

`rebuildAudioGraph()` runs on every edge change:
1. Disconnects all Tone nodes
2. Reconnects via current edges (skipping controller, chord, tempo, speaker as sources/targets)
3. Any audio node not reached by an edge is connected directly to `masterOutput`

Two parallel flows:
- **Note flow**: `controller → chord → generator` via `fireNoteOn` / `fireNoteOff`
- **Audio flow**: `generator / drum → effect → masterOutput → Tone.Destination` via Tone `.connect()`

Chord voicing is tracked so `noteOff` releases the correct chord notes even if the voicing was computed at `noteOn` time.

---

## 6. Parameter Updates

All parameter changes go through `updateNodeValue()` in the store.

- All slider/knob changes use `rampTo(value, 0.1)` — never set directly (prevents audio clicks)
- Wave shape changes are mirrored back into `node.data.waveShape`
- Speaker volume delegates to `setMasterVolume()` which controls the singleton `masterOutput`
- Drum mix controls the rack's `Tone.Gain` output gain

---

## 7. Visual System

### Colour Coding

| Node | Border / Accent Colour |
|---|---|
| Controller | Amber / Yellow (`#eab308`) |
| Chord | Sky blue (`#0ea5e9`) |
| Generator | Blue (`#3b82f6`) |
| Drum | Orange (`#f97316`) |
| Effect | Fuchsia (`#d946ef`) |
| Amplifier (Speaker) | Emerald (`#10b981`) |
| Tempo | Indigo (`#6366f1`) |

### Shared Canvas Language
- Dark slate background (`#020617`)
- Dotted React Flow grid
- Cyan adjacency glow and rings
- Cyan-glow manual edges (stroke: `#22d3ee`)
- Dashed preview line while connecting
- Cyan trash bin

### Per-Node Surface Textures
- Controller: horizontal staff lines
- Generator: vertical frequency bars
- Effect: diagonal stripes
- Speaker: speaker-grill dot pattern
- Drum: grid pattern
- Chord: wave pattern
- Tempo: radial pulse pattern

---

## 8. File Map

| File | Responsibility |
|---|---|
| `app/page.tsx` | Canvas orchestration, drag/drop, snapping, overlap resolution, trash deletion, adjacency refresh |
| `store/useStore.ts` | All audio node lifecycle, note dispatch, adjacency, auto-edge management, audio graph rebuilds |
| `components/SignalMenu.tsx` | Top menu — Generator, Effect, Drum drag sources |
| `components/ControllerMenu.tsx` | Left menu — Controller, Chord drag sources |
| `components/GlobalMenu.tsx` | Right menu — Tempo, Amplifier singleton drag sources |
| `components/SystemMenu.tsx` | Bottom menu — New/Clear button |
| `components/ControllerNode.tsx` | Arpeggiator and keyboard modes, note event dispatch |
| `components/ChordNode.tsx` | Chord quality selection, note-to-voicing transformation |
| `components/GeneratorNode.tsx` | PolySynth waveform source, active-note indicator |
| `components/DrumNode.tsx` | Drum machine — Hits mode and Grid sequencer |
| `components/EffectNode.tsx` | Runtime-switchable FX with mix/bypass and subtype controls |
| `components/TempoNode.tsx` | Singleton global BPM control |
| `components/SpeakerNode.tsx` | Singleton global output volume |
| `components/EngineControl.tsx` | Audio unlock gate and default-node initialisation entry point |
| `app/globals.css` | Tailwind import, React Flow surface theming |

---

## 9. V2 Constraints to Know Before V3

- No persistence layer — patches do not survive a page reload (save/load is V3, tracked in #12)
- Effect and controller UI state (mix value, bypass state, etc.) lives in component state — it is not serialised into node data
- Auto-wiring is proximity-based only; no concept of locked groups or directional constraints yet (V3: #15–#20)
- Global objects (Tempo, Amplifier) are not fully excluded from all adjacency edge cases — Speaker guard is V3 (#19)
- No automated test suite

---

## 10. Key Rules for Future Changes

- **Audio behaviour, routing, adjacency, node lifecycle** → start in `store/useStore.ts`
- **Canvas feel, snapping, drag** → `app/page.tsx` and `NODE_DIMS` (must stay in sync with Tailwind classes)
- **New node types** → add to `nodeTypes` in `page.tsx`, `SIGNAL_ORDER` and `VALID_AUTO_WIRE_PAIRS` in `useStore.ts`, and `NODE_DIMS` in both files
- **Always `.dispose()` Tone nodes** on removal — ghost audio and memory leaks are silent bugs
- **Always `rampTo`** for parameter changes — never set directly
