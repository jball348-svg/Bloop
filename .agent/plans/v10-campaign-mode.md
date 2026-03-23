# V10 — Campaign Mode: Gamified Synthesis Puzzles

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v10, Bloop offers an optional guided learning mode alongside the free sandbox. A user clicks "Campaign" from the System menu and enters a structured series of interactive puzzles: "Connect a Generator to the Amplifier and hear a tone", "Add a Reverb effect and set the mix to 50%", escalating through 20 levels to complex multi-node patches. Each completed level shows a success state and unlocks a cosmetic reward — a unique node skin colour or a curated preset. The free sandbox remains fully accessible at all times. Gamification rewards; it never restricts.

Depends on: v9 complete. This version requires both code work and content work (level design). The code architecture can be built first; levels can be authored incrementally.

GitHub issues: #53 (Campaign Mode).

## Progress

- [x] (2026-03-23) Read GitHub issue #53 and kept the implementation scoped to the beginner-tier campaign architecture in the plan.
- [x] (2026-03-23) Milestone 1 — Campaign architecture: added separate campaign store, mode toggle, and split-pane layout with a left-side panel.
- [x] (2026-03-23) Milestone 2 — Verification engine: added pure campaign condition helpers and level evaluation utilities.
- [x] (2026-03-23) Milestone 3 — Level content: authored five beginner levels covering generator, reverb, keys, arp playback, and full chain building.
- [x] (2026-03-23) Milestone 4 — Reward system: wired level completion to preset/skin unlock persistence and the v9 appearance/preset surfaces.
- [x] (2026-03-23) `npm run build` and `npm run lint` pass on the integrated v8/v9/v10 branch state.
- [ ] (2026-03-23) Update `TICKETS.md`, close GitHub issue #53, and land the milestone commit.

## Surprises & Discoveries

- Observation: the beginner-tier campaign did not need full graph isomorphism; a small library of reusable node-existence and path-existence predicates was enough.
  Evidence: `lib/campaignVerifier.ts` now verifies levels with `hasNodeOfType`, `hasNodeMatching`, and `pathExists`.
- Observation: reward persistence belongs in two places: campaign history and the appearance/preset preference store.
  Evidence: `store/campaign.ts` tracks progress/unlocked reward ids while `usePreferencesStore` owns the actual unlocked skin/preset surfaces.
- Observation: the Arpeggiator's play state had to move into node data for campaign verification to see it.
  Evidence: `ControllerNode.tsx` now toggles `node.data.isPlaying` through store state instead of holding play state only in local component state.

## Decision Log

- Decision: Use reward unlocks (cosmetics/presets) rather than node locks.
  Rationale: Bloop's identity is a sandbox built for intuition. Locking functionality behind levels creates friction and contradicts the product philosophy. Rewards motivate without restricting.
  Date: See ROADMAP.md.
- Decision: Keep campaign mode in a separate persisted store rather than adding more flags to `store/useStore.ts`.
  Rationale: Campaign progress is durable product state, while `useStore.ts` remains focused on canvas/audio graph state.
  Date: 2026-03-23.
- Decision: Let campaign mode preserve the current patch when entering or exiting.
  Rationale: The feature is meant to guide sandbox use, not replace it, and the user explicitly requested patch preservation.
  Date: 2026-03-23.
- Decision: Apply rewards immediately on first successful completion.
  Rationale: Reward feedback feels instant and keeps the preferences surfaces in sync with campaign success without a second claim flow.
  Date: 2026-03-23.

## Outcomes & Retrospective

V10 adds an optional learning layer without taking sandbox freedom away. Campaign mode now opens as a side panel beside the same live canvas, tracks five beginner objectives, verifies progress with pure reusable helpers, and keeps the user’s patch intact when they enter or leave the mode.

Reward unlocks flow straight into the v9 systems that already own them: preset rewards appear in the grouped preset library, and skin rewards extend the appearance palette. Progress persists in local storage independently of canvas resets or patch files.

## Context and Orientation

Campaign Mode is an entirely additive feature. It overlays the existing canvas with a left panel showing the current level objective, an optional target visualisation, and a progress indicator. The canvas on the right continues to function exactly as in free sandbox mode. Exiting campaign mode at any time returns to the free sandbox with the current patch intact.

Level state (which levels are complete, which rewards are unlocked) is persisted in `localStorage`. It does not go in the Zustand store's core canvas state — it is a separate concern.

The hardest engineering problem is the **verification engine**: how to detect that a user's current canvas patch matches a level's target configuration. A target can be described as a graph pattern (certain node types connected in a certain topology). The verifier compares the current React Flow edges and nodes against the target pattern. Exact matching (same node IDs) will not work since the user places their own nodes — use structural/topological matching: does there exist a path from a Controller-type node through any Generator-type node to the Amplifier? Does an Effect node exist in that path? This is a subgraph pattern match.

## Plan of Work

### Milestone 1 — Campaign Architecture

Add `campaignMode: boolean` and `activeLevelId: string | null` to the Zustand store. Add `enterCampaign(): void` and `exitCampaign(): void` actions. Add an "Enter Campaign" button to `components/SystemMenu.tsx`.

Create `components/CampaignPanel.tsx` — a left panel (approx 280px wide) that renders when `campaignMode` is true. The panel shows: the level number and title, the objective description (plain prose), a "Check My Patch" button that triggers the verification engine, and a success/failure state after checking. On success, it shows the reward unlocked and a "Next Level" button.

Update `app/page.tsx`: when `campaignMode` is true, render the CampaignPanel to the left of the React Flow canvas, reducing the canvas width by the panel width. The canvas must remain fully functional.

Create `store/campaign.ts` (separate from `useStore.ts`) to hold campaign-specific state: `levelProgress`, `unlockedRewards`. Persist via `localStorage`. Keep it separate to avoid polluting the audio store.

### Milestone 2 — Verification Engine

Create `lib/campaignVerifier.ts`. This module exports a function `verifyLevel(level: CampaignLevel, nodes: AppNode[], edges: Edge[]): boolean`.

A `CampaignLevel` defines its target as a set of required conditions, each of which is a function of the current nodes and edges. Examples:
- `hasNodeOfType('generator')` — at least one generator node exists
- `pathExists('controller', 'generator')` — a cable runs from any controller to any generator
- `pathExists('generator', 'effect')` — a cable runs from a generator through an effect
- `effectHasWetMin(0.4)` — at least one effect node has wet >= 40%

Conditions are evaluated lazily — all must return true for the level to be verified.

The verifier should be pure (no side effects) and fast (it runs on every "Check My Patch" button click, not on every canvas change).

Define the `CampaignLevel` type in `lib/campaignTypes.ts`:

    interface CampaignCondition {
      description: string; // Human-readable hint shown in the panel
      check: (nodes: AppNode[], edges: Edge[]) => boolean;
    }
    interface CampaignLevel {
      id: string;
      title: string;
      objective: string;
      conditions: CampaignCondition[];
      reward: CampaignReward;
    }
    interface CampaignReward {
      type: 'preset' | 'nodeSkin';
      label: string;
      value: string; // preset name or colour hex
    }

### Milestone 3 — Level Content

Create `store/campaignLevels.ts` exporting an array of at least 5 `CampaignLevel` objects covering the beginner tier.

Level 1 — "First Sound": Connect a Generator to the Amplifier and hear a tone.
  Condition: a Generator node exists on the canvas.
  Reward: unlock the "Aurora" node skin (a soft blue-purple gradient).

Level 2 — "Add Some Space": Add a Reverb Effect between your Generator and the Amplifier.
  Conditions: a Generator exists; an Effect (reverb subtype) exists; a path exists Generator → Effect.
  Reward: unlock the "Cave Echo" preset.

Level 3 — "Play It": Connect a Keys controller and play at least one note.
  Conditions: a Keys node exists; a path exists Keys → Generator.
  Reward: unlock the "Neon" node skin.

Level 4 — "Make It Groove": Connect an Arp controller and set it playing.
  Conditions: an Arp node exists; Arp is playing (`nodeData.isPlaying === true`); path Arp → Generator.
  Reward: unlock the "Late Night" preset.

Level 5 — "Chain Reaction": Build a chain: Controller → Generator → Effect → Visualiser.
  Conditions: path exists Controller-type → Generator → Effect → Visualiser.
  Reward: unlock the "Signal" node skin (signal-flow inspired).

### Milestone 4 — Reward System

Rewards are applied via `store/campaign.ts`. When a level is completed, add its reward to `unlockedRewards` in localStorage.

For node skin rewards: add an `unlockedSkins: string[]` array to the Zustand store (or campaign store). When a skin is unlocked, add it to the array. In `components/SystemMenu.tsx`'s Appearance panel (from v9), show unlocked skins as selectable themes alongside the default ones.

For preset rewards: when unlocked, add the preset to the available presets list in `store/presets.ts`. The preset should be clearly labelled as a campaign reward.

Show a satisfying success state in `CampaignPanel.tsx`: the reward name, a brief description, a colour/visual preview of the reward, and confetti or a pulse animation. Keep it brief and delightful.

## Concrete Steps

    npm run dev
    # Verify v9 stable

    # Campaign mode test:
    # Open System menu → Enter Campaign
    # CampaignPanel appears on left, canvas on right
    # Canvas is fully functional in campaign mode
    # Exiting campaign preserves the current patch

    # Level 1 test:
    # Enter campaign, load Level 1
    # Drop a Generator node
    # Click "Check My Patch"
    # Success state appears, Aurora skin unlocked
    # "Next Level" advances to Level 2

    # Level progress persistence:
    # Complete Level 1, reload page
    # Enter campaign — Level 1 shown as complete, Level 2 is active

    npm run build && npm run lint

## Validation and Acceptance

Architecture: entering campaign mode splits the screen. Exiting restores full canvas. Campaign state survives page reload.

Verification: Level 1 does not pass with an empty canvas. It passes after adding a Generator. Level 2 does not pass without an Effect node. It passes after connecting Generator → Effect.

Levels: 5 playable beginner levels. Each produces a clear success state. Rewards are applied and persist.

Sandbox access: at all times during campaign mode, the user can add/remove/connect nodes freely. Campaign mode never blocks canvas interaction.

## Idempotence and Recovery

Campaign state is in localStorage — safe to clear for testing. No campaign state goes into the core Zustand store, so resetting the canvas ("New" button) does not clear campaign progress.

## Interfaces and Dependencies

New files:
- `components/CampaignPanel.tsx`
- `lib/campaignVerifier.ts`
- `lib/campaignTypes.ts`
- `store/campaign.ts`
- `store/campaignLevels.ts`

No new npm packages required.
