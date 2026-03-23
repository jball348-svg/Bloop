# Bloop Product Roadmap — v4 → v10

This document captures the full planned evolution of Bloop from its current v4 state to v10. It is derived from the original product planning session and should be treated as a living document — update it as priorities shift or new ideas emerge.

---

## Current State — v3 Complete ✅

Bloop v3 shipped:
- Undo/Redo (50-step history)
- ADSR Envelope, Noise Generator, Keys Controller, Unison & Detune nodes
- Visualiser Node (waveform / spectrum)
- Save/Load/Presets system (.bloop patch files)
- Snapping & Locking (nodes snap to 15px grid; adjacency-snapped groups lock as one unit)
- Control / Audio domain separation (architectural wiring overhaul)
- Directional flow enforcement (controllers L→R, signal chain T→B)

---

## v4 — Stability, Packing & Deployment
*Theme: Solidify the foundation, fix tech debt, introduce macro-components, go live.*

| Issue | Title | Status |
|---|---|---|
| [#33](https://github.com/jball348-svg/Bloop/issues/33) | V4 Bug Omnibus — Snap, Audio Engine, Drum ADSR, Text Selection, N→S gaps | 🔵 Backlog |
| [#34](https://github.com/jball348-svg/Bloop/issues/34) | V4 Visual Polish — Cable Colours & Snapped-Node Glow Theming | 🔵 Backlog |
| [#35](https://github.com/jball348-svg/Bloop/issues/35) | Node Packing — Compress Locked Groups into Single Macro-Nodes | 🔵 Backlog |
| [#36](https://github.com/jball348-svg/Bloop/issues/36) | Vercel Pipeline Setup & Prototype Deployment | 🔵 Backlog |
| [#37](https://github.com/jball348-svg/Bloop/issues/37) | Auto-Resizing Canvas Bounds & Infinite Pan | 🔵 Backlog |
| [#23](https://github.com/jball348-svg/Bloop/issues/23) | Filter Node — Low Pass / High Pass / Band Pass | 🔵 Do not action yet |
| [#29](https://github.com/jball348-svg/Bloop/issues/29) | Mixer-Channel Signal Model | 🔵 Do not action yet |
| [#31](https://github.com/jball348-svg/Bloop/issues/31) | Drum Node — ADSR Controller Input Handle | 🔵 Do not action yet |

### v4 Highlights
- **Node Packing (#35):** The flagship v4 feature. Users build a patch, lock it, then "Pack" it into a single fuchsia-coloured Macro Node with an editable name. Unpacking restores the full locked cluster. Audio routing is preserved throughout.
- **Bug Omnibus (#33):** A comprehensive fix pass for known snapping, audio engine, and UX issues.
- **Vercel Deployment (#36):** Live URL for testing and sharing.
- **Infinite Canvas (#37):** Remove hard viewport bounds so large patches feel unrestricted.

---

## v5 — The "Bang" Update: Triggers, Time & Visual Routing
*Theme: Introduce discrete event logic for complex, mathematical sequencing. Make signal flow visible.*

| Issue | Title |
|---|---|
| [#38](https://github.com/jball348-svg/Bloop/issues/38) | The "Bloop" Pulse Node — Discrete Event Trigger (Bang-style) |
| [#39](https://github.com/jball348-svg/Bloop/issues/39) | Moog-Style Modular Step Sequencer |
| [#40](https://github.com/jball348-svg/Bloop/issues/40) | Signal Flow Visualization — Animated Cable Pulses |

### v5 Highlights
- **Pulse Node (#38):** The Max/MSP-inspired "Bang" — fires a one-shot wake-up signal to any downstream node. Has a "Sync to Global Tempo" toggle for musical timing or free-running intervals. This is the building block for all mathematical, generative sequencing in Bloop.
- **Step Sequencer (#39):** A proper Moog-style 16-step grid that advances on each Pulse input. Per-step pitch, gate, and velocity. Replaces/supersedes the basic Arp for power users.
- **Signal Flow Vis (#40):** A toggleable mode where glowing orbs animate along cable edges in real time, making routing intuitive and beautiful. Color-coded by signal domain.

---

## v6 — Theory Engine & UI Restructure
*Theme: As node count grows, the UI needs sorting. The musical output gets a smart safety net.*

| Issue | Title |
|---|---|
| [#41](https://github.com/jball348-svg/Bloop/issues/41) | Music Theory Engine — Quantizer / Scale Enforcer Node |
| [#42](https://github.com/jball348-svg/Bloop/issues/42) | Node Menu Sub-divisions — Generators, Modulators, Controllers, Triggers |
| [#43](https://github.com/jball348-svg/Bloop/issues/43) | XY Mood Pad — Intuitive Non-Musical Controller |

### v6 Highlights
- **Quantizer (#41):** A concrete music theory engine as an explicit *node* (not a hidden background force). Route notes through it to snap to a chosen key/scale. Bypass it to keep happy accidents. Uses `@tonaljs/tonal` (already in the project).
- **Menu Sub-divisions (#42):** Nested/tabbed sub-menus under Signal (Generators / Modulators / Visualisers) and Controller (Performance / Sequencing). Essential now that the node library is large.
- **XY Mood Pad (#43):** A touch-friendly 2D pad controller. Non-technical axis labels (e.g., "Tension" / "Brightness") output chord events to connected Generators. The gateway drug to complex harmony for non-musicians.

---

## v7 — The Sampler Update
*Theme: Move beyond synthesised oscillators into recorded audio.*

| Issue | Title |
|---|---|
| [#44](https://github.com/jball348-svg/Bloop/issues/44) | Sampler Node — Audio File Import & Playback |
| [#45](https://github.com/jball348-svg/Bloop/issues/45) | Sample Manipulation — Pitch Shift, Time Stretch & Reverse |
| [#46](https://github.com/jball348-svg/Bloop/issues/46) | Advanced Drum Machine — Sample-Backed 16-Step Sequencer |

### v7 Highlights
- **Sampler (#44):** Load `.wav`/`.mp3` files into a node. Trigger via Controllers. Waveform thumbnail preview. Sits alongside Generator in the Signal/Generator sub-menu.
- **Sample Manipulation (#45):** Non-destructive pitch shift (via `Tone.PitchShift`), time stretch, and reverse on any Sampler node. All in real time.
- **Advanced Drum Machine (#46):** A full rebuild of the Drum node — 8 tracks × 16 steps, per-step velocity, variable pattern length per track (for polyrhythms), swing, sample-backed with custom kit support. Clock from Pulse or Global Tempo.

---

## v8 — The I/O Update: Connectivity
*Theme: Bloop talks to the outside world.*

| Issue | Title |
|---|---|
| [#47](https://github.com/jball348-svg/Bloop/issues/47) | MIDI Input — Connect External Hardware via Web MIDI API |
| [#48](https://github.com/jball348-svg/Bloop/issues/48) | Live Audio Input — Microphone & USB Interface via getUserMedia |
| [#49](https://github.com/jball348-svg/Bloop/issues/49) | Session Export — Audio Recording (WAV) & MIDI File Export |

### v8 Highlights
- **MIDI In (#47):** External MIDI keyboards trigger Bloop Generators via Web MIDI API. Note velocity respected. CC messages mappable to parameters. MIDI Out as a stretch goal.
- **Audio In (#48):** Live microphone or USB audio interface input via `Tone.UserMedia`. Route your voice or guitar through Bloop's entire effect chain.
- **Session Export (#49):** Record the master output to a downloadable WAV file. MIDI export of generated note sequences as a `.mid` file. Bloop becomes part of a real production workflow.

---

## v9 — Polish, Vibe & Onboarding
*Theme: Make it feel like a premium, finished product. First impressions matter.*

| Issue | Title |
|---|---|
| [#50](https://github.com/jball348-svg/Bloop/issues/50) | Interactive Onboarding — GIF Tutorial Intro Screen |
| [#51](https://github.com/jball348-svg/Bloop/issues/51) | Theming Engine — Light/Dark/System Mode & User Colour Customisation |
| [#52](https://github.com/jball348-svg/Bloop/issues/52) | Expanded Presets Library & Advanced Visualiser Modes |

### v9 Highlights
- **Onboarding (#50):** A multi-step modal on first visit — GIF/video clips demonstrating snapping, routing, playing a sound, and packing a group. An optional Bloop brand intro sound plays on first load. Dismissable, replayable from System menu.
- **Theming (#51):** Full Light/Dark/System mode via CSS custom properties. Per-node-type accent colour overrides from a curated on-brand palette. Both persist via `localStorage`.
- **Presets + Visualiser (#52):** 15+ curated presets across categories (Beginner, Rhythmic, Ambient, Complex, Feature Demos). Visualiser upgraded with Lissajous, VU meter, and spectrum axis labels.

---

## v10 — The Guided Experience
*Theme: Teach synthesis through play. Rewards, not locks.*

| Issue | Title |
|---|---|
| [#53](https://github.com/jball348-svg/Bloop/issues/53) | Campaign Mode — Gamified Synthesis Puzzles with Reward System |

### v10 Highlights
- **Campaign Mode (#53):** An optional structured layer alongside the free sandbox. 20 guided levels (Beginner → Advanced) where users build circuits to achieve target sounds. Completing levels unlocks cosmetic rewards (node skins, preset packs) — never gates core features. All nodes always accessible in free play.

---

## Dependency Graph (v4 → v10)

```
v4: #33 (bugs) → #34 (polish) → #35 (packing) → #36 (deploy) → #37 (canvas)
       ↓
v5: #38 (Pulse) → #39 (Sequencer) → #40 (Signal Flow Vis)
       ↓
v6: #41 (Quantizer) → #42 (Sub-menus) → #43 (Mood Pad)
       ↓
v7: #44 (Sampler) → #45 (Sample Manip) → #46 (Drum Machine Rebuild)
       ↓
v8: #47 (MIDI In) → #48 (Audio In) → #49 (Session Export)
       ↓
v9: #50 (Onboarding) → #51 (Theming) → #52 (Presets + Visualiser)
       ↓
v10: #53 (Campaign Mode)
```

---

## Design Principles to Carry Forward

1. **Sandbox first, always.** No feature should feel like friction to free exploration. Quantizers, campaign mode, theory engines — all opt-in, never mandatory.
2. **Rewards, not locks.** Gamification unlocks cosmetics and presets, never nodes or functionality.
3. **Non-musician friendly.** At every version, there should be at least one new way to create music that requires no music theory knowledge.
4. **Audio integrity above all.** Visual transitions, packing, theming — none of them may interrupt the audio graph. Test Tone.js disposal on every new node type.
5. **Performance is a feature.** Animate where it delights, but always with a graceful performance fallback.
