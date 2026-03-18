# TICKETS.md — Bloop V2 Work Order

This file tracks the current status of all GitHub Issues and defines the recommended order of implementation. **Update this file when you close a ticket.**

Always read this before picking up a ticket. Some tickets have hard dependencies — working out of order will cause conflicts.

---

## Current Status Snapshot

| # | Title | Status | Labels |
|---|---|---|---|
| [#1](https://github.com/jball348-svg/Bloop/issues/1) | Tempo Node — Global Transport Controller | ✅ Closed | v2, node-type, audio-engine |
| [#2](https://github.com/jball348-svg/Bloop/issues/2) | Drum Node — Hits & Grid Sequencer | ✅ Closed | v2, node-type, audio-engine |
| [#3](https://github.com/jball348-svg/Bloop/issues/3) | Chord Node — Harmonic Voicing Transformer | 🚧 In Progress — see latest comment for outstanding issue | v2, node-type, audio-engine |
| [#4](https://github.com/jball348-svg/Bloop/issues/4) | V3 Backlog — Synth Overhaul, UX, Drum Samples | 🟡 Open (do not action) | v3, backlog |
| [#5](https://github.com/jball348-svg/Bloop/issues/5) | Speaker Node Redesign — Shared Global Output | ✅ Closed | v2, node-type, audio-engine |
| [#6](https://github.com/jball348-svg/Bloop/issues/6) | UI Polish — Node Sizing, Mix Knob, Drum Fixes | 🔴 Open | v2, ux, polish |
| [#7](https://github.com/jball348-svg/Bloop/issues/7) | Toolbar Layout — Singleton vs Multi-Instance | 🔴 Open | v2, ux, polish |

---

## Recommended Work Order

The order below accounts for dependencies. Do not skip ahead — earlier tickets change files and patterns that later tickets build on.

### ✅ Phase 1 — Core Infrastructure (Complete)
These establish the new broadcast model and transport system that all other V2 work depends on.

- ~~**#5** Speaker Node Redesign~~ — removes wiring requirement, all generators now route to `Tone.Destination` directly
- ~~**#1** Tempo Node~~ — global BPM broadcaster via `Tone.Transport`, singleton logic
- ~~**#2** Drum Node~~ — Hits & Grid modes, uses `Tone.MembraneSynth` / `NoiseSynth` / `MetalSynth`

### 🚧 Phase 2 — New Nodes (In Progress)

- **#3** Chord Node ← _Currently being worked on_
  - Depends on: #1 (Transport), #5 (audio routing)
  - Node is substantially built — **outstanding issue: missing React Flow input/output handles**
  - Needs `<Handle type="target" position={Position.Top} />` (input from Controller) and `<Handle type="source" position={Position.Bottom} />` (output to Generator) added to `ChordNode.tsx`
  - Store must also walk edges to route `fireNoteOn`/`fireNoteOff` through Chord node before hitting Generator
  - See issue #3 comments for full implementation detail

### 🔴 Phase 3 — Polish (After Phase 2)
These touch UI across all existing nodes — do them after new nodes are in place so you only polish once.

- **#6** UI Polish — Node Sizing, Mix Knob, Drum Grid, Amplifier rename
  - Depends on: #1, #2, #5 all closed (needs all nodes to exist to size them)
  - No audio changes — purely visual/layout

- **#7** Toolbar Layout — Singleton section separation
  - Depends on: #6 (Amplifier rename must be done first so toolbar uses correct label)
  - Touches `Toolbar.tsx` only (plus minor store selector)

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
