# V5 — The Bang Update: Pulse Node, Step Sequencer & Signal Flow Visualisation

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v5, Bloop moves from being a loop-only instrument to a generative, event-driven one. A user can place a Pulse node, connect it to a Step Sequencer, and watch 16 steps fire in sequence — each step triggering a specific note on a connected Generator. They can set the Pulse to fire every beat, every half-beat, or at a free interval independent of the global tempo. They can enable Signal Flow Visualisation to see glowing orbs travel along the cables in real time, making the routing tangible and beautiful. This is the foundation for all complex sequencing in subsequent versions.

Depends on: v4 complete (all of #33, #34, #36, #37 closed).

GitHub issues: #38 (Pulse Node), #39 (Step Sequencer), #40 (Signal Flow Visualisation).

## Progress

- [x] (2026-03-23) Read GitHub issues #38, #39, #40 in full
- [x] (2026-03-23) Milestone 1 — Pulse Node (#38): add Pulse node UI, transport/free-run loop scheduling, manual trigger, and pulse-to-generator / pulse-to-sequencer dispatch
- [x] (2026-03-23) Milestone 2 — Step Sequencer (#39): add editable 16-step sequencer node with pulse clock input and direct tempo-sync mode
- [x] (2026-03-23) Milestone 3 — Signal Flow Visualisation (#40): add toggleable animated orb overlay for control/audio signal activity with auto-disable on slow frames
- [x] (2026-03-23) npm run build and npm run lint pass
- [x] (2026-03-23) Update TICKETS.md, close GitHub issues #38, #39, #40

## Surprises & Discoveries

- Observation: The existing `patterns` map in `store/useStore.ts` was effectively unused before v5.
  Evidence: cleanup logic already existed for `patterns`, but no active node type was writing loops into it, so it was a clean place to store Pulse and Sequencer `Tone.Loop` instances.
- Observation: Signal flow visualisation is much easier to keep cosmetic-only when driven from a lightweight event list instead of querying live edge DOM paths.
  Evidence: rendering animated SVG circles in a viewport-synced overlay avoided mutating React Flow state and kept the feature independent from audio timing.
- Observation: Direct pulse-to-generator triggering needed its own gate bookkeeping.
  Evidence: using the existing note trigger/release flow avoided stuck-note regressions when pulses hit the same generator repeatedly.

## Decision Log

- Decision: Assign `lime-500` to Pulse and `blue-500` to Step Sequencer.
  Rationale: Both colors were still available in the style guide registry and are visually distinct from the existing controller palette while staying legible on the dark canvas.
  Date: 2026-03-23
- Decision: Keep Pulse and Step Sequencer as control-domain nodes with no Tone audio node instances.
  Rationale: Their job is event scheduling/dispatch, so storing only `Tone.Loop` clock objects in `patterns` preserves the repo's “audio objects live in the store” rule without inventing fake audio nodes.
  Date: 2026-03-23
- Decision: Emit signal-flow events from store actions and animate them in a separate overlay.
  Rationale: This makes the visualisation purely observational, keeps audio timing untouched, and lets the system auto-disable itself on poor frame pacing.
  Date: 2026-03-23

## Outcomes & Retrospective

V5 is complete. Bloop now has a reusable pulse-clock node, a proper step sequencer that can run from either a pulse input or direct transport sync, and a toggleable signal-flow teaching mode that makes both control and audio routing visible without interfering with playback.

## Context and Orientation

Bloop's controller domain currently uses setInterval-based timing in ControllerNode.tsx (the Arp). This is fragile and does not integrate with Tone.js Transport. For v5, all timing must use Tone.js Transport scheduling. A Tone.js `Tone.Loop` or `Tone.Sequence` receives its clock from `Tone.Transport`, which is already started in `EngineControl.tsx`.

The control signal domain carries note events (note name strings like 'C4'). The `fireNoteOn(controllerId, note)` and `fireNoteOff(controllerId, note)` actions in `store/useStore.ts` dispatch note events to all nodes connected downstream from a given controller. The Pulse node extends this: it fires a trigger (which may include a stored note value) to downstream nodes on a schedule.

Max/MSP's "Bang" is the conceptual model for the Pulse node: a stateless discrete trigger with no inherent pitch. The Step Sequencer stores pitch per step and uses incoming Pulses as its clock advance signal.

For Signal Flow Visualisation: React Flow edges are SVG paths. Animating an orb along an edge requires either CSS animation along the SVG `path` element (using `stroke-dashoffset` or a moving element along the path), or a canvas overlay. The simplest reliable approach is a React component that renders a small `<circle>` element and animates it along the edge's SVG path using `requestAnimationFrame` and the path's `getTotalLength` / `getPointAtLength` APIs.

This visualisation must be purely cosmetic — it must never affect audio timing or React Flow's internal state.

## Plan of Work

### Milestone 1 — Pulse Node (#38)

Create `components/PulseNode.tsx`. This is a controller-domain node (it fires events but has no Tone.js audio node). Its colour should be a new unique colour not in the existing registry — check STYLE_GUIDE.md and choose from available colours (lime-400 is a candidate but verify it is not taken).

The node UI contains: a rate selector (musical subdivisions: 1/1, 1/2, 1/4, 1/8, 1/16) and a "Sync to Tempo" toggle. When Sync is on, the Pulse fires at the selected subdivision of `Tone.Transport`. When Sync is off, it fires at a user-defined interval in milliseconds.

In `store/useStore.ts`: add `'pulse'` to the `AudioNodeType` union. Add `initAudioNode` handling for `'pulse'` — the Pulse node has no Tone.js audio node (like the Arp), but it does need a `Tone.Loop` instance stored in the `patterns` Map (the same Map already used for Arp patterns). On `firePulse(pulseId)`, dispatch to all downstream nodes using the same pattern as `fireNoteOn` — iterate edges from this source, find targets, and call the appropriate trigger on each target.

If a Pulse fires at a Generator directly (no Step Sequencer in between), it should trigger `triggerAttack` with the Generator's default note (C4) and schedule a release after a short gate time (e.g. 100ms).

Add Pulse to `SIGNAL_ORDER`, `VALID_AUTO_WIRE_PAIRS`, `NODE_DIMS`, the `ControllerMenu.tsx` Sequencing sub-section (which will be added in v6 — for now, add it to `ControllerMenu.tsx` directly), and `nodeTypes` in `app/page.tsx`.

### Milestone 2 — Step Sequencer (#39)

Create `components/StepSequencerNode.tsx`. This is also a controller-domain node (fires note events, no audio node). Colour: choose an available colour from STYLE_GUIDE.md.

The node displays a 16-step grid (4×4 or 1×16 — choose whichever fits the node dimensions from NODE_DIMS). Each step cell contains: an on/off toggle and a pitch selector (C3–C5 range, or a simplified note name dropdown). Clicking a step cell toggles it on/off. The active step is highlighted.

The Step Sequencer advances by one step each time it receives a Pulse from an upstream Pulse node. It also has a direct "Sync to Tempo" option that uses an internal `Tone.Loop` if no Pulse is connected.

In `store/useStore.ts`: add `'stepsequencer'` to `AudioNodeType`. The sequencer state (which steps are on, the note per step, current step index) lives in the node's `data` in the React Flow nodes array (not in the audio Map, since there is no Tone.js audio node). The step advance action is `advanceSequencerStep(id)`, called either by an incoming Pulse or by the internal Tone.Loop.

On step advance: if the current step is active, call `fireNoteOn(id, step.note)` to all connected Generator nodes, and schedule `fireNoteOff` after the gate time.

Add to SIGNAL_ORDER, VALID_AUTO_WIRE_PAIRS (Pulse → StepSequencer is a valid control pair), NODE_DIMS, ControllerMenu, and nodeTypes.

### Milestone 3 — Signal Flow Visualisation (#40)

This feature is a toggle in the System menu (bottom edge). When enabled, a visual layer renders on top of the React Flow canvas showing animated orbs moving along edges when signals fire.

Implementation approach: create `components/SignalFlowOverlay.tsx`, a React component that renders a full-screen SVG overlay positioned absolutely over the React Flow canvas (z-index above edges, below nodes). When a note fires or a Pulse triggers, dispatch an animation event. The overlay subscribes to these events and renders a glowing circle that travels from the source node to the target node along the edge path.

To get the edge SVG path: React Flow renders edges as `<path>` elements with the edge's ID as the element's data attribute. Use `document.querySelector` to find the path by edge ID, then use `path.getTotalLength()` and `path.getPointAtLength(t)` to animate a circle along it using `requestAnimationFrame`.

Colour: audio domain orbs = cyan (`#22d3ee`). Control domain orbs = neon green (`#39ff14`). Pulse orbs = the Pulse node's accent colour.

The toggle state lives in a new Zustand store field `signalFlowVisible: boolean` with a `toggleSignalFlow()` action. The toggle button goes in `components/SystemMenu.tsx`.

Critical: the animation must never call any store action that modifies canvas or audio state. It is purely visual. If FPS drops below 30 (measurable via `performance.now()` deltas), disable animations automatically and show a console warning.

## Concrete Steps

    # After v4 is confirmed complete:
    npm run dev
    # Verify v4 state is stable (no console errors, snapping works, cables are colour-coded)

    # Implement Milestone 1, then:
    npm run build && npm run lint
    # Test: add Pulse node, connect to Generator, verify note fires at set interval

    # Implement Milestone 2, then:
    npm run build && npm run lint
    # Test: add Pulse → StepSequencer → Generator chain
    # Enable steps, start Pulse — Generator should play the sequence

    # Implement Milestone 3, then:
    npm run build && npm run lint
    # Test: enable Signal Flow toggle, trigger notes — orbs should travel along edges

## Validation and Acceptance

Pulse: add a Pulse node, connect to a Generator, set rate to 1/4 and Sync to Tempo on, start transport. Generator fires C4 every quarter note. Verify with the Visualiser node (oscilloscope should show repeated attack transients).

Step Sequencer: connect Pulse → StepSequencer → Generator. Set 8 steps active with varied pitches. Pulse at 1/8 note. Generator plays the 8-note sequence in order, looping.

Signal Flow Vis: with any active patch, enable the toggle in System menu. On each note fire, a coloured orb travels from Controller to Generator along the cable. Orb colour matches cable domain colour. Disabling the toggle removes all orbs immediately.

## Idempotence and Recovery

Tone.Loop instances in the patterns Map must be stopped and disposed in `removeAudioNode`. Failure to do so will cause phantom loops after a node is deleted. The existing Arp pattern in the `patterns` Map uses the same lifecycle — follow that pattern exactly.

## Interfaces and Dependencies

New files:
- `components/PulseNode.tsx`
- `components/StepSequencerNode.tsx`
- `components/SignalFlowOverlay.tsx`

New store fields in `store/useStore.ts`:
- `signalFlowVisible: boolean`
- `toggleSignalFlow: () => void`
- `firePulse: (pulseId: string) => void`
- `advanceSequencerStep: (id: string) => void`

New AudioNodeType values: `'pulse'` | `'stepsequencer'`

No new npm packages required. All animation uses browser-native APIs.
