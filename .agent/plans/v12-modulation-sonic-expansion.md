# V12 — Modulation & Sonic Expansion

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v12, Bloop can make more expressive sounds and move them over time. Users can switch Generators into FM or AM modes, insert a dedicated EQ node to carve out frequencies, and route an LFO into exposed parameter targets using visible modulation cables. The experience stays beginner-friendly: sound design is still node-first, save/load still works, and motion comes from direct visual routing instead of hidden automation menus.

Depends on: v11 complete.

GitHub issues: #68, #69, #70, #71.

## Progress

- [ ] (2026-03-24) Read GitHub issues #68, #69, #70, and #71 in full.
- [ ] (2026-03-24) Milestone 1 — Parameter normalization and modulation domain: move parameter-bearing nodes to store-backed base values, add modulation edge types and handle conventions, and keep runtime modulation out of React state.
- [ ] (2026-03-24) Milestone 2 — Generator and EQ expansion: ship FM/AM generator engines and the new EQ node with persistence and routing support.
- [ ] (2026-03-24) Milestone 3 — LFO node: ship tempo-synced/free-running modulation with visible modulation edges and safe cleanup.
- [ ] (2026-03-24) Validate with `npm run build`, `npm run lint`, and browser audio checks covering save/load, undo/redo, and modulation audibility.
- [ ] (2026-03-24) Update `TICKETS.md`, close #68-#71, and record final outcomes here.

## Surprises & Discoveries

- Observation: current parameter-bearing nodes still keep important values in local component state.
  Evidence: `components/GeneratorNode.tsx`, `components/EffectNode.tsx`, `components/UnisonNode.tsx`, `components/DetuneNode.tsx`, `components/DrumNode.tsx`, `components/AdvancedDrumNode.tsx`, and `components/SamplerNode.tsx` all initialize local state and only push deltas into the store.
- Observation: the current edge model only distinguishes `audio` and `control`.
  Evidence: `ConnectionKind`, `getConnectionKind`, and `getEdgePresentation` in `store/useStore.ts` do not support a third routing domain.
- Observation: modulation cannot piggyback on existing auto-wire rules without becoming confusing.
  Evidence: adjacency currently auto-creates hidden edges based on node proximity in `autoWireAdjacentNodes`; that behavior is appropriate for note/audio flow but not for intentional parameter targeting.

## Decision Log

- Decision: add `modulation` as a new explicit edge kind and never auto-wire it.
  Rationale: parameter motion should be deliberate and visually obvious; hidden modulation edges would be hard to reason about and easy to create accidentally.
  Date: 2026-03-24
- Decision: treat `node.data` as persisted base values only, and keep runtime modulation as a separate overlay.
  Rationale: continuous LFO motion should not mutate React state every tick or overwrite saved values just by playing the patch.
  Date: 2026-03-24
- Decision: use `Tone.EQ3` with low/high crossover controls for the new tone-shaping node.
  Rationale: it satisfies the roadmap’s EQ requirement, adds sweepable range control for future automation, and avoids needing a separate filter node in v12.
  Date: 2026-03-24
- Decision: assign `zinc-400` to EQ and `lime-700` to LFO.
  Rationale: both are distinct from the current registry while keeping the controller/signal palettes readable.
  Date: 2026-03-24

## Outcomes & Retrospective

Pending implementation.

## Context and Orientation

`store/useStore.ts` is the core of this milestone. It owns `AudioNodeType`, `ConnectionKind`, node lifecycle, edge validation, `rebuildAudioGraph`, undo/redo rehydration, preset loading, and controller note dispatch. Any modulation or new node type work must start there.

`app/page.tsx` registers node components and sets the drag/drop defaults used when a node is added from the menus.

`components/GeneratorNode.tsx`, `components/EffectNode.tsx`, `components/UnisonNode.tsx`, `components/DetuneNode.tsx`, `components/DrumNode.tsx`, `components/AdvancedDrumNode.tsx`, and `components/SamplerNode.tsx` currently expose parameters that are partly local-state-driven. That must be normalized before modulation can target them safely.

`components/SignalMenu.tsx` and `components/ControllerMenu.tsx` surface the available node types. They must add EQ and LFO once the new node types exist.

`store/presets.ts` contains the built-in preset catalog. New node data must serialize cleanly there and through `.bloop` save/load.

`STYLE_GUIDE.md` is the required registry for new node accents and structural patterns. Update it before finalizing the new node UIs.

For this version, define these non-obvious terms explicitly:

Automatable parameter: a whitelisted Tone.js-backed control that can accept runtime modulation or future Arranger automation. Example targets include EQ band gain, EQ crossover frequency, effect wetness, unison depth, and detune pitch.

Base parameter: the persisted value stored in `node.data` and shown by the UI when the patch is idle.

Runtime modulation: a non-persisted offset or direct Tone.js param drive applied while the patch is playing. It must disappear cleanly when the source node or edge is removed.

## Plan of Work

Milestone 1 starts in `store/useStore.ts`. Extend `ConnectionKind`, `AppEdgeData`, and the handle constants with a modulation domain. Add edge validation, edge styling, and cleanup rules for modulation edges without touching audio/control auto-wire. At the same time, expand node data so parameter-bearing nodes render from store-backed base values. Replace local-only UI defaults with defaults written into node data at creation time or synced on node mount in the component.

Still in Milestone 1, add a central automatable-parameter registry. This should define the safe parameter keys per node type, the Tone.js param application logic, and the handle naming convention (`mod-in:<param>`). The runtime modulation layer should live in the store, not in component state, and it must be cleaned up in node removal, canvas clear, undo, redo, and load paths.

Milestone 2 adds richer sound-generation and tone-shaping. Extend `AudioNodeType`, node defaults, cleanup, and registration so a Generator can represent engine mode separately from wave shape. Update Generator UI to choose between legacy oscillator, FM, AM, and noise behaviors without breaking old patches. Add the EQ node as a normal serial audio node and register it everywhere required by AGENTS.md: unions, menus, `nodeTypes`, `SIGNAL_ORDER`, `VALID_AUTO_WIRE_PAIRS`, `NODE_DIMS`, preset labels, and cleanup.

Milestone 3 adds the LFO node. Create the node component, store runtime Tone.LFO instances in a dedicated map, and bind manual modulation edges to the target registry introduced earlier. Support sync/free rate selection, waveform, and depth. Validate that save/load and undo/redo recreate the LFO node and its modulation connections cleanly.

## Concrete Steps

    npm run dev
    # Verify the current v11 baseline and keep a browser session open for audio validation.

    # Milestone 1:
    # Edit store/useStore.ts to add modulation edge support, automatable param plumbing, and store-backed base params.
    # Update parameter-bearing node components to render from node.data instead of local drift state.

    # Milestone 2:
    # Add generator engine modes and the EQ node, then wire menus, defaults, cleanup, and preset support.

    # Milestone 3:
    # Add the LFO node and runtime modulation maps, then verify cleanup and persistence.

    npm run build
    npm run lint

## Validation and Acceptance

Build a patch using Keys → FM Generator → EQ → Effect → Amplifier and confirm the FM generator plays correctly, the EQ audibly changes tone, and the patch saves/loads without losing settings.

Build a second patch with an LFO routed into an EQ crossover or effect wetness parameter and confirm audible motion in both transport-synced and free-running modes.

Delete and undo an LFO or EQ node and confirm no ghost modulation or leaked Tone nodes remain.

Load a legacy preset containing only existing nodes and confirm it still behaves the same after parameter normalization lands.

## Idempotence and Recovery

Re-running `npm run build` and `npm run lint` is always safe.

Modulation runtime state must be disposable and rebuildable from current nodes and edges. If modulation cleanup gets out of sync, the safe recovery path is: clear runtime modulation maps, rebuild modulation bindings from current edges, then re-run `rebuildAudioGraph` for audio-domain safety.

When changing Generator engine instantiation, treat it like the current noise/non-noise swap: dispose old Tone nodes before creating new ones, and preserve persisted config in node data so load/undo can recreate the right engine.

## Interfaces and Dependencies

Add or extend these interfaces and concepts in `store/useStore.ts`:

- `AudioNodeType += 'eq' | 'lfo'`
- `ConnectionKind += 'modulation'`
- `AutomatableParamKey`
- `AutomatableParamDefinition`
- runtime maps for modulation sources and/or active modulation bindings
- handle IDs: `MODULATION_OUTPUT_HANDLE_ID` and parameter-specific modulation input handles

Tone.js dependencies expected for this version:

- `Tone.PolySynth(Tone.FMSynth)`
- `Tone.PolySynth(Tone.AMSynth)`
- `Tone.EQ3`
- `Tone.LFO`

No new npm packages are required.
