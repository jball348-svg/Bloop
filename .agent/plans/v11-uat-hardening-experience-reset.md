# V11 — UAT Hardening, Menu IA Cleanup & Interaction Reliability

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v11, Bloop should feel easier to enter, easier to scan, and less brittle in day-to-day use. A first-time user lands on a clearer startup flow, the intro no longer fights the audio bootstrap, the main menus read as simple grouped toolbars instead of nested toggles, global utilities live in the right place, light mode is usable, audio-capable modules follow the same mix conventions, and snapping feels dependable again.

This is the first post-roadmap stabilization release after the shipped v4-v10 feature tranche. It is explicitly driven by live UAT feedback rather than new feature expansion.

Depends on: v10 complete.

GitHub issues: #60, #61, #62, #63, #64, #65, #66, #67.

## Progress

- [x] (2026-03-24) Consolidated UAT feedback into GitHub issues #60-#67 and drafted the v11 execution plan
- [x] (2026-03-24) Milestone 1 — First-run bootstrap and onboarding simplification (#60)
- [x] (2026-03-24) Milestone 2 — Global utilities and dedicated Bloop navigation (#62, #63)
- [x] (2026-03-24) Milestone 3 — Theme simplification and System menu cleanup (#65, #61)
- [x] (2026-03-24) Milestone 4 — Module readability and mix-standard pass (#64)
- [x] (2026-03-24) Milestone 5 — Snapping, adjacency, and overlap hardening via shared runtime dimensions (#67)
- [ ] Milestone 6 — Presets library overhaul (#66)
- [x] (2026-03-24) `npm run build` and `npm run lint` pass on the completed v11 branch
- [x] (2026-03-24) Updated `TICKETS.md` / `ROADMAP.md` and captured the current v11 outcomes here

## Surprises & Discoveries

- Observation: the first-run flow is currently split across `components/EngineControl.tsx`, `components/OnboardingModal.tsx`, `store/usePreferencesStore.ts`, and intro-audio helpers in `store/useStore.ts`.
  Evidence: `EngineControl` starts Tone and opens onboarding, while `OnboardingModal` independently manages skip/close/complete states and intro audio playback.
- Observation: menu taxonomy is encoded directly in component-local arrays rather than a shared registry.
  Evidence: `components/ControllerMenu.tsx`, `components/SignalMenu.tsx`, and `components/GlobalMenu.tsx` each define their own tool lists, which is why `midiin`, `audioin`, `pulse`, and `quantizer` are currently scattered in ways UAT flagged.
- Observation: the theme system combines CSS custom properties with broad wildcard class overrides and a per-node accent override feature.
  Evidence: `app/globals.css` rewrites many `slate-*`/`text-*`/`bg-*` utility classes globally while `store/usePreferencesStore.ts` persists per-node accent overrides that the user now considers overwhelming.
- Observation: snapping is split between drag-stop logic in `app/page.tsx` and adjacency/auto-wire logic in `store/useStore.ts`.
  Evidence: `app/page.tsx` handles multi-pass overlap resolution and snap placement, while `store/useStore.ts` separately recalculates adjacency, lock clusters, and hidden auto-edges.
- Observation: a large share of the snap inconsistency came from hard-coded node dimensions drifting away from the sizes React Flow had already measured.
  Evidence: `app/page.tsx`, `store/useStore.ts`, and `components/SignalFlowOverlay.tsx` each carried separate dimension registries; switching the snap/adjacency path to prefer runtime `width` / `height` values made the geometry rules consistent again.
- Observation: the global utility and menu cleanups exposed small theme-specific contrast bugs in places that relied on wildcard `text-black` / `bg-black` remaps.
  Evidence: `components/KeysNode.tsx` and the menu pill chrome needed explicit contrast-safe styling once light mode was softened.

## Decision Log

- Decision: Treat the UAT round as a new v11 milestone instead of reopening v9/v10 plans.
  Rationale: The shipped v4-v10 roadmap is complete; these notes are a new prioritization pass that spans onboarding, navigation, theming, module polish, and interaction reliability.
  Date: 2026-03-24
- Decision: Keep Presets as its own follow-up ticket rather than folding it into generic System menu cleanup.
  Rationale: The user explicitly called for a more comprehensive presets overhaul, and that work should not be diluted by unrelated toolbar/layout changes.
  Date: 2026-03-24
- Decision: Sequence the snapping rewrite after node/menu/theme polish.
  Rationale: several v11 tickets may change node dimensions, density, or layout expectations; rewriting snap thresholds before those changes would risk doing the geometry work twice.
  Date: 2026-03-24
- Decision: Group global utility migration and Bloop/menu taxonomy early in the plan.
  Rationale: System menu cleanup, node discoverability, and utility placement all depend on first deciding what belongs in Global, what belongs in Controller/Signal, and where Bloop lives.
  Date: 2026-03-24

## Outcomes & Retrospective

- Landed a single first-run path: the intro now owns the first-use bootstrap, `Skip` and the final CTA both start the engine the same way, the duplicate “ready to bloop?” framing is gone, and the fallback post-onboarding unlock button is reduced to a plain `Bloop!` affordance.
- Moved recorder access into Global, promoted MIDI In / Audio In into the same utility surface, removed menu toggles in Controller and Signal, and added a dedicated top-left Bloop launcher so the main IA reads as grouped toolbars instead of nested modes.
- Simplified Appearance down to `Dark`, `Light`, and `System`, reworked light mode into a softer warm surface palette, and aligned the System bar ordering/copy with `New Save Load | Presets Flow | Appearance Intro Tutorial | Undo Redo`.
- Standardized shared mix chrome across representative audio nodes, fixed Keys legibility, renamed Sequencer `Gate` to `Mix`, softened the step-selection visuals, removed extra Mood Pad copy, and updated user-facing Pulse copy to Bloop where it appears in the app/preset catalog.
- Hardened snapping/adjacency by centralizing fallback node dimensions and preferring React Flow’s runtime-measured sizes for drag-stop snapping, adjacency detection, locking, and signal-flow overlays. This should get another manual UAT pass before #67 is closed.
- Deferred the deeper presets-library redesign to #66 on purpose. The current pass only carried the copy alignment needed for Bloop/Tutorial naming and kept the dedicated overhaul ticket open.

## Context and Orientation

The current canvas shell lives in `app/page.tsx`. It renders `EngineControl`, `OnboardingModal`, the three edge menus (`components/SignalMenu.tsx`, `components/ControllerMenu.tsx`, `components/GlobalMenu.tsx`), `components/SystemMenu.tsx`, and all React Flow node registries. Node dimensions are duplicated locally in `app/page.tsx` for drag placement and in `store/useStore.ts` for adjacency/lock logic.

The startup flow currently works like this:

1. `components/EngineControl.tsx` blocks the app until the user clicks "Start Audio Engine".
2. `Tone.start()` and `Tone.Transport.start()` run there, followed by `initializeDefaultNodes()`.
3. If onboarding has not been seen, `usePreferencesStore.openOnboarding()` is called.
4. `components/OnboardingModal.tsx` separately plays and stops intro audio via `store/useStore.ts`.

This split is why the user experiences the intro as semi-optional and disconnected from the actual audio unlock.

Menu taxonomy currently works like this:

1. `components/ControllerMenu.tsx` uses two local sections (`performance`, `sequencing`) and shows only one at a time.
2. `components/SignalMenu.tsx` uses three local sections (`generators`, `modulators`, `visualisers`) and shows only one at a time.
3. `components/GlobalMenu.tsx` currently exposes only `tempo` and `speaker`.
4. `components/SystemMenu.tsx` still contains recording, appearance, presets, intro, campaign, and signal-flow actions.

Node-level issues are spread across:

- `components/KeysNode.tsx` for contrast problems.
- `components/StepSequencerNode.tsx` for first-step visuals and `Gate` copy.
- `components/MoodPadNode.tsx` for extra helper text.
- `components/GeneratorNode.tsx`, `components/SamplerNode.tsx`, `components/DrumNode.tsx`, `components/AdvancedDrumNode.tsx`, `components/EffectNode.tsx`, `components/UnisonNode.tsx`, `components/DetuneNode.tsx`, and `components/AudioInNode.tsx` for mix-control consistency.

Theme state lives in `store/usePreferencesStore.ts`, while theme tokens and wildcard remaps live in `app/globals.css`. System chrome that exposes those controls lives in `components/SystemMenu.tsx`.

Snapping and adjacency logic spans:

- `app/page.tsx` for drop placement, grid snap, overlap resolution, and drag-stop alignment.
- `store/useStore.ts` for adjacency thresholds, lock clusters, hidden auto-wire edges, and re-sync after undo/redo/save/load.

## Plan of Work

### Milestone 1 — First-run bootstrap and onboarding simplification (#60)

Refactor `components/EngineControl.tsx`, `components/OnboardingModal.tsx`, `store/usePreferencesStore.ts`, and the intro-audio helpers in `store/useStore.ts` so first-run startup becomes a single understandable flow. The user should see one clear entry path. If the intro remains the place where audio unlock happens, both "Skip" and the final CTA must execute the exact same post-unlock state transition. Remove duplicate controls, duplicate progress indicators, and stale text about intro melody if no clearly audible intro sound is playing. Fix the onboarding media container so the SVG scenes fit their visible frame without cropping.

At the end of this milestone, a new user should not have to mentally map "start engine" and "dismiss intro" as separate concepts.

### Milestone 2 — Global utilities and dedicated Bloop navigation (#62, #63)

First, expand `components/GlobalMenu.tsx`, `app/page.tsx`, and `store/useStore.ts` so `midiin`, `audioin`, and recorder access are treated as global utilities alongside Tempo and Amplifier. `components/SystemMenu.tsx` should stop being the home for recording once that migration lands.

Second, refactor `components/ControllerMenu.tsx` and `components/SignalMenu.tsx` so they render all tools at once with visual dividers rather than tab/toggle filters. Move the current Pulse launcher into a dedicated top-left Bloop control surface rendered from `app/page.tsx` or a new small launcher component. Update launcher copy from Pulse to Bloop, and move Quantizer into the controller-facing taxonomy. Audio In should no longer appear in the Signal menu after the global utility migration.

This milestone changes discoverability, not just labels: the goal is for a new user to understand where controllers, signals, globals, and Bloop itself live without opening sub-menus.

### Milestone 3 — Theme simplification and System menu cleanup (#65, #61)

Rework `app/globals.css`, `store/usePreferencesStore.ts`, `lib/nodePalette.ts`, and `components/SystemMenu.tsx` so Appearance is simplified to `Dark`, `Light`, and `System`, while light mode becomes visually usable instead of a bright inversion of the current chrome. Remove or hide per-node accent overrides from the primary flow unless a clearly better override experience emerges during implementation.

After the theme simplification is stable, finalize the System menu layout in `components/SystemMenu.tsx`: `New Save Load | Presets Flow | Appearance Intro Tutorial | Undo Redo`. Rename `Signal Flow` to `Flow` and replace the user-facing `Campaign` launch label with `Tutorial`. Coordinate with Milestone 2 so recorder controls have already left System.

This milestone should make the shell feel calmer before deeper node-level polish begins.

### Milestone 4 — Module readability and mix-standard pass (#64)

Audit and update the affected node components:

- `components/KeysNode.tsx` for readable octave-state contrast and readable white-key labels.
- `components/StepSequencerNode.tsx` for the first-step visual bug and terminology change from `Gate` to `Mix` if that matches the intended behavior.
- `components/MoodPadNode.tsx` to remove extra explanatory copy.
- All audio-capable nodes to align mix slider placement, label style, and readout behavior.

If node dimensions change because controls are added, removed, or repositioned, update both dimension registries (`app/page.tsx` and `store/useStore.ts`) in the same change set. Preserve the store-owned audio architecture: any new mix or gain controls still flow through `updateNodeValue()` and store-managed Tone objects.

### Milestone 5 — Snapping, adjacency, and overlap rewrite (#67)

With menu and node sizing stable, rewrite the placement rules in `app/page.tsx` and the adjacency/auto-wire helpers in `store/useStore.ts`. The new implementation must cover:

1. Predictable grid snap.
2. Predictable controller-row and audio-column adjacency.
3. Mixed-size node overlaps.
4. Locking and packed-cluster behavior.
5. Exclusions for Tempo, Amplifier, and any promoted global utilities.

Capture the manual validation matrix directly in this plan as discoveries are made. The rewrite is not complete until the visual result, adjacency glow, hidden auto-edges, and lock state all agree with each other.

### Milestone 6 — Presets library overhaul (#66)

After the System menu shell has settled, redesign the presets experience. Start by auditing the current implementation in `components/SystemMenu.tsx` and the preset catalog source (`store/presets.ts` or its equivalent). Clarify the difference between curated presets and user Save/Load files, reduce noise from reward-locked presets, and give Presets a clearer browsing/loading flow than the current catch-all panel.

This milestone can change UI structure significantly, but it should not regress patch loading or reward unlocking behavior.

## Concrete Steps

    npm run dev
    # Verify current v10 state before starting any v11 milestone

    # Milestone 1 checks
    # Clear localStorage onboarding flags
    # Reload the app and verify there is one understandable startup path
    # Verify Skip and final intro CTA both leave audio unlocked and the canvas usable

    npm run build
    npm run lint

    # Milestone 2 checks
    # Verify Global exposes Tempo, Amplifier, MIDI In, Audio In, and recorder access
    # Verify Controller and Signal menus show all groups without tab toggles
    # Verify Bloop launcher is visible in the top-left

    npm run build
    npm run lint

    # Milestone 3 checks
    # Switch between Dark, Light, and System
    # Verify the System bar layout/order/labels match the v11 spec

    npm run build
    npm run lint

    # Milestone 4 checks
    # Verify Keys text contrast, Sequencer visuals/copy, Mood Pad copy removal,
    # and consistent mix controls across representative audio modules

    npm run build
    npm run lint

    # Milestone 5 checks
    # Drag representative controller/audio/global nodes into rows and columns
    # Verify adjacency, glow, auto-wire, locking, packing, and overlap resolution

    npm run build
    npm run lint

    # Milestone 6 checks
    # Open Presets, compare it to Save/Load, and verify curated vs user-owned flows are distinct

    npm run build
    npm run lint

## Validation and Acceptance

Bootstrap and intro:

1. On a fresh profile, load the app.
2. Confirm the startup affordance is clear and minimal.
3. Skip the intro once and complete it fully once in a fresh session.
4. In both cases, confirm the app ends in the same engine-started state.

Navigation and taxonomy:

1. Confirm Global utilities are clearly separate from Controller and Signal tools.
2. Confirm Bloop is discoverable without opening a submenu.
3. Confirm Quantizer is discoverable as a controller-facing aid.

Theme and System chrome:

1. Confirm Light mode is readable without washed-out or blinding chrome.
2. Confirm Appearance exposes only the intended simple options.
3. Confirm the System menu order and labels match the requested grouping.

Module polish:

1. Confirm selected octave text and white key legends are readable in Keys.
2. Confirm Sequencer step 1 no longer renders as incorrectly all-blue.
3. Confirm Mood Pad does not carry unnecessary explanatory copy.
4. Confirm all representative audio modules present mix controls in the same place and style.

Snapping:

1. Test controller-to-generator horizontal snaps with mixed node widths.
2. Test generator/effect/visualiser vertical snaps with mixed node heights.
3. Test locked clusters and packed nodes.
4. Test that globals do not incorrectly participate in adjacency logic.

Presets:

1. Confirm curated presets are clearly different from user Save/Load files.
2. Confirm locked reward presets are understandable but not noisy.
3. Confirm loading presets still rebuilds the canvas and audio graph correctly.

## Idempotence and Recovery

The startup and theme work both touch persisted browser state (`localStorage` via Zustand persist). During implementation, it must remain safe to clear `bloop-preferences` and retest from a fresh profile without corrupting saved patches.

Global utility migration must preserve store-owned browser resources. `Tone.UserMedia`, Web MIDI listeners, recorder taps, and any new recorder node/module all need explicit cleanup paths that survive node removal, canvas clear, undo/redo, and load/save transitions.

The snapping rewrite is the riskiest milestone. Keep it recoverable by landing it after the geometry-affecting UI changes and by validating each representative node family before moving on to packing/locking behavior.

## Interfaces and Dependencies

Primary files:

- `app/page.tsx`
- `app/globals.css`
- `components/EngineControl.tsx`
- `components/OnboardingModal.tsx`
- `components/SystemMenu.tsx`
- `components/GlobalMenu.tsx`
- `components/ControllerMenu.tsx`
- `components/SignalMenu.tsx`
- `components/KeysNode.tsx`
- `components/StepSequencerNode.tsx`
- `components/MoodPadNode.tsx`
- representative audio nodes such as `components/GeneratorNode.tsx`, `components/SamplerNode.tsx`, `components/DrumNode.tsx`, `components/AdvancedDrumNode.tsx`, `components/EffectNode.tsx`, `components/UnisonNode.tsx`, `components/DetuneNode.tsx`, and `components/AudioInNode.tsx`
- `store/useStore.ts`
- `store/usePreferencesStore.ts`
- `lib/nodePalette.ts`
- preset catalog source (`store/presets.ts` or equivalent)

Likely new UI files:

- a dedicated Bloop launcher component rendered from the canvas shell
- optionally a dedicated recorder node/component if Milestone 2 chooses the node-based global-utility route

Critical existing store interfaces:

- `initializeDefaultNodes()`
- `playOnboardingIntro()` / `stopOnboardingIntro()`
- `startRecording()` / `stopRecording()`
- `updateNodeValue()`
- `updateNodeData()`
- adjacency helpers and lock/packing actions in `store/useStore.ts`

No new npm dependencies should be required unless the presets overhaul or recorder redesign uncovers a capability gap. If that happens, record the decision and rationale in the Decision Log before introducing the package.
