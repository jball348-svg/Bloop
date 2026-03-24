# Bloop Style Guide — Node Design System

This file is the canonical reference for all node visual styling. **Read this before building any new node component.** Every new node must have a unique accent colour from the registry below, and must follow the shared structural patterns.

---

## Colour Registry

Every node has one primary accent colour. No two nodes share a colour. When adding a new node, pick an unused entry from the Available section.

### In Use

| Node | Type | Border | Text | Handle | Tailwind Colour |
|---|---|---|---|---|---|
| Arpeggiator | Controller | `border-yellow-500` | `text-yellow-400` | `bg-yellow-400` | `yellow` |
| Keys | Controller | `border-white` | `text-white` | `bg-white` | `white` |
| MIDI In | Controller | `border-neutral-300` | `text-neutral-200` | `bg-neutral-300` | `neutral` |
| ADSR | Controller | `border-amber-700` | `text-amber-600` | `bg-amber-600` | `amber-700` (dark amber, distinct from yellow) |
| Chord | Controller | `border-sky-500` | `text-sky-300` | `bg-sky-400` | `sky` |
| Pulse | Controller | `border-lime-500` | `text-lime-400` | `bg-lime-500` | `lime` |
| Step Sequencer | Controller | `border-blue-500` | `text-blue-400` | `bg-blue-500` | `blue` |
| Pattern | Controller | `border-blue-700` | `text-blue-300` | `bg-blue-700` | `blue-700` |
| LFO | Controller / Modulation | `border-lime-700` | `text-lime-300` | `bg-lime-500` | `lime-700` |
| Mood Pad | Controller | `border-rose-500` | `text-rose-300` | `bg-rose-500` | `rose` |
| Generator | Signal | `border-red-500` | `text-red-400` | `bg-red-500` | `red` |
| Sampler | Signal | `border-stone-400` | `text-stone-200` | `bg-stone-400` | `stone` |
| Audio In | Signal | `border-slate-400` | `text-slate-300` | `bg-slate-400` | `slate` |
| Drum | Signal | `border-orange-500` | `text-orange-400` | `bg-orange-500` | `orange` |
| Advanced Drums | Signal | `border-green-500` | `text-green-300` | `bg-green-500` | `green` |
| Effect | Signal | `border-fuchsia-500` | `text-fuchsia-400` | `bg-fuchsia-500` | `fuchsia` |
| EQ | Signal | `border-zinc-400` | `text-zinc-300` | `bg-zinc-400` | `zinc-400` |
| Unison | Signal | `border-violet-500` | `text-violet-400` | `bg-violet-500` | `violet` |
| Detune | Signal | `border-teal-500` | `text-teal-400` | `bg-teal-500` | `teal` |
| Visualiser | Signal | `border-pink-500` | `text-pink-400` | `bg-pink-500` | `pink` |
| Quantizer | Signal / Theory | `border-purple-500` | `text-purple-300` | `bg-purple-500` | `purple` |
| Packed Node (Macro) | Macro | `border-orange-400` | `text-orange-300` | `bg-orange-400` | `orange-400` (neon orange — distinct from Drum's orange-500) |
| Tempo | Global | `border-indigo-500` | `text-indigo-400` | n/a | `indigo` |
| Amplifier | Global | `border-emerald-500` | `text-emerald-400` | n/a | `emerald` |
| Mixer | Global | `border-emerald-500` | `text-emerald-300` | `bg-emerald-500` | `emerald-500` |
| Arranger | Global | `border-indigo-700` | `text-indigo-300` | n/a | `indigo-700` |

### Available (not yet assigned)

- No unused registry colours remain. If a new node type is needed beyond the above, choose a new distinct Tailwind hue (e.g. `cyan-600`, `slate-400`, `neutral-300`) and add it here first before implementing the component. **Do not use `cyan-400/500`** — that shade is reserved for adjacency glows.

> **Do not use `cyan`** for node colours — it is reserved exclusively for the adjacency glow ring and audio-domain cable colour.

---

## Canvas Accent Language

| Signal | Colour | Usage |
|---|---|---|
| Audio domain cables | `cyan` `#22d3ee` | Edges between Generator → Effect → Visualiser etc. |
| Control domain cables | neon green `#39ff14` / `#00ff88` | Edges from Controller → ADSR → Generator etc. |
| Adjacency glow ring (audio) | `ring-cyan-400` | Snapped nodes in the audio domain |
| Adjacency glow ring (control) | neon green ring | Snapped nodes in the control domain |
| Trash bin indicator | `red-500` / `red-900` | Drop zone for node deletion |

---

## Shared Structural Patterns

### Node Container
```tsx
<div data-node-accent style={accentStyle} className={`themed-node bg-slate-800 border-2 border-[COLOUR] rounded-2xl p-3 shadow-2xl text-white w-[WIDTH] flex flex-col transition-all hover:shadow-[COLOUR]/20 group relative${
    isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
}`}>
```
- Background is always `bg-slate-800`
- Every shippable node should opt into the shared accent override system via `data-node-accent`, `themed-node`, and `useNodeAccentStyle(type)`.
- Adjacency glow for audio-domain nodes is `ring-cyan-400`
- Adjacency glow for control-domain nodes is neon green (see Canvas Accent Language)

### Theme & Accent Variables (v9)
- Canvas, menus, and chrome now resolve through CSS variables in `app/globals.css` rather than hardcoded dark-only slate values.
- Preferred shell variables:
  - `--background`
  - `--surface-primary`
  - `--surface-secondary`
  - `--border-primary`
  - `--text-primary`
  - `--text-muted`
  - `--control-panel`
  - `--control-panel-border`
- Node accent overrides are limited to the approved palette in `lib/nodePalette.ts`. Campaign rewards add extra swatches, not arbitrary free-pick colours.

### Locking System (v3)
Nodes within a snapped group can be locked to move logically as one object.
```tsx
<LockButton id={id} isAdjacent={isAdjacent} accentColor="[COLOUR]" />
```
- The `LockButton` component handles state sync across snapped clusters.
- When `isLocked` is true, dragging any node in the cluster moves all of them.

### Packing System (v4 — complete)
A locked group can be "packed" into a single Macro Node using `PackedNode.tsx`.
- Every node component has a conditional return at the top: `if (nodeData?.isPackedVisible) return <PackedNode id={id} />`
- `PackedNode` uses the `orange-400` colour scheme with an editable label and an Unpack button.
- Audio routing is preserved during pack/unpack via edge redirection in `store/useStore.ts`.

### Handles & Routing Constraints
V3 introduced directional routing rules based on handle IDs.
- **Control Path**: Uses `Position.Left` (`control-in`) and `Position.Right` (`control-out`).
- **Audio Path**: Uses `Position.Top` (`audio-in`) and `Position.Bottom` (`audio-out`).
- **Modulation Path**: Uses `Position.Right` (`mod-out`) on sources and parameter-specific right-edge targets (`mod-in:<param>`) on destinations.

**Conditional Handle Rendering** (Locked Groups):
To prevent mid-chain connections in locked groups, only the entry and exit points should render handles.
```tsx
{(!nodeData?.isLocked || nodeData?.isEntry) && (
    <Handle type="target" id="[CONTROL/AUDIO]_INPUT_ID" position={[Left/Top]} ... />
)}
```

### Delete Button
Always in the top-left of every node. Hover state uses the node accent colour.

---

## Node Width Reference

| Node | Width |
|---|---|
| Controller / Keys | `w-72` (288px) |
| Mood Pad | `w-80` (320px) |
| Pulse | `w-72` (288px) |
| Step Sequencer | `w-[22rem]` (352px) |
| Pattern | `w-[22rem]` (352px) |
| LFO | `w-64` (256px) |
| Sampler | `w-80` (320px) |
| Drum | `w-80` (320px) |
| Advanced Drums | `w-[27rem]` (432px) |
| Generator | `w-60` (240px) |
| Quantizer | `w-60` (240px) |
| MIDI In | `w-64` (256px) |
| Audio In | `w-64` (256px) |
| Visualiser | `w-72` (288px) |
| EQ | `w-64` (256px) |
| Mixer | `w-80` (320px) |
| Arranger | `w-[22rem]` (352px) |
| Effect / Chord / ADSR / Speaker | `w-56` (224px) |
| Tempo | `w-64` (256px) |
| Packed Node (Macro) | `w-56` (224px) — same as standard node |

---

## Menu Colour Coordination

- **Controllers menu** (left): yellow, white, lime, blue, blue-700, amber, sky, rose
- **Signals menu** (top): red, stone, slate, orange, green, fuchsia, zinc, violet, teal, pink, purple
- **Global menu** (right): indigo, indigo-700, emerald
- **System menu** (bottom): neutral/slate chrome plus cyan action states for Presets / Appearance / Campaign / Intro / Record

---

## Legacy Notes

- `DrumNode` is legacy-facing from v7 onwards. Keep it for backwards compatibility with saved patches, but route new patches toward `AdvancedDrumNode`.
- The original `SpeakerNode.tsx` was renamed to `Amplifier` in v2. Do not re-add a Speaker node type.
- `Amplifier` remains loadable for legacy patches, but new song-authoring work should route through `Mixer`.
