# Composition Quality Standards

## 1. Purpose

This document defines concrete aesthetic quality criteria for AI-authored Bloop songs.

The composition pipeline (`30_composition_pipeline.md`) defines *what stages to follow*.
The composer playbook (`composer_playbook.md`) defines *how to think and behave*.
This document defines *what good output actually looks like* — specific, inspectable, and tied to the Bloop scaffold.

Use this document as a quality checklist before committing any `MusicalPlanV1` to the compiler.

Primary audience: any LLM agent authoring a `*.plan.yaml` file.


---

## 2. The Flagship Exemplar

`data/ai-song/flagship-song.plan.yaml` (Midnight Circuit, C minor, 112 BPM) is the reference quality benchmark.

When in doubt, compare your output against it. Study:

- how energy values step meaningfully between sections (0.24 → 0.46 → 0.84 → 0.40 → 0.88 → 0.30)
- how bass notes land on real C minor scale degrees and move by small steps or strong intervals (root–fifth)
- how lead notes use primarily stepwise motion within a bounded range (C4–D#5) with occasional leaps for cadences
- how automation curves have a clear direction within each scene (always ramping, never aimless)
- how each section activates a different subset of roles to create structural contrast
- how drum layers have clearly differentiated rhythmic roles (pulse, accent, subdivision, fill)

Do not copy the flagship literally. Use it to calibrate your own decisions.


---

## 3. Energy and Structure Quality

### 3.1 Energy curve requirements

- Adjacent sections must differ by at least **0.20** in energy value.
- No more than two consecutive sections should share a similar energy bracket (±0.10).
- The song must have at least one high-energy peak (≥ 0.80) and at least one low-energy rest point (≤ 0.40).
- Energy values should follow a legible arc — not random fluctuation.

Good arc shapes:
```
rise-and-fall:  0.25 → 0.50 → 0.85 → 0.45 → 0.80 → 0.30
plateau-drop:   0.30 → 0.65 → 0.85 → 0.85 → 0.40 → 0.25
build-to-peak:  0.20 → 0.35 → 0.55 → 0.80 → 0.90 → 0.45
```

Anti-pattern — flat energy (reject):
```
0.60 → 0.65 → 0.60 → 0.65 → 0.60 → 0.55
```

### 3.2 Section role activation

- No two adjacent sections should activate an identical set of `active_roles`.
- Intros and outros should activate fewer roles than peak sections.
- At least one section should activate all four primary roles (bass, lead, support, drums).
- At least one section should activate two or fewer roles (creates contrast and breath).

Good activation example:
```
intro:   [support, drums]
lift:    [bass, support, drums]
arrival: [bass, lead, support, drums]
break:   [lead, support]
return:  [bass, lead, support, drums]
outro:   [bass, support, drums]
```

Anti-pattern — every section activates everything (reject):
```
intro:   [bass, lead, support, drums]
verse:   [bass, lead, support, drums]
chorus:  [bass, lead, support, drums]
```

### 3.3 Section bar counts

- Default section length is 8 bars. This is correct for most sections.
- Intros and outros may use 4 bars for tighter pieces or 16 bars for atmospheric pieces.
- Never author a section shorter than 4 bars.
- Total song length should land within the `evaluation_targets.duration_window_sec` range.
  At 112 BPM, 8 bars ≈ 17.14 seconds. Use this ratio to estimate duration.


---

## 4. Melodic Quality (Lead and Bass Patterns)

### 4.1 Stepwise motion

Good melodies move mostly by step (interval of a minor 2nd or major 2nd).

Quality ratios to target:
- **60–75%** of consecutive note pairs should be stepwise (±1 or ±2 semitones)
- **15–25%** should be skips (3rd, 4th, or 5th — intervals of 3–7 semitones)
- **5–10%** should be leaps (6th or larger — intervals of ≥ 8 semitones)

Leaps should be:
- used for climactic moments or structural arrivals
- followed by a step in the opposite direction (leap recovery)

Anti-pattern — random interval sizes (reject):
```
C4, G5, D4, A#3, F5, C4, G4  ← uncontrolled leaps with no shape
```

Good example (stepwise with occasional skip):
```
G4, G#4, C5, D5, C5, G#4, G4, D#4  ← ascending with step-wise approach, stepwise descent
```

### 4.2 Melodic shape

Each 8-bar phrase should have a discernible shape. Choose one:

- **Arch**: rises toward the middle, falls back at the end
- **Rise**: generally ascending, landing high at the phrase end
- **Fall**: generally descending, landing on a stable low point
- **Wave**: two or more smaller arches within the phrase

Anti-pattern — flat contour (reject):
```
G4, G4, A4, G4, G4, A4, G4, G4  ← no movement, no arrival
```

### 4.3 Phrase endings

The final note of an 8-bar phrase should:
- land on a stable scale degree: root (1), fifth (5), or minor third (b3) of the key
- arrive with a shorter note length or lower velocity than preceding notes (signals closure)
- not end mid-phrase on a dissonant or passing tone

### 4.4 Register boundaries

Respect the `register_range` declared in `arrangement.roles`. Notes outside this range will fail compiler validation. Do not author notes at the boundary edges of the range — leave a minor third of clearance at each end.

Bass register guidance (default):
- comfortable center: octaves 1–3
- avoid going above the 3rd octave (competes with lead)
- avoid below B0 (outside Tone.js PolySynth reliable range)

Lead register guidance (default):
- comfortable center: octaves 4–5
- avoid going below C4 (overlaps bass)
- avoid above D#5 unless the piece intentionally reaches for a climax pitch

### 4.5 Note lengths and velocity

Note lengths (in steps at 16-subdivision):
- Bass: primarily 4–8 steps. Longer notes (8–16) for sustained pedal moments.
- Lead: primarily 2–4 steps for rhythmic phrases, 6–8 for held notes at phrase ends.
- Support sampler: very long notes (16–32 steps). The texture role sustains, it does not articulate.

Velocity guidance:
- Range: 0.60–0.92 for most notes. Do not author all notes at the same velocity.
- Phrase peaks should be slightly higher velocity (0.82–0.92).
- Phrase ends and passing tones should be lower velocity (0.62–0.74).
- Velocity variation of at least ±0.10 across a phrase reads as musical expression.

Anti-pattern — all notes at the same velocity (reject):
```
[G4, 0, 4, 0.80], [G#4, 4, 4, 0.80], [C5, 8, 4, 0.80]  ← robotic
```


---

## 5. Harmonic Quality

### 5.1 Bass line harmonic function

The bass note on the first step of each 8-bar phrase should land on the **root of the section's harmonic center**:

- tonic section: root of the key (e.g., C for C minor)
- dominant section: fifth of the key (e.g., G for C minor)
- pedal section: same root repeated or very close to it
- ambiguous section: use the minor third or minor seventh

This does not mean the entire bassline stays on one note. It means the *arrival* note at phrase downbeats anchors the harmony.

### 5.2 Scale adherence

All authored notes must belong to the declared `global_key` unless they appear in `harmony.allowed_exception_pitches`.

C natural minor scale degrees: C, D, D#, F, G, G#, A#
(Equivalently: C, D, Eb, F, G, Ab, Bb)

If you want a chromatic note, declare it explicitly:
```yaml
harmony:
  allowed_exception_pitches: [B4, E4]
```

Do not author chromatic exceptions without declaring them. The compiler will reject them.

### 5.3 Harmonic rhythm

For a song at 112–128 BPM:
- Harmonic center should change at section boundaries (every 8 bars minimum).
- Within a section, bass notes may move freely within the key but should reinforce the section's harmonic center on downbeats.
- Lead should complement bass tonality, not contradict it.


---

## 6. Rhythmic and Drum Quality

### 6.1 Drum layer roles

Every `rhythm.drum_layers` entry must have a distinct rhythmic role. The four standard roles and their behavior:

| Role | Behavior | Typical density |
|---|---|---|
| `pulse` | Drives primary beat, usually downbeats and key subdivisions | 3–6 active steps per 16 |
| `accent` | Backbeats and structural hits (usually beats 2 and 4) | 2–4 active steps per 16 |
| `subdivision` | Fills the rhythmic grid, provides groove motion | 6–12 active steps per 16 |
| `fill` | Syncopated ornament, pickup accents | 1–4 active steps per 16 |

Anti-pattern — all layers with similar step patterns (reject):
```
kick:  [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
snare: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
hat:   [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0]
```

Good example (differentiated roles):
```
kick (pulse):       [3,0,0,0, 2,0,0,1, 3,0,0,0, 2,0,1,0]
snare (accent):     [0,0,0,0, 3,0,0,1, 0,0,0,0, 3,0,0,1]
hat (subdivision):  [2,0,2,1, 2,0,2,0, 2,1,2,0, 2,0,2,1]
clap (fill):        [0,0,1,0, 0,0,2,0, 0,0,1,0, 0,0,2,0]
```

### 6.2 Velocity variation in drum steps

Step values in drum patterns represent velocity/intensity (0 = silent, 1 = soft, 2 = medium, 3 = strong).

Rules:
- The kick downbeat should almost always be value 3 (strongest hit).
- Offbeat and ghost hits should use value 1.
- Accents that reinforce a structural moment should be 3; passing fills should be 1–2.
- Avoid patterns that are all value 3 (no dynamic interest) or all value 1–2 (no punch).

### 6.3 Swing

Swing (`rhythm.swing_policy.ratio`) of 0.10–0.18 creates natural groove feel for most electronic and cinematic styles.

- 0.0: straight grid (mechanical feel, appropriate for tense or industrial moods)
- 0.10–0.14: gentle swing (natural electronic groove)
- 0.15–0.20: moderate swing (soulful, hip-hop adjacent)
- 0.25+: heavy swing (avoid unless explicitly jazz or heavily swung style)

### 6.4 Groove clarity test

Before committing a drum pattern, answer:
- Can you clearly identify the downbeat (beat 1)?
- Is there a distinct backbeat or accent on beat 3 (for 4/4 with half-time feel) or beats 2 and 4?
- Does the subdivision layer create a consistent rhythmic texture without dominating?

If you cannot identify these three clearly, simplify the pattern before adding more steps.


---

## 7. Automation Quality

### 7.1 Direction rule

Every automation lane must have a clear direction within its section: either consistently rising, consistently falling, or clearly transitioning from one stable state to another.

Good:
```yaml
points:
  - [0, 0.24]
  - [7.75, 0.58]    # clear rise: wet opens up over the section
```

Good:
```yaml
points:
  - [0, 74]
  - [7.75, 58]      # clear fall: volume fades toward outro
```

Anti-pattern — directionless (reject):
```yaml
points:
  - [0, 0.50]
  - [7.75, 0.52]    # ±0.02 is inaudible, not meaningful automation
```

Anti-pattern — arbitrary (reject):
```yaml
points:
  - [0, 0.30]
  - [3.0, 0.80]
  - [5.0, 0.20]
  - [7.75, 0.60]    # uncontrolled zigzag without musical intent
```

### 7.2 Automation magnitude

Automation should move by a musically audible amount over the course of a section.

Minimum meaningful delta by parameter type:
- Volume (`volume`): ±4 units (e.g., 68 → 74)
- Wet/dry mix (`wet`): ±0.15 (e.g., 0.24 → 0.42)
- EQ bands (`low`, `mid`, `high`): ±2 dB
- Playback rate (`playbackRate`): ±0.10 (e.g., 0.92 → 1.06)
- Pitch shift (`pitchShift`): ±2 semitones
- Pan: ±0.20

Changes smaller than these minimums are inaudible and should not be authored.

### 7.3 Automation musical intent

Each automation lane should serve a legible formal function. Use one of these:

| Function | What it does | Good parameters |
|---|---|---|
| `open` | Widens, brightens, or energizes into a section | wet, volume, high EQ |
| `close` | Narrows, darkens, or calms out of a section | wet, volume, roomSize |
| `build` | Accumulates tension or density during a section | delay feedback, wet, low EQ |
| `breathe` | Creates slow organic movement that adds life | playbackRate, pitchShift, pan |
| `fade` | Terminal volume reduction (outro / transition out) | volume, wet |

Never author an automation lane without being able to name its function. If you cannot name it, remove it.

### 7.4 Automation coverage

A well-authored song should have:
- At minimum: one automation lane per section (the minimum required by `evaluation_targets.minimum_automation_lanes`)
- Ideal: at least one lane that affects the emotional core of each section (not just cosmetic parameters)
- At least one volume or wet lane that contributes to the overall dynamic arc across the whole song

Not every section needs to automate every node. Selective automation is better than blanket automation.


---

## 8. Sound Design Quality

### 8.1 Generator mode selection by role

| Role | Recommended mode | Why |
|---|---|---|
| Bass | `fm` | FM gives sub-bass warmth, punch, and harmonic richness at low frequencies |
| Lead | `am` or `wave` | AM has a vocal-like formant character; wave gives clean clarity |
| Pad / support synth | `am` or `wave` | Needs to blend without dominating |
| Texture / noise | `noise` | Environmental or industrial texture |

Do not assign `fm` to lead unless you want an aggressive, buzzy lead character. Do not assign `noise` to bass or lead.

### 8.2 FM/AM parameter ranges for musical output

FM mode:
- `harmonicity`: 1.0–2.0 for warm, musical FM; 0.25–0.75 for metallic/bell; 3.0+ for harsh/industrial
- `modulationIndex`: 2–6 for gentle FM color; 8–14 for richer harmonics; 16–20 for distorted aggressive tone

AM mode:
- `harmonicity`: 1.5–3.0 for vocal-adjacent richness; 0.5–1.0 for subtle beating/wobble

Wave mode:
- `sine`: clean, sub-focused, works for pads and sub bass
- `triangle`: smooth, slightly warm, good for leads
- `sawtooth`: bright, harmonically rich, cuts through mixes
- `square`: hollow mid character, less common but useful for retro/chiptune moods

### 8.3 Effect wet/dry balance

Starting guidelines by role:
- Bass reverb: `wet` 0.05–0.15 (very dry — reverb muddies low end)
- Lead delay: `wet` 0.20–0.40 (delay adds width and sustain without washing out)
- Lead reverb: `wet` 0.15–0.30 (small room or plate for presence)
- Texture/support reverb: `wet` 0.50–0.80 (atmospheric — the space is part of the texture)
- Drum reverb/delay: `wet` 0.10–0.25 (subtle — preserves punch)

### 8.4 EQ role differentiation

If using the `eq` node, separate roles by frequency emphasis:

| Role | Low | Mid | High |
|---|---|---|---|
| Bass | +2 to +6 | -2 to -4 | -3 to -6 |
| Lead | -1 to -3 | 0 to +2 | +1 to +4 |
| Drums | 0 to +3 | -1 to -2 | +2 to +5 |
| Texture/support | -3 to -6 | 0 to +2 | +1 to +3 |

Do not boost the same frequency band on multiple roles simultaneously — this causes frequency masking and mud.

### 8.5 Mixer and speaker levels

Starting points that provide headroom for automation:
- `mixer.volume`: 68–74 (leaves room to automate up or down)
- `speaker.volume`: 68–72 (master level; rarely needs automation)
- Individual channel mix (within generator/drum nodes): 72–82 for primary roles, 55–68 for support/texture


---

## 9. Quality Anti-Patterns

These are the most common failure modes in AI-generated song plans. Check for all of them before submitting.

### 9.1 The flat melody
Symptom: all notes within a range of ±2 semitones. No shape, no arrival, no contour.
Fix: add a clear arch or rise with a cadence point; ensure phrase peaks are at least a 5th above phrase starts.

### 9.2 The uniform grid
Symptom: all notes the same length (e.g., all 4 steps). Feels mechanical.
Fix: mix note lengths — use longer held tones at phrase ends, shorter tones for inner motion.

### 9.3 The identical-velocity sequence
Symptom: every note has velocity 0.80. No dynamics, no expressiveness.
Fix: reduce passing tones and inner phrase notes to 0.65–0.72; raise arrivals and peaks to 0.85–0.92.

### 9.4 The homogeneous drum
Symptom: all drum layers fire on every beat or every other beat with the same velocity.
Fix: ensure pulse, accent, subdivision, and fill have clearly different step counts and velocity distributions.

### 9.5 The aimless automation
Symptom: automation start and end values are within 0.05 of each other, or they move up and down randomly within a section.
Fix: each lane must have a named function (open, close, build, breathe, fade) and move by at least the minimum meaningful delta.

### 9.6 The everything-on-all-the-time section map
Symptom: every section activates all four roles at the same density.
Fix: drop one or two roles in at least two sections to create structural contrast and give the full-arrangement sections more impact.

### 9.7 The register collision
Symptom: bass notes in octave 3–4 and lead notes in octave 3–4 at the same time.
Fix: keep bass in octaves 1–2 for most of the song; only allow octave 3 for specific expressive peaks.

### 9.8 The key-violating note
Symptom: a note appears that is not in the declared scale and not listed in `allowed_exception_pitches`.
Fix: check every authored note against the scale degrees before committing. The compiler will reject violations, but fix them at authoring time.

### 9.9 The too-wet mix
Symptom: `wet` on reverb or delay set to 0.70+ on bass or drums.
Fix: wet values above 0.50 on rhythmic or low-frequency roles destroy punch and clarity. Use these only on atmospheric support and texture layers.

### 9.10 The energy plateau
Symptom: three or more consecutive sections with energy values within 0.15 of each other.
Fix: at least every other section boundary should cross a 0.20 threshold.


---

## 10. Pre-Commit Quality Checklist

Run through this list before running `npm run compile:ai-songs`.

### Structure
- [ ] Adjacent sections differ by ≥ 0.20 in energy
- [ ] At least one peak section (≥ 0.80) and one rest section (≤ 0.40)
- [ ] No two adjacent sections have identical `active_roles`
- [ ] At least one section activates ≤ 2 roles

### Melody (lead and bass)
- [ ] ≥ 60% of consecutive note pairs are stepwise
- [ ] Phrase peaks are at least a perfect 5th above phrase lows
- [ ] Phrase endings land on root, fifth, or minor third of section harmony
- [ ] Note lengths vary — not all the same value
- [ ] Velocities vary — at least ±0.10 range across the phrase

### Harmony
- [ ] All notes belong to the declared scale OR are in `allowed_exception_pitches`
- [ ] Bass downbeats reinforce section harmonic center
- [ ] Lead register does not collide with bass register

### Rhythm
- [ ] Drum layers have clearly differentiated roles (pulse, accent, subdivision, fill)
- [ ] Each drum layer has different step density from the others
- [ ] Velocity variation present in drum patterns (not all the same value)
- [ ] Swing ratio is appropriate for the mood

### Automation
- [ ] Every lane has a named function (open, close, build, breathe, fade)
- [ ] Every lane moves by at least the minimum meaningful delta
- [ ] No lane zigzags without musical intent
- [ ] At minimum one lane per section

### Sound design
- [ ] Generator modes match roles (FM for bass, AM or wave for lead)
- [ ] Effect wet values are appropriate for role (low wet on bass/drums, high wet only on texture)
- [ ] EQ bands differentiate roles rather than stacking boosts
- [ ] Mixer volume leaves headroom for automation

### Validation readiness
- [ ] All transform IDs exist in `21_transform_ops.yaml`
- [ ] All section IDs used in `harmony`, `transforms`, and `evaluation_targets` match `structure.sections`
- [ ] All scaffold node IDs match the fixed scaffold IDs in `AI_SONG_AUTHORING.md`
- [ ] `target_duration_sec` is within the `evaluation_targets.duration_window_sec` range


---

## 11. Cross-References

- `30_composition_pipeline.md` — pipeline stages and iteration model
- `composer_playbook.md` — agent behavior, discipline principles, and failure handling
- `21_transform_ops.yaml` — valid transform operation names
- `12_pitch_harmony_schema.yaml` — scale definitions, chord qualities, and harmonic functions
- `13_rhythm_schema.yaml` — rhythm, subdivision, and groove schemas
- `AI_SONG_AUTHORING.md` — MusicalPlanV1 contract, scaffold IDs, and compiler validation rules
- `data/ai-song/flagship-song.plan.yaml` — reference quality exemplar
