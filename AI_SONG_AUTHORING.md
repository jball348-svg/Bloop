# AI Song Authoring

Bloop now compiles AI-authored songs from a theory-grounded `MusicalPlanV1` source instead of treating execution blueprints as the primary authoring artifact.

## Canonical Flow

1. Edit a `MusicalPlanV1` YAML file in [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song).
2. Run `npm run compile:ai-songs`.
3. The compiler loads the musical-brain source files directly from [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer):
   - [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/10_music_ontology.yaml`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/10_music_ontology.yaml)
   - [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/11_time_schema.yaml`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/11_time_schema.yaml)
   - [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/12_pitch_harmony_schema.yaml`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/12_pitch_harmony_schema.yaml)
   - [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/13_rhythm_schema.yaml`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/13_rhythm_schema.yaml)
   - [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/21_transform_ops.yaml`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/21_transform_ops.yaml)
   - [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/30_composition_pipeline.md`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/.agent/composer/30_composition_pipeline.md)
4. If the plan passes theory and runtime validation, the compiler emits:
   - generated blueprint JSON sidecars in [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song)
   - grounding and evaluation reports in [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/data/ai-song)
   - compiled patch assets in [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/patches`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/patches)
   - shipped sample assets in [`/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/ai-song-kit`](/Users/johnfairfax-ball/Documents/GitHub/Bloop/public/ai-song-kit)
5. The app loads those `.bloop` assets through the same normalized and validated path used for manual patch files.

## Source vs Output

- Source of truth for musical intent: `*.plan.yaml`
- Source of truth for music theory and composition semantics: `.agent/composer/*`
- Source of truth for runtime constraints: the Bloop repo and app code
- Generated execution artifact: `*.blueprint.json`
- Generated runtime artifact: `*.bloop`
- Generated provenance artifact: `*.grounding-report.json`

## MusicalPlanV1 Shape

Every grounded song plan should include:

- `intent`
  - `title`, `mood`, `target_duration_sec`, `bpm`, `global_key`, `style_tags`, `energy_curve`
- `structure`
  - ordered sections with `id`, `name`, `bars`, `energy`, `density`, `active_roles`, and optional `automation_lanes`
- `harmony`
  - section harmonic centers plus `allowed_exception_pitches`
- `rhythm`
  - subdivision, swing policy, and explicit drum-layer roles/patterns
- `arrangement`
  - fixed scaffold role mappings, register ranges, timbre intent, and note material
- `sound_design`
  - concrete synth, sampler, effect, mixer, and speaker settings
- `transforms`
  - declared operations that must exist in `21_transform_ops.yaml`
- `evaluation_targets`
  - duration window, minimum role coverage, minimum automation lanes, and density/contrast targets

## Fixed Scaffold IDs

The compiler still targets one stable scaffold. Use these IDs exactly:

- `song-tempo`
- `song-bass-pattern`
- `song-bass-adsr`
- `song-bass-gen`
- `song-bass-eq`
- `song-lead-pattern`
- `song-lead-quant`
- `song-lead-gen`
- `song-lead-delay`
- `song-support-pattern`
- `song-support-sampler`
- `song-support-reverb`
- `song-drums`
- `song-drum-eq`
- `song-mixer`
- `song-arranger`
- `song-speaker`

## Validation Rules

`npm run compile:ai-songs` fails if:

- any required musical-brain file is missing or malformed
- a transform name is not defined in `21_transform_ops.yaml`
- melodic notes fall outside the declared key without explicit exceptions
- melodic notes exceed the declared register range
- required role coverage is missing
- section-to-scene mapping cannot be derived
- generated blueprint data violates core Bloop runtime limits

Warnings are still emitted for lower-level quality issues such as weak section contrast, thin automation coverage, or sound-design/key mismatches.

## Grounding Metadata

Compiled `.bloop` assets now include compact grounded-song metadata in patch `metadata`, including:

- `planId`
- `globalKey`
- `brainRefs`
- `validationPass`
- `errorCount`
- `warningCount`
- nested `groundedSong` provenance fields

## Important Constraints

- The compiler is build-time only. The browser app does not parse the musical-brain YAML files.
- Musical abstractions remain authoritative at plan time, but Bloop still executes through Pattern, Arranger, Mixer, Sampler, synth nodes, and automation.
- Strict diatonic validation is the default. Chromatic exceptions must be explicit in the plan.
- Generated blueprints are outputs, not hand-authored sources.
