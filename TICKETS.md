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

### V3 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#27](https://github.com/jball348-svg/Bloop/issues/27) | Undo / Redo — Canvas Action History | ✅ Closed |
| [#22](https://github.com/jball348-svg/Bloop/issues/22) | ADSR Envelope — Standalone Controller Node | ✅ Closed |
| [#24](https://github.com/jball348-svg/Bloop/issues/24) | Noise Generator — New Waveform Option on Generator Node | ✅ Closed |
| [#30](https://github.com/jball348-svg/Bloop/issues/30) | Keys Controller — Split QWERTY Keyboard into Standalone Module | ✅ Closed |
| [#25](https://github.com/jball348-svg/Bloop/issues/25) | Unison & Detune — Standalone Signal Nodes | ✅ Closed |
| [#28](https://github.com/jball348-svg/Bloop/issues/28) | Visualiser Node — Real-Time Waveform / Spectrum Display | ✅ Closed |
| [#12](https://github.com/jball348-svg/Bloop/issues/12) | Enhanced System Menu — Save, Load & Presets | ✅ Closed |
| [#19](https://github.com/jball348-svg/Bloop/issues/19) | Exclude Global Objects (Tempo, Amplifier) from Snapping & Locking | ✅ Closed |
| [#15](https://github.com/jball348-svg/Bloop/issues/15) | Snapped Module Locking — Move Group as One Object | ✅ Closed |
| [#16](https://github.com/jball348-svg/Bloop/issues/16) | Locked Groups Expose Single Input/Output Only | ✅ Closed |
| [#32](https://github.com/jball348-svg/Bloop/issues/32) | Control/Audio Signal Domain Separation — Architectural Wiring Overhaul | ✅ Closed |
| [#17](https://github.com/jball348-svg/Bloop/issues/17) | Controllers Lock Horizontally (Left → Right Flow) | ✅ Closed |
| [#18](https://github.com/jball348-svg/Bloop/issues/18) | Signal Chain Locks Vertically (Top → Bottom Flow) | ✅ Closed |

### V4 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#33](https://github.com/jball348-svg/Bloop/issues/33) | V4 Bug Omnibus — Snap, Audio Engine, Drum ADSR, Text Selection, N→S gaps | ✅ Closed |
| [#34](https://github.com/jball348-svg/Bloop/issues/34) | V4 Visual Polish — Cable Colours & Snapped-Node Glow Theming | ✅ Closed |
| [#35](https://github.com/jball348-svg/Bloop/issues/35) | Node Packing — Compress Locked Groups into Single Macro-Nodes | ✅ Closed |
| [#36](https://github.com/jball348-svg/Bloop/issues/36) | Vercel Pipeline Setup & Prototype Deployment | ✅ Closed |
| [#37](https://github.com/jball348-svg/Bloop/issues/37) | Auto-Resizing Canvas Bounds & Infinite Pan | ✅ Closed |
| [#23](https://github.com/jball348-svg/Bloop/issues/23) | Filter Node — Low Pass / High Pass / Band Pass | 🔵 V4, do not action |
| [#29](https://github.com/jball348-svg/Bloop/issues/29) | Mixer-Channel Signal Model — Effects as Channel Inserts | 🔵 V4, do not action |
| [#31](https://github.com/jball348-svg/Bloop/issues/31) | Drum Node — Add Controller Input Handle for ADSR Enveloping | 🔵 V4, do not action |

### V5 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#38](https://github.com/jball348-svg/Bloop/issues/38) | The "Bloop" Pulse Node — Discrete Event Trigger (Bang-style) | ✅ Closed |
| [#39](https://github.com/jball348-svg/Bloop/issues/39) | Moog-Style Modular Step Sequencer | ✅ Closed |
| [#40](https://github.com/jball348-svg/Bloop/issues/40) | Signal Flow Visualization — Animated Cable Pulses | ✅ Closed |

### V6 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#41](https://github.com/jball348-svg/Bloop/issues/41) | Music Theory Engine — Quantizer / Scale Enforcer Node | ✅ Closed |
| [#42](https://github.com/jball348-svg/Bloop/issues/42) | Node Menu Sub-divisions — Generators, Modulators, Controllers, Triggers | ✅ Closed |
| [#43](https://github.com/jball348-svg/Bloop/issues/43) | XY Mood Pad — Intuitive Non-Musical Controller | ✅ Closed |

### V7 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#44](https://github.com/jball348-svg/Bloop/issues/44) | Sampler Node — Audio File Import & Playback | ✅ Closed |
| [#45](https://github.com/jball348-svg/Bloop/issues/45) | Sample Manipulation — Pitch Shift, Time Stretch & Reverse | ✅ Closed |
| [#46](https://github.com/jball348-svg/Bloop/issues/46) | Advanced Drum Machine — Sample-Backed 16-Step Sequencer | ✅ Closed |

### V8 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#47](https://github.com/jball348-svg/Bloop/issues/47) | MIDI Input — Connect External Hardware via Web MIDI API | ✅ Closed |
| [#48](https://github.com/jball348-svg/Bloop/issues/48) | Live Audio Input — Microphone & USB Interface via getUserMedia | ✅ Closed |
| [#49](https://github.com/jball348-svg/Bloop/issues/49) | Session Export — Audio Recording (WAV) & MIDI File Export | ✅ Closed |

### V9 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#50](https://github.com/jball348-svg/Bloop/issues/50) | Interactive Onboarding — GIF Tutorial Intro Screen | ✅ Closed |
| [#51](https://github.com/jball348-svg/Bloop/issues/51) | Theming Engine — Light/Dark/System Mode & User Colour Customisation | ✅ Closed |
| [#52](https://github.com/jball348-svg/Bloop/issues/52) | Expanded Presets Library & Advanced Visualiser Modes | ✅ Closed |

### V10 — Complete ✅

| # | Title | Status |
|---|---|---|
| [#53](https://github.com/jball348-svg/Bloop/issues/53) | Campaign Mode — Gamified Synthesis Puzzles with Reward System | ✅ Closed |

### V11 — Post-v10 UAT Follow-up 🔵

| # | Title | Status |
|---|---|---|
| [#60](https://github.com/jball348-svg/Bloop/issues/60) | Post-v10 UAT - Audio Bootstrap and Mandatory Intro Simplification | ✅ Closed |
| [#61](https://github.com/jball348-svg/Bloop/issues/61) | Post-v10 UAT - System Menu Layout Cleanup and Tutorial Rename | ✅ Closed |
| [#62](https://github.com/jball348-svg/Bloop/issues/62) | Post-v10 UAT - Promote MIDI In, Audio In, and Recorder into Global Utilities | ✅ Closed |
| [#63](https://github.com/jball348-svg/Bloop/issues/63) | Post-v10 UAT - Always-Visible Node Menus and Dedicated Bloop Control | ✅ Closed |
| [#64](https://github.com/jball348-svg/Bloop/issues/64) | Post-v10 UAT - Module Readability and Mix-Control Consistency Pass | ✅ Closed |
| [#65](https://github.com/jball348-svg/Bloop/issues/65) | Post-v10 UAT - Accessible Theme Redesign and Simpler Appearance Settings | ✅ Closed |
| [#66](https://github.com/jball348-svg/Bloop/issues/66) | Post-v10 UAT - Presets Library Overhaul | 🟣 V11 Backlog |
| [#67](https://github.com/jball348-svg/Bloop/issues/67) | Post-v10 UAT - Snapping, Adjacency, and Overlap Resolution Rewrite | 🟡 Validation Pass |

### Superseded / Closed

| # | Title | Status |
|---|---|---|
| [#4](https://github.com/jball348-svg/Bloop/issues/4) | V3 Backlog Omnibus (superseded by #22–#29) | ✅ Closed |
| [#14](https://github.com/jball348-svg/Bloop/issues/14) | Grouped Module Locking (superseded by #15–#20) | ✅ Closed |
| [#20](https://github.com/jball348-svg/Bloop/issues/20) | Directional Wiring Overhaul (superseded by #32) | ⛔ Superseded |
| [#26](https://github.com/jball348-svg/Bloop/issues/26) | Preset Patches — Load Pre-Built Graphs from System Menu | ✅ Closed (absorbed into #12) |

---

## V11 Recommended Work Order

1. ~~**#60** Audio Bootstrap and Mandatory Intro Simplification~~ ✅
2. ~~**#62** Promote MIDI In, Audio In, and Recorder into Global Utilities~~ ✅
3. ~~**#63** Always-Visible Node Menus and Dedicated Bloop Control~~ ✅
4. ~~**#65** Accessible Theme Redesign and Simpler Appearance Settings~~ ✅
5. ~~**#61** System Menu Layout Cleanup and Tutorial Rename~~ ✅
6. ~~**#64** Module Readability and Mix-Control Consistency Pass~~ ✅
7. **#67** Snapping, Adjacency, and Overlap Resolution Rewrite — measured-dimension hardening landed; keep open for manual UAT
8. **#66** Presets Library Overhaul

9. # Bloop Ticket Tracker

This document tracks the active, upcoming, and completed development tickets for Bloop. 

## 🟢 ACTIVE SPRINT: v12 - Sonic Expansion & Shaping
*Focus: Expanding sound generation and frequency control.*

- [ ] **TKT-1201: Implement FM/AM Generator Modes**
  - Add new oscillator types to the `Generator` node or create a dedicated `Advanced Synth` node.
  - Wire Tone.js FM/AM oscillators to the UI state.
- [ ] **TKT-1202: Parametric EQ Node**
  - Create a 3-band or 5-band EQ node using `Tone.EQ3` or `Tone.Filter` chains.
  - Build UI for frequency, Q, and gain adjustments.
- [ ] **TKT-1203: LFO Control Node**
  - Build a Low-Frequency Oscillator node to modulate other node parameters (pitch, filter cutoff).
  - Implement the routing logic to allow LFO cables to snap to parameter inputs.

## 🟡 UPCOMING: v13 - Composition & "Writing"
*Focus: Upgrading note-input workflow to a Piano Roll interface.*

- [ ] **TKT-1301: Piano Roll / Pattern Node UI**
  - Build a grid-based UI module (FL Studio style) that opens on double-click.
  - Implement note drag, drop, stretch, and delete functionality.
- [ ] **TKT-1302: Polyphonic Output Engine**
  - Upgrade the note-firing engine to handle chords and overlapping MIDI notes from the Pattern Node.
- [ ] **TKT-1303: ADSR Gate Refining**
  - Ensure the ADSR envelopes accurately trigger and release based on the precise note-on/note-off data from the Piano Roll.

## 🟡 UPCOMING: v14 - Mixing & Arrangement
*Focus: Organizing complex patches into a structured timeline.*

- [ ] **TKT-1401: Global Mixer Node**
  - Replace/Upgrade the `Amplifier` with a multi-channel mixer hub (volume, pan, mute, solo).
- [ ] **TKT-1402: Timeline / Arranger Node**
  - Create a macro-module that triggers specific Pattern Nodes based on a global bar counter (Intro -> Verse -> Chorus).

## 🟡 UPCOMING: v15 - Automation & The Masterpiece
*Focus: Optimization, Automation, and the Final Showcase Preset.*

- [ ] **TKT-1501: Parameter Automation Routing**
  - Allow the Timeline/Arranger to map automation to node dials (e.g., sweeping a filter on bar 16).
- [ ] **TKT-1502: Graph & Engine Optimization**
  - Refactor React Flow and Tone.js state handling to support 50+ nodes without lag.
- [ ] **TKT-1503: The "Demo Song" Preset**
  - Compose, balance, and save the final built-in showcase track.

---

## 🏁 ARCHIVE: Completed (v1 - v11)
* **Audio Engine:** Core Tone.js and React Flow integration.
* **Nodes:** Arp, Keys, MIDI In, ADSR, Sequencer, Pulse, Chord, Mood Pad, Generator, Sampler, Audio In, Drums, Effects, Visualisers.
* **UX/UI:** Cable routing, signal flow animation, drag-and-drop creation, undo/redo (50 steps), saving/loading `.bloop` files.
* **Features:** Live audio, Web MIDI input, `.webm` recording, onboarding tutorial, gamified campaign mode.

---

## Historical V4 Work Order

1. ~~**#33** Bug Omnibus~~ ✅
2. ~~**#34** Visual Polish~~ ✅
3. ~~**#35** Node Packing~~ ✅ Done
4. ~~**#36** Vercel Deployment~~ ✅
5. ~~**#37** Auto-Resizing Canvas~~ ✅
6. **#23**, **#29**, **#31** — hold until v4 core complete

---

## Dependency Graph

```
── V2 Complete ── V3 Complete ──

V4 Core:
~~#33 (bugs)~~ ✅ → ~~#34 (polish)~~ ✅ → ~~#35 (packing)~~ ✅ → ~~#36 (deploy)~~ ✅ → ~~#37 (canvas)~~ ✅

V4 Deferred Features:
#23 (Filter) · #29 (Mixer) · #31 (Drum Input)

V5 (requires v4 complete):
~~#38 (Pulse)~~ ✅ → ~~#39 (Sequencer)~~ ✅ → ~~#40 (Signal Flow Vis)~~ ✅

V6 (requires v5 complete):
~~#41 (Quantizer)~~ ✅ → ~~#42 (Sub-menus)~~ ✅ → ~~#43 (Mood Pad)~~ ✅

V7 (requires v6 complete):
~~#44 (Sampler)~~ ✅ → ~~#45 (Sample Manip)~~ ✅ → ~~#46 (Drum Machine Rebuild)~~ ✅

V8 (requires v7 complete):
~~#47 (MIDI In)~~ ✅ → ~~#48 (Audio In)~~ ✅ → ~~#49 (Session Export)~~ ✅

V9 (requires v8 complete):
~~#50 (Onboarding)~~ ✅ → ~~#51 (Theming)~~ ✅ → ~~#52 (Presets + Visualiser)~~ ✅

V10 (requires v9 complete):
~~#53 (Campaign Mode)~~ ✅

V11 (post-v10 UAT follow-up):
#60 (bootstrap/intro)
#62 (global utilities) → #63 (menus + Bloop)
#65 (theme) ─┐
#62 (global utilities) ─┼→ #61 (system menu cleanup) → #66 (presets overhaul)
#63 (menu taxonomy) ────┘
#64 (module UX consistency) → #67 (snapping rewrite)
```

---

## How to Update This File

When you close a ticket:
1. Change its status in the table from the current backlog marker (for example `🔵 Backlog` / `🟣 V11 Backlog`) to `✅ Closed`
2. Strike through its entry in the Work Order section using `~~text~~`
3. Commit this file in the same PR as the work

When a new ticket is added to GitHub Issues:
1. Add a row to the appropriate Status Snapshot section
2. Insert it into the Work Order at the appropriate phase
3. Update the Dependency Graph if it has dependencies
