# V8 — The I/O Update: MIDI In, Live Audio In & Session Export

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v8, Bloop connects to the outside world. A user with a MIDI keyboard can plug it in and play Bloop's generators directly. A guitarist can route their instrument through Bloop's effects chain via microphone or USB audio interface. And after building a patch, a user can hit Record, play for 30 seconds, and download a WAV file of exactly what they heard — bringing Bloop into a real music production workflow.

Depends on: v7 complete.

GitHub issues: #47 (MIDI Input), #48 (Live Audio Input), #49 (Session Export).

## Progress

- [ ] Read GitHub issues #47, #48, #49 in full
- [ ] Milestone 1 — MIDI Input (#47): Web MIDI API, device selector, note velocity, graceful degradation
- [ ] Milestone 2 — Live Audio Input (#48): getUserMedia, Tone.UserMedia, input gain, VU meter
- [ ] Milestone 3 — Session Export (#49): MediaRecorder WAV capture, download trigger, recording indicator
- [ ] npm run build and npm run lint pass
- [ ] Update TICKETS.md, close GitHub issues #47, #48, #49

## Surprises & Discoveries

[To be filled. Web MIDI API browser support varies significantly — document findings here.]

## Decision Log

[To be filled.]

## Outcomes & Retrospective

[To be written at completion.]

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
