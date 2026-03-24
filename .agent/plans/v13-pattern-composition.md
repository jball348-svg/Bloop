# V13 — Pattern Composition & Gate Accuracy

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v13, Bloop can write melodies and harmonies as real reusable clips instead of only step-by-step triggers. Users can double-click a Pattern node to open a piano-roll editor, draw notes over multiple bars, overlap notes to form chords, and rely on accurate note lengths so ADSR plucks, pads, and sampler releases behave musically.

Depends on: v12 complete.

GitHub issues: #72, #73, #74.

## Progress

- [ ] (2026-03-24) Read GitHub issues #72, #73, and #74 in full.
- [ ] (2026-03-24) Milestone 1 — Pattern engine: add clip data types, transport scheduling, persistence, and playback integration.
- [ ] (2026-03-24) Milestone 2 — Piano roll UI: ship the Pattern node and its editor for multi-bar note authoring.
- [ ] (2026-03-24) Milestone 3 — Gate accuracy: add note-instance-aware release handling for ADSR, generators, and samplers.
- [ ] (2026-03-24) Validate with `npm run build`, `npm run lint`, and browser tests for chords, overlaps, save/load, and undo/redo.
- [ ] (2026-03-24) Update `TICKETS.md`, close #72-#74, and record final outcomes here.

## Surprises & Discoveries

- Observation: the store already has a generic `patterns` map that can hold more than `Tone.Loop`.
  Evidence: `DisposablePattern` only requires `stop()` and `dispose()`, which aligns with `Tone.Part` and gives a clean migration path from loop-only playback.
- Observation: current note-off logic is keyed by controller ID plus note name.
  Evidence: `fireNoteOn` and `fireNoteOff` in `store/useStore.ts` collect dispatches by note and do not distinguish overlapping note instances from the same source.
- Observation: the current Step Sequencer remains useful for simple looping and should not be removed.
  Evidence: it is already wired into presets and controller menus, and the roadmap frames the Pattern node as an upgrade path for complex writing rather than a full replacement.

## Decision Log

- Decision: make the Pattern node additive; keep the Step Sequencer for simple cases.
  Rationale: beginner-friendly immediacy matters, and not every patch needs a piano roll.
  Date: 2026-03-24
- Decision: store Pattern notes in step/grid units instead of raw Tone time strings.
  Rationale: the editor is grid-based, step units are easier to serialize and edit, and the store can convert them into Tone transport times at runtime.
  Date: 2026-03-24
- Decision: use `Tone.Part` for Pattern playback.
  Rationale: it supports arbitrary note timing and overlaps better than a fixed-step loop.
  Date: 2026-03-24
- Decision: assign `blue-700` to Pattern.
  Rationale: it stays visually related to the Step Sequencer without colliding with its current `blue-500` accent.
  Date: 2026-03-24

## Outcomes & Retrospective

Pending implementation.

## Context and Orientation

`store/useStore.ts` already has controller dispatch, generator note counting, sampler triggering, ADSR envelope application, undo/redo rehydration, and transport-aware loop scheduling. V13 extends that system rather than replacing it.

`components/StepSequencerNode.tsx` is the closest current analogue for playback UX, but it is strictly step-based and stores a fixed array of 16 simple note steps. The Pattern node must go beyond that by allowing arbitrary start positions and lengths.

`app/page.tsx`, `components/ControllerMenu.tsx`, and `store/presets.ts` must register the new `pattern` type everywhere a user can add, load, or save it.

The current gate model is the main audio-engine risk in this version. Repeated notes of the same pitch from the same source can currently interfere with each other because release handling is note-name-based, not instance-based.

## Plan of Work

Milestone 1 adds the clip engine. Extend `AudioNodeType`, `AppNode['data']`, default-node creation, undo/redo serialization, and preset loading so a Pattern node can store clip metadata and note arrays. Generalize the runtime `patterns` map to manage `Tone.Part` instances. Integrate Pattern playback into the existing controller-dispatch path so connected generators, samplers, chords, quantizers, and ADSR nodes still behave through the current graph model.

Milestone 2 adds the actual editor UX. Create a `PatternNode` component that shows a compact summary on the canvas and opens a piano-roll editor on double-click. The editor must support note creation, drag, resize, deletion, loop length changes, and simple per-note velocity editing. Keep editor state in the store-backed node data so save/load and undo/redo work automatically.

Milestone 3 fixes note-off correctness. Extend the dispatch and release path so Pattern playback tracks note instances rather than only note names. This must preserve current controller behavior while making duration-based clips reliable for ADSR, generators, and samplers.

## Concrete Steps

    npm run dev
    # Verify v12 is stable before starting the clip engine.

    # Milestone 1:
    # Add Pattern types and runtime scheduling in store/useStore.ts.
    # Register the node in app/page.tsx, menus, dimensions, routing, and preset support.

    # Milestone 2:
    # Build the Pattern node and editor surface.

    # Milestone 3:
    # Replace note-name-only release handling with note-instance-aware release paths.

    npm run build
    npm run lint

## Validation and Acceptance

Author a 4-bar clip with a sustained pad note under shorter melodic notes and verify both sustain and short notes play correctly without cutting each other off.

Author a chord progression with overlapping notes and verify connected Generators and Samplers respond polyphonically.

Route Pattern → ADSR → Generator and confirm note-off timing follows each note’s length instead of a guessed fixed gate.

Save the patch to `.bloop`, reload it, and confirm the Pattern editor restores the exact note layout and playback.

Undo and redo note edits in the editor and confirm node playback follows the restored state each time.

## Idempotence and Recovery

The Pattern runtime should be fully rebuildable from `node.data`. If playback gets out of sync, the safe recovery path is to dispose existing `Tone.Part` instances, rebuild them from the stored note arrays, and restart only the nodes marked `isPlaying`.

The editor should never own the source of truth for note data. If local modal state is used for interaction performance, it must write through to store-backed data before close and be reproducible from store state after reload.

## Interfaces and Dependencies

Add or extend these concepts:

- `AudioNodeType += 'pattern'`
- `PatternNote`
- `PatternClip` or equivalent clip metadata shape
- default Pattern note factory/helper
- Pattern runtime entries in the existing `patterns` map
- note-instance tracking structures for duration-correct release handling

Likely file touchpoints:

- `store/useStore.ts`
- `app/page.tsx`
- `components/ControllerMenu.tsx`
- `store/presets.ts`
- new Pattern node component
- `STYLE_GUIDE.md`

Tone.js dependency expected for this version:

- `Tone.Part`

No new npm packages are required.
