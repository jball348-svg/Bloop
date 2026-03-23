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
| ADSR | Controller | `border-amber-700` | `text-amber-600` | `bg-amber-600` | `amber-700` (dark amber, distinct from yellow) |
| Chord | Controller | `border-sky-500` | `text-sky-300` | `bg-sky-400` | `sky` |
| Generator | Signal | `border-red-500` | `text-red-400` | `bg-red-500` | `red` |
| Drum | Signal | `border-orange-500` | `text-orange-400` | `bg-orange-500` | `orange` |
| Effect | Signal | `border-fuchsia-500` | `text-fuchsia-400` | `bg-fuchsia-500` | `fuchsia` |
| Unison | Signal | `border-violet-500` | `text-violet-400` | `bg-violet-500` | `violet` |
| Detune | Signal | `border-teal-500` | `text-teal-400` | `bg-teal-500` | `teal` |
| Visualiser | Signal | `border-pink-500` | `text-pink-400` | `bg-pink-500` | `pink` |
| Quantizer | Signal / Theory | `border-purple-500` | `text-purple-300` | `bg-purple-500` | `purple` |
| Pulse | Controller | `border-lime-500` | `text-lime-400` | `bg-lime-500` | `lime` |
| Step Sequencer | Controller | `border-blue-500` | `text-blue-400` | `bg-blue-500` | `blue` |
| Mood Pad | Controller | `border-rose-500` | `text-rose-300` | `bg-rose-500` | `rose` |
| Tempo | Global | `border-indigo-500` | `text-indigo-400` | n/a | `indigo` |
| Amplifier | Global | `border-emerald-500` | `text-emerald-400` | n/a | `emerald` |

### Available (not yet assigned)

Pick the next colour for any new node — each should be visually distinct from its neighbours in the menu.

- No unused registry colours remain. Pick a new distinct Tailwind hue and add it here before creating another node type.

> **Do not use `cyan`** for node colours — it is reserved exclusively for the adjacency glow ring.

---

## Shared Structural Patterns

### Node Container
```tsx
<div className={`bg-slate-800 border-2 border-[COLOUR] rounded-2xl p-3 shadow-2xl text-white w-[WIDTH] flex flex-col transition-all hover:shadow-[COLOUR]/20 group relative${
    isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
}`}>
```
- Background is always `bg-slate-800`
- Adjacency glow is always `ring-cyan-400`

### Locking System (v3 New)
Nodes within a snapped group can be locked to move logically as one object.
```tsx
<LockButton id={id} isAdjacent={isAdjacent} accentColor="[COLOUR]" />
```
- The `LockButton` component handles state sync across snapped clusters.
- When `isLocked` is true, dragging any node in the cluster moves all of them.

### Handles & Routing Constraints
V3 introduced directional routing rules based on handle IDs.
- **Control Path**: Uses `Position.Left` (`control-in`) and `Position.Right` (`control-out`).
- **Audio Path**: Uses `Position.Top` (`audio-in`) and `Position.Bottom` (`audio-out`).

**Conditional Handle Rendering** (Locked Groups):
To prevent mid-chain connections in locked groups, only the entry and exit points should render handles.
```tsx
{(!nodeData?.isLocked || nodeData?.isEntry) && (
    <Handle type="target" id="[CONTROL/AUDIO]_INPUT_ID" position={[Left/Top]} ... />
)}
```

### Delete Button
Always in the top-left of every node. Hoover state uses the node accent colour.

---

## Node Width Reference

| Node | Width |
|---|---|
| Controller / Keys | `w-72` (288px) |
| Mood Pad | `w-80` (320px) |
| Pulse | `w-72` (288px) |
| Step Sequencer | `w-[22rem]` (352px) |
| Drum | `w-80` (320px) |
| Generator | `w-60` (240px) |
| Quantizer | `w-60` (240px) |
| Effect / Chord / ADSR / Speaker | `w-56` (224px) |
| Tempo | `w-64` (256px) |

---

## Menu Colour Coordination

- **Controllers menu** (left): yellow, white, lime, blue, amber, sky, rose
- **Signals menu** (top): red, orange, fuchsia, violet, teal, pink, purple
- **Global menu** (right): indigo, emerald
- **System menu** (bottom): neutral/slate (New, Save, Load, Presets, Undo, Redo)
