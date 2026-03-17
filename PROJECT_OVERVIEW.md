# Bloop v1 Project Overview

This document is the end-of-v1 technical snapshot for Bloop. It is meant to capture the current implementation accurately before any v2 scoping begins.

## 1. Executive Summary

Bloop is a single-page visual audio sandbox built on React Flow for layout, Zustand for app state, and Tone.js for sound generation and processing. The core v1 idea is no longer just "draw cables between nodes." The shipped build combines explicit wiring with spatial patching:

- Nodes can still be connected manually with React Flow edges.
- Nodes that are horizontally adjacent can also auto-chain through hidden edges.
- The canvas reinforces that behavior through snapping, anti-overlap placement, and cyan adjacency glow.

The result is a more tactile patching model than the earlier MVP documentation described.

## 2. What Changed Since The Previous Documentation Pass

- The default boot graph is now pre-routed with hidden edges between the starter controller, generator, and speaker.
- Adjacency became a first-class mechanic. Nearby nodes are detected, highlighted, and auto-wired when their spacing and row alignment qualify.
- Dragging into overlap no longer leaves cards stacked awkwardly; drag-stop logic pushes nodes flush left or right and aligns them onto the same row.
- Manual edges are no longer the only routing story. Hidden auto-edges now participate in `rebuildAudioGraph`.
- `ControllerNode` gained octave selection for keyboard mode.
- Arpeggiation moved from a basic `setInterval` loop to `Tone.Sequence` running against `Tone.Transport`.
- Generator activity is now driven by real note state through `activeGenerators` in the store.
- Generator visuals were redesigned from blue to red and now match the toolbar.
- All node types now expose stronger "connected vs unconnected" feedback.
- Node cards gained per-type patterned surfaces to make modules easier to scan visually.

## 3. Runtime Architecture

### 3.1 UI Layer

The UI lives in `app/page.tsx` and renders a full-screen React Flow canvas. It owns:

- custom node registration
- drag-and-drop from the toolbar
- grid snapping
- edge update lifecycle callbacks
- drag-stop overlap resolution
- trash-bin hit detection
- adjacency recalculation triggers

### 3.2 State Layer

`store/useStore.ts` is the authoritative runtime model. It stores both visual graph state and audio runtime state:

- `nodes`: React Flow node definitions plus app-specific node data
- `edges`: manual edges plus hidden auto-managed edges
- `audioNodes`: `Map<string, Tone.ToneAudioNode>`
- `patterns`: retained disposable timing objects map
- `activeGenerators`: set of generator ids currently receiving note attacks
- `adjacentNodeIds`: set of nodes that qualify for adjacency glow
- `autoEdgeIds`: set of store-managed hidden edge ids

The store is also responsible for lifecycle work that would normally be split across components:

- audio node initialization
- subtype replacement and disposal
- graph rebuilds
- note dispatch from controllers to generators
- adjacency detection
- hidden auto-edge generation

### 3.3 Audio Layer

Tone.js nodes do not live in React component state. They live in the store and are recreated or disposed from there. This keeps the visual canvas and audio graph synchronized.

The key lifecycle is:

1. A node is added or initialized.
2. The store creates the correct Tone node for that visual node.
3. `rebuildAudioGraph()` disconnects existing routes and reconnects the graph based on current edges.
4. When nodes are removed or subtypes change, old Tone nodes are disconnected and disposed.

Controllers are the exception: they do not create audio nodes. They emit note events toward connected generators.

## 4. Canvas Interaction Model

### 4.1 Startup

The app launches behind `EngineControl`. The user must click `START AUDIO ENGINE`, which:

- calls `Tone.start()`
- starts `Tone.Transport`
- initializes the default nodes already present in store state

This is required to satisfy browser audio unlock behavior.

### 4.2 Drag And Drop

`Toolbar` places node types onto the drag payload via `application/reactflow`. On drop:

- the canvas converts screen coordinates to flow coordinates
- a node id is generated with `crypto.randomUUID()`
- a default subtype is chosen
- adjacency is recalculated on the next tick

Default subtypes:

- `controller` -> `arp`
- `generator` -> `wave`
- `effect` -> `reverb`
- `speaker` -> no subtype

### 4.3 Grid Snap

The canvas uses a `15px` snap grid. This applies during layout interaction before the custom drag-stop corrections run.

### 4.4 Anti-Overlap "Lego" Placement

On drag stop, the canvas:

- checks whether the node was dropped over the trash bin
- waits one tick so React Flow finalizes position
- compares the dragged node against all other nodes
- resolves overlap by pushing the dragged node flush to the left or right side of the obstacle
- aligns the dragged node to the obstacle's row
- repeats in multiple passes to handle chain reactions

This logic depends on hard-coded node dimensions that match the rendered Tailwind widths and heights.

### 4.5 Adjacency Detection

Adjacency is calculated from actual node positions and per-type dimensions.

Thresholds:

- horizontal gap must be between `0` and `48px`
- vertical center distance must be `<= 100px`

When two nodes qualify:

- both ids are added to `adjacentNodeIds`
- the cards render a cyan ring and glow
- auto-wiring is recalculated immediately after

### 4.6 Hidden Auto-Wiring

Auto-wiring is one of the biggest v1 changes.

Rules:

- auto-edge ids are prefixed with `auto-`
- auto-edges are stored in normal React Flow `edges`
- auto-edges are `hidden: true`, so they route audio without drawing visible cables
- manually drawn edges are preserved during auto-edge recalculation
- an auto-edge is skipped if a manual edge already exists for the same source/target pair

Allowed auto-wire direction pairs:

- `controller -> generator`
- `generator -> effect`
- `generator -> speaker`
- `effect -> effect`
- `effect -> speaker`

Signal direction is derived from a type order, not just left-to-right position:

- `controller`
- `generator`
- `effect`
- `speaker`

## 5. Audio Routing Details

`rebuildAudioGraph()` disconnects every Tone node first, then reconnects all current edges. Important behavior:

- controller edges are skipped for audio connections because controllers are note sources, not audio processors
- hidden auto-edges are included in audio routing
- speaker nodes are always reconnected to `Tone.Destination`

This means there are effectively two flows in the app:

- note flow: controller -> generator via `fireNoteOn` / `fireNoteOff`
- audio flow: generator/effect/speaker via Tone `.connect()`

## 6. Node Implementations

### 6.1 Controller Node

`components/ControllerNode.tsx` supports two controller modes.

Arpeggiator mode:

- stores `rootNote` and `scaleType` in node data
- builds note collections with `@tonaljs/tonal`
- runs a `Tone.Sequence` on `8n`
- uses `Tone.Transport` at `120 BPM`
- triggers short note-on / note-off bursts into downstream generators

Keyboard mode:

- maps the `A/W/S/E/D/F/T/G/Y/H/U/J/K` row to chromatic notes
- supports octave switching from `1` through `7`
- mirrors key state into the on-screen piano
- releases any held notes during cleanup

The controller also renders:

- adjacency glow when snapped near a valid neighbor
- a "not connected" band when no edge touches the node
- a staff-line background pattern

### 6.2 Generator Node

`components/GeneratorNode.tsx` is the playable sound source.

Implementation details:

- each generator owns a `Tone.PolySynth`
- waveform selection is applied through the synth oscillator config
- supported shapes are `sine`, `square`, `triangle`, and `sawtooth`
- activity lights are tied to `activeGenerators` in store state

The node now uses a red visual identity and shows an unconnected status band when isolated.

### 6.3 Effect Node

`components/EffectNode.tsx` is polymorphic and can swap its internal Tone node at runtime.

Supported subtypes:

- `reverb` -> `Tone.Freeverb`
- `delay` -> `Tone.FeedbackDelay`
- `distortion` -> `Tone.Distortion`
- `phaser` -> `Tone.Phaser`
- `bitcrusher` -> `Tone.BitCrusher`

Behavior:

- changing subtype disposes the old Tone node and creates a new one
- mix and bypass work through wet-value updates
- subtype-specific controls drive different Tone parameters
- UI control state such as mix, depth, time, and bypass currently lives in component state

The node also participates fully in adjacency glow and unconnected-state messaging.

### 6.4 Speaker Node

`components/SpeakerNode.tsx` wraps a `Tone.Volume` routed to destination.

Behavior:

- initializes to `80%` volume on mount
- supports mute and volume slider control
- converts UI volume into decibel values through the store
- uses `rampTo(..., 0.1)` for smoother volume changes

It also renders adjacency glow and the unconnected banner when isolated.

### 6.5 Engine Control

`components/EngineControl.tsx` is a full-screen blocker until audio is unlocked. It is intentionally simple and acts as the runtime gate for initial node creation.

## 7. Parameter Update Behavior

The store's `updateNodeValue()` function handles most runtime parameter writes.

Notable behavior:

- wave shape changes are mirrored back into node data
- `Tone.Volume` updates use a smoothed ramp
- effect wet controls are ramped where supported
- delay time and phaser frequency are smoothed
- bit depth and distortion amount are applied directly

This keeps UI movement from producing harsh jumps in the most obvious realtime cases.

## 8. Visual System

The v1 visual language is now more specific than the previous docs captured.

Node colors:

- controller: amber/yellow
- generator: red
- effect: fuchsia
- speaker: emerald

Shared canvas language:

- dark slate background
- dotted React Flow grid
- cyan adjacency/routing accent
- cyan-glow manual edges
- dashed preview line while connecting

Per-node textures:

- controller: horizontal staff lines
- generator: vertical frequency bars
- effect: diagonal stripes
- speaker: speaker-grill dot pattern

## 9. File Map

| File | Responsibility |
| :--- | :--- |
| `app/page.tsx` | Canvas orchestration, drag/drop, snapping, overlap resolution, trash deletion, and adjacency refresh. |
| `store/useStore.ts` | Store state, Tone node lifecycle, note dispatch, adjacency detection, hidden auto-edge management, and audio graph rebuilds. |
| `components/ControllerNode.tsx` | Arpeggiator and keyboard controller behavior, keyboard listeners, scale selection, and octave selection. |
| `components/GeneratorNode.tsx` | PolySynth waveform source with active-note status UI. |
| `components/EffectNode.tsx` | Runtime-switchable effect node with mix/bypass and subtype-specific controls. |
| `components/SpeakerNode.tsx` | Output gain control and mute UI. |
| `components/Toolbar.tsx` | Drag source for spawning new modules. |
| `components/EngineControl.tsx` | Audio unlock gate and default-node initialization entry point. |
| `app/globals.css` | Tailwind import plus React Flow surface styling. |

## 10. Current v1 Constraints To Remember Before v2

- There is no persistence layer yet for patches or user settings.
- Effect and speaker control UI state is mostly local to the component layer rather than fully serialized into node data.
- Auto-wiring is strictly proximity-based and focused on horizontal chain building.
- The app assumes a browser environment with direct keyboard access and an explicit audio-unlock action.
- There is no automated test suite in the repository yet.

## 11. Guidance For Future Changes

If v2 work touches audio behavior, routing, adjacency, or node lifecycle, start with `store/useStore.ts`. If v2 work changes how patching feels on the canvas, read `app/page.tsx` and the store together, because layout behavior and audio routing are now tightly coupled through adjacency and hidden auto-edges.
