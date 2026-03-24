# Bloop Taxonomy for LLM Agents

This document is an agent-facing reference for the Bloop codebase.

Primary audience: coding agents, refactor agents, review agents, and future automation agents.

Primary source of truth:
- `store/useStore.ts`
- `app/page.tsx`
- `components/*Node.tsx`

If this document conflicts with code, trust `store/useStore.ts` first.

---

## 1. Fast Orientation

### 1.1 What Bloop is

Bloop is a node-based modular audio app built on:
- Next.js
- React Flow
- Tone.js
- Zustand

The canvas is composed of node instances whose canonical `type` values come from `AudioNodeType` in `store/useStore.ts`.

### 1.2 Core architectural rule

All real audio runtime objects live in the store, not in React component state.

Implications:
- Node components are UI-first.
- `store/useStore.ts` is the real integration surface.
- If you change behavior, start in the store.
- If you only change layout, the node component may be enough.

### 1.3 V16 status

V16 adds a new `math` edge domain, but only on the receiver side.

Important:
- `MATH_INPUT_HANDLE_ID = 'math'`
- `MATH_OUTPUT_HANDLE_ID = 'math-out'`
- receiver UI exists now
- store dispatch exists now
- no user-creatable math sender node ships yet

Practical consequence:
- math receivers are real
- math target selection is real
- `receiveMathValue(nodeId, normalizedValue)` is real
- future sender nodes can plug into this without redesigning receivers

---

## 2. Canonical Node Registry

This is the full current node-type set from `AudioNodeType`.

| type | default label | menu / launcher origin | category | singleton | math receiver |
|---|---|---|---|---|---|
| `generator` | `Oscillator` | `SignalMenu` | signal generator | no | yes |
| `sampler` | `Sampler` | `SignalMenu` | sample generator | no | yes |
| `audioin` | `Audio In` | `GlobalMenu` | live audio input | yes | yes |
| `effect` | `Effect` | `SignalMenu` | signal processor | no | yes |
| `eq` | `EQ` | `SignalMenu` | signal processor | no | yes |
| `speaker` | `Master Out` | `GlobalMenu` | global output | yes | yes |
| `mixer` | `Mixer` | `GlobalMenu` | master bus | yes | yes |
| `controller` | `Arpeggiator` UI / `arp` subtype | `ControllerMenu` | control source | no | yes |
| `midiin` | `MIDI In` | `GlobalMenu` | hardware control source | yes | no |
| `tempo` | `Tempo` | `GlobalMenu` | global tempo broadcaster | yes | yes |
| `arranger` | `Arranger` | `GlobalMenu` | scene scheduler | yes | yes |
| `drum` | `Drums` | `SignalMenu` | drum generator | no | yes |
| `advanceddrum` | `Advanced Drums` | `SignalMenu` | advanced drum generator | no | yes |
| `chord` | `Chord` | `ControllerMenu` | note transformer | no | yes |
| `adsr` | `ADSR` | `ControllerMenu` | envelope transformer | no | yes |
| `keys` | `Keys` | `ControllerMenu` | keyboard control source | no | yes |
| `lfo` | `LFO` | `ControllerMenu` | modulation source | no | yes |
| `pattern` | `Pattern` | `ControllerMenu` | transport-driven note sequencer | no | yes |
| `unison` | `Unison` | `SignalMenu` | signal processor | no | yes |
| `detune` | `Detune` | `SignalMenu` | signal processor | no | yes |
| `visualiser` | `Visualiser` | `SignalMenu` | display / passthrough node | no | yes |
| `pulse` | `Bloop` | `BloopLauncher` | discrete trigger source | no | yes |
| `stepsequencer` | `Sequencer` | `ControllerMenu` | step sequencer control source | no | yes |
| `quantizer` | `Quantizer` | `ControllerMenu` | note transformer | no | yes |
| `moodpad` | `Mood Pad` | `ControllerMenu` | XY control source | no | yes |

Derived / special-case node:

| type | source | purpose | math receiver |
|---|---|---|---|
| `PackedNode` | internal derived UI | packed macro-node for locked groups | no |

---

## 3. Edge Domains

Bloop currently has five connection domains.

| kind | purpose | canonical handle ids | color | style |
|---|---|---|---|---|
| `audio` | audio signal path | `audio-in`, `audio-out`, `audio-in-secondary` | `#22d3ee` | solid |
| `control` | note / event flow | `control-in`, `control-out` | `#39ff14` | solid |
| `tempo` | legacy / sanitized transport links | `tempo-in`, `tempo-out` | store-defined legacy path | special-case |
| `modulation` | V12 LFO modulation | `mod-out` -> `mod-in:*` | `#bef264` | modulation path |
| `math` | V16 normalized parameter control | `math-out` -> `math` | `#8b5cf6` | dashed `4 2` |

Important math facts:
- math is not audio
- math is not control
- math is not modulation
- math edges are intentionally separate from the V12 modulation system
- `rebuildAudioGraph()` ignores math edges
- `rebuildModulationGraph()` ignores math edges

---

## 4. How V16 Math Works

### 4.1 Mental model

`math` is a normalized control lane.

Input:
- one float in `[0, 1]`

Receiver behavior:
- each receiver node chooses one active math target
- the store maps normalized `[0, 1]` into a real parameter range
- the store dispatches through existing node actions

This is not direct Tone.js parameter poking from the component.

### 4.2 Canonical pipeline

1. A node renders `MathInputHandle`.
2. The node computes its current target list via `getMathTargetOptionsForNode(node, context?)`.
3. The user chooses one target from the dropdown.
4. The selected target is stored in `node.data.mathInputTarget`.
5. A future sender or a manual store call invokes `receiveMathValue(nodeId, normalizedValue)`.
6. `receiveMathValue` resolves the node and target.
7. `applyMathTargetValue` maps `[0, 1]` to the node-specific real value.
8. The store updates state via existing actions like:
   - `updateNodeValue`
   - `updateNodeData`
   - `updateSamplerSettings`
   - `updateTempoBpm`
   - `updateMixerChannel`
   - `updateArpScale`
   - `updateOctave`
   - `updatePatternData`
   - `updateSequencerStep`
   - `upsertPatternNote`
   - `upsertArrangerScene`
   - `setDrumMode`
   - `setMasterVolume`

### 4.3 Why the dispatcher matters

The dispatcher is typed and semantic.

It does not treat every target as a plain numeric field.

Examples:
- `speaker.volume` must also call `setMasterVolume`
- `controller.rootNote` and `controller.scaleType` must use `updateArpScale`
- `effect.subType` and `chord.subType` must use subtype switching logic
- `sampler.loop` and `sampler.reverse` use toggles
- `pattern` and `arranger` target IDs address specific selected entities

### 4.4 Target persistence

State fields introduced or used by V16:
- `AppNode.data.mathInputTarget?: string`
- `AppNode.data.arpRate?: number`
- `AppEdgeData.mathTarget?: string`

### 4.5 Dynamic target invalidation

`useMathInputSelection(nodeId, targetOptions)` resets invalid targets back to `none`.

This matters because some nodes have context-sensitive math targets:
- generator targets depend on `generatorMode`
- effect targets depend on `subType`
- lfo targets depend on `lfoSync`
- pulse targets depend on `pulseSync`
- step sequencer contextual targets depend on `selectedStep`
- pattern contextual targets depend on the currently selected note in local UI state
- arranger contextual targets depend on the currently selected scene in local UI state
- mixer channel targets depend on the current `mixerChannels` array

### 4.6 Current receiver limitations

V16 is receiver-first.

There is currently no shipped node that exposes `MATH_OUTPUT_HANDLE_ID = 'math-out'`.

So today:
- the UI can show receivers
- target selection works
- edge semantics are in the store
- direct testing can call `useStore.getState().receiveMathValue(...)`
- future senders can be added without redesigning the receivers

### 4.7 Current explicit exclusions

These are intentionally not math-addressable right now:
- `midiin` device selection
- sampler file import actions
- browser permission prompts
- one-shot buttons like `Play`, `Record`, `Fire`, `Add Scene`, `Add Lane`
- any external resource selector or unstable side effect trigger

Reason:
- V16 math is for deterministic, bounded, writable control state

---

## 5. Math Target ID Grammar

Simple target IDs:
- `mix`
- `wet`
- `roomSize`
- `delayTime`
- `feedback`
- `distortion`
- `frequency`
- `bits`
- `volume`
- `rootNote`
- `scaleType`
- `arpRate`
- `attack`
- `decay`
- `sustain`
- `release`
- `inputGain`
- `drumMode`
- `swing`
- `depth`
- `pitch`
- `low`
- `mid`
- `high`
- `lowFrequency`
- `highFrequency`
- `loop`
- `playbackRate`
- `pitchShift`
- `reverse`
- `bpm`
- `lfoWaveform`
- `lfoSync`
- `lfoRate`
- `lfoHz`
- `lfoDepth`
- `bypass`
- `octave`
- `visualiserMode`
- `pan`
- `pulseSync`
- `pulseRate`
- `pulseIntervalMs`
- `pulseNote`
- `moodX`
- `moodY`
- `sequenceSync`
- `sequenceRate`
- `sequenceIntervalMs`
- `selectedStep`
- `patternLoopBars`
- `subType`
- `generatorMode`
- `waveShape`
- `harmonicity`
- `modulationIndex`

Contextual target IDs:

```text
advanceddrum:track:length:{trackIndex}
stepsequencer:step:enabled:{stepIndex}
stepsequencer:step:note:{stepIndex}
stepsequencer:step:mix:{stepIndex}
pattern:note:note:{noteId}
pattern:note:startStep:{noteId}
pattern:note:lengthSteps:{noteId}
pattern:note:velocity:{noteId}
mixer:channel:volume:{sourceId}
mixer:channel:pan:{sourceId}
mixer:channel:muted:{sourceId}
mixer:channel:solo:{sourceId}
arranger:scene:startBar:{sceneId}
arranger:scene:lengthBars:{sceneId}
```

---

## 6. Node Taxonomy: Detailed Reference

Format:
- `type`: canonical node type
- `component`: React component file
- `runtime_kind`: what kind of runtime responsibility the node has
- `handles`: visible handle domains
- `math_targets`: exact target IDs currently exposed to the math system

### 6.1 Signal / Audio Domain Nodes

### `generator`

- `type`: `generator`
- `component`: `components/GeneratorNode.tsx`
- `runtime_kind`: audio generator
- `default_label`: `Oscillator`
- `default_subType`: `wave`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: none
- `primary_role`: turns control notes into audio; supports wave, FM, AM, and noise modes
- `key_state`: `generatorMode`, `waveShape`, `mix`, `harmonicity`, `modulationIndex`
- `math_targets`:
  - `mix` -> integer `0..100`
  - `generatorMode` -> enum `wave | fm | am | noise`
  - `waveShape` -> enum `sine | square | triangle | sawtooth` ; only when mode is not `noise`
  - `harmonicity` -> float `0.25..8` ; only in `fm` and `am`
  - `modulationIndex` -> float `0.5..20` ; only in `fm`
- `notes`:
  - `generatorMode` is the real mode field for V12/V16 behavior
  - `subType` is not the main V16 generator control surface

### `sampler`

- `type`: `sampler`
- `component`: `components/SamplerNode.tsx`
- `runtime_kind`: audio generator / player
- `default_label`: `Sampler`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: none
- `primary_role`: plays imported audio files as note-triggered material
- `key_state`: `mix`, `loop`, `playbackRate`, `reverse`, `pitchShift`, sample metadata
- `math_targets`:
  - `mix` -> integer `0..100`
  - `loop` -> toggle
  - `playbackRate` -> float `0.25..2`
  - `pitchShift` -> integer `-12..12`
  - `reverse` -> toggle
- `notes`:
  - file import itself is not math-controlled
  - sample selection is explicitly excluded from math

### `audioin`

- `type`: `audioin`
- `component`: `components/AudioInNode.tsx`
- `runtime_kind`: live audio input
- `default_label`: `Audio In`
- `singleton`: `true`
- `handles_in`: `math`
- `handles_out`: `audio-out`
- `modulation_handles`: none
- `primary_role`: receives microphone / external audio via `Tone.UserMedia`
- `key_state`: `inputGain`, `audioInStatus`
- `math_targets`:
  - `inputGain` -> integer `0..100`
- `notes`:
  - permission state is browser-driven
  - permission prompts are not math-controlled

### `drum`

- `type`: `drum`
- `component`: `components/DrumNode.tsx`
- `runtime_kind`: drum generator
- `default_label`: `Drums`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: none
- `primary_role`: drum machine with `hits` and `grid` modes
- `key_state`: `mix`, `drumMode`, drum pattern data
- `math_targets`:
  - `mix` -> integer `0..100`
  - `drumMode` -> enum `hits | grid`

### `advanceddrum`

- `type`: `advanceddrum`
- `component`: `components/AdvancedDrumNode.tsx`
- `runtime_kind`: advanced drum generator
- `default_label`: `Advanced Drums`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: none
- `primary_role`: multi-track sample-backed drum sequencer
- `key_state`: `mix`, `swing`, `advancedDrumTracks`
- `math_targets`:
  - `mix` -> integer `0..100`
  - `swing` -> float `0..0.6`
  - `advanceddrum:track:length:{trackIndex}` -> enum over `4 | 8 | 12 | 16`
- `notes`:
  - contextual track IDs are index-based, not name-based

### `effect`

- `type`: `effect`
- `component`: `components/EffectNode.tsx`
- `runtime_kind`: audio processor
- `default_label`: `Effect`
- `default_subType`: `reverb`
- `singleton`: `false`
- `handles_in`: `audio-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: `wet` and subtype-specific V12 modulation targets
- `primary_role`: single effect insert that can switch subtype
- `key_state`: `subType`, `wet`, subtype-specific parameters
- `math_targets`:
  - `wet` -> float `0..1`
  - `subType` -> enum `reverb | delay | distortion | phaser | bitcrusher`
  - `roomSize` -> float `0..1` ; only when `subType = reverb`
  - `delayTime` -> float `0.1..1` ; only when `subType = delay`
  - `feedback` -> float `0..0.95` ; only when `subType = delay`
  - `distortion` -> float `0..1` ; only when `subType = distortion`
  - `frequency` -> float `0.1..20` ; only when `subType = phaser`
  - `bits` -> integer `1..8` ; only when `subType = bitcrusher`
- `notes`:
  - effect math and V12 modulation coexist
  - subtype changes can invalidate old math targets; the shared hook resets them to `none`

### `eq`

- `type`: `eq`
- `component`: `components/EQNode.tsx`
- `runtime_kind`: audio processor
- `default_label`: `EQ`
- `singleton`: `false`
- `handles_in`: `audio-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: `low`, `mid`, `high`, `lowFrequency`, `highFrequency`
- `primary_role`: `Tone.EQ3` insert
- `key_state`: `eqLow`, `eqMid`, `eqHigh`, `eqLowFrequency`, `eqHighFrequency`
- `math_targets`:
  - `low` -> float `-24..24`
  - `mid` -> float `-24..24`
  - `high` -> float `-24..24`
  - `lowFrequency` -> float `80..1200`
  - `highFrequency` -> float `1200..8000`
- `notes`:
  - EQ is both modulation-addressable and math-addressable

### `unison`

- `type`: `unison`
- `component`: `components/UnisonNode.tsx`
- `runtime_kind`: audio processor
- `default_label`: `Unison`
- `singleton`: `false`
- `handles_in`: `audio-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: `wet`, `frequency`
- `primary_role`: chorus-based widening / unison effect
- `key_state`: `wet`, `depth`, `frequency`
- `math_targets`:
  - `wet` -> float `0..1`
  - `depth` -> float `0..1`
  - `frequency` -> float `0.1..10`

### `detune`

- `type`: `detune`
- `component`: `components/DetuneNode.tsx`
- `runtime_kind`: audio processor
- `default_label`: `Detune`
- `singleton`: `false`
- `handles_in`: `audio-in`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: `wet`
- `primary_role`: pitch shifting / detune effect
- `key_state`: `wet`, `pitch`
- `math_targets`:
  - `wet` -> float `0..1`
  - `pitch` -> float `-12..12`

### `visualiser`

- `type`: `visualiser`
- `component`: `components/VisualiserNode.tsx`
- `runtime_kind`: display passthrough
- `default_label`: `Visualiser`
- `singleton`: `false`
- `handles_in`: `audio-in`, `audio-in-secondary`, `math`
- `handles_out`: `audio-out`
- `modulation_handles`: none
- `primary_role`: audio display node with passthrough audio output
- `key_state`: `visualiserMode`
- `math_targets`:
  - `visualiserMode` -> enum `waveform | spectrum | vu | lissajous`
- `notes`:
  - this is the main exception to the “no Tone objects in components” rule
  - it creates display-only analysers in component refs
  - these analysers reconnect on edge changes

### `mixer`

- `type`: `mixer`
- `component`: `components/MixerNode.tsx`
- `runtime_kind`: master bus
- `default_label`: `Mixer`
- `singleton`: `true`
- `handles_in`: `audio-in`, `math`
- `handles_out`: none
- `modulation_handles`: none
- `primary_role`: collects multiple audio sources into one master bus
- `key_state`: `volume`, `pan`, `mixerChannels`
- `math_targets`:
  - `volume` -> integer `0..100`
  - `pan` -> float `-1..1`
  - `mixer:channel:volume:{sourceId}` -> integer `0..100`
  - `mixer:channel:pan:{sourceId}` -> float `-1..1`
  - `mixer:channel:muted:{sourceId}` -> toggle
  - `mixer:channel:solo:{sourceId}` -> toggle
- `notes`:
  - per-channel math targets only exist after sources have created `mixerChannels`
  - contextual channel IDs use the upstream node `sourceId`

### `speaker`

- `type`: `speaker`
- `component`: `components/SpeakerNode.tsx`
- `runtime_kind`: global output volume
- `default_label`: `Master Out`
- `singleton`: `true`
- `handles_in`: `math`
- `handles_out`: none
- `modulation_handles`: none
- `primary_role`: master output / amplifier
- `key_state`: `volume`
- `math_targets`:
  - `volume` -> integer `0..100`
- `notes`:
  - not cable-based for audio routing
  - math volume dispatch must call `setMasterVolume`

### 6.2 Control / Transform / Sequencing Nodes

### `controller`

- `type`: `controller`
- `component`: `components/ControllerNode.tsx`
- `runtime_kind`: control source
- `default_label`: UI shows `ARPEGGIATOR`
- `default_subType`: `arp`
- `singleton`: `false`
- `handles_in`: `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: arpeggiator that emits note events
- `key_state`: `rootNote`, `scaleType`, `arpRate`, `isPlaying`
- `math_targets`:
  - `rootNote` -> enum over `ROOT_NOTES`
  - `scaleType` -> enum over `TONAL_SCALE_OPTIONS`
  - `arpRate` -> float `400..50` milliseconds, inverted so higher input = faster
- `notes`:
  - `arpRate` is persisted in node data in V16
  - dispatch uses `updateArpScale` for musical coherence on root / scale changes

### `keys`

- `type`: `keys`
- `component`: `components/KeysNode.tsx`
- `runtime_kind`: control source
- `default_label`: `Keys`
- `singleton`: `false`
- `handles_in`: `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: QWERTY keyboard note source
- `key_state`: `octave`
- `math_targets`:
  - `octave` -> integer `1..7`

### `midiin`

- `type`: `midiin`
- `component`: `components/MidiInNode.tsx`
- `runtime_kind`: hardware control source
- `default_label`: `MIDI In`
- `singleton`: `true`
- `handles_in`: none
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: browser MIDI input bridge
- `key_state`: `midiDeviceId`, `midiDeviceName`, `midiSupported`
- `math_targets`: none
- `notes`:
  - intentionally excluded from V16 math
  - hardware device selection is external state, not stable bounded parameter state

### `chord`

- `type`: `chord`
- `component`: `components/ChordNode.tsx`
- `runtime_kind`: control transformer
- `default_label`: `Chord`
- `default_subType`: `major`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: expands incoming notes into chord voicings
- `key_state`: `subType`
- `math_targets`:
  - `subType` -> enum over chord quality values:
    - `major`
    - `minor`
    - `dominant7`
    - `major7`
    - `minor7`
    - `sus2`
    - `sus4`
    - `diminished`
    - `augmented`

### `adsr`

- `type`: `adsr`
- `component`: `components/AdsrNode.tsx`
- `runtime_kind`: control transformer
- `default_label`: `ADSR`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: envelope shaping for note/control flow
- `key_state`: `attack`, `decay`, `sustain`, `release`
- `math_targets`:
  - `attack` -> float `0.001..2`
  - `decay` -> float `0.01..2`
  - `sustain` -> float `0..1`
  - `release` -> float `0.01..4`

### `quantizer`

- `type`: `quantizer`
- `component`: `components/QuantizerNode.tsx`
- `runtime_kind`: control transformer
- `default_label`: `Quantizer`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: constrains notes to a scale
- `key_state`: `rootNote`, `scaleType`, `bypass`
- `math_targets`:
  - `rootNote` -> enum over `ROOT_NOTES`
  - `scaleType` -> enum over `TONAL_SCALE_OPTIONS`
  - `bypass` -> toggle

### `pulse`

- `type`: `pulse`
- `component`: `components/PulseNode.tsx`
- `runtime_kind`: discrete trigger source
- `default_label`: `Bloop`
- `singleton`: `false`
- `handles_in`: `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: emits single triggers or repeating triggers
- `launcher_origin`: `components/BloopLauncher.tsx`
- `key_state`: `pulseSync`, `pulseRate`, `pulseIntervalMs`, `pulseNote`
- `math_targets`:
  - `pulseSync` -> toggle
  - `pulseRate` -> enum over transport rates; only when synced
  - `pulseIntervalMs` -> integer `100..2000`; only when unsynced
  - `pulseNote` -> enum over pulse note options

### `stepsequencer`

- `type`: `stepsequencer`
- `component`: `components/StepSequencerNode.tsx`
- `runtime_kind`: control sequencer
- `default_label`: `Sequencer`
- `singleton`: `false`
- `handles_in`: `control-in`, `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: transport or free-run step sequencer for note events
- `key_state`: `sequenceSync`, `sequenceRate`, `sequenceIntervalMs`, `selectedStep`, `stepSequence`
- `math_targets`:
  - `sequenceSync` -> toggle
  - `sequenceRate` -> enum over transport rates; only when synced
  - `sequenceIntervalMs` -> integer `100..1200`; only when unsynced
  - `selectedStep` -> integer `0..maxStepIndex`
  - `stepsequencer:step:enabled:{selectedStep}` -> toggle
  - `stepsequencer:step:note:{selectedStep}` -> enum over sequencer note options
  - `stepsequencer:step:mix:{selectedStep}` -> integer `10..100`
- `notes`:
  - contextual step targets are tied to `node.data.selectedStep`
  - changing selected step changes the available contextual target IDs

### `pattern`

- `type`: `pattern`
- `component`: `components/PatternNode.tsx`
- `runtime_kind`: transport-driven note sequencer
- `default_label`: `Pattern`
- `singleton`: `false`
- `handles_in`: `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: piano-roll note clip playback
- `key_state`: `patternNotes`, `patternLoopBars`, `patternStepsPerBar`
- `math_targets`:
  - `patternLoopBars` -> integer `1..8`
  - `pattern:note:note:{selectedNoteId}` -> enum over `C5 | B4 | A4 | G4 | F4 | E4 | D4 | C4`
  - `pattern:note:startStep:{selectedNoteId}` -> integer `0..(totalSteps - 1)`
  - `pattern:note:lengthSteps:{selectedNoteId}` -> integer `1..remainingSteps`
  - `pattern:note:velocity:{selectedNoteId}` -> float `0.05..1`
- `notes`:
  - contextual note targets only exist when a note is selected in the local component UI
  - selected note identity is local component state, not persisted in `AppNode.data`

### `moodpad`

- `type`: `moodpad`
- `component`: `components/MoodPadNode.tsx`
- `runtime_kind`: XY control source
- `default_label`: `Mood Pad`
- `singleton`: `false`
- `handles_in`: `math`
- `handles_out`: `control-out`
- `modulation_handles`: none
- `primary_role`: non-musical XY controller
- `key_state`: `moodX`, `moodY`
- `math_targets`:
  - `moodX` -> float `0..1`
  - `moodY` -> float `0..1`

### `lfo`

- `type`: `lfo`
- `component`: `components/LFONode.tsx`
- `runtime_kind`: modulation source
- `default_label`: `LFO`
- `singleton`: `false`
- `handles_in`: `math`
- `handles_out`: `mod-out`
- `modulation_handles`: source only, not receiver
- `primary_role`: V12 modulation source for modulation-capable params
- `key_state`: `lfoWaveform`, `lfoSync`, `lfoRate`, `lfoHz`, `lfoDepth`
- `math_targets`:
  - `lfoWaveform` -> enum `sine | triangle | square | sawtooth`
  - `lfoSync` -> toggle
  - `lfoDepth` -> float `0..1`
  - `lfoRate` -> enum over transport rates; only when synced
  - `lfoHz` -> float `0.1..12`; only when unsynced
- `notes`:
  - this is a modulation sender, not a math sender
  - math can modulate the modulator configuration

### 6.3 Global / Scene / Transport Nodes

### `tempo`

- `type`: `tempo`
- `component`: `components/TempoNode.tsx`
- `runtime_kind`: global tempo broadcaster
- `default_label`: `Tempo`
- `singleton`: `true`
- `handles_in`: `math`
- `handles_out`: none
- `modulation_handles`: none
- `primary_role`: drives `Tone.Transport.bpm`
- `key_state`: `bpm`
- `math_targets`:
  - `bpm` -> integer `40..200`
- `notes`:
  - not cable-routed like normal control/audio nodes

### `arranger`

- `type`: `arranger`
- `component`: `components/ArrangerNode.tsx`
- `runtime_kind`: scene scheduler / automation scheduler
- `default_label`: `Arranger`
- `singleton`: `true`
- `handles_in`: `math`
- `handles_out`: none
- `modulation_handles`: none
- `primary_role`: sequences sections, pattern participation, rhythm participation, and automation lanes
- `key_state`: `arrangerScenes`
- `math_targets`:
  - `arranger:scene:startBar:{selectedSceneId}` -> integer `0..64`
  - `arranger:scene:lengthBars:{selectedSceneId}` -> integer `1..16`
- `notes`:
  - contextual scene targets only exist when a scene is selected in the local component UI
  - selected scene identity is local component state, not persisted in `AppNode.data`

---

## 7. Nodes Without V16 Math Support

Only these node-like surfaces are currently outside the V16 math receiver set:

### `midiin`

Reason:
- browser / device-driven external hardware state

### `PackedNode`

Reason:
- derived macro UI, not a first-class `AudioNodeType`
- handle exposure is aggregate and structural, not parameter-centric

---

## 8. V12 Modulation vs V16 Math vs V15 Automation

These three systems are related but not interchangeable.

### V12 modulation

- source node: `lfo`
- edge kind: `modulation`
- handle pattern: `mod-out` -> `mod-in:{paramKey}`
- target class: only modulation-capable params
- runtime style: direct modulation graph / parameter target resolution

Nodes with explicit V12 modulation handles:
- `effect`
- `eq`
- `unison`
- `detune`

### V16 math

- source node: not shipped yet
- edge kind: `math`
- handle pattern: `math-out` -> `math`
- target class: broad writable node state, not just Tone params
- runtime style: store dispatcher from normalized value to semantic action

### V15 automation

- source system: arranger automation lanes
- edge kind: none; stored scheduling model
- target class: `AUTOMATABLE_PARAM_REGISTRY`
- runtime style: scheduled value application over time

Rule of thumb:
- use modulation for audio-rate / cyclic parameter movement from LFO
- use math for future generalized normalized control of receiver state
- use automation for timeline-authored section playback changes

---

## 9. Support Components Relevant to Taxonomy

### `components/MathInputHandle.tsx`

Purpose:
- shared V16 receiver UI

Responsibilities:
- renders the top-left border break
- renders the violet React Flow target handle with `id = 'math'`
- renders the target dropdown
- exports `useMathInputSelection(...)` for invalid-target reset behavior

### `components/ModulationTargetHandle.tsx`

Purpose:
- V12 modulation receiver UI

Responsibilities:
- renders right-edge modulation target handles for automatable params

---

## 10. Known Agent Gotchas

### 10.1 Do not confuse `subType` and `generatorMode`

For generators, V16 math works through `generatorMode`, not only `subType`.

### 10.2 Speaker is global, not a normal audio-sink node

If you change speaker math behavior, remember:
- `setMasterVolume(...)` matters
- updating only node data is insufficient

### 10.3 Pattern and Arranger contextual math depends on local UI selection

These are not purely store-derived:
- pattern selected note is local component state
- arranger selected scene is local component state

### 10.4 Step Sequencer contextual math depends on persisted `selectedStep`

Unlike Pattern and Arranger, Step Sequencer selection is in `node.data`.

### 10.5 Mixer contextual math only appears after channels exist

No input channels means no per-channel contextual targets.

### 10.6 Visualiser is the main component-level Tone exception

It owns display-only analyzers in refs.

### 10.7 Receiver-first means no math sender yet

Do not assume the app already exposes `math-out` in the UI.

---

## 11. Agent Recipes

### 11.1 How to manually test math today

From the dev console or any store-aware test harness:

```ts
useStore.getState().setMathInputTarget(nodeId, 'mix');
useStore.getState().receiveMathValue(nodeId, 0.75);
```

For contextual nodes, select the context first in the UI or set the relevant state so the target exists.

Examples:
- Step Sequencer: ensure `selectedStep` points at the intended step
- Pattern: click a note so `selectedNoteId` exists in the component
- Arranger: click a scene so `selectedSceneId` exists in the component
- Mixer: patch sources into the mixer first

### 11.2 How to add math support to a new node

1. Add target descriptors to `getMathTargetOptionsForNode(...)`.
2. Add dispatch logic to `applyMathTargetValue(...)`.
3. Reuse existing store actions if possible. Do not invent a new mutation path unless necessary.
4. Render `MathInputHandle` in the node component as the first child inside the outer node wrapper.
5. Use `useMathInputSelection(...)` so invalid targets reset cleanly.
6. If targets depend on UI context, pass the relevant context object into `getMathTargetOptionsForNode(node, context)`.
7. If the node has an early return for packed mode, call hooks before that return.
8. Re-run:
   - `npx tsc --noEmit`
   - `npm run build`
   - `npm run lint`

### 11.3 How to decide whether something should be a math target

Good candidate:
- deterministic
- bounded
- writable
- safe to set repeatedly

Bad candidate:
- file picker
- permission prompt
- one-shot action button
- unstable external resource selection

---

## 12. Minimal Canonical Summary

If an agent only remembers one thing, remember this:

- node types are defined in `AudioNodeType`
- all real behavior lives in `store/useStore.ts`
- V16 math is a receiver-only normalized control path
- receivers expose `math` input handles and `mathInputTarget`
- the dispatcher is `receiveMathValue(nodeId, normalizedValue)`
- target menus come from `getMathTargetOptionsForNode(...)`
- dynamic targets reset back to `none` when invalid
- no node currently ships a visible `math-out` sender handle

