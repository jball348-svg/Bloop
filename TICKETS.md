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
| [#9](https://github.com/jball348-svg/Bloop/issues/9) | Split Toolbar into Four Contextual Menus | ✅ Closed | v2 |
| [#10](https://github.com/jball348-svg/Bloop/issues/10) | Empty Canvas on Initial Load | ✅ Closed | v2 |
| [#11](https://github.com/jball348-svg/Bloop/issues/11) | "New" Button Clears Canvas (System Menu) | 🔴 Open | v2 |
| [#12](https://github.com/jball348-svg/Bloop/issues/12) | Enhanced System Menu — Save, Load & Presets | 🟡 Open (do not action) | v3, backlog |
| [#13](https://github.com/jball348-svg/Bloop/issues/13) | Expand Canvas Zoom Range | 🔴 Open | v2, ux |
| [#14](https://github.com/jball348-svg/Bloop/issues/14) | Grouped Module Locking & Directional Wiring (superseded) | ✅ Closed | v3, backlog |
| [#15](https://github.com/jball348-svg/Bloop/issues/15) | Snapped Module Locking — Move Group as One Object | 🟡 Open (do not action) | v3, backlog |
| [#16](https://github.com/jball348-svg/Bloop/issues/16) | Locked Groups Expose Single Input/Output Only | 🟡 Open (do not action) | v3, backlog |
| [#17](https://github.com/jball348-svg/Bloop/issues/17) | Controllers Lock Horizontally (Left → Right Flow) | 🟡 Open (do not action) | v3, backlog |
| [#18](https://github.com/jball348-svg/Bloop/issues/18) | Signal Chain Locks Vertically (Top → Bottom Flow) | 🟡 Open (do not action) | v3, backlog |
| [#19](https://github.com/jball348-svg/Bloop/issues/19) | Exclude Global Objects (Tempo, Amplifier) from Snapping & Locking | 🟡 Open (do not action) | v3, backlog |
| [#20](https://github.com/jball348-svg/Bloop/issues/20) | Directional Wiring Overhaul — Controllers Horizontal, Signal Vertical | 🟡 Open (do not action) | v3, backlog |

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

### 🔴 Phase 6 — Canvas & Navigation (Current)

- ~~**#9** Split Toolbar into Four Contextual Menus~~
- ~~**#10** Empty Canvas on Initial Load~~

- **#11** "New" Button Clears Canvas (System Menu)
  - Depends on **#9** ✅ and **#10** ✅ — both done
  - Wire the `New` button in `SystemMenu.tsx` to a new `clearCanvas()` store action

- **#13** Expand Canvas Zoom Range
  - No dependencies
  - Single prop change in `app/page.tsx`: add `minZoom={0.1}` to `<ReactFlow>`
  - Can be done in parallel with or after #11

### 🟡 Phase 7 — Backlog (Do Not Action Yet)

- **#4** V3 Backlog — reference document only, do not implement
- **#12** Enhanced System Menu (Save, Load, Presets) — blocked until Phase 6 is complete
- **#19** Exclude Global Objects from Snapping & Locking — prerequisite for the locking work below
- **#15** Snapped Module Locking — core group movement behaviour
- **#16** Locked Groups Expose Single I/O — depends on #15
- **#17** Controllers Lock Horizontally — depends on #15
- **#18** Signal Chain Locks Vertically — depends on #15
- **#20** Directional Wiring Overhaul — related to #17 and #18, can ship independently

---

## Dependency Graph

```
#5 (Speaker) ─┐
              ├──► #3 (Chord) ──► #6 (Polish) ──► #7 (Toolbar) ──► #8 (Delete) ──► #9 ──► #10
#1 (Tempo)  ──┘
#2 (Drums)  ──────────────────► #6 (Polish)

#9  ✅ ──────────────────────┐
                             ├──► #11 (New Button)
#10 ✅ ──────────────────────┘

#13 (Zoom) — no dependencies

#12 (Save/Load/Presets) — blocked until #11 complete

#19 (Exclude globals) ──────────────────────────────────────────► #15 (Module Locking)
                                                                         │
                               ┌─────────────────────────────────────────┤
                               ▼                 ▼                       ▼
                            #16 (Single I/O)  #17 (H-lock)          #18 (V-lock)
                                                 │                       │
                                                 └───────────────────────┘
                                                           │
                                                           ▼
                                                    #20 (Wiring overhaul)
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
