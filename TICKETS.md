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
| [#6](https://github.com/jball348-svg/Bloop/issues/6) | UI Polish — Node Sizing, Mix Knob, Drum Fixes + Chord cleanup + Unique patterns | 🔴 Open | v2, ux, polish |
| [#7](https://github.com/jball348-svg/Bloop/issues/7) | Toolbar Layout — Singleton vs Multi-Instance | 🔴 Open | v2, ux, polish |

---

## Recommended Work Order

### ✅ Phase 1 — Core Infrastructure (Complete)

- ~~**#5** Speaker Node Redesign~~ — removes wiring requirement, all generators route to `Tone.Destination` directly
- ~~**#1** Tempo Node~~ — global BPM broadcaster via `Tone.Transport`, singleton logic
- ~~**#2** Drum Node~~ — Hits & Grid modes, `Tone.MembraneSynth` / `NoiseSynth` / `MetalSynth`

### ✅ Phase 2 — New Nodes (Complete)

- ~~**#3** Chord Node~~ — React Flow handles, store-side note event routing, handle clipping fix

### 🔴 Phase 3 — Polish (Up Next)

- **#6** UI Polish ← _Start here_ — see issue comments for full item list, including:
  - Node sizing (remove dead space)
  - Generator Mix knob
  - Drum node fixes (no "not connected", no BPM label, zig-zag step numbers)
  - Amplifier rename + remove decorative circle
  - **Chord node cleanup** — remove "Harmonic Voicing" block, "ROOT POS" badge, "CHORD QUALITY" label
  - **Unique background patterns** per node type (no two nodes should share the same pattern)
  - Depends on: all Phase 1 + Phase 2 tickets closed ✅

- **#7** Toolbar Layout — Singleton section separation
  - Depends on: #6 (Amplifier rename must be done first)
  - Touches `Toolbar.tsx` only

### 🟡 Phase 4 — Backlog (Do Not Action Yet)
- **#4** V3 Backlog — reference document only, do not implement

---

## Dependency Graph

```
#5 (Speaker) ─┐
              ├──► #3 (Chord) ──► #6 (Polish) ──► #7 (Toolbar)
#1 (Tempo)  ──┘
#2 (Drums)  ──────────────────► #6 (Polish)
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
