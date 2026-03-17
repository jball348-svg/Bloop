# Bloop v1

Bloop is a visual modular audio sandbox built with Next.js, React Flow, Tone.js, and Zustand. The final v1 build is a single-screen patching experience designed around fast experimentation: drag nodes onto the canvas, snap them into place, unlock the audio engine, and shape playable signal chains in real time.

## v1 Final Highlights

- Drag-and-drop node palette for `Controller`, `Generator`, `Effect`, and `Speaker` nodes.
- Browser-safe audio startup flow with a full-screen `START AUDIO ENGINE` gate.
- A default starter chain is present on load: controller -> generator -> speaker.
- `15px` grid snapping across the whole canvas.
- Anti-overlap drag behavior that snaps nodes flush left or right and aligns them into a shared row.
- Proximity-based patching: adjacent nodes can auto-route audio through hidden edges instead of always relying on visible cables.
- Cyan adjacency glow that signals when nodes are close enough to be treated as a chain.
- Manual React Flow connections still work and remain editable.
- `Controller` nodes can run as:
  - an arpeggiator with selectable root note and scale
  - a QWERTY keyboard with an on-screen piano and octave switching from `1` to `7`
- `Generator` nodes use `Tone.PolySynth` and support `sine`, `square`, `triangle`, and `sawtooth` oscillator shapes.
- `Effect` nodes support `Reverb`, `Delay`, `Distortion`, `Phaser`, and `BitCrusher`, with per-type controls plus mix and bypass.
- `Speaker` nodes expose smoothed master volume and mute control.
- Drag-to-trash deletion removes the UI node, connected edges, and the underlying Tone resources together.
- Node cards now carry stronger visual identity through type-specific background patterns, activity states, and "not connected" indicators.

## What Changed Since The Previous Docs Update

- The canvas is no longer just a manual cable-patching surface. Snapped adjacency now matters and can create hidden audio routes automatically.
- The default scene now opens as a pre-aligned, pre-routed chain using hidden auto-edges.
- Drag-stop logic now resolves overlaps with a more tactile "lego" feel by pushing nodes flush beside each other and aligning them by row.
- Adjacency glow was added so the user can understand implied routing without seeing a wire.
- Visible manual edges were restyled, while auto-managed edges stay hidden and only affect routing.
- `Controller` keyboard mode gained octave selection, and arpeggiation moved to `Tone.Sequence` plus `Tone.Transport` instead of a simple interval loop.
- `Generator` activity lights now reflect real note playback instead of pulsing constantly.
- `Generator` visuals were updated to a red identity that matches the toolbar and node surface treatment.
- `Controller`, `Generator`, `Effect`, and `Speaker` cards now expose clearer empty-state feedback through "not connected" status bands.
- The trash target was visually brought into the same cyan interaction language as adjacency and routing.

## Tech Stack

- `Next.js 16`
- `React 19`
- `React Flow 11`
- `Tone.js 15`
- `Zustand 5`
- `Tailwind CSS 4`
- `@tonaljs/tonal`

## Project Structure

- `app/page.tsx`: React Flow canvas setup, drag-and-drop, grid snapping, overlap resolution, trash-drop deletion, and adjacency recalculation hooks.
- `store/useStore.ts`: Central app state, Tone node lifecycle, edge routing, hidden auto-edge generation, adjacency tracking, and note dispatch.
- `components/ControllerNode.tsx`: Arpeggiator and keyboard controller UI, transport sequencing, keyboard listeners, and octave switching.
- `components/GeneratorNode.tsx`: PolySynth source node with waveform selection and active-note indicator.
- `components/EffectNode.tsx`: Switchable effect rack for reverb, delay, distortion, phaser, and bitcrusher.
- `components/SpeakerNode.tsx`: Output node with default volume initialization, mute, and volume control.
- `components/Toolbar.tsx`: Node palette for drag-adding modules.
- `components/EngineControl.tsx`: Audio-unlock overlay and default-node initialization trigger.
- `app/globals.css`: Global styling plus React Flow theming.

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open `http://localhost:3000`.

4. Click `START AUDIO ENGINE` before testing any sound.

`npm run dev` also clears a stale `:3000` lock before launching Next, which helps during repeated local restarts.

## v1 Status

This repository now reflects the end-of-v1 feature set. The next phase should be scoped as a separate v2 planning pass rather than treated as unfinished v1 implementation.
