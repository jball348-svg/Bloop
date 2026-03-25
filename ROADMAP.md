# Bloop Project Roadmap

Bloop is a visual modular audio sandbox built to make synthesis, routing, and song structure approachable for non-musicians. This roadmap now reflects the shipped state through v17 and the most relevant next-step frontiers.

---

## Shipped Through v17

### Foundations (v1-v5)

- Visual node canvas with React Flow + Tone.js integration
- Core generator, drum, controller, and global singleton nodes
- Undo/redo, snapping, locking, packing, and signal-flow visualization

### Musical and Sonic Expansion (v6-v12)

- Quantizer and theory helpers
- Mood Pad and more beginner-friendly control surfaces
- Sampler, Advanced Drums, MIDI In, Audio In, and session recording
- Onboarding, themes, expanded presets, campaign mode
- FM/AM generator modes, EQ, and LFO modulation

### Song Building (v13-v15)

- Pattern / piano-roll authoring
- Mixer and Arranger systems
- Scene automation lanes
- Performance refactors and showcase preset pipeline

### Math Receiver Foundation (v16 workstream, partially shipped)

The repo now includes receiver-side math foundations:

- many nodes expose violet math-input receiver selectors
- the store can persist receiver targets and apply normalized values
- contextual targets exist for selected Pattern notes, selected Arranger scenes, mixer channels, and Step Sequencer selected steps

Important constraint:

- there is still **no shipped sender node**, so math routing remains a partial foundation rather than a finished user-facing composition system

### AI-Authored Song Pipeline (v17 shipped)

v17 focused on making one convincing AI-authored song load and play inside the real app, without pretending the runtime itself is a generalized AI composer.

Shipped outcomes:

- asset-backed AI song scaffold preset
- asset-backed flagship AI showcase song preset
- normalized/validated `.bloop` load path for presets and files
- broader song-writing surfaces: Pattern C2-C6, up to 16 bars, Step Sequencer C2-C6, Arranger up to 32 bars, scene duplication, richer sampler automation
- build-time grounded compiler using `.agent/composer/*` as theory truth and the repo as execution truth

---

## Current Product Direction

The product now supports two complementary creative modes:

- **Sandbox patching** for immediate visual sound design
- **Structured song playback** through patterns, arranger scenes, automation, and compiled showcase assets

This means Bloop is no longer only a modular patch toy. It is now a constrained browser composition environment with a demonstrable song pipeline.

---

## Current Constraints

- Math routing is receiver-ready but not sender-complete
- Recording exports browser-native audio rather than WAV stems
- AI song authoring is build-time and scaffold-first, not a prompt box inside the app
- Musical-brain abstractions live at build time and in docs, not as native runtime objects

---

## Likely Next Frontier

The repo is positioned for a post-v17 hardening and expansion phase rather than a total redesign. The most plausible next areas are:

1. **UAT hardening**
   - verify the flagship song and save/load flows in real browser usage
   - tighten validation, onboarding clarity, and error handling
2. **Math system completion**
   - add honest sender surfaces or formalize the current receiver-only state
   - avoid implying a complete cable authoring workflow before it exists
3. **AI composition tooling**
   - deepen plan-time musical reasoning, revision loops, and tooling around the existing compiler
   - keep runtime claims conservative

---

## Reference Docs

- [`README.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/README.md)
- [`PROJECT_OVERVIEW.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/PROJECT_OVERVIEW.md)
- [`AI_SONG_AUTHORING.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/AI_SONG_AUTHORING.md)
- [`.agent/plans/v16-math-cable-system.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/plans/v16-math-cable-system.md)
- [`.agent/plans/v17-ai-authored-song-pipeline.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/plans/v17-ai-authored-song-pipeline.md)
