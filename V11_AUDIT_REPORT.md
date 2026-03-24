# V11 Stabilization Audit Report

## Phase 1: Discovery & Documentation Audit
- [x] Read `PROJECT_OVERVIEW.md`, `AGENTS.md`, `STYLE_GUIDE.md`, and `TICKETS.md`
- [x] Analyze `store/useStore.ts` mapping to React Flow and Tone.js
- [x] Create this report and checklist

## Phase 2: Systematic Verification & Bug Squashing

### 1. The Core Store
- [x] `useStore.ts` - Audit for race conditions
- [x] `useStore.ts` - Audit for memory leaks (Tone.js components disposing properly)
- [x] `useStore.ts` - Audit state sync between React Flow and Tone.js
- [x] `usePreferencesStore.ts` - Audit logic and persistence

### 2. Controller Nodes
*Check logic: ensure they correctly output control signals/triggers.*
- [x] Arp
- [x] Keys
- [x] MIDI In
- [x] ADSR
- [x] Pulse
- [x] Chord
- [x] Step Sequencer
- [x] Mood Pad

### 3. Signal Nodes
*Check logic: ensure audio routes correctly through cables, inputs/outputs aren't mismatched.*
- [x] Generator
- [x] Sampler
- [x] Audio In
- [x] Drums
- [x] Effect
- [x] Unison
- [x] Detune
- [x] Quantizer
- [x] Visualiser

### 4. Canvas Mechanics
- [x] Spatial snapping
- [x] Adjacency detection
- [x] Signal Flow animation overlay
- [x] Undo/Redo history limits (50 steps max, proper snapshotting)

### 5. System & I/O
- [x] Logic for saving/loading `.bloop` files
- [x] Browser `.webm` recording
- [x] Web MIDI API teardowns

## Phase 3: Final Polish
- [x] Run a linter/type-checker pass and fix any remaining TypeScript warnings/unused imports
- [x] Update inline comments for any complex logic refactored in `useStore.ts`
- [x] Update bottom of this report with a summary of the health of the application.

---
## Defect & Fix Log

1. **Bug:** `drumPadTimeouts` dictionary was not cleared in `useStore.ts` `clearCanvas()`.
   **Fix:** Added `drumPadTimeouts.forEach((timeoutId) => clearTimeout(timeoutId)); drumPadTimeouts.clear();` to ensure no ghost blinking pads remain after clearing the canvas.
2. **Bug:** React Flow `remove` events bypassed `Tone.js` node cleanup, causing severe ghost audio and memory leaks when deleting nodes with the Backspace key.
   **Fix:** Rewrote the `onNodesChange` handler in `useStore.ts` to explicitly intercept `{ type: 'remove' }` events, apply `removeAudioNode`, generate a new snapshot, and safely clear out the instances before handing the filtered nodes back to React Flow.
3. **Architecture Note:** `ControllerNode` (Arp) uses `setTimeout` to trigger NoteOffs and relies on main-thread synchronous state updates for UI, resulting in non-sample-accurate playback jitter. However, since Bloop couples Audio dispatch intimately with Zustand UI state logic (`generatorNoteCounts`), decoupling them for sample-accuracy would mean fracturing the UI/Audio sync. Thus, this is maintained as a known, acceptable tradeoff for this application's target audience.

---
## Final Application Health Summary

**Status: STABLE**

Bloop V11 has passed the stabilization audit. 
* Critical memory leaks due to React Flow `remove` events lacking `Tone.js` teardowns have been patched securely natively through `useStore.ts` `onNodesChange`.
* Global timeout leaks in drum nodes mapping logic have correctly received cleanup directives in `clearCanvas()`.
* The Controller-to-Signal dispatch system handles inputs correctly. The tight coupling of UI and Tone.js logic creates some non-sample-accurate triggering (such as the Arpeggiator jitter tradeoff), but securely avoids hanging audio context queues.
* Canvas Mechanics smoothly resolve collisions without dropping connections.
* Strict-mode `npm run build` and `npm run lint` report no errors.

The architecture is sound. Bloop is ready for the V12 feature development roadmap.
