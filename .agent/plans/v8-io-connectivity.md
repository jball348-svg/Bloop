# V8 — The I/O Update: MIDI In, Live Audio In & Session Export

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v8, Bloop connects to the outside world. A user with a MIDI keyboard can plug it in and play Bloop's generators directly. A guitarist can route their instrument through Bloop's effects chain via microphone or USB audio interface. And after building a patch, a user can hit Record, play for 30 seconds, and download a WAV file of exactly what they heard — bringing Bloop into a real music production workflow.

Depends on: v7 complete.

GitHub issues: #47 (MIDI Input), #48 (Live Audio Input), #49 (Session Export).

## Progress

- [x] (2026-03-23) Read GitHub issues #47, #48, and #49 and scoped the v8 pass to core acceptance only.
- [x] (2026-03-23) Milestone 1 — MIDI Input (#47): added `midiin`, Web MIDI access, device hot-plug updates, and note velocity support through generator dispatch.
- [x] (2026-03-23) Milestone 2 — Live Audio Input (#48): added singleton `audioin`, `Tone.UserMedia` lifecycle, gain staging, and live meter UI.
- [x] (2026-03-23) Milestone 3 — Session Export (#49): added System menu recording controls, timer/error states, and browser download export.
- [x] (2026-03-23) `npm run build` and `npm run lint` pass on the integrated v8/v9/v10 branch state.
- [x] (2026-03-23) Vercel alias status re-verified as healthy; no v4 deployment repair was required during v8.
- [ ] (2026-03-23) Update `TICKETS.md`, close GitHub issues #47, #48, and #49, and land the milestone commit.

## Surprises & Discoveries

- Observation: `MediaRecorder` in the current browser stack produces WebM/Opus, not WAV, without adding a client-side encoder dependency.
  Evidence: The implemented recorder path uses supported `audio/webm` / `video/webm` MIME checks and exports `.webm`.
- Observation: keeping live input and recording state out of snapshots/load payloads mattered more than expected because undo/redo and `.bloop` patch loads otherwise resurrected dead microphone/recorder state.
  Evidence: `audioInputChains`, recording controller state, and browser permissions now live outside the saved canvas graph.
- Observation: the previously reported Vercel failure was stale by March 23, 2026.
  Evidence: `npx vercel inspect bloop-ivory-rho.vercel.app` reported the production alias as `Ready`.

## Decision Log

- Decision: Export browser-native WebM recordings instead of forcing WAV in v8.
  Rationale: Core acceptance was downloadable audio recording; adding client-side WAV encoding would have expanded scope and dependency surface.
  Date: 2026-03-23.
- Decision: Treat `audioin` as a singleton source node whose permission/open lifecycle is controlled entirely from the node UI.
  Rationale: It matches the microphone permission model and avoids surprising background capture on drop/load.
  Date: 2026-03-23.
- Decision: Thread note velocity through both `triggerNoteOn` and `fireNoteOn`.
  Rationale: MIDI velocity needed to survive controller routing and land at `Tone.PolySynth.triggerAttack`.
  Date: 2026-03-23.
- Decision: Keep deferred v4 tickets `#23`, `#29`, and `#31` deferred during v8.
  Rationale: The user explicitly asked to keep the missed-v4 backlog out of scope unless a blocker appeared.
  Date: 2026-03-23.

## Outcomes & Retrospective

V8 now connects Bloop to external input and output workflows without polluting the saved patch format. A user can add a MIDI In node, select a hardware device, and play generators with velocity-sensitive notes. A user can add Audio In, enable a microphone/interface, hear the signal through downstream effects, and watch a live meter. The System menu can record the master output and download a playable audio file.

The implementation stayed aligned with the store-first audio architecture: live input uses `Tone.UserMedia` plus gain/meter nodes owned by `store/useStore.ts`, recording taps the master output through a `MediaStreamDestination`, and cleanup/undo/load paths dispose everything correctly.

## Context and Orientation

Web MIDI API (`navigator.requestMIDIAccess()`) is available in Chrome and Edge but not Safari (without a plugin) as of 2025. This must be handled gracefully: the MIDI In node should show an "Unavailable in this browser" state rather than crashing if the API is absent.

MIDI note-on messages carry a note number (0–127) and a velocity (0–127). Convert note number to note name using `Tone.Frequency(midiNote, 'midi').toNote()` or `@tonaljs/tonal`'s `Midi.midiToNoteName()`. Scale velocity to a 0–1 range for Tone.js PolySynth's velocity parameter.

For live audio input, `Tone.UserMedia` wraps `navigator.mediaDevices.getUserMedia`. It is an audio-domain source node that can be connected to Effect nodes via `rebuildAudioGraph`. It is a singleton (only one AudioIn node allowed on the canvas, like Tempo and Amplifier).

For session recording, `MediaRecorder` records the `AudioContext`'s destination stream. In Tone.js, `Tone.Destination.output` gives access to the Web Audio `AudioNode` that everything routes through. Connect a `MediaStreamDestination` node to capture it.

## Plan of Work

### Milestone 1 — MIDI Input (#47)

Create `components/MidiInNode.tsx`. This is a controller-domain node (no audio node). Colour: choose from STYLE_GUIDE.md available registry.

The component requests MIDI access on mount via `navigator.requestMIDIAccess()`. If the API is unavailable, render a clear error state: "MIDI not available in this browser. Use Chrome or Edge."

The node UI shows a device selector dropdown listing all connected MIDI input devices (populated from `MIDIAccess.inputs`). When a device is selected, attach a `onmidimessage` listener. Note-on (status byte 144) fires `fireNoteOn(nodeId, note, velocity)`. Note-off (status byte 128, or note-on with velocity 0) fires `fireNoteOff(nodeId, note)`.

Add `velocity` as a parameter to `fireNoteOn` in `store/useStore.ts`. Downstream PolySynth generators should pass velocity to `triggerAttack(note, undefined, velocity)` (Tone.js PolySynth accepts velocity as the third argument).

MIDI device hot-plug: listen to `MIDIAccess.onstatechange` to update the device list when devices connect or disconnect.

Add `'midiin'` to all required registration points.

### Milestone 2 — Live Audio Input (#48)

Create `components/AudioInNode.tsx`. This is a singleton signal-domain source node (like Amplifier). Colour: from STYLE_GUIDE.md. Enforce singleton: if an AudioIn node already exists on the canvas, show an error on drop.

In `store/useStore.ts`, add `'audioin'` handling in `initAudioNode`. Create a `Tone.UserMedia` instance. Store it in `audioNodes`. The UserMedia node does not auto-start — the user must click "Enable Microphone" in the node UI, which calls `userMedia.open()` (which triggers the browser permission prompt).

The node UI shows: an Enable/Disable toggle button, a status indicator (permissions state: waiting, active, denied), an input gain slider (maps 0–100 to `Tone.Volume` gain applied after the UserMedia), and a simple VU meter (an animated bar driven by a `Tone.Meter` analyser).

Handle permission denial gracefully: catch the `getUserMedia` rejection and render a clear denied state.

In `rebuildAudioGraph`: UserMedia nodes connect downstream like any other source. When the user disables the microphone (calls `userMedia.close()`), downstream nodes receive silence — no additional handling required.

### Milestone 3 — Session Export (#49)

Add recording capability to `components/SystemMenu.tsx` (or create a dedicated `components/RecordButton.tsx` included in SystemMenu).

A "Record" button toggles the recording state. A pulsing red indicator and a timer (MM:SS) are shown while recording is active.

Implementation: when recording starts, create a `MediaStreamDestination` from the Tone.js audio context: `const dest = Tone.getContext().rawContext.createMediaStreamDestination()`. Connect `Tone.Destination.output` to `dest`. Create a `MediaRecorder` with `dest.stream`. Push `ondataavailable` chunks into an array. On stop, create a Blob from the chunks and trigger a browser download via a temporary `<a href="blobUrl" download="bloop-recording.webm">` click.

Note: `MediaRecorder` natively produces WebM/Opus on most browsers, not WAV. This is acceptable — document it in the UI as "Download Recording (.webm)" rather than claiming WAV. If WAV is specifically required in the acceptance test, add a note here in the Decision Log and use a small client-side encoding library.

Add recording state to the store: `isRecording: boolean`, `startRecording(): void`, `stopRecording(): void`.

### Milestone 4 — Review missed tickets from V4 (#23/26/29/31)

It appears a number of tickets and features were missed in the v4 implementation. Review the v4 tickets and implement any missing functionality.

Additional new ticket open right now - vercel deployment not working, fix before closing v8.

Vercel returning this;

404: NOT_FOUND
Code: NOT_FOUND
ID: lhr1::ln8tf-1774275514692-15275fb28d04

## Concrete Steps

    npm run dev
    # Verify v7 stable

    # MIDI test requires a physical or virtual MIDI device.
    # On macOS: use the built-in IAC Driver (Audio MIDI Setup) to create a virtual MIDI port.
    # On Windows: use loopMIDI.
    # Connect a virtual MIDI port, open Bloop, add MidiIn node, select the port.
    # Press keys on MIDI keyboard (or send MIDI from DAW) — Generator fires notes.

    # Audio In test:
    npm run build && npm run lint
    # Add AudioIn node, click Enable Microphone, grant permission.
    # Connect AudioIn → Effect → Amplifier — speak into mic, hear reverbed voice.

    # Recording test:
    npm run build && npm run lint
    # Start an Arp → Generator patch, click Record, let it run 10 seconds, click Stop.
    # A download prompt appears. The downloaded file plays back the recorded audio.

## Validation and Acceptance

MIDI: plug in (or simulate) a MIDI keyboard. MidiIn node lists the device. Playing a key fires the correct note at the correct pitch to connected Generators. Velocity 64 sounds softer than velocity 127. Unplugging the device updates the device list.

Audio In: enable microphone, connect to Reverb → Amplifier. Speaking into the microphone produces reverbed audio in the speaker. The VU meter responds to input level. Denying the permission shows a clear error state, not a crash.

Recording: start recording with an active patch. Stop after 10 seconds. Downloaded file contains 10 seconds of audio. File is playable in a standard media player.

## Idempotence and Recovery

MediaRecorder must be stopped in `stopRecording` and the stream disconnected. If the page is refreshed mid-recording, the partial recording is lost — this is acceptable. Document it in the UI: "Recording will be lost if you navigate away."

Tone.UserMedia must be closed (`.close()`) and disposed when the AudioIn node is removed from the canvas.

## Interfaces and Dependencies

New files:
- `components/MidiInNode.tsx`
- `components/AudioInNode.tsx`
- `components/RecordButton.tsx` (or extend SystemMenu.tsx)

New store fields:
- `isRecording: boolean`
- `startRecording(): void`
- `stopRecording(): void`

New AudioNodeType values: `'midiin'` | `'audioin'`

Browser APIs: Web MIDI API, MediaRecorder API, getUserMedia, MediaStreamDestination

No new npm packages required (Tone.js already includes UserMedia wrapper).
