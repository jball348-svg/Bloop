# Bloop

Bloop is a visual modular audio sandbox for non-musicians and curious tinkerers. You drag colourful nodes onto a canvas, connect them with cables or snap them into place, and build playable synth patches without needing to know traditional audio-routing jargon first.

The current repo reflects the v10 state of the product: external input, recording export, onboarding, theming, an expanded preset library, advanced visualisers, and a beginner-friendly campaign mode all ship in the app today.

---

## Current Feature Set

### Controller Nodes

| Node | Description |
|---|---|
| **Arpeggiator** | Tempo-synced note generator with scale selection and play/stop state. |
| **Keys** | QWERTY keyboard controller with visual piano layout. |
| **MIDI In** | External MIDI input via Web MIDI API with device selection and velocity-aware note triggering. |
| **ADSR** | Envelope controller for attack, decay, sustain, and release shaping. |
| **Chord** | Expands a single note into chord voicings including major, minor, 7ths, sus, diminished, and augmented shapes. |
| **Pulse** | Discrete trigger node for clocking sequencers or firing note events. |
| **Step Sequencer** | Multi-step melodic sequencer with per-step note and gate settings. |
| **Mood Pad** | XY controller that outputs musical gestures through an intuitive "feel-first" interface. |

### Signal / Audio Nodes

| Node | Description |
|---|---|
| **Generator** | Polyphonic oscillator with sine, square, triangle, sawtooth, and noise modes. |
| **Sampler** | File-backed sampler with waveform preview, loop, reverse, playback-rate, and pitch-shift controls. |
| **Audio In** | Live microphone or USB-interface input via `getUserMedia`, with gain control and level metering. |
| **Drum** | Legacy drum machine kept for backwards-compatible patches. |
| **Advanced Drums** | Sample-capable multi-track drum machine with step sequencing and swing. |
| **Effect** | Reverb, delay, distortion, phaser, and bitcrusher processor node. |
| **Unison** | Chorus-based width / detune-style voice thickening. |
| **Detune** | Pitch-shift processor with wet mix control. |
| **Quantizer** | Theory helper that snaps note events into a selected key and scale. |
| **Visualiser** | Waveform, spectrum, VU meter, and dual-input XY/Lissajous visualisation. |

### Global Nodes

| Node | Description |
|---|---|
| **Tempo** | Singleton transport controller for BPM. |
| **Amplifier** | Singleton master output volume node. |

### Canvas, Workflow, and UX

- Drag-and-drop node creation from contextual edge menus.
- Directional control routing and audio routing.
- Spatial snapping, adjacency detection, locking, and packed macro nodes.
- Save and load `.bloop` patch files.
- Undo and redo with 50-step history.
- Signal Flow overlay for animated cable pulses.
- In-app onboarding with replayable animated tutorial clips and intro audio.
- Light, dark, and system theme support.
- Per-node accent overrides from a curated palette, with unlockable campaign skins.
- Categorised preset browser with 15+ built-in patches plus unlockable reward presets.
- Beginner campaign mode with five playable levels, patch verification, and persistent rewards.

### Input / Output

- **MIDI input** through Web MIDI API.
- **Live audio input** through browser microphone / interface permissions.
- **Session recording** from the System menu with downloadable browser-native audio export.

---

## Menus

| Menu | Position | Contents |
|---|---|---|
| **Signals** | Top centre | Generator, Sampler, Audio In, Drum, Advanced Drums, Effect, Unison, Detune, Quantizer, Visualiser |
| **Controllers** | Left centre | Keys, MIDI In, Arpeggiator, Chord, Pulse, Step Sequencer, ADSR, Mood Pad |
| **Global** | Right centre | Tempo, Amplifier |
| **System** | Bottom centre | New, Save, Load, Presets, Appearance, Intro, Campaign, Signal Flow, Record, Undo, Redo |

---

## Presets and Campaign

- The preset library is grouped into:
  - Getting Started
  - Rhythmic
  - Ambient
  - Complex Patches
  - Feature Showcases
  - Campaign Rewards
- Campaign mode is optional and does not restrict sandbox use.
- Completing campaign levels unlocks:
  - extra accent skins for the Appearance panel
  - reward presets in the Presets panel

---

## Important Current Behaviour

- `.bloop` patch files save the graph and master volume only.
- Theme, onboarding progress, unlocked skins, unlocked presets, and campaign progress are stored separately in local storage.
- MIDI support depends on browser support for the Web MIDI API. Chromium-based browsers are the safest choice.
- Recording currently exports browser-native audio (`.webm`) rather than WAV.
- Audio still requires a user gesture to start. You must click the engine-start overlay before testing sound.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI / Canvas | React Flow 11 |
| Audio Engine | Tone.js 15 |
| State Management | Zustand 5 |
| Styling | Tailwind CSS 4 |
| Music Theory | `@tonaljs/tonal` |
| Language | TypeScript |
| React | React 19 |

---

## Project Structure

```text
bloop/
├── app/
│   ├── page.tsx                  # Main canvas, menus, campaign split layout
│   ├── layout.tsx                # Root layout + theme controller mount
│   └── globals.css               # Theme variables and shared chrome styling
├── components/
│   ├── *Node.tsx                 # Individual node UIs
│   ├── SystemMenu.tsx            # Save/load, presets, appearance, campaign, recording
│   ├── OnboardingModal.tsx       # First-run / replayable onboarding overlay
│   ├── CampaignPanel.tsx         # Left-side campaign UI
│   ├── ThemeController.tsx       # Applies light/dark/system mode
│   └── SignalFlowOverlay.tsx     # Animated cable pulses
├── store/
│   ├── useStore.ts               # Main canvas + audio lifecycle store
│   ├── usePreferencesStore.ts    # Theme, onboarding, unlocked skins/presets
│   ├── presets.ts                # Categorised preset catalog
│   ├── campaign.ts               # Campaign progress store
│   └── campaignLevels.ts         # Beginner campaign content
├── lib/
│   ├── nodePalette.ts            # Accent palette and reward skins
│   ├── campaignTypes.ts          # Campaign types
│   └── campaignVerifier.ts       # Pure level verification helpers
├── public/
│   └── onboarding/               # Animated onboarding tutorial assets
├── .agent/plans/                 # Versioned ExecPlans
├── AGENTS.md                     # Project briefing for coding agents
├── STYLE_GUIDE.md                # Node colour and UI design system
├── TICKETS.md                    # Ticket history / status
├── PROJECT_OVERVIEW.md           # Technical deep-dive
└── ROADMAP.md                    # Roadmap context
```

---

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), click **START AUDIO ENGINE**, and then begin patching.

Useful commands:

```bash
npm run build
npm run lint
```

`npm run dev` clears stale port-3000 locks before starting the local server.

---

## Architecture Notes

- `store/useStore.ts` is the source of truth for the audio graph.
- Tone.js audio nodes live in store-managed Maps, not in component state.
- Components are UI shells that call store actions.
- `VisualiserNode` is the only intentional exception: it owns display-only analysers that reconnect when the graph changes.
- Undo, redo, save/load, and graph rebuilds all flow through the store lifecycle.

If you are changing behaviour rather than just using the app, read [AGENTS.md](./AGENTS.md), [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md), and [STYLE_GUIDE.md](./STYLE_GUIDE.md) first.
