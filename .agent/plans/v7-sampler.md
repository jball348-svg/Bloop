# V7 — The Sampler Update

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v7, Bloop can work with real recorded audio — not just synthesised oscillators. A user can load a WAV or MP3 file into a Sampler node, trigger it from any Controller, and run it through the full effects chain. They can pitch-shift and time-stretch the sample independently, or play it in reverse. The Drum node is replaced with a genuinely useful 16-step sample-backed drum machine with per-step velocity and polyrhythmic track lengths.

Depends on: v6 complete.

GitHub issues: #44 (Sampler Node), #45 (Sample Manipulation), #46 (Advanced Drum Machine).

## Progress

- [ ] Read GitHub issues #44, #45, #46 in full
- [ ] Milestone 1 — Sampler Node (#44): file load, playback, waveform preview, Controller trigger
- [ ] Milestone 2 — Sample Manipulation (#45): pitch shift, time stretch, reverse (non-destructive)
- [ ] Milestone 3 — Advanced Drum Machine (#46): sample-backed 16-step grid with velocity and polyrhythm
- [ ] npm run build and npm run lint pass
- [ ] Update TICKETS.md, close GitHub issues #44, #45, #46

## Surprises & Discoveries

[To be filled.]

## Decision Log

[To be filled.]

## Outcomes & Retrospective

[To be written at completion.]

## Context and Orientation

Tone.js provides `Tone.Player` for loading and playing audio files, `Tone.PitchShift` for pitch shifting without changing tempo, and `Tone.GrainPlayer` for time-stretching (granular playback). `Tone.Player` has a `.reverse` property for reverse playback and a `.playbackRate` parameter. `Tone.PitchShift` is an audio-domain effect node that can be inserted into the signal chain after the Player.

File loading in the browser: use the HTML `<input type="file" accept="audio/*">` element and the `FileReader` API to read the file as an `ArrayBuffer`, then decode it with `Tone.getContext().rawContext.decodeAudioData()` to get an `AudioBuffer`, which `Tone.Player` can accept.

For the waveform thumbnail: after loading, use the `AudioBuffer`'s channel data to render a mini waveform in a `<canvas>` element inside the node. This is purely cosmetic and runs once on load.

The existing `DrumNode.tsx` can be left in place during v7 development. The new Advanced Drum Machine is a separate node type (`'advanceddrum'`). Once validated, the old Drum node can be marked as deprecated but not removed (to avoid breaking saved patches).

The Advanced Drum Machine stores its state (which steps are on, which sample per track, velocities, pattern lengths) entirely in the node's `data` field in the React Flow nodes array. The Tone.js Players (one per track) live in the audio nodes Map, keyed by `${nodeId}-track-${trackIndex}`.

## Plan of Work

### Milestone 1 — Sampler Node (#44)

Create `components/SamplerNode.tsx`. This is a generator-domain node (it produces audio). Assign a colour from the available registry in STYLE_GUIDE.md.

UI: a "Load Sample" button, a waveform thumbnail canvas (shows after load, empty state shows a placeholder), a play/stop button (for preview), a loop toggle, and a playback speed slider.

In `store/useStore.ts`, add `'sampler'` to `AudioNodeType`. In `initAudioNode` for type `'sampler'`, create a `Tone.Player` with `toDestination: false` (it will be connected via `rebuildAudioGraph`). Store it in `audioNodes`. The Player starts with no buffer — it must be loaded first.

Add a new store action `loadSample(nodeId: string, audioBuffer: AudioBuffer)` that calls `player.load(audioBuffer)` and updates the node's data with `hasSample: true` and the waveform data for rendering.

The SamplerNode component handles the `<input type="file">` interaction and calls `loadSample`. The component uses `useEffect([id])` to register a `triggerAttack` listener via the existing `fireNoteOn` mechanism — when a note-on event arrives, call `player.start()`.

Add to all required registration points.

### Milestone 2 — Sample Manipulation (#45)

Extend `SamplerNode.tsx` and its audio node setup with three manipulation controls.

Pitch Shift: add a `Tone.PitchShift` node to the signal chain between the `Tone.Player` and the rest of the graph. In `initAudioNode`, create both the Player and a PitchShift node, chain them (`player.connect(pitchShift)`), and register the PitchShift as the node's outgoing connection point (the one that gets connected in `rebuildAudioGraph`). The pitch shift slider in the UI maps -12 to +12 semitones.

Time Stretch: `Tone.Player.playbackRate` changes speed without pitch shifting (when PitchShift compensates). Add a playback rate slider (0.25x to 2x). Call `player.playbackRate.rampTo(value, 0.1)` on change.

Reverse: `Tone.Player.reverse = true/false`. Add a toggle button. This takes effect on the next trigger.

All three controls should be in a collapsible "Advanced" panel within the SamplerNode to keep the node height manageable.

### Milestone 3 — Advanced Drum Machine (#46)

Create `components/AdvancedDrumNode.tsx`. This is a generator-domain node.

UI: 8 tracks × 16 steps grid. Each track row has a sample load button (or uses a default kit sample), a track label, and 16 step cells. Each step cell has three visual states: off, medium velocity, high velocity — cycling on click. A variable pattern length selector per track (4, 8, 12, 16 steps). A global swing slider.

Default kit: provide 4 built-in samples (kick, snare, hi-hat, clap) as base64-encoded short audio blobs embedded in the component, decoded on mount. This means the drum machine works out of the box without requiring the user to load samples.

In `store/useStore.ts`, each track within the drum machine is a separate `Tone.Player` stored in the audioNodes Map under a compound key. The sequencer clock is a `Tone.Sequence` running on `Tone.Transport`.

Swing is implemented by offsetting even-numbered steps slightly in time within the Tone.Sequence callback.

The existing `DrumNode` is preserved but deprecated. Add a deprecation notice to `DrumNode.tsx` and a note in STYLE_GUIDE.md that new patches should use `AdvancedDrumNode`.

## Concrete Steps

    npm run dev
    # Verify v6 stable before starting

    # Milestone 1:
    npm run build && npm run lint
    # Test: load a .wav file, connect to Effect → Amplifier
    # Connect Arp → Sampler — sample triggers on each Arp note

    # Milestone 2:
    npm run build && npm run lint
    # Test: pitch shift +5 semitones — sample sounds higher without speed change
    # Reverse toggle — sample plays backwards

    # Milestone 3:
    npm run build && npm run lint
    # Test: default kit plays kick/snare pattern without loading any files
    # Load custom sample into track 1 — plays in sequence
    # Set track 2 pattern length to 12 over a 16-step kick — polyrhythm is audible

## Validation and Acceptance

Sampler: load a .wav file → waveform thumbnail appears → connect Keys → Sampler → press key → sample plays. Loop toggle causes sample to loop. `npm run build` passes with no TypeScript errors.

Manipulation: pitch shift -7 semitones produces an audibly lower pitch. Time stretch 0.5x produces half-speed playback at same pitch (with PitchShift compensating). Reverse plays sample backwards.

Drum Machine: default kit immediately produces kick/snare/hi-hat on start without loading any files. Per-step velocity (medium vs high) produces audibly different strike intensities. 12-step hi-hat over 16-step kick creates an audible polyrhythm.

## Idempotence and Recovery

The Advanced Drum Machine creates multiple Tone.js Players per node. All must be disposed in `removeNodeAndCleanUp` and `clearCanvas`. Store the compound keys in the node's data so cleanup can iterate them. Test node deletion: add a drum machine, delete it, check browser memory (no audio nodes should remain in `audioNodes` Map).

## Interfaces and Dependencies

New files:
- `components/SamplerNode.tsx`
- `components/AdvancedDrumNode.tsx`

New store actions:
- `loadSample(nodeId: string, audioBuffer: AudioBuffer): void`

New AudioNodeType values: `'sampler'` | `'advanceddrum'`

Tone.js APIs used: `Tone.Player`, `Tone.PitchShift`, `Tone.Sequence`

No new npm packages required (Tone.js already included).
