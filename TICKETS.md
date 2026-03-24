# TICKETS.md — Bloop Work Order

This file tracks the current status of all GitHub Issues and defines the recommended order of implementation. Update this file whenever a roadmap ticket is opened, closed, superseded, or materially re-scoped.

Always read this before picking up a ticket. Some tickets have hard dependencies and should not be started out of order.

---

## Current Status Snapshot

Implementation note: v12-v15 are now implemented in the codebase and pass `npm run build` and `npm run lint` as of 2026-03-24. The remaining step before issue closure is manual browser/audio QA of the new song-authoring flow.

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
| [#23](https://github.com/jball348-svg/Bloop/issues/23) | Filter Node — Low Pass / High Pass / Band Pass | ✅ Closed |
| [#29](https://github.com/jball348-svg/Bloop/issues/29) | Mixer-Channel Signal Model — Effects as Channel Inserts | ✅ Closed |
| [#31](https://github.com/jball348-svg/Bloop/issues/31) | Drum Node — Add Controller Input Handle for ADSR Enveloping | ✅ Closed |

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

### V11 — Post-v10 UAT Follow-up Complete ✅

| # | Title | Status |
|---|---|---|
| [#60](https://github.com/jball348-svg/Bloop/issues/60) | Post-v10 UAT - Audio Bootstrap and Mandatory Intro Simplification | ✅ Closed |
| [#61](https://github.com/jball348-svg/Bloop/issues/61) | Post-v10 UAT - System Menu Layout Cleanup and Tutorial Rename | ✅ Closed |
| [#62](https://github.com/jball348-svg/Bloop/issues/62) | Post-v10 UAT - Promote MIDI In, Audio In, and Recorder into Global Utilities | ✅ Closed |
| [#63](https://github.com/jball348-svg/Bloop/issues/63) | Post-v10 UAT - Always-Visible Node Menus and Dedicated Bloop Control | ✅ Closed |
| [#64](https://github.com/jball348-svg/Bloop/issues/64) | Post-v10 UAT - Module Readability and Mix-Control Consistency Pass | ✅ Closed |
| [#65](https://github.com/jball348-svg/Bloop/issues/65) | Post-v10 UAT - Accessible Theme Redesign and Simpler Appearance Settings | ✅ Closed |
| [#66](https://github.com/jball348-svg/Bloop/issues/66) | Post-v10 UAT - Presets Library Overhaul | ✅ Closed |
| [#67](https://github.com/jball348-svg/Bloop/issues/67) | Post-v10 UAT - Snapping, Adjacency, and Overlap Resolution Rewrite | ✅ Closed |

### V12 — Sonic Expansion & Shaping 🟢

| # | Title | Status |
|---|---|---|
| [#68](https://github.com/jball348-svg/Bloop/issues/68) | [V12 Core] Parameter State Normalization & Modulation Targets | 🟠 Implemented locally |
| [#69](https://github.com/jball348-svg/Bloop/issues/69) | [V12 Feature] Generator Expansion — FM and AM Voice Modes | 🟠 Implemented locally |
| [#70](https://github.com/jball348-svg/Bloop/issues/70) | [V12 Node] EQ Node — Tone.EQ3 Insert with Sweepable Crossovers | 🟠 Implemented locally |
| [#71](https://github.com/jball348-svg/Bloop/issues/71) | [V12 Feature] LFO Node — Tempo-Synced Modulation Routing | 🟠 Implemented locally |

### V13 — Composition & Writing 🟡

| # | Title | Status |
|---|---|---|
| [#72](https://github.com/jball348-svg/Bloop/issues/72) | [V13 Core] Pattern Playback Engine — Polyphonic Clips on Tone.Transport | 🟠 Implemented locally |
| [#73](https://github.com/jball348-svg/Bloop/issues/73) | [V13 UI] Pattern Node — Piano Roll Editor | 🟠 Implemented locally |
| [#74](https://github.com/jball348-svg/Bloop/issues/74) | [V13 Feature] Gate-Accurate Envelope Handling for Pattern Notes | 🟠 Implemented locally |

### V14 — Mixing & Arrangement 🟡

| # | Title | Status |
|---|---|---|
| [#75](https://github.com/jball348-svg/Bloop/issues/75) | [V14 Core] Mixer Node — Multi-Channel Master Bus | 🟠 Implemented locally |
| [#76](https://github.com/jball348-svg/Bloop/issues/76) | [V14 Feature] Arranger Node — Section Scenes and Playback Scheduling | 🟠 Implemented locally |

### V15 — Automation & Showcase 🟡

| # | Title | Status |
|---|---|---|
| [#77](https://github.com/jball348-svg/Bloop/issues/77) | [V15 Feature] Arranger Automation Lanes — Parameter Curves and Mixer Moves | 🟠 Implemented locally |
| [#78](https://github.com/jball348-svg/Bloop/issues/78) | [V15 Core] Canvas Performance & Store Subscription Refactor | 🟠 Implemented locally |
| [#79](https://github.com/jball348-svg/Bloop/issues/79) | [V15 Product] Showcase Preset Pipeline — Built-In Song Slot and Validation | 🟠 Implemented locally |

### Superseded / Closed

| # | Title | Status |
|---|---|---|
| [#4](https://github.com/jball348-svg/Bloop/issues/4) | V3 Backlog Omnibus (superseded by #22–#29) | ✅ Closed |
| [#14](https://github.com/jball348-svg/Bloop/issues/14) | Grouped Module Locking (superseded by #15–#20) | ✅ Closed |
| [#20](https://github.com/jball348-svg/Bloop/issues/20) | Directional Wiring Overhaul (superseded by #32) | ⛔ Superseded |
| [#26](https://github.com/jball348-svg/Bloop/issues/26) | Preset Patches — Load Pre-Built Graphs from System Menu | ✅ Closed (absorbed into #12) |

---

## V12 Recommended Work Order

1. **#68** Parameter State Normalization & Modulation Targets
2. **#69** Generator Expansion — FM and AM Voice Modes
3. **#70** EQ Node — Tone.EQ3 Insert with Sweepable Crossovers
4. **#71** LFO Node — Tempo-Synced Modulation Routing

## V13 Recommended Work Order

1. **#72** Pattern Playback Engine — Polyphonic Clips on Tone.Transport
2. **#73** Pattern Node — Piano Roll Editor
3. **#74** Gate-Accurate Envelope Handling for Pattern Notes

## V14 Recommended Work Order

1. **#75** Mixer Node — Multi-Channel Master Bus
2. **#76** Arranger Node — Section Scenes and Playback Scheduling

## V15 Recommended Work Order

1. **#77** Arranger Automation Lanes — Parameter Curves and Mixer Moves
2. **#78** Canvas Performance & Store Subscription Refactor
3. **#79** Showcase Preset Pipeline — Built-In Song Slot and Validation

---

## Dependency Graph

    ── V2 Complete ── V3 Complete ── V4 Complete ── V5 Complete ──
    ── V6 Complete ── V7 Complete ── V8 Complete ── V9 Complete ──
    ── V10 Complete ── V11 Complete ──

    V12:
    #68 (parameter normalization + modulation targets)
      ├─→ #69 (FM/AM generator modes)
      ├─→ #70 (EQ node)
      └─→ #71 (LFO modulation routing)

    V13:
    #68 ─┐
    #69 ─┴→ #72 (pattern playback engine) → #73 (piano roll UI)
                                   └──────→ #74 (gate-accurate note handling)

    V14:
    #68 ─→ #75 (mixer node)
    #72 ─┐
    #75 ─┴→ #76 (arranger scenes + playback scheduling)

    V15:
    #68 ─┐
    #75 ─┼→ #77 (automation lanes)
    #76 ─┘

    #72 ─┐
    #75 ─┴→ #78 (performance refactor)

    #75 ─┐
    #76 ─┼→ #79 (showcase preset pipeline)
    #77 ─┤
    #78 ─┘

---

## How to Update This File

When you close a ticket:
1. Change its status in the table from the current backlog marker to `✅ Closed`.
2. Strike through its entry in the relevant Work Order section if it is no longer active.
3. Update the dependency graph if the closure changes the active frontier of work.
4. Commit this file in the same PR as the implementation work.

When a new ticket is added to GitHub Issues:
1. Add a row to the appropriate version snapshot section.
2. Insert it into the recommended work order for that version.
3. Update the dependency graph if it introduces a new hard dependency.
4. Keep this file authoritative; do not append a second standalone tracker at the bottom.
