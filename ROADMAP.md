# Bloop Project Roadmap

Bloop is a visual modular audio sandbox designed to make sound design and routing intuitive and playful. This roadmap outlines our journey from a basic audio canvas to a fully capable modular sequencer and arranger.

---

## The Journey So Far (v1 - v11)

From its inception, Bloop has grown from a simple proof-of-concept into a robust, browser-based modular synthesizer. Over the first 11 major iterations, we have successfully established:

* **The Core Engine:** Seamless integration between React Flow (for the visual canvas) and Tone.js (for the audio graph).
* **The Node Ecosystem:** A comprehensive suite of Controller nodes (Sequencers, Arp, MIDI In), Signal nodes (Oscillators, Samplers, Effects), and Global nodes.
* **User Experience & Persistence:** Drag-and-drop routing, undo/redo history, and `.bloop` patch saving/loading.
* **Onboarding & Gamification:** A replayable tutorial, theming system, and a beginner-friendly campaign mode that unlocks custom skins and presets.
* **External I/O:** Live audio input (microphone/USB interface), Web MIDI support, and browser-native `.webm` session recording.

---

## The Road to v15: "The Showcase"

**The Ultimate v15 Milestone:** To create a fully built, automated "Song" written entirely within Bloop, shipped as a master preset to demonstrate the platform's full capabilities. 

To achieve this without turning Bloop into a bloated DAW, we are introducing targeted arrangement, mixing, and sequencing tools that maintain our visual, modular philosophy. UI bug fixes are temporarily deprioritized in favor of shipping these core functional pillars.

### v12: Sonic Expansion & Shaping
*Focus: Expanding the sound-generation capabilities beyond basic waveforms and providing finer control over frequencies.*

* **New Generator Modes (FM & AM Synthesis):** Expand the `Generator` node (or create a new `Advanced Synth` node) to include Frequency Modulation and Amplitude Modulation, allowing for bells, metallic tones, and complex modern bass patches.
* **Parametric EQ Node:** A dedicated Equalizer node (3-band or 5-band) to carve out frequencies, allowing kicks and basslines to sit together without muddying the mix.
* **LFO (Low Frequency Oscillator) Node:** A control node that can be routed to parameters (like filter cutoff, pitch, or volume) to create movement and evolving sounds over time.

### v13: Composition & "Writing"
*Focus: Upgrading the note-input workflow from basic step-sequencing to a dedicated composition interface.*

* **Piano Roll / Pattern Node:** A new sequencer node inspired by FL Studio's piano roll. Double-clicking this node opens a grid where users can "drop" and stretch notes over a multi-bar loop. 
* **Polyphonic Output for Patterns:** Ensure the Pattern Node can output chords and overlapping notes to drive polyphonic generators seamlessly.
* **Gate / Trigger Refining:** Ensure ADSR envelopes handle the precise note-on/note-off data coming from the new Pattern node to allow for staccato plucks and sustained pads.

### v14: Mixing & Arrangement
*Focus: Giving users the ability to organize complex patches and structure them into a timeline.*

* **Global Mixer Node:** A centralized hub to replace the simple `Amplifier`. It will feature multiple input channels with individual volume sliders, panning, mute, and solo buttons to balance the elements of a full track.
* **Timeline / Arranger Node:** A new macro-control node that triggers specific events or starts/stops specific Pattern Nodes based on a global bar counter. Instead of a traditional DAW timeline, think of it as a "Scene" or "Event" trigger module that moves the patch from an Intro -> Verse -> Chorus.

### v15: Automation & The Masterpiece
*Focus: Tying it all together, optimizing performance, and building the final deliverable.*

* **Automation Routing:** The ability to map the Timeline/Arranger node to dial parameters (e.g., automatically sweeping a filter open during a build-up, or turning up the Reverb wetness on bar 16).
* **Graph Optimization:** A full song will require a massive node graph. v15 will include under-the-hood optimization for React Flow and Tone.js to ensure the browser doesn't choke on complex, multi-layered patches.
* **The "Demo Song" Preset:** The final deliverable. A meticulously crafted, multi-genre track built entirely inside Bloop using the Arranger, Piano Rolls, Synths, EQs, and the Mixer. This patch will be the default showcase of what the engine can do.
