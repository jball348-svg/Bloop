# Bloop: Modular Nodes Synthesizer

Bloop is a high-performance, visually stunning modular audio synthesizer built with **Next.js**, **React Flow**, and **Tone.js**. It allows users to create complex audio patches by connecting functional nodes—Generators, Effects, Controllers, and Speakers—in a dynamic, interactive canvas.

![Bloop Header](public/screenshot.png) (Coming soon!)

## 🚀 Key Features

- **Visual Modular Patching**: Intuitive drag-and-drop interface powered by React Flow.
- **Dynamic Audio Engine**: Real-time sound synthesis using Tone.js.
- **Multi-Generator Support**: Choose between classic Waveform oscillators and Polyphonic Synths.
- **Rich Effect Suite**: Chain Reverb, Delay, Distortion, Phaser, and BitCrusher to sculpt your sound.
- **Interactive Controllers**:
  - **Arpeggiator**: Generate complex rhythmic patterns with selectable scales (Major, Minor, Pentatonic, etc.) and root notes.
  - **QWERTY Keyboard**: Play the synthesizer directly from your computer keyboard with visual feedback.
- **Real-time Parameter Smoothing**: All sliders use `rampTo` to ensure glitch-free audio adjustments.
- **Custom Design System**: Premium dark-mode aesthetic with vibrant accent colors for different node types.
- **Trash Bin**: Drag nodes to the red bin to delete them and instantly clean up the audio graph.

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Store-driven audio lifecycle)
- **Audio Engine**: [Tone.js](https://tonejs.github.io/)
- **Visuals/Graph**: [React Flow](https://reactflow.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Music Theory Logic**: [@tonaljs/tonal](https://github.com/tonaljs/tonal)

## 📁 File Structure & Functionality

### Core Logic
- `store/useStore.ts`: The "brain" of the app. Manages the React Flow nodes/edges, Tone.js audio node instances, and the logic for connecting/disconnecting the audio graph. It ensures that the audio state remains perfectly synced with the UI.

### Components
- `components/ControllerNode.tsx`: Handles MIDI-like input. Contains logic for the Arpeggiator and the QWERTY Playable Keyboard.
- `components/GeneratorNode.tsx`: The source of sound. Currently supports multiple waveforms and polyphonic synthesis.
- `components/EffectNode.tsx`: Audio processors. Dynamically switches between Reverb, Delay, Distortion, Phaser, and BitCrusher.
- `components/SpeakerNode.tsx`: The final output stage with volume and mute controls.
- `components/Toolbar.tsx`: Floating UI for adding new nodes to the canvas.
- `components/EngineControl.tsx`: Global audio engine start/stop and master controls.

### App Pages
- `app/page.tsx`: The main canvas setup, handling drag-and-drop registration and the React Flow provider.
- `app/layout.tsx`: Root layout with font and SEO configuration.

## 🚦 Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** in your browser and start patching!

---

Built with dedication by the Bloop Team.
