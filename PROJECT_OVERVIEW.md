# Bloop v3 — Project Deep-Dive

This document is the authoritative technical snapshot of Bloop at the end of V3 work. Read it before making any significant changes to the codebase.

---

## 1. Executive Summary

Bloop is a single-page visual audio sandbox. The core patching model combines two routing mechanisms:

- **Explicit wiring** — visible React Flow edges drawn by the user
- **Spatial auto-wiring** — hidden edges generated automatically when nodes are snapped adjacent to each other

The canvas starts empty. Users drag nodes from edge-docked menus, position them, and the system handles routing automatically where nodes are close enough — or they can wire manually for explicit control.

---

## 2. Architecture Overview

### 2.1 Three-Layer Model

```
UI Layer          app/page.tsx + components/
State Layer       store/useStore.ts
Audio Layer       Tone.js (inside the store)
```

Components are pure UI — they read from the store and call store actions. They never own Tone.js instances directly. **Exception: `VisualiserNode`** creates `Tone.Analyser` and `Tone.FFT` instances locally in refs — these are display-only and not part of the audio graph.

### 2.2 Store as Single Source of Truth

`store/useStore.ts` owns:

| Map / Set | Contents |
|---|---|
| `nodes` | React Flow node definitions + app-specific data (`isLocked`, `isEntry`, `isExit`) |
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
| `past` | Undo history stack — `{ nodes, edges }[]`, max 50 |
| `future` | Redo history stack — `{ nodes, edges }[]` |

**Presets**: `store/presets.ts` contains curated `Preset` structures (nodes and edges) loaded via `loadCanvas`.

---

## 3. Node Taxonomy

### 3.1 Controllers (no audio node — fire note events)

**ControllerNode (Arp)** — fires note events toward connected nodes.
- Arpeggiator only (keyboard mode split out into KeysNode)
- Uses `@tonaljs/tonal` to build note collections, runs a `Tone.Sequence` on `8n`
- Amber/yellow theme

**KeysNode (Keys)** — QWERTY keyboard controller.
- Stands alone as of V3 — Maps A–K to chromatic notes
- `keydown`/`keyup` listeners with cleanup on unmount
- Black/white theme

**AdsrNode (ADSR)** — envelope pass-through controller.
- Sits between Controller and Generator/Drum
- Has both input and output handles — note events pass through, envelope values applied downstream
- Live SVG envelope diagram
- Dark amber theme (`amber-700`)

**ChordNode** — transforms incoming single notes into full chord voicings.
- Uses `Note.transpose` from `@tonaljs/tonal` to build interval-based voicings
- Sky blue theme

### 3.2 Generators (produce audio)

**GeneratorNode** — polyphonic oscillator source.
- Owns a `Tone.PolySynth` or `Tone.Noise`
- Waveforms: sine, square, triangle, sawtooth, **noise**
- Red theme

**DrumNode** — drum machine with Hits and Grid modes.
- Each drum node owns a `DrumRack` (MembraneSynth, NoiseSynth, MetalSynth)
- Orange theme

### 3.3 Signal Processors (pass audio through, modify it)

**EffectNode**, **UnisonNode**, **DetuneNode**, **VisualiserNode**.
- All follow the pattern of wrapping a Tone.js node and participating in `rebuildAudioGraph`.
- Visualiser is pink, Effect is fuchsia, Unison is violet, Detune is teal.

### 3.4 Singletons (global broadcast — no cables)

**TempoNode** (indigo) and **SpeakerNode** (emerald).
- Only one of each allowed. Excluded from snapping and locking systems.

---

## 4. Signal & Note Flow

V3 introduced a formal separation of signal domains:

### 4.1 Control Path (West → East)
- **Handles**: `control-in` (left), `control-out` (right)
- **Participants**: Controller, Keys, ADSR, Chord, Generator (input only)
- **Logic**: `collectNoteDispatches()` walks this path recursively.

### 4.2 Audio Path (North → South)
- **Handles**: `audio-in` (top), `audio-out` (bottom)
- **Participants**: Generator, Drum, Unison, Detune, Effect, Visualiser, Speaker (implicit)
- **Logic**: `rebuildAudioGraph()` connects these nodes in a vertical chain.

---

## 5. Adjacency & Locking (v2)

The proximity system was overhauled in V3 for better UX:

### 5.1 Directional Snapping
- **Horizontal Snapping**: Controllers only (Keys → ADSR → Chord → Generator).
- **Vertical Snapping**: Signal chain only (Generator → Unison → Effect → Visualiser).

### 5.2 Group Locking
- Snapped nodes can be **Locked** into a single rigid object.
- **Transitive Locking**: Locking one node in a group locks all adjacent snapped nodes.
- **Move-as-one**: Dragging any node in a locked group moves the entire group.
- **Handle Filtering**: Locked groups expose only the entry-point input and exit-point output handles to the canvas, reducing visual clutter and preventing illegal mid-chain connections.

---

## 6. Session Management

- **Persistence**: Users can **Save** patches as `.bloop` (JSON) files.
- **Loading**: Patches can be re-loaded into the canvas, fully disposing previous audio nodes first.
- **Presets**: Curated starter patches are available in the System menu.
- **Undo/Redo**: 50-step history for all canvas layout and wiring changes.

---

## 7. Visual System

Refer to `STYLE_GUIDE.md` for specific tokens.
- **Cyan** (`#22d3ee`): Reserved for routing indicators (glow rings, edges).
- **Adjacency Ring**: Animates when nodes are within auto-wiring distance.
- **Locked Overlay**: Icons and dimmed handles indicate a locked state.

---

## 8. Known Constraints Heading into V4

- **Parameter Serialisation**: Some node-specific UI states (like mix knobs) are not yet saved into the `.bloop` file.
- **Performance**: Large patches with many Visualiser nodes can be CPU-intensive.
- **Automated Testing**: The project currently relies on manual verification.
- **Mobile Support**: The canvas interaction is optimised for mouse/keyboard.

---

## 9. Key Rules for Future Changes

- **Signal Domain Rule**: Never connect a Control output to an Audio input (and vice-versa).
- **Dispose First**: Always call `dispose()` on Tone.js nodes before removing from the store.
- **Ramp Parameters**: Use `rampTo(val, 0.1)` to avoid audio pops.
- **Sync Dimensions**: If a node's UI size changes, update `NODE_DIMS` in `useStore.ts` or snapping will break.
