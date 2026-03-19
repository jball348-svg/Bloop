# TICKETS.md — Bloop V2 Work Order

This file tracks the current status of all GitHub Issues and defines the recommended order of implementation. **Update this file when you close a ticket.**

Always read this before picking up a ticket. Some tickets have hard dependencies — working out of order will cause conflicts.

---

## Current Status Snapshot

| # | Title | Status | Labels |
|---|---|---|---|
| [#1](https://github.com/jball348-svg/Bloop/issues/1) | Tempo Node — Global Transport Controller | ✅ Closed | v2, node-type, audio-engine |
| [#2](https://github.com/jball348-svg/Bloop/issues/2) | Drum Node — Hits & Grid Sequencer | ✅ Closed | v2, node-type, audio-engine |
| [#3](https://github.com/jball348-svg/Bloop/issues/3) | Chord Node — Harmonic Voicing Transformer | ✅ Closed | v2, node-type, audio-engine |
| [#4](https://github.com/jball348-svg/Bloop/issues/4) | V3 Backlog — Synth Overhaul, UX, Drum Samples | 🟡 Open (do not action) | v3, backlog |
| [#5](https://github.com/jball348-svg/Bloop/issues/5) | Speaker Node Redesign — Shared Global Output | ✅ Closed | v2, node-type, audio-engine |
| [#6](https://github.com/jball348-svg/Bloop/issues/6) | UI Polish — Node Sizing, Mix Knob, Drum Fixes + Chord cleanup + Unique patterns | ✅ Closed | v2, ux, polish |
| [#7](https://github.com/jball348-svg/Bloop/issues/7) | Toolbar Layout — Singleton vs Multi-Instance | ✅ Closed | v2, ux, polish |
| [#8](https://github.com/jball348-svg/Bloop/issues/8) | Node Delete Button — In-Canvas X Button on All Nodes | ✅ Closed | v2, ux, polish |
| [#9](https://github.com/jball348-svg/Bloop/issues/9) | Split Toolbar into Four Contextual Menus | 🔴 Open | v2 |
| [#10](https://github.com/jball348-svg/Bloop/issues/10) | Empty Canvas on Initial Load | 🔴 Open | v2 |
| [#11](https://github.com/jball348-svg/Bloop/issues/11) | "New" Button Clears Canvas (System Menu) | 🔴 Open | v2 |
| [#12](https://github.com/jball348-svg/Bloop/issues/12) | Enhanced System Menu — Save, Load & Presets | 🟡 Open (do not action) | v3, backlog |

---

## Recommended Work Order

### ✅ Phase 1 — Core Infrastructure (Complete)

- ~~**#5** Speaker Node Redesign~~ — removes wiring requirement, all generators route to `Tone.Destination` directly
- ~~**#1** Tempo Node~~ — global BPM broadcaster via `Tone.Transport`, singleton logic
- ~~**#2** Drum Node~~ — Hits & Grid modes, `Tone.MembraneSynth` / `NoiseSynth` / `MetalSynth`

### ✅ Phase 2 — New Nodes (Complete)

- ~~**#3** Chord Node~~ — React Flow handles, store-side note event routing, handle clipping fix

### ✅ Phase 3 — Polish (Complete)

- ~~**#6** UI Polish~~ — node sizing, Generator Mix knob, Drum node fixes, Amplifier rename, Chord cleanup, unique background patterns

### ✅ Phase 4 — Toolbar Layout (Complete)

- ~~**#7** Toolbar Layout — Singleton section separation~~ — Modules vs Global sections, singleton slots grey out when present on canvas

### ✅ Phase 5 — UX (Complete)

- ~~**#8** Node Delete Button — In-Canvas X button on all nodes~~
  - No dependencies — ready to action
  - Touches all `components/*Node.tsx` files only

### 🔴 Phase 6 — Canvas & Navigation (Current)

Work these in order — #10 is a quick win and unblocks #11; #9 is the largest lift and can go last.

- **#10** Empty Canvas on Initial Load
  - No dependencies
  - One-line change in `store/useStore.ts` (empty the initial `nodes` array)
  - Confirm `initializeDefaultNodes` gracefully handles an empty list

- **#11** "New" Button Clears Canvas (System Menu)
  - Depends on **#9** (needs the System menu to exist) and **#10** (defines what "empty" means)
  - Add `clearCanvas()` action to the store; dispose all audio nodes and patterns, then `set({ nodes: [], edges: [] })`

- **#9** Split Toolbar into Four Contextual Menus
  - No hard code dependencies but should be done before #11 ships (System menu houses the New button)
  - Refactor `Toolbar.tsx` → four new components: `ControllerMenu`, `SignalMenu`, `GlobalMenu`, `SystemMenu`
  - Left: Controller, Chord | Top: Generator, Effect, Drums | Right: Tempo, Amplifier | Bottom: System (New button)

### 🟡 Phase 7 — Backlog (Do Not Action Yet)

- **#4** V3 Backlog — reference document only, do not implement
- **#12** Enhanced System Menu (Save, Load, Presets) — blocked until Phase 6 is complete

---

## Dependency Graph

```
#5 (Speaker) ─┐
              ├──► #3 (Chord) ──► #6 (Polish) ──► #7 (Toolbar) ──► #8 (Delete)
#1 (Tempo)  ──┘
#2 (Drums)  ──────────────────► #6 (Polish)

#10 (Empty Canvas) ──────────────────────────────────────────────► #11 (New Button)
#9  (Split Toolbar) ─────────────────────────────────────────────► #11 (New Button)

#12 (Save/Load/Presets) — blocked until #9, #10, #11 complete
```

---

## How to Update This File

When you close a ticket:
1. Change its status in the table from `🔴 Open` to `✅ Closed`
2. Strike through its entry in the Work Order section using `~~text~~`
3. Commit this file in the same PR as the work

When a new ticket is added to GitHub Issues:
1. Add a row to the Status Snapshot table
2. Insert it into the Work Order at the appropriate phase
3. Update the Dependency Graph if it has dependencies
