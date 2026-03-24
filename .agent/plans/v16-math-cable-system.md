# V16 — Math Cable System

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After V16, every major Bloop node can expose a dedicated math input receiver that accepts normalized modulation-style values without replacing the existing V12 LFO modulation system. Users will see a violet math port in the top-left of receiver nodes, choose which parameter it should drive, and be able to route future math senders into those receivers once sender nodes ship.

Depends on: V15 complete, V12 modulation still intact.

GitHub issues: #80, #81, #82, #83, #84, #85, plus follow-up V16 receiver tickets to cover the remaining nodes.

## Progress

- [x] (2026-03-24) Audit current store, node UIs, and existing V12 modulation overlap.
- [x] (2026-03-24) Milestone 1 — Add the V16 math edge domain, receiver target persistence, and normalized dispatch in `store/useStore.ts`.
- [x] (2026-03-24) Milestone 2 — Create the shared `components/MathInputHandle.tsx` receiver UI and shared selection reset hook.
- [x] (2026-03-24) Milestone 3 — Wire the original receiver batch into Generator, Effect, Speaker, and Controller.
- [x] (2026-03-24) Milestone 4 — Extend receiver support to the remaining single-field and contextual nodes.
- [x] (2026-03-24) Run `npx tsc --noEmit`, `npm run build`, and `npm run lint`.
- [x] (2026-03-24) Update `TICKETS.md` and record final outcomes here.

## Surprises & Discoveries

- Observation: the repo already ships a full V12 `modulation` edge domain with LFO senders and right-edge parameter handles.
  Evidence: `store/useStore.ts`, `components/LFONode.tsx`, `components/ModulationTargetHandle.tsx`, `components/EffectNode.tsx`, `components/EQNode.tsx`, `components/UnisonNode.tsx`, and `components/DetuneNode.tsx`.
- Observation: contextual editor targets are not all stored centrally today.
  Evidence: `components/PatternNode.tsx` stores `selectedNoteId` locally, and `components/ArrangerNode.tsx` stores `selectedSceneId` locally.
- Observation: some controls are deterministic and bounded but are not good fits for continuous math dispatch.
  Evidence: file pickers, MIDI device selectors, microphone permission toggles, and action buttons in sampler, MIDI In, Audio In, and transport-style nodes depend on external state or one-shot actions.
- Observation: `npx tsc --noEmit` depends on generated `.next/types` files in this repo, so it must run after a build or with an existing `.next` directory.
  Evidence: `tsconfig.json` includes `.next/types/**/*.ts`, and a concurrent `next build` temporarily removed those files during one validation run.
- Observation: GitHub currently only has V16 issues `#80` through `#86` open, so the Batch B and Batch C receiver expansion could not be mapped to dedicated issue numbers yet.
  Evidence: the repo issue index at `https://github.com/jball348-svg/Bloop/issues?q=is%3Aissue+is%3Aopen` lists only `#80`–`#86` as open issues.

## Decision Log

- Decision: keep the V12 `modulation` system untouched and add `math` as a parallel edge kind.
  Rationale: V12 is already implemented and working; V16 should prepare receiver nodes without breaking existing LFO patches.
  Date: 2026-03-24
- Decision: store the selected receiver target in `node.data.mathInputTarget` and dispatch math values through a typed store-side resolver.
  Rationale: the receiver needs to persist through save/load, while runtime dispatch should still reuse existing store actions and node-specific constraints.
  Date: 2026-03-24
- Decision: treat math targets as persistent parameter/state controls, not one-shot action buttons or external-resource selectors.
  Rationale: normalized cable input should map to stable state, not repeatedly fire play buttons or browser permission prompts.
  Date: 2026-03-24
- Decision: track Batch B and Batch C receiver coverage under `#80` in `TICKETS.md` until dedicated GitHub issues exist.
  Rationale: the implementation now covers more than the original four-node batch, but there are no open issue numbers yet for the extra receiver slices.
  Date: 2026-03-24

## Outcomes & Retrospective

V16 now has a complete receiver-side foundation in the working tree. `store/useStore.ts` understands a new `math` edge domain, persists receiver targets on nodes, styles math edges separately from audio/modulation, and dispatches normalized values through a typed per-node resolver that reuses existing store actions.

The shared `components/MathInputHandle.tsx` UI renders the top-left border break and selector, and receiver support now spans the original batch plus the broader deterministic-control set: Generator, Effect, Speaker, Controller, ADSR, Audio In, Drum, Advanced Drum, Unison, Detune, EQ, Sampler, Tempo, LFO, Quantizer, Keys, Chord, Visualiser, Mixer, Pulse, Mood Pad, Step Sequencer, Pattern, and Arranger.

Validation status:
- `npm run build` passed on 2026-03-24.
- `npm run lint` passed on 2026-03-24.
- `npx tsc --noEmit` passed on 2026-03-24 after regenerating `.next/types` via the build.

## Context and Orientation

`store/useStore.ts` owns edge kinds, node data shape, node lifecycle, validation, runtime audio/modulation rebuilding, and all mutable node actions. V16 must begin there.

`components/ModulationTargetHandle.tsx` and `components/LFONode.tsx` are the existing V12 modulation references. They must continue working after V16 lands.

`components/GeneratorNode.tsx`, `components/EffectNode.tsx`, `components/SpeakerNode.tsx`, and `components/ControllerNode.tsx` are the first receiver batch from the original issue breakdown.

The rest of the nodes with persistent bounded controls live in `components/AdsrNode.tsx`, `components/AudioInNode.tsx`, `components/DrumNode.tsx`, `components/AdvancedDrumNode.tsx`, `components/UnisonNode.tsx`, `components/DetuneNode.tsx`, `components/EQNode.tsx`, `components/SamplerNode.tsx`, `components/TempoNode.tsx`, `components/QuantizerNode.tsx`, `components/KeysNode.tsx`, `components/ChordNode.tsx`, `components/VisualiserNode.tsx`, `components/MixerNode.tsx`, `components/PulseNode.tsx`, `components/MoodPadNode.tsx`, `components/StepSequencerNode.tsx`, `components/PatternNode.tsx`, and `components/ArrangerNode.tsx`.

## Plan of Work

Milestone 1 extends the edge model with `math`, introduces math receiver target persistence on nodes, and adds a store-side `receiveMathValue(nodeId, normalizedValue)` dispatcher. The dispatcher must resolve the selected target, map `[0, 1]` to the real value or enum bucket, and call the appropriate existing store action.

Milestone 2 adds a reusable `MathInputHandle` component and shared selection-reset helper. The UI renders a top-left border break with a violet target handle and a compact selector inside the node.

Milestone 3 wires the original receiver batch: Generator, Effect, Speaker, and Controller.

Milestone 4 extends the same receiver pattern to the rest of the deterministic bounded node controls, including contextual targets for selected pattern notes, selected arranger scenes, and mixer channels.

## Concrete Steps

    # Store foundation
    # Edit store/useStore.ts to add math edge constants, edge validation, math target helpers,
    # target selection persistence, and normalized dispatch.

    # Shared UI
    # Add components/MathInputHandle.tsx.

    # Receiver batches
    # Update node components to render MathInputHandle, compute target options, and reset invalid targets.

    npx tsc --noEmit
    npm run build
    npm run lint

## Validation and Acceptance

Verify that existing V12 modulation still works: LFO edges remain lime, right-edge modulation handles still accept modulation edges, and `rebuildModulationGraph()` ignores math edges.

Verify that receiver nodes show a violet math port and selector, and that changing subtype or local editor context invalidates stale math targets back to `none`.

Directly call `receiveMathValue` in the store (or through a temporary console check in dev) against representative targets:
- Generator mix, mode, and FM parameters
- Effect wet plus subtype-specific controls
- Speaker volume
- ADSR envelope stages
- EQ band and crossover values
- Unison/Detune/Sampler/Pulse/Tempo/LFO/Quantizer/Keys/Chord/Mood Pad controls
- Step Sequencer selected-step controls
- Pattern selected-note controls
- Mixer master and per-channel controls
- Arranger selected-scene controls

## Idempotence and Recovery

Re-running `npx tsc --noEmit`, `npm run build`, and `npm run lint` is safe.

Math edges must not own runtime audio nodes, so the safe recovery path for any broken math routing is to reset `mathInputTarget` to `none`, remove the math edge, or reload the canvas state. Existing audio and V12 modulation rebuild paths must remain unchanged.

## Interfaces and Dependencies

Add or extend these interfaces in `store/useStore.ts`:

- `ConnectionKind += 'math'`
- `AppNode['data'].mathInputTarget?: string`
- `AppNode['data'].arpRate?: number`
- `AppEdgeData.mathTarget?: string`
- `setMathInputTarget(nodeId, targetId)`
- `receiveMathValue(nodeId, normalizedValue)`

Add the shared UI file:

- `components/MathInputHandle.tsx`

No new npm packages are required.
