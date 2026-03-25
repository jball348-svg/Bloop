# Bloop v17 — Project Overview

This document is the technical snapshot of Bloop as shipped for the v17 milestone. Read it before making significant product, audio, persistence, or compiler changes.

---

## 1. Executive Summary

Bloop is a browser-based visual modular audio sandbox built for non-musicians and curious tinkerers. Users create patches by dropping nodes onto a canvas, connecting them with explicit cables, or snapping them into adjacency-driven chains. The app now supports both freeform sound design and structured song building through patterns, arranger scenes, automation lanes, mixers, and asset-backed showcase songs.

The current repo reflects three overlapping layers:

- **Runtime layer**: the interactive Bloop app in Next.js, React Flow, Zustand, and Tone.js
- **Persistence layer**: normalized `.bloop` patch assets and asset-backed presets
- **Build-time authoring layer**: a theory-grounded AI-song compiler driven by `.agent/composer/*` schemas and `MusicalPlanV1` files

---

## 2. Current Product Snapshot

### 2.1 Core Interaction Model

- Drag nodes from edge-docked menus onto the canvas
- Patch **control**, **audio**, and **modulation** cables directly
- Use adjacency snapping and locking to create structured modules
- Save and load `.bloop` patch files
- Load inline presets or asset-backed preset patches from the same validated pipeline

### 2.2 Major User-Facing Systems

- **Controllers**: Arpeggiator, Keys, MIDI In, ADSR, Chord, Pulse, Step Sequencer, Mood Pad
- **Sound / signal nodes**: Generator, Sampler, Audio In, Drum, Advanced Drums, Effect, EQ, Unison, Detune, Quantizer, Visualiser
- **Composition tools**: Pattern, Mixer, Arranger
- **Global singletons**: Tempo, Amplifier
- **Quality-of-life systems**: undo/redo, onboarding, themes, campaign, recording, signal-flow overlay
- **Song pipeline**: asset-backed AI scaffold and flagship song presets compiled into `.bloop` files

### 2.3 Important Current Limits

- Audio still requires a user gesture to start
- Recording exports browser-native audio (`.webm`), not WAV
- `.bloop` files persist canvas/runtime patch data, not overlay-only musical intent or revision memory
- Receiver-side math targeting is present in the UI and store, but there is still **no shipped end-user math sender node**

---

## 3. Architecture Overview

### 3.1 Runtime Layers

```text
UI Layer          app/page.tsx + components/*
State Layer       store/useStore.ts + auxiliary Zustand stores
Audio Layer       Tone.js objects created and owned inside the store
```

Components are UI shells. `store/useStore.ts` is the source of truth for node state, edge state, Tone node lifecycle, patch persistence, arranger playback, automation playback, graph rebuilds, and validation. The only intentional component-level Tone exception remains `VisualiserNode`, which owns display-only analyser refs and reconnects them when the graph changes.

### 3.2 Supporting Stores

- [`store/useStore.ts`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/store/useStore.ts): main canvas, audio runtime, patch normalization/validation, persistence, playback
- [`store/usePreferencesStore.ts`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/store/usePreferencesStore.ts): theme, onboarding, unlocked presets, unlocked accent skins
- [`store/campaign.ts`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/store/campaign.ts): campaign mode state and progress
- [`store/presets.ts`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/store/presets.ts): curated preset library, including asset-backed showcase presets

### 3.3 Build-Time Authoring Layer

The AI-song pipeline is intentionally **not** part of the client runtime. It lives in:

- [`scripts/compile-ai-song-assets.mjs`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/scripts/compile-ai-song-assets.mjs)
- [`data/ai-song/`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song)
- [`AI_SONG_AUTHORING.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/AI_SONG_AUTHORING.md)

This compiler:

1. loads `.agent/composer/*` musical-brain files
2. loads `MusicalPlanV1` YAML
3. validates theory constraints and transform provenance
4. generates blueprint JSON
5. validates against Bloop runtime limits
6. emits `.bloop` patch assets and grounding reports

---

## 4. Signal Domains and Routing

### 4.1 Control Domain

- Handle IDs: `control-in`, `control-out`
- Carries note and trigger events
- Connects controllers, ADSR, chord transformers, pattern-like control sources, and note-producing nodes

### 4.2 Audio Domain

- Handle IDs: `audio-in`, `audio-out`
- Carries Tone audio through generators, samplers, drums, effects, visualisers, mixer channels, and finally the master output

### 4.3 Modulation Domain

- Existing lime/green modulation system introduced in v12
- Used by the LFO and right-edge modulation target handles
- Remains a shipped, working runtime path

### 4.4 Math Domain

- Purple receiver-side path introduced during the v16 workstream
- Nodes expose a top-left `MathInputHandle` and a selected receiver target in `node.data.mathInputTarget`
- `receiveMathValue(nodeId, normalizedValue)` can resolve and apply bounded normalized values inside the store
- Important constraint: the runtime still treats math edges as non-shipped for normal end-user authoring because there is no shipped sender surface

### 4.5 Legacy Tempo Edges

Tempo is still a global singleton broadcast model. Legacy tempo edges can be sanitized out of loaded patches; they are not part of the live direct routing surface.

---

## 5. Node Taxonomy

### 5.1 Controller / Event Nodes

- `controller` — arpeggiator
- `keys`
- `midiin`
- `adsr`
- `chord`
- `pulse`
- `stepsequencer`
- `pattern`
- `quantizer`
- `moodpad`

These nodes primarily generate, transform, or schedule note/control events.

### 5.2 Sound and Processing Nodes

- `generator`
- `sampler`
- `audioin`
- `drum`
- `advanceddrum`
- `effect`
- `eq`
- `unison`
- `detune`
- `lfo`
- `visualiser`

### 5.3 Structure / Mix Nodes

- `mixer`
- `arranger`

These provide song-level structure, routing, automation, and balancing.

### 5.4 Global Singletons

- `tempo`
- `speaker`

Only one of each is allowed on the canvas.

---

## 6. Composition and Song Systems

### 6.1 Pattern Authoring

- Piano-roll style note editing
- Scrollable note range across C2-C6
- Up to 48 bars per loop
- Pattern notes are persisted directly in node data

### 6.2 Step Sequencer

- Selected-step editing is persisted in node data
- Uses the same C2-C6 note range
- Supports contextual math targeting of the selected step

### 6.3 Arranger

- Scenes activate pattern and rhythm nodes by bar range
- Each scene can contain automation lanes
- Scene length supports up to 32 bars
- Duplicate-scene UI and validation warnings are present

### 6.4 Automation

Automation lanes can target mixer, EQ, effect, and sampler parameters. Sampler `playbackRate` and `pitchShift` are now part of the usable song-grade automation surface.

---

## 7. Persistence Model

### 7.1 `.bloop` Patch Assets

The canonical patch payload is:

- `version`
- `nodes`
- `edges`
- `masterVolume`
- optional `metadata`

`loadCanvas(...)` now routes patch data through:

- `normalizePatchAsset(...)`
- `validatePatchAsset(...)`

before the runtime is rehydrated.

### 7.2 What `.bloop` Files Do Not Store

They do **not** store:

- theme preferences
- onboarding progress
- campaign progress
- unlock states
- composer overlay memory
- full musical-brain plan state unless copied into patch metadata intentionally

### 7.3 Presets

Presets can now be:

- `inline`
- `asset`

The flagship showcase song and AI scaffold both ship as asset-backed presets using compiled `.bloop` files in [`public/patches/`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/patches).

---

## 8. AI Song Pipeline

### 8.1 Source Artifacts

- `*.plan.yaml` files under [`data/ai-song/`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song)
- `.agent/composer/*` musical-brain schemas and composition docs

### 8.2 Generated Artifacts

- `*.blueprint.json`
- `*.grounding-report.json`
- `.bloop` patch assets in [`public/patches/`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/patches)

### 8.3 Current Showcase Assets

- [`ai-song-scaffold.bloop`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/patches/ai-song-scaffold.bloop)
- [`ai-flagship-song.bloop`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/patches/ai-flagship-song.bloop)

The flagship song is grounded to C natural minor at compile time and carries provenance metadata plus a grounding/evaluation report.

---

## 9. UX Systems

### 9.1 Onboarding and Themes

- Replayable onboarding modal
- Light / dark / system mode
- Accent palette customization with unlockable skins

### 9.2 Campaign Mode

- Optional left-side campaign panel
- Level verification against the live patch graph
- Unlocks skins and tutorial reward presets

### 9.3 Recording and Input

- Web MIDI input support
- Browser microphone / interface input via `getUserMedia`
- Session recording via MediaRecorder

---

## 10. Important Engineering Rules

- Keep all Tone runtime ownership inside [`store/useStore.ts`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/store/useStore.ts)
- Always dispose Tone nodes on cleanup
- Always rebuild the graph after relevant node/edge changes
- Use `rampTo(..., 0.1)` for parameter changes
- Do not overclaim math-edge authoring support while sender nodes are absent
- Treat `.agent/composer/*` as theory truth and the runtime codebase as execution truth

---

## 11. Key Files to Read First

- [`AGENTS.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/AGENTS.md)
- [`STYLE_GUIDE.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/STYLE_GUIDE.md)
- [`TICKETS.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/TICKETS.md)
- [`AI_SONG_AUTHORING.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/AI_SONG_AUTHORING.md)
- [`store/useStore.ts`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/store/useStore.ts)
- [`scripts/compile-ai-song-assets.mjs`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/scripts/compile-ai-song-assets.mjs)
