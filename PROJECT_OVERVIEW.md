# Bloop Project Deep-Dive

This document provides a comprehensive technical overview of Bloop, designed for both human review and LLM context.

## 1. System Architecture

Bloop follows a **uni-directional data flow** where the UI (React Flow) and Audio (Tone.js) are synchronized through a central **Zustand store**.

### The Store-Driven Audio Lifecycle
Unlike traditional React apps where audio nodes might live in component state, Bloop stores all `Tone.AudioNode` instances in a `Map` within the Zustand store.
- **Initialization**: Nodes are created when added to the graph or when their subtype changes.
- **Connection**: The `rebuildAudioGraph` function traverses the React Flow edges and maps them to Tone.js `.connect()` calls.
- **Disposal**: When a node is deleted, its corresponding audio node is `.dispose()`-ed to prevent memory leaks and ghost audio.

## 2. Component Breakdown

### Controller Node (`ControllerNode.tsx`)
The controller is a "data node" that doesn't process audio directly but fires MIDI-like events to connected generators.
- **Arpeggiator**: Uses `setInterval` and `Tonal.js` to cycle through notes in a scale.
- **Keyboard**: Maps `keydown` events to `fireNoteOn` triggers. It includes a custom-styled piano UI for visual feedback.

### Generator Node (`GeneratorNode.tsx`)
Generators are the oscillators of the system.
- Every Generator instance is a `Tone.PolySynth`, allowing it to handle multiple simultaneous notes from a Controller.
- Users can switch between `sine`, `square`, `triangle`, and `sawtooth` waveforms.

### Effect Node (`EffectNode.tsx`)
Effects process the audio signal. The node is polymorphic, meaning it can change its internal Tone.js node type on the fly:
- **Reverb**: `Tone.Freeverb`
- **Delay**: `Tone.FeedbackDelay`
- **Distortion**: `Tone.Distortion`
- **Phaser**: `Tone.Phaser`
- **BitCrusher**: `Tone.BitCrusher`

### Speaker Node (`SpeakerNode.tsx`)
The terminal node. It wraps a `Tone.Volume` node and connects to `Tone.Destination`. It features:
- Volume slider (mapped from dB to a linear 0-100 scale).
- High-visibility Mute toggle.

## 3. Advanced Features

### Glitch-Free Parameter Updates
To avoid "zipper noise" or clicks when moving sliders, the `updateNodeValue` function uses `rampTo(value, 0.1)`. This smoothly interpolates parameters like volume, frequency, and wetness over a 100ms window.

### Drag-to-Delete Interface
Using the `onNodeDragStop` hook from React Flow, Bloop detects if a node is released over the "Trash Bin" area. If so, it triggers a clean-up routine that removes the UI node, the edges, and the underlying audio engine instance simultaneously.

## 4. Design Aesthetics
The app uses a consistent **Glassmorphic Design System**:
- **Generators**: Azure blue (`#3b82f6`)
- **Effects**: Fuchsia (`#d946ef`)
- **Controllers**: Amber/Yellow (`#eab308`)
- **Speakers**: Emerald Green (`#10b981`)

All nodes feature subtle glow effects, pulsed status indicators, and high-contrast typography (Inter/Black).

## 5. File Descriptions

| File | Responsibility |
| :--- | :--- |
| `store/useStore.ts` | State management, audio graph routing, and node lifecycle. |
| `app/page.tsx` | Main application entry point and React Flow canvas setup. |
| `components/ControllerNode.tsx` | Logic for Arp and QWERTY keyboard interaction. |
| `components/GeneratorNode.tsx` | Waveform selection and synth engine interface. |
| `components/EffectNode.tsx` | Multi-effect processing and parameter sliders. |
| `components/SpeakerNode.tsx` | Master output, volume control, and metering UI. |
| `components/Toolbar.tsx` | User interface for instantiating new modular components. |
| `components/EngineControl.tsx` | Global Tone.js context initializer and master bypass. |

---
**Technical Note for LLMs**: When modifying this codebase, always prioritize the `useStore.ts` logic for audio changes. Component-level state should be reserved for UI-only polish.
