# V14 — Mixer & Arrangement

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v14, Bloop can structure and balance a real song instead of only looping a patch. Users can route multiple sound sources into a dedicated Mixer node with channel strips, then use an Arranger node to move the patch through sections such as intro, verse, and chorus on exact bar boundaries.

Depends on: v13 complete.

GitHub issues: #75, #76.

## Progress

- [ ] (2026-03-24) Read GitHub issues #75 and #76 in full.
- [ ] (2026-03-24) Milestone 1 — Mixer node: add explicit master-bus routing, channel strips, persistence, and legacy speaker compatibility.
- [ ] (2026-03-24) Milestone 2 — Arranger node: add section scenes, bar-boundary scheduling, and target node control for Pattern and rhythm nodes.
- [ ] (2026-03-24) Validate with `npm run build`, `npm run lint`, and browser tests covering routing, solo/mute, and section changes.
- [ ] (2026-03-24) Update `TICKETS.md`, close #75-#76, and record final outcomes here.

## Surprises & Discoveries

- Observation: current output routing is implicit and global.
  Evidence: `rebuildAudioGraph` auto-connects unrouted audio nodes directly to `masterOutput` whenever a `speaker` node exists, and the `speaker` itself has no audio handles.
- Observation: Global singleton behavior is already enforced in node creation.
  Evidence: `addNode` and the Global menu already prevent multiple Tempo/Speaker instances.
- Observation: rhythm playback already has node-level play/stop plumbing.
  Evidence: `toggleNodePlayback` supports `stepsequencer`, `advanceddrum`, and other time-based nodes, which gives the Arranger a clean first target set.

## Decision Log

- Decision: introduce `mixer` as a new singleton and keep `speaker` only for legacy loading.
  Rationale: it preserves old patch compatibility without forcing a risky one-shot migration of the current broadcast model.
  Date: 2026-03-24
- Decision: keep Arranger v1 focused on starting/stopping Pattern and rhythm nodes at bar boundaries.
  Rationale: that delivers song structure without overloading v14 with parameter automation or arbitrary node orchestration.
  Date: 2026-03-24
- Decision: assign `emerald-700` to Mixer and `indigo-700` to Arranger.
  Rationale: both sit near the current global-node palette while remaining distinct from Tempo and legacy Speaker.
  Date: 2026-03-24

## Outcomes & Retrospective

Pending implementation.

## Context and Orientation

`store/useStore.ts` currently assumes one broadcast-style output node (`speaker`) and uses `masterOutput` as the final Tone.Volume to destination. V14 must preserve that for old patches while adding a new explicit routed destination for new ones.

`components/GlobalMenu.tsx` is where the singleton creation affordances live. It currently exposes Tempo, Amplifier, MIDI In, and Audio In. Mixer and Arranger belong here once implemented.

`store/presets.ts` and `.bloop` save/load are important in this milestone because new routed patches will need to persist Mixer and Arranger data cleanly, and legacy `speaker` patches must remain loadable.

The Arranger should build on the Pattern work from v13, but it should also be able to control existing rhythm nodes that already understand `toggleNodePlayback`.

## Plan of Work

Milestone 1 creates the Mixer node and its routing model. Add `mixer` to `AudioNodeType`, node registration, menus, dimensions, and preset labels. Create a dedicated mixer runtime chain in the store with channel strips keyed by incoming source node IDs. Each strip needs volume, pan, mute, and solo state, plus a master stage that still feeds the recorder and destination. Update routing so new patches can explicitly wire audio into the Mixer without breaking old `speaker`-based broadcast patches.

Still in Milestone 1, keep legacy compatibility explicit. `speaker` should remain loadable from older patches and presets, but it should stop appearing in the creation menu once Mixer is available. Preserve existing recording/export behavior by ensuring the recorder taps the post-mixer master bus for new patches and the legacy master output for old ones.

Milestone 2 adds the Arranger. Add `arranger` to node registration and create a node data model for scenes keyed to bar ranges or bar starts. The Arranger runtime should watch transport bar position and issue play/stop commands to target Pattern and rhythm nodes exactly on section boundaries. Scene data must persist through save/load, undo/redo, and preset promotion.

## Concrete Steps

    npm run dev
    # Verify v13 clip playback is stable before changing master routing.

    # Milestone 1:
    # Add the Mixer node, runtime channel-strip model, and explicit routed output path.
    # Keep legacy speaker loading intact while removing it from new-node menus.

    # Milestone 2:
    # Add the Arranger node, scene data model, and bar-boundary scheduling.

    npm run build
    npm run lint

## Validation and Acceptance

Create a patch with at least three sources, for example Pattern bass, Advanced Drums, and a pad Generator, all routed into Mixer. Confirm each source gets its own strip and that pan, mute, solo, and volume all behave audibly.

Record the mixed patch and confirm the exported recording reflects the post-mixer balance.

Create Arranger scenes for intro, verse, and chorus that start/stop different Pattern or rhythm nodes. Verify section changes happen exactly on bar boundaries and remain stable across tempo changes.

Load an older preset containing a `speaker` node and confirm it still plays correctly.

## Idempotence and Recovery

Mixer strip runtime state must be disposable and rebuildable from current edges and persisted mixer data. If routing gets out of sync, the safe recovery path is to clear mixer runtime maps, rebuild strips from current incoming audio edges, then reconnect the final bus.

Arranger scene evaluation should be transport-derived, not wall-clock-derived. If a scene transition fires incorrectly, restarting transport and rebuilding the current section from the persisted scene list should restore correctness.

## Interfaces and Dependencies

Add or extend these concepts:

- `AudioNodeType += 'mixer' | 'arranger'`
- `MixerChannelState`
- Mixer runtime chain map and cleanup rules
- `ArrangerScene`
- Arranger target references for Pattern and rhythm nodes

Likely file touchpoints:

- `store/useStore.ts`
- `app/page.tsx`
- `components/GlobalMenu.tsx`
- new Mixer node component
- new Arranger node component
- `store/presets.ts`
- `STYLE_GUIDE.md`

No new npm packages are required.
