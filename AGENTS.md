# AGENTS.md — Bloop Project Briefing

This file is the authoritative briefing document for any AI agent (Codex, Windsurf, Claude, Cursor, or otherwise) working on this codebase. Read it fully before writing a single line of code.

---

## What is Bloop?

Bloop is a **modular audio synthesiser** built as a visual node-based canvas. Users drag and drop audio nodes onto a canvas and connect them with virtual cables to create sounds — no music theory or technical knowledge required.

The primary audience is **non-musicians and non-technical users**. Every design and UX decision should be made with this in mind.

---

## Dev Environment

```bash
npm install          # Install all dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run compile:ai-songs   # Rebuild grounded AI-song assets and reports
npm run build        # Production build — must pass before closing any ticket
npm run lint         # ESLint — must pass before closing any ticket
```

TypeScript is checked at build time via `npm run build`. There is no separate `tsc` step. The dev server uses Turbopack; hot reload is enabled. Audio requires a user gesture to start (the EngineControl overlay handles this). Test audio in the browser after `npm run dev`.

---

## ExecPlans

When implementing complex features, significant refactors, or any work spanning multiple files or multiple GitHub issues, use an ExecPlan as described in `.agent/PLANS.md`.

An ExecPlan is a living design document written before starting work and updated continuously as implementation proceeds. It allows autonomous long-running sessions to stay on track without losing context.

**When to create an ExecPlan:** Any task involving 3+ files, any new node type, any changes to the audio graph lifecycle, or any versioned milestone in `.agent/plans/`.

**How to use:** Before starting any versioned milestone (v4, v5, v6 etc.), read the corresponding plan in `.agent/plans/`. If no plan exists, create one following `.agent/PLANS.md` before writing any code. Do not prompt the user for next steps — proceed to the next milestone in the plan automatically.

Plans live at:
- `.agent/PLANS.md` — the ExecPlan format spec (read this first)
- `.agent/plans/v4-stability-packing-deployment.md`
- `.agent/plans/v5-pulse-sequencer-signal-flow.md`
- `.agent/plans/v6-theory-ui-restructure.md`
- `.agent/plans/v7-sampler.md`
- `.agent/plans/v8-io-connectivity.md`
- `.agent/plans/v9-polish-onboarding.md`
- `.agent/plans/v10-campaign-mode.md`
- `.agent/plans/v11-uat-hardening-experience-reset.md`
- `.agent/plans/v12-modulation-sonic-expansion.md`
- `.agent/plans/v13-pattern-composition.md`
- `.agent/plans/v14-mixer-arrangement.md`
- `.agent/plans/v15-automation-showcase.md`
- `.agent/plans/v16-math-cable-system.md`
- `.agent/plans/v17-ai-authored-song-pipeline.md`

---

## Commit Conventions

Commit messages must follow: `type(scope): description`

Types: `feat`, `fix`, `refactor`, `style`, `docs`, `test`, `chore`

Examples:
- `feat(pulse-node): add discrete trigger node with tempo sync`
- `fix(snapping): resolve overlap resolution on rapid drag`
- `docs(tickets): close #33 bug omnibus`

Always update `TICKETS.md` in the same commit as the work that closes a ticket. Always close the corresponding GitHub issue when a ticket is complete.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI / Canvas | React Flow 11 |
| Audio Engine | Tone.js 15 |
| State Management | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Music Theory | @tonaljs/tonal |
| Language | TypeScript |

---

## Project Structure

```
bloop/
├── app/
│   ├── page.tsx              # Main canvas, menus, campaign split layout, drag/drop, snapping, undo/redo.
│   ├── layout.tsx            # Root layout, fonts, metadata.
│   └── globals.css           # Theme variables and shared chrome styling.
├── components/
│   ├── *Node.tsx             # Individual node UIs including Pattern, Mixer, Arranger, Sampler, Audio In, and MathInputHandle-enabled receivers
│   ├── SignalMenu.tsx        # Top edge menu — sound and signal nodes
│   ├── ControllerMenu.tsx    # Left edge menu — controller and composition nodes
│   ├── GlobalMenu.tsx        # Right edge menu — tempo, arranger, mixer, amplifier, I/O, and recorder
│   ├── SystemMenu.tsx        # Bottom edge menu — save/load, presets, appearance, intro, campaign, signal-flow, undo/redo
│   ├── OnboardingModal.tsx   # Replayable onboarding overlay
│   ├── CampaignPanel.tsx     # Campaign mode UI
│   ├── ThemeController.tsx   # Light/dark/system theme application
│   ├── SignalFlowOverlay.tsx # Animated cable pulses
│   └── EngineControl.tsx     # Tone.js audio unlock overlay
├── store/
│   ├── useStore.ts            # THE BRAIN. Audio lifecycle, routing, persistence, validation, playback, and math receiver logic.
│   ├── usePreferencesStore.ts # Theme/onboarding/unlock preferences
│   ├── presets.ts             # Curated preset catalog, including asset-backed showcase presets
│   ├── campaign.ts            # Campaign state
│   └── campaignLevels.ts      # Campaign content
├── data/
│   └── ai-song/               # MusicalPlanV1 sources, generated blueprints, and grounding reports
├── public/
│   ├── ai-song-kit/           # Shipped sample kit for the AI-song pipeline
│   ├── onboarding/            # Onboarding/tutorial assets
│   └── patches/               # Compiled `.bloop` patch assets
├── scripts/
│   └── compile-ai-song-assets.mjs  # Grounded AI-song compiler
├── .agent/
│   ├── PLANS.md               # ExecPlan format spec — read before writing any plan
│   ├── plans/                 # One ExecPlan per version milestone
│   └── composer/              # Musical-brain schemas and composer overlay docs
├── AI_SONG_AUTHORING.md       # Grounded AI-song authoring contract
├── STYLE_GUIDE.md             # Node colour registry and UI patterns — read before styling anything
├── TICKETS.md                 # Current ticket status and work order — check this before starting.
├── ROADMAP.md                 # Version summary through v17 and next frontier
├── PROJECT_OVERVIEW.md        # Technical deep-dive for the current shipped app
└── AGENTS.md                  # This file.
```

---

## Architecture: How Audio Works

This is the most important section. Get this wrong and you will break everything.

### The Store is the Source of Truth
- All `Tone.AudioNode` instances live in Maps inside `useStore.ts`, not in component state
- Components are purely UI — they call store actions, they never own audio objects
- **Exception**: `VisualiserNode` creates `Tone.Analyser` and `Tone.FFT` in component refs — these are display-only and do not participate in the audio graph
- When modifying audio behaviour, **always start in `useStore.ts`**

### Broadcast Model (Singletons)
- **Tempo** and **Amplifier (Speaker)** nodes are singletons — only one of each can exist on the canvas
- They are **not wired with cables** — they broadcast globally
- `TempoNode` sets `Tone.Transport.bpm` — all rhythmic nodes read from Transport directly
- `SpeakerNode` controls master output volume via a singleton `Tone.Volume` → `Tone.Destination`
- All Generator, Drum, and signal-processor nodes route to this automatically — no cable required

### Node Categories

| Category | Examples | Has Audio Node? | Cables? |
|---|---|---|---|
| Controller | Arp, Keys | No — fires note events only | Yes — to ADSR, Chord, or Generator |
| Envelope | ADSR | No — pass-through for note events | Yes — between Controller and Generator/Drum |
| Chord | Chord Node | No — transforms note events | Yes — between Controller and Generator |
| Generator | Oscillator, FM/AM synth, Noise | Yes — PolySynth or Tone.Noise | Yes — to signal processors |
| Drum | Drum Machine, Advanced Drums | Yes | Yes — to signal processors |
| Signal Processor | Effect, EQ, Unison, Detune, Visualiser, Sampler, Audio In | Yes | Yes — chains in signal path |
| Structure | Pattern, Mixer, Arranger, Quantizer, Step Sequencer | Mixed — some schedule events, some own audio helpers | Yes / contextual |
| Singleton (Global) | Tempo, Amplifier | Yes (Transport / Volume) | **No cables** |

### Signal Flow
```
Controller/Keys ──► (ADSR) ──► (Chord) ──► Generator ──► (Unison/Detune) ──► (Effect) ──► (Visualiser) ──► masterOutput
     fires noteOn    envelope   voicing     audio out      processing chain    FX chain      display         always-on

Drum ──────────────────────────────────────────────────► (same signal chain)
```

Additional shipped domains:

- `modulation` — existing V12 lime/green modulation routing
- `math` — receiver-side violet target surface with normalized dispatch, but no shipped sender node

### Audio Node Lifecycle
1. **Create**: `initAudioNode()` — called when a node is dropped on the canvas
2. **Connect**: `rebuildAudioGraph()` — called whenever edges change
3. **Destroy**: `removeNodeAndCleanUp()` or `clearCanvas()` — disposes Tone.js node, removes from Map

Always call `.dispose()` on Tone.js nodes when removing them. Failure causes memory leaks and ghost audio.

### Critical: rebuildAudioGraph disconnects everything
`rebuildAudioGraph()` calls `audioNodes.forEach(node => node.disconnect())` on every run. Any connections made outside the store (e.g. Visualiser's analyser refs) will be severed. Components that attach their own Tone.js nodes must re-connect them in a `useEffect` that depends on `edges` — see `VisualiserNode.tsx` for the pattern.

---

## Undo / Redo

- `saveSnapshot()` must be called before every mutating canvas action (add node, remove node, connect edge, etc.)
- `undo()` and `redo()` restore snapshots and fully re-sync the audio graph
- Parameter slider changes are NOT snapshotted — too granular
- History cap: 50 steps

---

## Design System

**Read `STYLE_GUIDE.md` before styling any node.** It contains the canonical colour registry, available colours for new nodes, and all shared structural patterns.

### Colour Summary

| Node | Colour |
|---|---|
| Arp | yellow-500 |
| Keys | white |
| ADSR | amber-700 |
| Chord | sky-500 |
| Generator | red-500 |
| Drum | orange-500 |
| Effect | fuchsia-500 |
| Unison | violet-500 |
| Detune | teal-500 |
| Visualiser | pink-500 |
| Tempo | indigo-500 |
| Amplifier | emerald-500 |
| Packed Node | orange-400 (neon orange — v4 done) |

**cyan is reserved** — adjacency glow rings and edge strokes only. Never use as a node colour.

### Canvas Accent Language
- Audio domain cables and glow: **cyan** (`#22d3ee`)
- Control domain cables: **neon green** (`#39ff14` or `#00ff88`) — v4 #34
- Adjacency rings follow domain colour (cyan for audio, neon green for control)
- Dashed slate preview line during connection drag

### Node Base Pattern
All nodes use: `bg-slate-800`, coloured `border-2`, `rounded-2xl`, `p-3`. See `STYLE_GUIDE.md` for the exact class patterns for delete buttons, handles, labels, sliders, readouts, and the unconnected indicator.

---

## Coding Conventions

- **TypeScript everywhere** — no `any` unless absolutely unavoidable and commented
- **Store for audio, components for UI** — never put Tone.js logic inside a component (Visualiser's analyser refs are the only exception, and they are display-only)
- **`rampTo(value, 0.1)`** for all parameter changes — never set values directly
- **Always `.dispose()`** Tone.js nodes on cleanup
- **Zustand actions** should be atomic — one action does one thing
- File names: PascalCase for components, camelCase for everything else
- New node types must be added to: `AudioNodeType` union, `nodeTypes` in `page.tsx`, `SIGNAL_ORDER`, `VALID_AUTO_WIRE_PAIRS`, and `NODE_DIMS` in `useStore.ts`
- New nodes that need defaults synced to Tone.js on mount need a `useEffect([id])` that pushes initial values via `updateNodeValue`

---

## What NOT to Do

- ❌ Do not create `Tone.AudioNode` instances inside React components (except Visualiser's display-only analysers)
- ❌ Do not use `setInterval` for rhythmic behaviour — use `Tone.Transport` and `Tone.Sequence`/`Tone.Loop`
- ❌ Do not add audio output ports to Tempo or Amplifier nodes — they are broadcast/global only
- ❌ Do not gate audio on a Speaker cable being connected — all generators route to `masterOutput` directly
- ❌ Do not allow more than one Tempo or Amplifier node on the canvas
- ❌ Do not set Tone.js parameter values directly — always use `rampTo` to avoid clicks
- ❌ Do not skip calling `rebuildAudioGraph()` after adding/removing nodes or changing edges
- ❌ Do not forget to update `NODE_DIMS` when changing node component dimensions
- ❌ Do not assign a colour already in the STYLE_GUIDE.md "In Use" table to a new node
- ❌ Do not use cyan as a node accent colour — it is reserved for canvas-level indicators
- ❌ Do not call `changeNodeSubType` to switch between oscillator waveforms of the same class — use `node.set()` on PolySynth; only call `changeNodeSubType` when switching between fundamentally different Tone.js classes (e.g. PolySynth ↔ Noise)
- ❌ Do not describe receiver-side math handles as a complete shipped math-cable system while sender nodes are still absent
- ❌ Do not claim `.bloop` files persist overlay-only musical intent or revision memory; they persist the patch graph plus metadata only

---

## Before You Start Any Ticket

1. Read `TICKETS.md` — understand the work order and what is already done
2. Read the GitHub issue for the full spec
3. Read the relevant ExecPlan in `.agent/plans/` — or create one if it doesn't exist
4. Read `PROJECT_OVERVIEW.md` if the change touches audio, routing, adjacency, or node lifecycle
5. Read `STYLE_GUIDE.md` if the change involves any new or modified node UI
6. Identify all affected files — changes often ripple between `page.tsx`, `useStore.ts`, menu components, and node components
7. Check for dependencies — some tickets must be completed before others
8. If the change touches the AI-song pipeline, also read `AI_SONG_AUTHORING.md` and the relevant files under `.agent/composer/`
9. When done: update `TICKETS.md`, close the GitHub issue, update the ExecPlan Progress section, and update `STYLE_GUIDE.md` if a new colour was assigned
