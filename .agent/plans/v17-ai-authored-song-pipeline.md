# V17 — AI-Authored Song Pipeline

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this work, Bloop can ship and play a genuinely authored AI song through the normal product surface instead of relying on a handwritten inline demo patch. Users will be able to load a featured AI song preset backed by a real `.bloop` asset, and the repo will also gain a constrained theory-grounded authoring workflow so future AI-authored songs can be generated safely against a known scaffold instead of guessing raw graph JSON.

This milestone targets the fastest practical route to a believable AI song:

- keep delivery as preset + `.bloop`
- keep authoring scaffold-first instead of arbitrary graph generation
- use shipped sample assets where they materially improve the result
- improve only the song-writing surfaces that currently bottleneck this outcome

## Progress

- [x] (2026-03-25) Read `.agent/PLANS.md`, the existing v15/v16 plans, preset/load code, arranger/pattern/song-related runtime files, and composer overlay docs.
- [x] (2026-03-25) Milestone 1 — Add patch asset types, normalization, validation, and asset-backed preset loading.
- [x] (2026-03-25) Milestone 2 — Add AI song scaffold assets, blueprint compiler/promotion flow, and shipped sample kit.
- [x] (2026-03-25) Milestone 3 — Upgrade song-authoring surfaces: Pattern range/length, Step Sequencer range, Arranger duplication/validation, and sampler automation.
- [x] (2026-03-25) Milestone 4 — Ship the featured AI song preset and equivalent `.bloop` asset, then validate load/play/save behavior.
- [x] (2026-03-25) Milestone 5 — Ground the AI-song compiler in `.agent/composer` via `MusicalPlanV1`, strict theory validation, and provenance sidecars.
- [x] (2026-03-25) Milestone 6 — Refresh top-level docs so README, overview, roadmap, tickets, and agent guidance all describe the shipped v17 app accurately.
- [x] (2026-03-25) Run `npm run compile:ai-songs`, `npm run build`, and `npm run lint`.

## Surprises & Discoveries

- Observation: the current showcase song is still embedded inline in `store/presets.ts`.
  Evidence: `showcase-song` is defined as a large literal preset object rather than a shipped asset path.
- Observation: `loadCanvas(...)` accepts raw patch JSON directly and does not currently run a dedicated normalization/validation pass.
  Evidence: `store/useStore.ts` sets `nodes`, `edges`, and `masterVolume` from input data and immediately rehydrates runtime objects.
- Observation: Pattern and Arranger are powerful enough to play a song, but the current showcase only uses a shallow subset of them.
  Evidence: the built-in showcase has only 3 scenes, 2 tonal pattern nodes, one static drum node, and minimal automation.
- Observation: the working tree already contains unrelated composer-doc edits outside this milestone.
  Evidence: `git status --short` showed modified files under `.agent/composer/` before implementation started.
- Observation: a deterministic sample kit is enough to unblock the first AI-song pipeline without introducing new third-party audio assets or authoring dependencies.
  Evidence: `scripts/compile-ai-song-assets.mjs` now renders `kick.wav`, `snare.wav`, `hat.wav`, `clap.wav`, `support-texture.wav`, and `hook-chime.wav` directly into `public/ai-song-kit/`.
- Observation: the first trustworthy AI-song interface is a scaffold JSON compiler, not arbitrary graph synthesis.
  Evidence: the shipped scaffold and flagship song both compile from blueprint files in `data/ai-song/` into preset-backed `.bloop` assets in `public/patches/`.
- Observation: the first version of the AI-song pipeline was runtime-grounded but not actually consuming the musical-brain source files.
  Evidence: no repo code referenced `.agent/composer/10_music_ontology.yaml`, `11_time_schema.yaml`, `12_pitch_harmony_schema.yaml`, `13_rhythm_schema.yaml`, `21_transform_ops.yaml`, or `30_composition_pipeline.md` until the grounding pass added those files as compiler inputs.
- Observation: the original flagship song relied on runtime quantization and still contained non-diatonic source notes.
  Evidence: the pre-grounding bass and lead blueprint material included `A` and `E` naturals even though the lead quantizer was set to `C minor`.

## Decision Log

- Decision: make the featured AI song an asset-backed preset instead of another inline object.
  Rationale: the same compiled patch should power both preset loading and `.bloop` delivery.
  Date: 2026-03-25
- Decision: use a constrained scaffold plus blueprint compiler rather than arbitrary graph generation.
  Rationale: this is the quickest way to make AI-authored output repeatable and safe.
  Date: 2026-03-25
- Decision: shipped sample assets are allowed for the first AI song.
  Rationale: they raise the floor on musical impact faster than adding major new synthesis systems.
  Date: 2026-03-25
- Decision: do not build a user-facing prompt UI in this milestone.
  Rationale: the required missing capability is the authoring pipeline, not the prompting surface.
  Date: 2026-03-25
- Decision: make `.agent/composer/*` a hard build dependency for AI-song compilation.
  Rationale: the musical brain should be the source of truth for theory, transformations, and composition semantics instead of a loosely related documentation layer.
  Date: 2026-03-25
- Decision: promote `MusicalPlanV1` YAML to the source artifact and demote blueprint JSON to generated output.
  Rationale: this preserves a clean separation between musical intent and Bloop execution details while keeping the scaffold contract deterministic.
  Date: 2026-03-25
- Decision: fail compilation on theory violations instead of treating them as advisory warnings.
  Rationale: v17 needs one trustworthy flagship song, and strict compile-time rejection is the fastest way to guarantee it stays grounded.
  Date: 2026-03-25

## Outcomes & Retrospective

- The preset catalog can now load either inline presets or asset-backed `.bloop` files through one normalized/validated patch path.
- The repo now contains a scaffold-first AI song contract: fixed node IDs, `MusicalPlanV1` YAML sources, generated blueprint JSON files, a compiler script, and shipped sample assets.
- Pattern, Step Sequencer, Arranger, and sampler automation are now broad enough to support a longer multi-scene flagship song without inventing a new timeline model.
- The compiler now ingests the musical-brain files from `.agent/composer`, emits grounding/evaluation reports, and refuses to build theory-invalid songs.
- Top-level docs now reflect the real shipped app instead of older v3/v15 snapshots, including the partial-but-visible math receiver foundation and the grounded AI-song asset pipeline.
- Build, lint, and the grounded `compile:ai-songs` pipeline all pass after the new asset pipeline, UI limits, and generated song files were added.

## Context and Orientation

`store/useStore.ts` owns the patch graph, load/save flow, Tone runtime lifecycle, arranger playback, pattern playback, and current node defaults. Any normalized patch pipeline must plug in there.

`store/presets.ts` defines the curated preset catalog. It currently stores every preset inline, including the showcase song. This needs to evolve to support asset-backed presets while preserving existing inline presets.

`components/SystemMenu.tsx` is the entry point for both preset loading and `.bloop` file loading. It needs to resolve both inline and asset-backed presets, surface validation warnings, and keep the current user flow simple.

`components/PatternNode.tsx`, `components/StepSequencerNode.tsx`, and `components/ArrangerNode.tsx` define the authoring ceilings for the first AI song. Pattern pitch range, loop length, step note range, scene length, scene duplication, and scene validation all live in these files plus the shared store constants/actions.

The first AI song should not invent its own graph. It should target a stable scaffold with fixed node IDs and role semantics, then compile into a `.bloop` asset that the app can load normally.

## Plan of Work

Milestone 1 introduces a proper patch asset contract. Add `PatchAssetV1` metadata/types, shared normalization and validation helpers, and a small validation report surface in the load flow. Extend the preset catalog so presets can either remain inline or point at a shipped patch asset URL. Preserve all existing inline presets.

Milestone 2 creates the constrained AI authoring path. Add a small sample kit under `public/`, define the scaffold node IDs and allowed mutation points, add a `SongBlueprintV1` file shape, and implement a dev-time compiler/promotion script that emits the scaffold `.bloop` asset and the final AI song `.bloop` asset. The preset catalog should reference those emitted assets rather than duplicating their graphs inline.

Milestone 3 raises the musical ceiling enough for the first song to feel like a song. Expand Pattern to a scrollable C2-C6 range and 16-bar maximum, expand Step Sequencer note options to the same range, expand Arranger scene length to 32 bars and add a duplicate-scene action, and extend automation support for sampler playback-rate and pitch-shift movement. Also add scene-level validation so AI-authored patches surface broken structure instead of silently loading.

Milestone 4 ships the actual AI-authored song asset. Compile a multi-section blueprint into a featured preset and public `.bloop` file, then validate end-to-end: preset loading, direct `.bloop` loading, playback, save/load round-trip, sample rehydration, and validation warnings.

Milestone 5 grounds the song pipeline in the composer brain. Load the musical-brain YAML and markdown docs from `.agent/composer`, add `MusicalPlanV1` YAML sources, validate plans and generated note material against theory constraints, emit provenance/evaluation sidecars, and ensure the flagship song passes strict C natural minor validation before the `.bloop` asset is written.

## Concrete Steps

    npm run dev
    # Keep the app available while patching preset loading and song playback flows.

    # Milestone 1:
    # Edit store/useStore.ts, store/presets.ts, and components/SystemMenu.tsx to add
    # patch asset types, normalization/validation, and asset-backed preset loading.

    # Milestone 2:
    # Add the scaffold/blueprint assets, compiler script, and shipped sample files.

    # Milestone 3:
    # Update Pattern, Step Sequencer, Arranger, and automation surfaces for song-grade authoring.

    # Milestone 5:
    # Add MusicalPlanV1 files, direct musical-brain ingestion, theory validation, and provenance reports.

    npm run compile:ai-songs
    npm run build
    npm run lint

## Validation and Acceptance

Load an asset-backed preset from the System menu and confirm it resolves through fetch, normalizes correctly, and produces the same runtime result as loading the equivalent `.bloop` file directly.

Load a deliberately sparse scaffold-derived asset and confirm defaults are filled without crashing the app.

Verify that Pattern notes below C4 and above C5 render and remain editable, that Step Sequencer can author the same range, and that save/load preserves those notes.

Verify that Arranger warnings appear for empty scenes, missing pattern/rhythm references, structural gaps, overlaps, and invalid automation targets.

Verify that sampler `playbackRate` and `pitchShift` automation audibly work in arranged playback and survive save/load.

Verify that the featured AI song is 90–120 seconds long, has at least five named scenes, includes drums/bass/lead/support roles, and plays end-to-end after starting the audio engine.

Verify that `npm run compile:ai-songs` fails if one of the `.agent/composer` brain files is missing or malformed, if a plan references an unknown transform, or if generated note material falls outside the declared key/register rules.

Verify that the compiler emits `*.grounding-report.json` sidecars with transform provenance, evaluation metrics, and brain source references for both the scaffold and flagship songs.

## Idempotence and Recovery

Re-running the blueprint compiler should be safe and should overwrite the emitted scaffold/song assets deterministically.

If asset-backed preset loading breaks, the safe fallback is to load the emitted `.bloop` file directly and compare the validation report to the preset fetch path.

If sample asset loading fails, the recovery path is to keep the patch structure intact, fix the referenced public asset path, re-run the compiler, and reload the asset.

Normalization and validation helpers must be safe to re-run during both preset loads and file loads without mutating unrelated app state.

## Interfaces and Dependencies

Add or extend these interfaces:

- `PatchAssetV1`
- `PatchAssetMetadata`
- `PatchValidationIssue`
- `PatchValidationReport`
- `normalizePatchAsset(...)`
- `validatePatchAsset(...)`
- `Preset.source`
- `SongBlueprintV1`
- `compileSongBlueprintToPatch(...)` in the dev-time pipeline

Likely file touchpoints:

- `store/useStore.ts`
- `store/presets.ts`
- `components/SystemMenu.tsx`
- `components/PatternNode.tsx`
- `components/StepSequencerNode.tsx`
- `components/ArrangerNode.tsx`
- `public/`
- new compiler/docs files for the AI song pipeline
