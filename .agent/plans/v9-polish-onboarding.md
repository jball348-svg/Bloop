# V9 — Polish, Vibe & Onboarding

This ExecPlan is a living document. Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date. Maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

After v9, Bloop feels like a finished, premium product. A first-time visitor sees a beautiful onboarding experience with animated GIF tutorials that show exactly how to connect their first patch — without reading a word. The app supports Light, Dark, and System themes. Users can personalise node accent colours. The preset library has 15+ curated patches organised by category. The Visualiser node can display a Lissajous curve, VU meter, or spectrum with axis labels in addition to its existing waveform view.

Depends on: v8 complete.

GitHub issues: #50 (Onboarding), #51 (Theming), #52 (Presets + Visualiser).

## Progress

- [ ] Read GitHub issues #50, #51, #52 in full
- [ ] Milestone 1 — Onboarding (#50): multi-step modal with GIF tutorials and intro audio
- [ ] Milestone 2 — Theming (#51): Light/Dark/System mode + per-node colour overrides
- [ ] Milestone 3 — Presets & Visualiser (#52): 15+ presets in categories, Visualiser mode selector
- [ ] npm run build and npm run lint pass
- [ ] Update TICKETS.md, close GitHub issues #50, #51, #52

## Surprises & Discoveries

[To be filled. GIF asset creation and Light mode CSS are likely the most time-intensive parts.]

## Decision Log

[To be filled.]

## Outcomes & Retrospective

[To be written at completion.]

## Context and Orientation

The current `EngineControl.tsx` shows a simple "START AUDIO ENGINE" overlay that unmounts once clicked. The new onboarding replaces or extends this: it adds a multi-step tutorial after the engine starts, shown only on first visit (tracked via `localStorage`).

Theme colours are currently hardcoded as Tailwind classes in each component. Light mode requires either a CSS variable approach (extend `globals.css` custom properties) or a Tailwind dark-mode class strategy (adding `dark:` prefixed classes). CSS custom properties are simpler for a comprehensive theme change. The variables `--background` and `--foreground` are already present in `globals.css` — extend this pattern.

The existing `VisualiserNode.tsx` uses `Tone.Analyser` (waveform) and `Tone.FFT` (spectrum). The Lissajous mode requires two audio inputs (one per axis of an X/Y plot) — this is an architectural extension. The VU meter mode can use the existing `Tone.Meter` class.

The preset system is already implemented (issue #12, v3). Presets are stored as JSON objects that serialise the node graph state. Adding more presets means authoring more JSON objects in the presets array/file.

## Plan of Work

### Milestone 1 — Onboarding (#50)

Create `components/OnboardingModal.tsx`. This is a full-screen semi-transparent overlay with a white/dark card in the centre. It shows on first visit (check `localStorage.getItem('bloop-onboarded')` — if absent, show the modal).

The modal has 5 steps, each with: a title, a 2-3 sentence description, and a looping GIF/WebM clip. For the GIF assets: capture short screen recordings of the key interactions (drag node onto canvas, snap two nodes, connect cable, play sound, pack group) and export as optimised GIFs into `public/onboarding/`. If GIF creation is not possible in the agent session, use placeholder `<div>` elements with descriptive text and leave a `// TODO: replace with GIF asset` comment — the structure must be complete even if assets are pending.

Navigation: Previous / Next buttons. Skip button on every step. Final step has a "Start Blooping" button that sets `localStorage.setItem('bloop-onboarded', '1')` and closes the modal.

Intro audio: after the engine starts and the modal is shown, play a short ambient Tone.js sequence (synthesised — no file dependency) using the existing audio engine. This is the "Bloop brand sound". Keep it simple: a pentatonic arp for ~3 seconds, then fade out. Stop it when the modal is dismissed.

Re-access: add an "Intro / Help" button to `components/SystemMenu.tsx` that sets `localStorage.removeItem('bloop-onboarded')` and re-mounts the modal.

### Milestone 2 — Theming (#51)

Add `theme: 'dark' | 'light' | 'system'` and `nodeColorOverrides: Record<AudioNodeType, string>` to the Zustand store. Persist both in `localStorage`.

For Light/Dark/System mode: use a `useEffect` in `app/layout.tsx` that watches the store's theme value. On change, toggle the `dark` class on the `<html>` element and listen to `prefers-color-scheme` media query for system mode. Extend `globals.css` to define `--bg-primary`, `--bg-secondary`, `--border-primary`, `--text-primary` custom properties for both `:root` (dark, the current look) and `.light` selector.

Update all node components and the canvas to use these CSS variables instead of hardcoded `slate-800`/`slate-900` Tailwind classes. This is the most labour-intensive part — be systematic, file by file.

For node colour overrides: add an "Appearance" panel to `components/SystemMenu.tsx`. It shows one colour picker per node type, but constrained to a predefined palette of 12 approved vibrant colours (not a full free picker — this keeps colours on-brand). When a colour override is set, the corresponding node components read from the override Map in the store instead of their hardcoded default class.

### Milestone 3 — Presets & Visualiser (#52)

Presets: author 15+ preset patch JSON objects. Organise them into categories: Getting Started (3), Rhythmic (3), Ambient (3), Complex Patches (3), Feature Showcases (3+). Each preset should use the nodes available by v8. Store them in `store/presets.ts` (or wherever the existing preset data lives — find it first). Update the `SystemMenu.tsx` preset picker to show category groupings.

Visualiser modes: update `components/VisualiserNode.tsx` to add a mode selector (Waveform / Spectrum / VU / Lissajous) inside the node. For Waveform and Spectrum: already implemented. For VU meter: use `Tone.Meter` (a peak meter). Display as a vertical bar. For Lissajous: requires two audio inputs. Add a second `audio-in` handle to the Visualiser node. The X axis plots channel 1, Y axis plots channel 2 using a `<canvas>` with `Tone.Analyser` (time domain) on each channel.

Update `VALID_AUTO_WIRE_PAIRS` and `NODE_DIMS` if the Visualiser's handle configuration changes.

## Concrete Steps

    npm run dev
    # Verify v8 stable

    # Clear localStorage to trigger onboarding:
    # In browser console: localStorage.removeItem('bloop-onboarded')
    # Reload — onboarding modal should appear
    # Step through all 5 screens, verify navigation, verify "don't show again" on completion

    # Theme test:
    # Open System menu → Appearance → switch to Light mode
    # Canvas and all nodes should switch to light colours
    # Switch to System — should follow OS dark/light preference

    # Preset test:
    # Open System menu → presets
    # Verify categories appear
    # Load each preset — patch should load without errors and produce sound

    # Visualiser test:
    # Add Visualiser, switch to VU mode — bar responds to audio input
    # Switch to Lissajous, connect two sources — X/Y plot appears

    npm run build && npm run lint

## Validation and Acceptance

Onboarding: clear localStorage, reload, modal appears. All 5 steps navigate correctly. Skip works from any step. "Start Blooping" closes modal and sets localStorage. Reopening from System menu works. Intro audio plays on first show.

Theming: Light mode makes the canvas clearly legible with a light background. System mode follows OS. Node colour overrides persist after page reload.

Presets: 15 presets available, organised by category. Each preset loads and produces sound. No TypeScript errors in preset data.

Visualiser: VU meter responds to audio. Lissajous shows X/Y plot with two inputs connected.

## Idempotence and Recovery

LocalStorage cleanup: if the onboarding appears on every load due to a bug, check the `localStorage.setItem` call in the "Start Blooping" handler. The key must exactly match the key checked on mount.

## Interfaces and Dependencies

New files:
- `components/OnboardingModal.tsx`
- `public/onboarding/` (GIF assets — may be placeholder)

New store fields:
- `theme: 'dark' | 'light' | 'system'`
- `setTheme: (t: 'dark' | 'light' | 'system') => void`
- `nodeColorOverrides: Partial<Record<AudioNodeType, string>>`
- `setNodeColorOverride: (type: AudioNodeType, color: string) => void`

No new npm packages required.
