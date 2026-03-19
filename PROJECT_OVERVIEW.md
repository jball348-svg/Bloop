# Bloop v3 — Project Deep-Dive

This document is the authoritative technical snapshot of Bloop at the end of V3 Synth work. Read it before making any significant changes to the codebase.

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

Components are pure UI — they read from the store and call store actions. They never own Tone.js instances directly. **Exception: `VisualiserNode`** creates `Tone.Analyser` and `Tone.FFT` instances locally in refs — these are display-only and not part of the audio graph.

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
| `past` | Undo history stack — `{ nodes, edges }[]`, max 50 |
| `future` | Redo history stack — `{ nodes, edges }[]` |

---

## 3. Node Taxonomy

### 3.1 Controllers (no audio node — fire note events)

**ControllerNode (Arp)** — fires note events toward connected nodes.
- Arpeggiator only (keyboard mode was split out into KeysNode)
- Uses `@tonaljs/tonal` to build note collections, runs a `Tone.Sequence` on `8n`, fires short `noteOn`/`noteOff` bursts
- Amber/yellow theme

**KeysNode (Keys)** — QWERTY keyboard controller.
- Extracted from ControllerNode in V3 — now a standalone node type
- Maps A–K to chromatic notes, W/E/T/Y/U to sharps/flats, octave selector 1–7
- `keydown`/`keyup` listeners with cleanup on unmount
- Black/white theme — distinct from the amber Arp

**AdsrNode (ADSR)** — envelope pass-through controller.
- Sits between any Controller and a Generator or Drum
- Has both input and output handles — note events pass through, envelope values applied to downstream PolySynths before triggering
- Four sliders: Attack (0.001–2s), Decay (0.01–2s), Sustain (0–1), Release (0.01–4s)
- Live SVG envelope diagram that redraws on slider change
- Values stored in `node.data` for future serialisation
- Dark amber theme (`amber-700`)

**ChordNode** — transforms incoming single notes into full chord voicings.
- Supported qualities: Major, Minor, Dominant7, Major7, Minor7, Sus2, Sus4, Diminished, Augmented
- Uses `Note.transpose` from `@tonaljs/tonal` to build interval-based voicings
- Tracks active voicings in `activeChordVoicings` to correctly release on `noteOff`
- Sky blue theme

### 3.2 Generators (produce audio)

**GeneratorNode** — polyphonic oscillator source.
- Owns a `Tone.PolySynth` per instance (or `Tone.Noise` when waveShape is `'noise'`)
- Waveforms: sine, square, triangle, sawtooth, **noise** (white)
- Switching between oscillator types and noise disposes and recreates the Tone.js instance via `changeNodeSubType`
- Receives note attacks via `triggerAttack` / `triggerRelease` (PolySynth) or `.start()` / `.stop()` (Noise)
- Red theme

**DrumNode** — drum machine with two modes.
- **Hits mode**: tap-to-trigger pads for kick, snare, closed hat, open hat. Keyboard: A/S/D/F
- **Grid mode**: 16-step sequencer driven by `Tone.Loop` on `16n`
- Each drum node owns a `DrumRack`: `Tone.MembraneSynth` (kick), `Tone.NoiseSynth` (snare), two `Tone.MetalSynth` instances (hats), all routed through a `Tone.Gain` output
- Step highlighting is synced to the audio thread via `Tone.getDraw()`
- Orange theme

### 3.3 Signal Processors (pass audio through, modify it)

**EffectNode** — swappable audio processor.

| Subtype | Tone.js Node | Key Controls |
|---|---|---|
| Reverb | `Tone.Freeverb` | Mix, Room Size |
| Delay | `Tone.FeedbackDelay` | Mix, Time, Feedback |
| Distortion | `Tone.Distortion` | Mix, Drive |
| Phaser | `Tone.Phaser` | Mix, Speed |
| BitCrusher | `Tone.BitCrusher` | Mix, Bits |

Changing subtype disposes the old Tone node and creates a new one, then calls `rebuildAudioGraph`. Fuchsia theme.

**UnisonNode** — chorus-based voice stacking.
- Uses `Tone.Chorus` initialised with `.start()` (required or it produces no output)
- Controls: Depth (0–100%), Speed (0.5–10Hz), Mix (wet/dry), Bypass
- Initialized with `wet: 0`; a mount `useEffect` syncs component defaults to the Tone node
- Violet theme

**DetuneNode** — pitch shift node.
- Uses `Tone.PitchShift`
- Cents slider maps -100 to +100 UI range → -12 to +12 semitones (`val / 100 * 12`)
- Mix slider (wet/dry), Bypass
- Teal theme

**VisualiserNode** — real-time signal display.
- Uses `Tone.Gain(1)` as a passthrough node in the store audio graph
- `Tone.Analyser` (256 samples, waveform) and `Tone.FFT` (64 bins, spectrum) created inside the component as refs — not in the store
- Canvas drawn via `requestAnimationFrame` loop — not React renders
- Two modes: **WAVE** (oscilloscope) and **FREQ** (frequency bars)
- Analyser and FFT reconnect whenever `edges` changes (to survive `rebuildAudioGraph` disconnects)
- Pink theme

### 3.4 Singletons (global broadcast — no cables)

**TempoNode** — global BPM broadcaster.
- Sets `Tone.getTransport().bpm` directly
- Only one instance allowed; removed → 120 BPM fallback
- Indigo theme

**SpeakerNode** (labelled Amplifier) — global master output.
- Wraps a singleton `Tone.Volume` → `Tone.Destination`
- All Generator, Drum, and signal-processor nodes route here via `rebuildAudioGraph`
- Only one instance allowed
- Emerald theme

---

## 4. Signal & Note Flow

### Note event flow
```
Controller/Keys ──► (ADSR) ──► (Chord) ──► Generator
     fireNoteOn          applies envelope    triggerAttack
```

Note dispatch is handled by `collectNoteDispatches()` — a recursive function that walks edges from a source, passing through ADSR and Chord nodes, and collecting `{ generatorId, note }` dispatch objects. The ADSR path calls `applyAdsrEnvelopes()` before note-on to push envelope settings to downstream PolySynths.

### Audio signal flow
```
Generator / Drum ──► Unison / Detune ──► Effect ──► Visualiser ──► masterOutput ──► Tone.Destination
```

`rebuildAudioGraph()` runs on every edge change:
1. Disconnects all Tone nodes
2. Reconnects via current edges (skipping controller-family nodes as audio sources/targets)
3. Any audio node not reached by an edge connects directly to `masterOutput`

---

## 5. Undo / Redo

Implemented via `past` / `future` snapshot stacks in the store.

- `saveSnapshot()` is called before every mutating action (addNode, removeNode, connect edge, etc.)
- `undo()` pops from `past`, pushes to `future`, restores the snapshot, then disposes all current audio nodes, reinitialises from the restored state, and calls `rebuildAudioGraph`
- `redo()` mirrors this in reverse
- History capped at 50 steps
- Keyboard: `Cmd/Ctrl+Z` (undo), `Cmd/Ctrl+Shift+Z` / `Ctrl+Y` (redo), wired in `app/page.tsx`
- Parameter/slider changes are NOT snapshotted (too granular)

---

## 6. Parameter Updates

All parameter changes go through `updateNodeValue()` in the store.

- All slider/knob changes use `rampTo(value, 0.1)` — never set directly (prevents audio clicks)
- Wave shape changes: switching between oscillator types is handled via `node.set()` on PolySynth; switching to/from `'noise'` calls `changeNodeSubType` to swap the Tone.js class entirely
- Speaker volume delegates to `setMasterVolume()` which controls the singleton `masterOutput`
- ADSR values are stored in `node.data` (no audio node for ADSR)
- Unison/Detune have mount `useEffect` hooks to sync component default values to their Tone.js nodes

---

## 7. Visual System

See `STYLE_GUIDE.md` for the full canonical colour registry and UI patterns. Summary:

| Node | Colour |
|---|---|
| Arp (Controller) | yellow-500 |
| Keys | white |
| ADSR | amber-700 |
| Chord | sky-500 |
| Generator | red-500 |
| Drum | orange-500 |
| Effect | fuchsia-500 |
| Unison | violet-500 |
| Detune | teal-500 |
| Visualiser | pink-500 |
| Tempo | indigo-500 |
| Amplifier | emerald-500 |

Canvas accent language: **cyan** (`#22d3ee`) is reserved exclusively for adjacency glow rings and manual edge strokes. Never use cyan as a node colour.

---

## 8. File Map

| File | Responsibility |
|---|---|
| `app/page.tsx` | Canvas orchestration, drag/drop, snapping, overlap resolution, trash deletion, adjacency refresh, undo/redo keyboard shortcuts |
| `store/useStore.ts` | All audio node lifecycle, note dispatch, adjacency, auto-edge management, audio graph rebuilds, undo/redo history |
| `components/SignalMenu.tsx` | Top menu — Generator, Effect, Drum, Unison, Detune, Visualiser |
| `components/ControllerMenu.tsx` | Left menu — Arp, Keys, ADSR, Chord |
| `components/GlobalMenu.tsx` | Right menu — Tempo, Amplifier singleton drag sources |
| `components/SystemMenu.tsx` | Bottom menu — New/Clear, Undo/Redo buttons |
| `components/ControllerNode.tsx` | Arpeggiator only — fires note events |
| `components/KeysNode.tsx` | QWERTY keyboard — fires note events, black/white theme |
| `components/AdsrNode.tsx` | ADSR envelope pass-through with live SVG diagram |
| `components/ChordNode.tsx` | Chord quality selection, note-to-voicing transformation |
| `components/GeneratorNode.tsx` | PolySynth / Noise source, active-note indicator |
| `components/DrumNode.tsx` | Drum machine — Hits mode and Grid sequencer |
| `components/EffectNode.tsx` | Runtime-switchable FX with mix/bypass and subtype controls |
| `components/UnisonNode.tsx` | Chorus-based unison/width processor |
| `components/DetuneNode.tsx` | PitchShift processor |
| `components/VisualiserNode.tsx` | Real-time waveform/spectrum display via canvas + requestAnimationFrame |
| `components/TempoNode.tsx` | Singleton global BPM control |
| `components/SpeakerNode.tsx` | Singleton global output volume |
| `components/EngineControl.tsx` | Audio unlock gate and default-node initialisation entry point |
| `STYLE_GUIDE.md` | Canonical node colour registry and UI design patterns |
| `app/globals.css` | Tailwind import, React Flow surface theming |

---

## 9. Known Constraints Heading into V4

- No persistence layer — patches do not survive a page reload (save/load is #12)
- Effect and controller UI state (mix value, bypass state, etc.) lives in component state — not serialised into node data
- Auto-wiring is proximity-based only; no concept of locked groups or directional constraints yet (V3 canvas structure: #15–#20)
- Global objects (Tempo, Amplifier) are not fully excluded from all adjacency edge cases (#19)
- No automated test suite
- Visualiser analyser re-connects on `edges` change — minor CPU overhead from repeated connect/disconnect cycles on every cable change

---

## 10. Key Rules for Future Changes

- **Audio behaviour, routing, adjacency, node lifecycle** → start in `store/useStore.ts`
- **Canvas feel, snapping, drag** → `app/page.tsx` and `NODE_DIMS` (must stay in sync with Tailwind classes)
- **New node types** → add to `nodeTypes` in `page.tsx`, `SIGNAL_ORDER`, `VALID_AUTO_WIRE_PAIRS`, and `NODE_DIMS` in `useStore.ts`; add to the appropriate menu; register colour in `STYLE_GUIDE.md`
- **Always `.dispose()` Tone nodes** on removal — ghost audio and memory leaks are silent bugs
- **Always `rampTo`** for parameter changes — never set directly
- **Check `STYLE_GUIDE.md`** before assigning colours to new nodes — pick from the Available list
- **Unison/Detune pattern**: nodes that need initial values synced to Tone.js on mount need a `useEffect` with `[id]` dependency to push defaults into the store
- **Visualiser pattern**: analysis nodes (Analyser, FFT) that live in component refs must re-connect in a `useEffect` that depends on both `audioNodes` and `edges` — otherwise `rebuildAudioGraph` will disconnect them silently
