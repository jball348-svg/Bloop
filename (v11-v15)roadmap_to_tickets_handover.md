# Agent Handover Brief: Bloop v11 -> v15

**Context for AI Agent:** You are acting as the lead developer and technical architect for **Bloop**, a visual modular audio sandbox. The project currently sits at v11. We are moving towards v15, where the final deliverable is a fully composed, automated "song" written inside the tool as a master preset.

**Your Goal:** Read the following Epics. When prompted by the user, you will break these down into specific, actionable code-level tickets. You must respect the existing architecture: `store/useStore.ts` handles the Tone.js audio graph and state, while React Flow components act strictly as UI shells.

---

### Epic 1 (v12): Sonic Expansion (EQ & Modulation)
**Requirements:**
1. **EQ Node:** We need a node utilizing `Tone.EQ3` (or multiple `Tone.Filter` instances). It needs visual dials for Low, Mid, and High gain, and must route cleanly between Generators and Effects.
2. **FM/AM Synthesis:** Expand the existing polyphonic oscillator logic in the `useStore` to accept FM and AM types. Update the `Generator` node UI dropdowns.
3. **LFO Node:** Implement `Tone.LFO`. This is tricky: it needs to route *control signals* to parameter values (like a filter cutoff dial) rather than *audio signals* to an input jack. 

### Epic 2 (v13): The Piano Roll (Composition)
**Requirements:**
1. **Pattern/Piano Roll Node:** This will replace the basic Step Sequencer for complex melodies. We need a React Flow node that opens an expanded modal or grid on double-click. 
2. **Data Structure:** The node needs to store an array of note objects: `{ note: string, start: time/bar, duration: string/ticks }`.
3. **Engine Update:** The trigger mechanism in `useStore` must parse this array synced to `Tone.Transport` and fire polyphonic events to connected Generators. Envelopes (ADSR) must respect the `duration` for note-offs.

### Epic 3 (v14): Mixing & The Arranger
**Requirements:**
1. **Global Mixer Node:** A centralized hub. Needs dynamic input creation (drag a cable to the mixer, it creates a new channel strip). Each strip needs Volume, Pan (`Tone.Panner`), Mute, and Solo logic. 
2. **Timeline / Arranger Node:** A state machine node tied to `Tone.Transport.position`. It will hold logic like: "If Bar = 9, send start trigger to Pattern Node ID #4". 

### Epic 4 (v15): Automation & Optimization
**Requirements:**
1. **Automation:** Allow the Arranger Node to send sequenced floating-point values to specific node IDs and parameters (e.g., interpolating a filter cutoff from 200Hz to 2000Hz over 4 bars).
2. **Performance Refactor:** Audit `useStore` to ensure React state changes aren't causing unnecessary re-renders of the entire React Flow canvas when Tone.js values update.

