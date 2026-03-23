# V4 — Stability, Visual Polish & Deployment

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After this version, Bloop will have a stable, visually polished canvas running on a public Vercel URL. The control signal domain will be visually distinct from the audio domain (different cable and glow colours), long-standing snapping bugs will be resolved, and the canvas will feel effectively infinite. A user opening the deployed URL will experience no janky overlapping nodes, clear colour coding between controller and audio cables, and the ability to build arbitrarily large patches without hitting a viewport wall.

Node Packing (issue #35) is already complete and closed. This plan covers the remaining v4 work: #33, #34, #36, #37.

## Progress

- [ ] Read and understand all four GitHub issues: #33, #34, #36, #37
- [ ] Milestone 1 — Bug Omnibus (#33): Fix all identified snapping, audio engine, and UX bugs
- [ ] Milestone 2 — Visual Polish (#34): Control cables → neon green; glow rings follow domain colour
- [ ] Milestone 3 — Vercel Deployment (#36): Connect repo to Vercel, confirm production build passes
- [ ] Milestone 4 — Canvas Bounds (#37): Remove hard viewport limits, enable effective infinite pan
- [ ] Run `npm run build` and `npm run lint` — both must pass
- [ ] Update TICKETS.md: close #33, #34, #36, #37
- [ ] Close GitHub issues #33, #34, #36, #37

## Surprises & Discoveries

[To be filled during implementation.]

## Decision Log

[To be filled during implementation.]

## Outcomes & Retrospective

[To be written at completion.]

## Context and Orientation

Bloop is a Next.js 16 / React Flow 11 / Tone.js 15 / Zustand 5 modular audio synth. The canvas lives in `app/page.tsx`. All audio logic lives in `store/useStore.ts`. Node components are in `components/`. The 15px snap grid and adjacency detection are implemented in `app/page.tsx` (the `onNodeDragStop` handler) and `store/useStore.ts`. Edge styling is set in `app/page.tsx` via `defaultEdgeOptions` and in `app/globals.css`.

The two signal domains are: **audio domain** (Generator → Effect → Unison → Detune → Visualiser) and **control domain** (Controller → ADSR → Chord → Generator). In v3, both domains used cyan-coloured cables. Issue #34 changes control domain cables to neon green, making it visually clear which cables carry note events versus audio signals.

The adjacency glow ring is the cyan border that appears on nodes when they are snapped together. Issue #34 also changes this ring colour to match the domain — cyan for audio-domain node adjacency, neon green for control-domain node adjacency.

Issue #33 is an omnibus of known bugs. Before starting, read the full GitHub issue #33 at https://github.com/jball348-svg/Bloop/issues/33 to get the precise bug list. Do not guess — read the issue.

Issue #37 concerns React Flow canvas bounds. The relevant props in `app/page.tsx` are `translateExtent`, `nodeExtent`, and `fitViewOptions` on the `<ReactFlow>` component. Removing or setting these to very large values enables effective infinite pan.

## Plan of Work

### Milestone 1 — Bug Omnibus (#33)

Read the full text of GitHub issue #33 before starting. The issue describes a set of specific bugs with reproduction steps. Work through them one by one. The most likely files to change are `app/page.tsx` (drag/drop/snap logic), `store/useStore.ts` (audio engine, node state), `components/DrumNode.tsx` (ADSR-related drum bug), and individual node components (text selection bleed). Commit after each distinct bug fix with a message like `fix(snapping): resolve N→S gap missed snap`.

For snap/overlap bugs: the core logic is in the `onNodeDragStop` callback in `app/page.tsx`. Node positions are snapped to 15px multiples. Overlap resolution finds the nearest free 15px slot. After any fix, verify by rapidly dragging and dropping multiple nodes in a crowded canvas — no node should overlap another after release.

For audio engine bugs: most are in `store/useStore.ts`. The pattern is always: read the bug description, find the relevant store action, fix it, verify by reproducing the original scenario in the browser.

For text selection bleed: React Flow node drag events can bleed into browser text selection. The fix is typically `user-select: none` on the canvas container or on specific node elements. Check `app/globals.css` and the relevant node components.

### Milestone 2 — Visual Polish (#34)

Control domain cable colour is currently set in `app/page.tsx` via `defaultEdgeOptions`. The current colour is the same cyan used for audio cables. The fix: detect edge domain (control vs audio) and apply different stroke colours. Control edges should use neon green (recommend `#39ff14` or `#00ff88`). Audio edges keep cyan (`#22d3ee`).

In React Flow, edge styling can be applied per-edge via the `style` property on each edge object in the store, or via custom edge types. The simplest approach: when creating an edge in `onConnect` in `store/useStore.ts`, determine the source node's domain (controller/ADSR/Chord = control; everything else = audio) and set `style: { stroke: color }` on the edge accordingly. Also update `rebuildAudioGraph` if domain detection is centralised there.

For adjacency glow rings: these are rendered as a border/ring on snapped nodes. Find where the glow ring colour is applied (likely a `border-cyan-400` or similar Tailwind class on snapped nodes, or a CSS class toggled in the snapping logic in `app/page.tsx`). Change it to match the domain: if the snapped group contains a controller-domain node at the top, use neon green; if purely audio-domain, use cyan.

After the change: open the dev server, connect a Keys → Generator cable and verify it is neon green. Connect a Generator → Effect cable and verify it is cyan. Snap a Keys + Generator together and verify the glow ring colour.

### Milestone 3 — Vercel Deployment (#36)

First, confirm `npm run build` passes with zero errors. Fix any TypeScript or ESLint errors that surface. Common issues: unused imports, implicit `any`, missing type annotations on new code from earlier milestones.

Vercel deployment itself requires manual steps outside the repo (connecting the GitHub repo to a Vercel project through the Vercel dashboard). Document the steps in the plan's Decision Log once done. What Codex can do in the repo: ensure the build is clean, ensure `next.config.ts` has no localhost-only assumptions, and verify that `EngineControl.tsx` correctly blocks audio until a user gesture (this is mandatory in all browsers — `Tone.start()` must be called inside a click handler).

Create a note in this plan's Decision Log when the Vercel URL is live.

### Milestone 4 — Canvas Bounds (#37)

In `app/page.tsx`, find the `<ReactFlow>` component. Remove or greatly expand any `translateExtent` and `nodeExtent` props that restrict panning. A `translateExtent` of `[[-100000, -100000], [100000, 100000]]` is effectively infinite for practical use. Removing `nodeExtent` allows nodes to be placed anywhere.

Also verify that `fitView` on initial load still works (it should frame only the initial nodes, not the entire infinite canvas). The `fitViewOptions` prop can limit `fitView` to the current nodes.

After the change: drag a node to the extreme right edge of the screen. The canvas should pan to follow it. Zoom out with the mouse wheel — the entire patch should stay visible. No hard wall should stop node placement.

## Concrete Steps

All commands run from the repo root.

    npm run dev
    # Open http://localhost:3000 in browser
    # Verify existing functionality before making changes (smoke test)

    # After each milestone:
    npm run build
    npm run lint
    # Fix any errors before moving to the next milestone

    # Final verification:
    npm run build
    # Expected: compiled successfully, no type errors, no lint errors

## Validation and Acceptance

Milestone 1 (Bugs): Rapidly drag and drop 6+ nodes onto a crowded canvas. No overlaps after release. The specific bugs listed in issue #33 must each be reproduced (failing) before the fix and verified (passing) after.

Milestone 2 (Colours): Connect Keys → Generator: cable is neon green. Connect Generator → Effect: cable is cyan. Snap Keys + Generator: glow ring is neon green. Snap Generator + Effect: glow ring is cyan.

Milestone 3 (Vercel): The app loads at the Vercel URL. Clicking START AUDIO ENGINE and connecting nodes produces sound in Chrome, Firefox, and Safari.

Milestone 4 (Canvas): Drag a node past the visible right/bottom edge — canvas pans. Zoom out fully — all nodes remain visible with no hard boundary.

## Idempotence and Recovery

All changes are additive or surgical. `npm run dev` can be restarted at any point. If a Tone.js bug is introduced, the symptom is usually a silent canvas or console errors — reload the page and check the browser console. If snapping is broken, nodes will stack on drop — check the `onNodeDragStop` handler in `app/page.tsx`.

## Interfaces and Dependencies

No new external libraries required for this plan. All changes are within existing files:
- `app/page.tsx` — snap logic, edge options, canvas bounds
- `store/useStore.ts` — edge domain detection, audio bug fixes
- `app/globals.css` — edge stroke and glow ring CSS
- `components/DrumNode.tsx` — ADSR-related drum bug (if applicable)
- Individual node components — text selection fixes
