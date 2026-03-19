# TICKETS.md — Bloop Work Order

This file tracks the current status of all GitHub Issues and defines the recommended order of implementation. **Update this file when you close a ticket.**

Always read this before picking up a ticket. Some tickets have hard dependencies — working out of order will cause conflicts.

---

## Current Status Snapshot

### V2 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#1](https://github.com/jball348-svg/Bloop/issues/1) | Tempo Node — Global Transport Controller | ✅ Closed |
| [#2](https://github.com/jball348-svg/Bloop/issues/2) | Drum Node — Hits & Grid Sequencer | ✅ Closed |
| [#3](https://github.com/jball348-svg/Bloop/issues/3) | Chord Node — Harmonic Voicing Transformer | ✅ Closed |
| [#5](https://github.com/jball348-svg/Bloop/issues/5) | Speaker Node Redesign — Shared Global Output | ✅ Closed |
| [#6](https://github.com/jball348-svg/Bloop/issues/6) | UI Polish — Node Sizing, Mix Knob, Drum Fixes + Chord cleanup + Unique patterns | ✅ Closed |
| [#7](https://github.com/jball348-svg/Bloop/issues/7) | Toolbar Layout — Singleton vs Multi-Instance | ✅ Closed |
| [#8](https://github.com/jball348-svg/Bloop/issues/8) | Node Delete Button — In-Canvas X Button on All Nodes | ✅ Closed |
| [#9](https://github.com/jball348-svg/Bloop/issues/9) | Split Toolbar into Four Contextual Menus | ✅ Closed |
| [#10](https://github.com/jball348-svg/Bloop/issues/10) | Empty Canvas on Initial Load | ✅ Closed |
| [#11](https://github.com/jball348-svg/Bloop/issues/11) | "New" Button Clears Canvas (System Menu) | ✅ Closed |
| [#13](https://github.com/jball348-svg/Bloop/issues/13) | Expand Canvas Zoom Range | ✅ Closed |
| [#21](https://github.com/jball348-svg/Bloop/issues/21) | Comprehensive Documentation Review & Update | ✅ Closed |

### V3 — Synth & Canvas (Active Backlog)

| # | Title | Status |
|---|---|---|
| [#27](https://github.com/jball348-svg/Bloop/issues/27) | Undo / Redo — Canvas Action History | ✅ Closed |
| [#22](https://github.com/jball348-svg/Bloop/issues/22) | ADSR Envelope — Standalone Controller Node | ✅ Closed |
| [#24](https://github.com/jball348-svg/Bloop/issues/24) | Noise Generator — New Waveform Option on Generator Node | ✅ Closed |
| [#30](https://github.com/jball348-svg/Bloop/issues/30) | Keys Controller — Split QWERTY Keyboard into Standalone Module | ✅ Closed |
| [#25](https://github.com/jball348-svg/Bloop/issues/25) | Unison & Detune — Standalone Signal Nodes | ✅ Closed |
| [#31](https://github.com/jball348-svg/Bloop/issues/31) | Drum Node — Add Controller Input Handle for ADSR Enveloping | 🟡 Backlog |
| [#23](https://github.com/jball348-svg/Bloop/issues/23) | Filter Node — Low Pass / High Pass / Band Pass | 🟡 Backlog |
| [#26](https://github.com/jball348-svg/Bloop/issues/26) | Preset Patches — Load Pre-Built Graphs from System Menu | 🟡 Backlog |
| [#28](https://github.com/jball348-svg/Bloop/issues/28) | Visualiser Node — Real-Time Waveform / Spectrum Display | 🟡 Backlog |
| [#12](https://github.com/jball348-svg/Bloop/issues/12) | Enhanced System Menu — Save, Load & Presets | 🟡 Backlog |

### V3 — Canvas Structure (Active Backlog)

| # | Title | Status |
|---|---|---|
| [#19](https://github.com/jball348-svg/Bloop/issues/19) | Exclude Global Objects (Tempo, Amplifier) from Snapping & Locking | 🟡 Backlog |
| [#15](https://github.com/jball348-svg/Bloop/issues/15) | Snapped Module Locking — Move Group as One Object | 🟡 Backlog |
| [#16](https://github.com/jball348-svg/Bloop/issues/16) | Locked Groups Expose Single Input/Output Only | 🟡 Backlog |
| [#17](https://github.com/jball348-svg/Bloop/issues/17) | Controllers Lock Horizontally (Left → Right Flow) | 🟡 Backlog |
| [#18](https://github.com/jball348-svg/Bloop/issues/18) | Signal Chain Locks Vertically (Top → Bottom Flow) | 🟡 Backlog |
| [#20](https://github.com/jball348-svg/Bloop/issues/20) | Directional Wiring Overhaul — Controllers Horizontal, Signal Vertical | 🟡 Backlog |

### V4 — Structural (Do Not Action)

| # | Title | Status |
|---|---|---|
| [#29](https://github.com/jball348-svg/Bloop/issues/29) | Mixer-Channel Signal Model — Effects as Channel Inserts | 🔵 V4, do not action |

### Superseded / Closed

| # | Title | Status |
|---|---|---|
| [#4](https://github.com/jball348-svg/Bloop/issues/4) | V3 Backlog Omnibus (superseded by #22–#29) | ✅ Closed |
| [#14](https://github.com/jball348-svg/Bloop/issues/14) | Grouped Module Locking (superseded by #15–#20) | ✅ Closed |

---

## V3 Recommended Work Order

No hard sequencing requirements within V3 synth work — these can be picked up in any order. Suggested priority:

1. ~~**#27** Undo/Redo — highest day-to-day impact, no dependencies~~ ✅ Done
2. ~~**#22** ADSR — standalone controller node, high sound design value~~ ✅ Done
3. ~~**#24** Noise Generator — contained change, ADSR-compatible~~ ✅ Done
4. ~~**#30** Keys Controller — clean split, low risk~~ ✅ Done
5. ~~**#25** Unison & Detune — two new standalone signal nodes~~ ✅ Done
6. **#31** Drum Input — add ADSR enveloping to Drum node ← **next**
7. **#23** Filter Node — new node type, more involved
8. **#26** Preset Patches — depends on the canvas being stable, pairs with #12
9. **#12** Save/Load — significant, pairs with #26
10. **#28** Visualiser — significant new node, scope carefully

For canvas structure work, order matters:
1. **#19** Exclude globals first (guard change, no dependencies)
2. **#15** Module Locking (core)
3. **#16**, **#17**, **#18** in parallel (all depend on #15)
4. **#20** Wiring overhaul last (or independently)

---

## Dependency Graph

```
── V2 Complete ──

V3 Synth (no hard deps between these):
#22 (ADSR) ✅ · #23 (Filter) · #24 (Noise) ✅ · #25 (Unison & Detune) ✅
#27 (Undo/Redo) ✅ · #28 (Visualiser) · #30 (Keys Controller) ✅
#31 (Drum Input) · #26 (Presets) ──► #12 (Save/Load)

V3 Canvas Structure:
#19 ──► #15 ──► #16, #17, #18 ──► #20

V4:
#29 (Mixer model) — blocked until V3 complete + design phase
```

---

## How to Update This File

When you close a ticket:
1. Change its status in the table from `🟡 Backlog` to `✅ Closed`
2. Strike through its entry in the Work Order section using `~~text~~`
3. Commit this file in the same PR as the work

When a new ticket is added to GitHub Issues:
1. Add a row to the appropriate Status Snapshot section
2. Insert it into the Work Order at the appropriate phase
3. Update the Dependency Graph if it has dependencies
