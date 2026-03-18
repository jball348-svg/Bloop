# AGENTS.md — Bloop Project Briefing

This file is the authoritative briefing document for any AI agent (Codex, Windsurf, Claude, Cursor, or otherwise) working on this codebase. Read it fully before writing a single line of code.

---

## What is Bloop?

Bloop is a **modular audio synthesiser** built as a visual node-based canvas. Users drag and drop audio nodes onto a canvas and connect them with virtual cables to create sounds — no music theory or technical knowledge required.

The primary audience is **non-musicians and non-technical users**. Every design and UX decision should be made with this in mind. If something requires musical knowledge to understand, it's probably wrong.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| UI / Canvas | React Flow |
| Audio Engine | Tone.js |
| State Management | Zustand |
| Styling | Tailwind CSS |
| Music Theory | @tonaljs/tonal |
| Language | TypeScript |

---

## Project Structure

```
bloop/
├── app/
│   ├── page.tsx          # Main canvas. React Flow provider, drag/drop registration.
│   └── layout.tsx        # Root layout, fonts, metadata.
├── components/
│   ├── ControllerNode.tsx  # Arp and QWERTY keyboard — fires note events, no audio node
│   ├── GeneratorNode.tsx   # Oscillator — PolySynth, waveform selection, Mix knob
│   ├── DrumNode.tsx        # Drum machine — Hits and Grid modes
│   ├── TempoNode.tsx       # Global BPM broadcaster — singleton
│   ├── ChordNode.tsx       # Note event transformer — fans single notes into chords
│   ├── EffectNode.tsx      # FX chain — Reverb, Delay, Distortion, Phaser, BitCrusher
│   ├── SpeakerNode.tsx     # Global volume controller — singleton, labelled 'Amplifier'
│   ├── Toolbar.tsx         # Node picker — two sections: multi-instance (left) and singletons (right)
│   └── EngineControl.tsx   # Tone.js context start/stop, master bypass
├── store/
│   └── useStore.ts         # THE BRAIN. All audio node lifecycle, routing, and state lives here.
└── TICKETS.md              # Current ticket status and work order — check this before starting.
```

---

## Architecture: How Audio Works

This is the most important section. Get this wrong and you'll break everything.

### The Store is the Source of Truth
- All `Tone.AudioNode` instances live in a `Map` inside `useStore.ts`, not in component state
- Components are purely UI — they call store actions, they don't own audio objects
- When modifying audio behaviour, **always start in `useStore.ts`**

### Broadcast Model (Singletons)
- **Tempo** and **Amplifier** nodes are singletons — only one of each can exist on the canvas
- They are **not wired with cables** — they broadcast globally
- `TempoNode` sets `Tone.Transport.bpm` — all rhythmic nodes read from Transport directly
- `SpeakerNode` (Amplifier) controls master output volume — all Generator and Drum nodes route directly to `Tone.Destination`, no cable required
- Default fallback: if no Tempo node exists → 120 BPM. If no Amplifier exists → 50% volume.

### Node Categories

| Category | Examples | Has Audio Node? | Cables? |
|---|---|---|---|
| Controller | Arp, QWERTY Keyboard | No — fires note events only | Yes — to Chord or Generator |
| Chord | Chord Node | No — transforms note events | Yes — between Controller and Generator |
| Generator | Oscillator, Drums | Yes — PolySynth / MembraneSynth etc. | Yes — to Effects |
| Effect | Reverb, Delay, Distortion, Phaser, BitCrusher | Yes | Yes — chains to other effects or nothing |
| Singleton (Global) | Tempo, Amplifier | Yes (Transport / Volume) | **No cables** |

### Note Event Flow
```
Controller → (Chord) → Generator → (Effect → Effect) → Tone.Destination
     fires noteOn/Off   fans out     audio signal       always-on output
```

### Audio Node Lifecycle
1. **Create**: `initAudioNode()` — called when node is dropped on canvas
2. **Connect**: `rebuildAudioGraph()` — called whenever edges change
3. **Destroy**: `removeNodeAndCleanUp()` — disposes Tone.js node, removes from Map

Always call `.dispose()` on Tone.js nodes when removing them. Failure to do so causes memory leaks and ghost audio.

---

## Design System

### Glassmorphic Dark UI
All nodes use a consistent glassmorphic style: semi-transparent dark backgrounds, subtle glow, high contrast text.

### Colour Coding by Node Category

| Category | Colour | Hex |
|---|---|---|
| Generator | Azure Blue | `#3b82f6` |
| Effect | Fuchsia | `#d946ef` |
| Controller | Amber / Yellow | `#eab308` |
| Amplifier (Speaker) | Emerald Green | `#10b981` |
| Tempo | — | TBD (distinct from above) |
| Chord | — | TBD (distinct from above) |
| Drum | — | TBD (distinct from above) |

### Node Sizing
- Nodes must be the **minimum size needed to contain their content** — no empty padding or dead space inside node borders
- Fonts and control sizes are fixed — only the container shrinks to fit

### Typography
- Font: Inter (Black weight for headers, regular for controls)
- Keep all labels concise — non-technical users should understand everything at a glance

---

## Coding Conventions

- **TypeScript everywhere** — no `any` unless absolutely unavoidable and commented
- **Store for audio, components for UI** — never put Tone.js logic inside a component
- **`rampTo(value, 0.1)`** for all parameter changes — never set values directly, to avoid audio clicks
- **Always dispose** Tone.js nodes on cleanup
- **Zustand actions** should be atomic — one action does one thing
- File names: PascalCase for components (`TempoNode.tsx`), camelCase for everything else

---

## What NOT to Do

- ❌ Do not create new `Tone.AudioNode` instances inside React components
- ❌ Do not use `setInterval` for any rhythmic behaviour — use `Tone.Transport` and `Tone.Sequence`
- ❌ Do not add audio output ports to Tempo or Amplifier nodes — they are broadcast/global only
- ❌ Do not gate audio output on a Speaker/Amplifier cable being connected — all generators route to `Tone.Destination` directly
- ❌ Do not allow more than one Tempo or Amplifier node on the canvas
- ❌ Do not add BPM or tempo labels to the Drum node — it receives from Transport silently
- ❌ Do not show 'not connected' warnings on the Drum node

---

## Before You Start Any Ticket

1. Read `TICKETS.md` to understand the current work order and what's already done
2. Check the GitHub issue for the full spec and any comments (spec revisions appear as comments)
3. Identify which files are affected (listed in each issue)
4. Check for dependencies — some tickets must be completed before others
5. When done, update `TICKETS.md` to reflect the new status
