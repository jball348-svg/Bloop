# V6 — Theory Engine, Menu Sub-divisions & XY Mood Pad

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v6, a user who knows nothing about music theory can route their note events through a Quantizer node and have every note they play automatically snapped to a chosen musical key and scale — making it impossible to play an "out of tune" note. The menus are reorganised into clear sub-categories so finding any node takes at most two interactions. And a new XY Mood Pad lets a completely non-technical user drag a cursor around a square to generate musically interesting chord events without needing to know a single note name.

Depends on: v5 complete.

GitHub issues: #41 (Quantizer), #42 (Menu Sub-divisions), #43 (XY Mood Pad).

## Progress

- [ ] Read GitHub issues #41, #42, #43 in full
- [ ] Milestone 1 — Quantizer Node (#41): scale/key enforcer as an explicit node
- [ ] Milestone 2 — Menu Sub-divisions (#42): nested sub-categories in Signal and Controller menus
- [ ] Milestone 3 — XY Mood Pad (#43): 2D controller pad with evocative axis labels
- [ ] npm run build and npm run lint pass
- [ ] Update TICKETS.md, close GitHub issues #41, #42, #43

## Surprises & Discoveries

[To be filled.]

## Decision Log

[To be filled.]

## Outcomes & Retrospective

[To be written at completion.]

## Context and Orientation

The project already imports `@tonaljs/tonal` and uses `Scale.get()` in `ControllerNode.tsx` for the Arp. The Quantizer node extends this: given an incoming note (e.g. 'D#4'), it finds the nearest note within the selected scale and passes that corrected note downstream instead. `Scale.get('C4 major').notes` returns `['C', 'D', 'E', 'F', 'G', 'A', 'B']` — use this to build the quantization lookup.

The menus (`components/SignalMenu.tsx`, `components/ControllerMenu.tsx`) currently render a flat list of node type buttons. Sub-divisions mean adding a tab row or accordion at the top of each menu panel to filter the list by sub-category.

By v6, the full node inventory is: Signal (Generator, Noise, Drum, Effect, Filter[deferred], Unison, Detune, Visualiser, Quantizer, Sampler[v7]) and Controller (Arp, Keys, ADSR, Chord, Pulse, StepSequencer, XY Mood Pad). Sub-categories should be: Signal → Generators (Generator, Noise, Drum) / Modulators (Effect, Unison, Detune, Quantizer) / Visualisers (Visualiser); Controller → Performance (Arp, Keys, Chord) / Sequencing (ADSR, Pulse, StepSequencer, XY Mood Pad).

## Plan of Work

### Milestone 1 — Quantizer Node (#41)

Create `components/QuantizerNode.tsx`. This is a signal-domain node that intercepts the note event stream (not audio). It sits between a Controller and a Generator in the control signal path.

The node UI contains: a root note selector (C, C#, D … B) and a scale type selector (major, minor, pentatonic, blues, chromatic, etc. — use the same list as the Arp in `ControllerNode.tsx`). A bypass toggle passes notes through unquantized.

Architectural note: the Quantizer is unique — it processes note events (strings) rather than audio signals. It must sit in the `VALID_AUTO_WIRE_PAIRS` as a valid target for controller-domain cables and a valid source for generator-domain cables. In `store/useStore.ts`, add a `quantizeNote(note: string, root: string, scale: string): string` utility that finds the nearest in-scale pitch using `Scale.get()`. When `fireNoteOn` traverses the graph, if it encounters a Quantizer node, it passes the note through `quantizeNote` before continuing downstream.

Colour: choose an available colour from STYLE_GUIDE.md. Green-400 or lime-500 may work — verify against the existing registry.

Add to `AudioNodeType`, `SIGNAL_ORDER`, `VALID_AUTO_WIRE_PAIRS`, `NODE_DIMS`, `nodeTypes`, and the Controller menu (Sequencing sub-category).

### Milestone 2 — Menu Sub-divisions (#42)

Refactor `components/SignalMenu.tsx` and `components/ControllerMenu.tsx` to render sub-category tabs at the top of each menu panel. The tab row should use the same dark Bloop aesthetic (small pill-shaped buttons, active tab highlighted with the menu's accent colour).

The sub-category filter is purely UI state — no store changes needed. Use `useState` in each menu component to track the active sub-category, and filter the rendered node buttons accordingly.

All existing node types must remain accessible — the refactor must not remove any node from the menus. Add any v5 nodes (Pulse, StepSequencer) and v6 nodes (Quantizer, Mood Pad) to the correct sub-categories while adding them.

Test: open the Signal menu, click "Modulators" tab — only Effect, Unison, Detune, Quantizer buttons are visible. Click "Generators" — only Generator, Drum buttons are visible.

### Milestone 3 — XY Mood Pad (#43)

Create `components/MoodPadNode.tsx`. This is a controller-domain node. Its colour should be a new, evocative colour — rose-400 or purple-400 are candidates (check STYLE_GUIDE.md).

The node UI is dominated by a large interactive square (approximately 160×160px within the node). Dragging within the square changes the X and Y values continuously. The X axis is labelled "Tension" (left = calm, right = tense). The Y axis is labelled "Brightness" (bottom = dark, top = bright).

Output logic: X maps to chord complexity (simple triads → extended chords with added tensions). Y maps to register/octave (bottom = lower octaves, top = higher octaves). On pointer move within the pad, call `fireNoteOn` for each note in the resulting chord voicing, and schedule `fireNoteOff` after a short sustain (200ms). The chord voicing can use Tonal.js's Chord detection and voicing utilities.

The pad must respond to both mouse events and touch events (`onPointerDown`, `onPointerMove`, `onPointerUp` — use pointer events for cross-device support). Add `touch-action: none` CSS to the pad element to prevent scroll interference.

Add `'moodpad'` to all required locations.

## Concrete Steps

    npm run dev
    # Verify v5 is stable before starting

    # After each milestone:
    npm run build && npm run lint

    # Quantizer test:
    # Connect Keys → Quantizer → Generator
    # Set Quantizer to C major
    # Press keys that would produce out-of-scale notes (e.g. C#, D#)
    # Generator should play the nearest in-scale note instead

    # Menu test:
    # Open Signal menu — verify sub-category tabs appear
    # Each tab shows only the correct nodes
    # All existing nodes are still reachable

    # Mood Pad test:
    # Add Mood Pad → Generator
    # Click/drag in the pad — Generator produces chord output
    # Drag to corners — output changes character
    # Touch on mobile viewport (or Chrome DevTools touch sim) — works

## Validation and Acceptance

Quantizer: Keys → Quantizer (C major) → Generator. Playing D# on the keyboard produces D (nearest in-scale note). Bypass toggle bypasses quantization. `npm run build` passes.

Menus: Signal menu has Generators/Modulators/Visualisers tabs. Controller menu has Performance/Sequencing tabs. All nodes accessible. No regressions.

Mood Pad: drag across the full pad — chord output changes smoothly. Touch input works. Works in combination with Quantizer downstream.

## Idempotence and Recovery

The MoodPad fires multiple notes simultaneously (chord voicings). Ensure `fireNoteOff` is called for all notes on `onPointerUp` even if the pointer leaves the element — use a document-level pointer up listener attached on `onPointerDown` and removed on `onPointerUp`.

## Interfaces and Dependencies

New files:
- `components/QuantizerNode.tsx`
- `components/MoodPadNode.tsx`

New utility in `store/useStore.ts`:
- `quantizeNote(note: string, root: string, scaleType: string): string`

New AudioNodeType values: `'quantizer'` | `'moodpad'`

Uses existing `@tonaljs/tonal` — no new npm packages needed.
