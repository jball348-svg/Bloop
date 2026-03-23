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

### Superseded / Closed

| # | Title | Status |
|---|---|---|
| [#4](https://github.com/jball348-svg/Bloop/issues/4) | V3 Backlog Omnibus (superseded by #22–#29) | ✅ Closed |
| [#14](https://github.com/jball348-svg/Bloop/issues/14) | Grouped Module Locking (superseded by #15–#20) | ✅ Closed |
| [#20](https://github.com/jball348-svg/Bloop/issues/20) | Directional Wiring Overhaul (superseded by #32) | ⛔ Superseded |
| [#26](https://github.com/jball348-svg/Bloop/issues/26) | Preset Patches — Load Pre-Built Graphs from System Menu | ✅ Closed (absorbed into #12) |

---

## V4 Recommended Work Order

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
```

---

## How to Update This File

When you close a ticket:
1. Change its status in the table from `🔵 V4 Backlog` / `🟣 Vx Roadmap` to `✅ Closed`
2. Strike through its entry in the Work Order section using `~~text~~`
3. Commit this file in the same PR as the work

When a new ticket is added to GitHub Issues:
1. Add a row to the appropriate Status Snapshot section
2. Insert it into the Work Order at the appropriate phase
3. Update the Dependency Graph if it has dependencies
