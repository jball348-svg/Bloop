# V15 — Automation, Performance, & Showcase Preset

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v15, Bloop can carry a full arranged song through the finish line. Users can add parameter automation to arranged sections, run larger node graphs without the canvas bogging down, and promote a saved `.bloop` song into the built-in preset library as the flagship showcase patch for the app.

Depends on: v14 complete.

GitHub issues: #77, #78, #79.

## Progress

- [ ] (2026-03-24) Read GitHub issues #77, #78, and #79 in full.
- [ ] (2026-03-24) Milestone 1 — Arranger automation lanes: add runtime automation targeting on top of the shared automatable-parameter registry.
- [ ] (2026-03-24) Milestone 2 — Performance pass: reduce avoidable React Flow rerenders and isolate transport/runtime state from canvas rendering.
- [ ] (2026-03-24) Milestone 3 — Showcase preset pipeline: add the built-in promotion path for a user-authored song patch and validate shipped asset handling.
- [ ] (2026-03-24) Validate with `npm run build`, `npm run lint`, and browser tests on a large arranged patch.
- [ ] (2026-03-24) Update `TICKETS.md`, close #77-#79, and record final outcomes here.

## Surprises & Discoveries

- Observation: current node components frequently subscribe to `state.nodes.find(...)`.
  Evidence: many node components select their data by scanning the full node array, which is acceptable for small patches but a poor fit for the roadmap’s 50+ node showcase goal.
- Observation: the preset catalog is code-defined and not currently designed for promoting a saved song patch into a built-in entry.
  Evidence: `store/presets.ts` defines the built-in library inline, while `.bloop` save/load works through `components/SystemMenu.tsx`.
- Observation: Arranger automation must reuse the v12 base/runtime split instead of overwriting persisted values.
  Evidence: the v12 plan deliberately separates stored base params from runtime modulation, and v15 needs the same rule to avoid changing a patch just by playing it.

## Decision Log

- Decision: keep automation lanes owned by the Arranger instead of introducing a separate automation node.
  Rationale: arrangement-aware automation belongs to the song-structure surface and avoids adding another global authoring concept.
  Date: 2026-03-24
- Decision: performance work will prioritize selector isolation and runtime-store separation before deeper micro-optimizations.
  Rationale: the repo’s most visible current risk is broad React subscriptions and local/state drift, not a missing low-level optimization library.
  Date: 2026-03-24
- Decision: the showcase promotion path will remain platform-first.
  Rationale: the repo should ship the tooling and validation for a flagship song preset while leaving the musical composition itself user-authored inside Bloop.
  Date: 2026-03-24

## Outcomes & Retrospective

Pending implementation.

## Context and Orientation

This version depends on all earlier groundwork. The Arranger from v14 provides section timing. The modulation registry from v12 provides the safe list of targetable parameters. The Mixer from v14 provides the channels likely to receive automation. The Pattern engine from v13 provides the clips that make the final song meaningful.

`store/useStore.ts` remains the most important file. It will own automation lane data, runtime automation application, transport synchronization, cleanup, preset loading, and performance-sensitive state organization.

`components/SystemMenu.tsx` and `store/presets.ts` are the delivery surface for the showcase preset pipeline. The user-authored song must graduate from a saved `.bloop` patch into a built-in preset entry without manual fragile rewrites.

`public/` becomes relevant in this version because a showcase song may need shipped sample references. Use stable asset URLs there rather than embedding large sample blobs into source files when promoting the final preset.

## Plan of Work

Milestone 1 adds Arranger-owned automation lanes. Extend Arranger scene data so a scene can own stepped or ramped parameter events targeting the shared automatable registry. Apply automation at runtime as an overlay on top of base params rather than by mutating `node.data` on every tick. Persist automation lane data through save/load, undo/redo, and preset promotion.

Milestone 2 is the performance pass. Audit node components and replace broad `nodes.find(...)` selectors with id-scoped selectors or small helper hooks so each node only re-renders when its own data changes. Remove remaining local-only parameter drift. Ensure transport and automation runtime changes do not force whole-canvas rerenders where avoidable.

Milestone 3 adds the showcase preset pipeline. Add a featured-showcase category or slot in the preset library, then create a repeatable path for promoting a saved `.bloop` patch into `store/presets.ts` and, when needed, `public/` sample assets. The implementation can include a small dev helper script if that makes the promotion workflow reliable and repeatable.

## Concrete Steps

    npm run dev
    # Verify v14 arrangement and mixer behavior before starting automation.

    # Milestone 1:
    # Extend Arranger data and runtime scheduling to support automation lanes.

    # Milestone 2:
    # Refactor node selectors, remove local-only drift, and profile a large arranged patch in the browser.

    # Milestone 3:
    # Add the showcase preset promotion path and validate built-in loading.

    npm run build
    npm run lint

## Validation and Acceptance

Author a song patch with at least one Pattern bass line, one rhythm source, one pad or lead source, Mixer balancing, and Arranger sections. Add automation to a musically useful target such as EQ crossover, effect wetness, or Mixer channel volume and confirm audible stepped and ramped changes during arranged playback.

Verify that playing the song does not overwrite the saved base values shown in node UIs.

Measure the behavior of a 50+ node patch during playback and confirm the canvas remains usable while transport, modulation, and automation are active.

Promote a saved `.bloop` song into the built-in preset library, load it from System > Presets, and confirm all new node data restores correctly. If the patch uses samples, confirm those samples load from stable shipped `public/` paths.

## Idempotence and Recovery

Automation runtime state must be disposable and reconstructible from Arranger scene data. If automation gets stuck or diverges, the safe recovery path is to clear active automation overlays, reapply base params from `node.data`, then rebuild active automation from the current transport position.

The showcase promotion path should be repeatable. If a promotion helper is added, design it so rerunning it produces a stable preset entry rather than duplicating records or changing IDs unexpectedly.

Performance refactors should remain behavior-preserving. Keep `npm run build`, `npm run lint`, and one large manual browser patch as the invariant checks after each batch of selector changes.

## Interfaces and Dependencies

Add or extend these concepts:

- `AutomationLane`
- `AutomationPoint` or equivalent stepped/ramped event shape
- Arranger scene data extended with automation targets
- selector helpers or small hooks for node-by-id data access
- optional dev helper for promoting `.bloop` patches into built-in presets

Likely file touchpoints:

- `store/useStore.ts`
- `app/page.tsx`
- node components with broad `state.nodes.find(...)` selectors
- `components/SystemMenu.tsx`
- `store/presets.ts`
- `public/`

No new npm packages are required unless a later discovery proves a profiling or serialization helper is necessary.
