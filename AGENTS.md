# AGENTS.md — Bloop Project Briefing

This file is the authoritative briefing document for any AI agent (Codex, Windsurf, Claude, Cursor, or otherwise) working on this codebase. Read it fully before writing a single line of code.

---

## What is Bloop?

Bloop is a **modular audio synthesiser** built as a visual node-based canvas. Users drag and drop audio nodes onto a canvas and connect them with virtual cables to create sounds — no music theory or technical knowledge required.

The primary audience is **non-musicians and non-technical users**. Every design and UX decision should be made with this in mind.

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
│   ├── page.tsx              # Main canvas. React Flow provider, drag/drop, snapping, overlap resolution.
│   └── layout.tsx            # Root layout, fonts, metadata.
├── components/
│   ├── SignalMenu.tsx         # Top edge menu — Generator, Effect, Drum drag sources
│   ├── ControllerMenu.tsx     # Left edge menu — Controller, Chord drag sources
│   ├── GlobalMenu.tsx         # Right edge menu — Tempo, Amplifier (singletons)
│   ├── SystemMenu.tsx         # Bottom edge menu — New/Clear canvas button
│   ├── ControllerNode.tsx     # Arpeggiator + QWERTY keyboard — fires note events, no audio node
│   ├── ChordNode.tsx          # Note-to-chord transformer — no audio node
│   ├── GeneratorNode.tsx      # Oscillator — PolySynth, waveform selection
│   ├── DrumNode.tsx           # Drum machine — Hits and Grid modes
│   ├── TempoNode.tsx          # Global BPM broadcaster — singleton, no cables
│   ├── SpeakerNode.tsx        # Global output volume — singleton, labelled 'Amplifier', no cables
│   ├── EffectNode.tsx         # FX chain — Reverb, Delay, Distortion, Phaser, BitCrusher
│   └── EngineControl.tsx      # Tone.js audio unlock overlay
├── store/
│   └── useStore.ts            # THE BRAIN. All audio node lifecycle, routing, and state.
├── TICKETS.md                 # Current ticket status and work order — check this before starting.
├── PROJECT_OVERVIEW.md        # Full technical deep-dive — read before any significant change.
└── AGENTS.md                  # This file.
```

---

## Architecture: How Audio Works

This is the most important section. Get this wrong and you will break everything.

### The Store is the Source of Truth
- All `Tone.AudioNode` instances live in Maps inside `useStore.ts`, not in component state
- Components are purely UI — they call store actions, they never own audio objects
- When modifying audio behaviour, **always start in `useStore.ts`**

### Broadcast Model (Singletons)
- **Tempo** and **Amplifier (Speaker)** nodes are singletons — only one of each can exist on the canvas
- They are **not wired with cables** — they broadcast globally
- `TempoNode` sets `Tone.Transport.bpm` — all rhythmic nodes read from Transport directly
- `SpeakerNode` controls master output volume via a singleton `Tone.Volume` → `Tone.Destination`
- All Generator and Drum nodes route to this automatically — no cable required
- Default fallback: no Tempo → 120 BPM; no Amplifier → 50% volume

### Node Categories

| Category | Examples | Has Audio Node? | Cables? |
|---|---|---|---|
| Controller | Arp, QWERTY Keyboard | No — fires note events only | Yes — to Chord or Generator |
| Chord | Chord Node | No — transforms note events | Yes — between Controller and Generator |
| Generator | Oscillator | Yes — PolySynth | Yes — to Effects |
| Drum | Drum Machine | Yes — MembraneSynth/NoiseSynth/MetalSynth | Yes — to Effects |
| Effect | Reverb, Delay, Distortion, Phaser, BitCrusher | Yes | Yes — chains to other Effects |
| Singleton (Global) | Tempo, Amplifier | Yes (Transport / Volume) | **No cables** |

### Signal Flow
```
Controller ──► (Chord) ──► Generator ──► (Effect chain) ──► masterOutput ──► Tone.Destination
     fires noteOn/Off   fans to chord    audio signal        routed by store    always-on output

Drum ──────────────────────────────────► (Effect chain) ──► masterOutput
```

### Audio Node Lifecycle
1. **Create**: `initAudioNode()` — called when a node is dropped on the canvas
2. **Connect**: `rebuildAudioGraph()` — called whenever edges change
3. **Destroy**: `removeNodeAndCleanUp()` or `clearCanvas()` — disposes Tone.js node, removes from Map

Always call `.dispose()` on Tone.js nodes when removing them. Failure causes memory leaks and ghost audio.

---

## Design System

### Colour Coding by Node Type

| Node | Colour | Tailwind |
|---|---|---|
| Controller | Amber / Yellow | `bg-yellow-500` / `border-yellow-500` |
| Chord | Sky blue | `bg-sky-500` / `border-sky-500` |
| Generator | Blue | `bg-blue-500` / `border-blue-500` |
| Drum | Orange | `bg-orange-500` / `border-orange-500` |
| Effect | Fuchsia | `bg-fuchsia-500` / `border-fuchsia-500` |
| Amplifier (Speaker) | Emerald | `bg-emerald-500` / `border-emerald-500` |
| Tempo | Indigo | `bg-indigo-500` / `border-indigo-500` |

### Canvas Accent Language
- All adjacency / routing indicators use **cyan** (`#22d3ee`) — rings, edge glow, trash bin
- Manual edges: cyan glow stroke
- Dashed slate preview line during connection drag

### Glassmorphic Dark UI
All nodes use: semi-transparent dark background (`bg-slate-900`), coloured border, subtle glow on hover, high-contrast Inter text.

### Node Sizing
- Nodes must be the minimum size needed to contain their content
- Hard-coded `NODE_DIMS` in both `app/page.tsx` and `store/useStore.ts` must stay in sync with rendered Tailwind classes

---

## Coding Conventions

- **TypeScript everywhere** — no `any` unless absolutely unavoidable and commented
- **Store for audio, components for UI** — never put Tone.js logic inside a component
- **`rampTo(value, 0.1)`** for all parameter changes — never set values directly
- **Always `.dispose()`** Tone.js nodes on cleanup
- **Zustand actions** should be atomic — one action does one thing
- File names: PascalCase for components, camelCase for everything else
- New node types must be added to: `nodeTypes` in `page.tsx`, `SIGNAL_ORDER` and `VALID_AUTO_WIRE_PAIRS` in `useStore.ts`, and `NODE_DIMS` in both files

---

## What NOT to Do

- ❌ Do not create `Tone.AudioNode` instances inside React components
- ❌ Do not use `setInterval` for rhythmic behaviour — use `Tone.Transport` and `Tone.Sequence`/`Tone.Loop`
- ❌ Do not add audio output ports to Tempo or Amplifier nodes — they are broadcast/global only
- ❌ Do not gate audio on a Speaker cable being connected — all generators route to `masterOutput` directly
- ❌ Do not allow more than one Tempo or Amplifier node on the canvas
- ❌ Do not add BPM or tempo labels to Drum nodes — they follow Transport silently
- ❌ Do not set Tone.js parameter values directly — always use `rampTo` to avoid clicks
- ❌ Do not skip calling `rebuildAudioGraph()` after adding/removing nodes or changing edges
- ❌ Do not forget to update `NODE_DIMS` when changing node component dimensions

---

## Before You Start Any Ticket

1. Read `TICKETS.md` — understand the work order and what is already done
2. Read the GitHub issue for the full spec (revisions appear as comments)
3. Read `PROJECT_OVERVIEW.md` if the change touches audio, routing, adjacency, or node lifecycle
4. Identify all affected files — changes often ripple between `page.tsx`, `useStore.ts`, and one or more node components
5. Check for dependencies — some tickets must be completed before others
6. When done, update `TICKETS.md` to reflect the new status
