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
| Tempo | Global | `border-indigo-500` | `text-indigo-400` | n/a | `indigo` |
| Amplifier | Global | `border-emerald-500` | `text-emerald-400` | n/a | `emerald` |

### Available (not yet assigned)

Pick the next colour for any new node — each should be visually distinct from its neighbours in the menu.

- `blue-500` — clean blue
- `lime-500` — bright green
- `rose-500` — warm red-pink (close to red, use with care)
- `purple-500` — deep purple (close to violet/indigo, use with care)

> **Do not use `cyan`** for node colours — it is reserved exclusively for the adjacency glow ring.

---

## Shared Structural Patterns

All nodes must follow these patterns. Do not deviate without a strong reason.

### Node Container
```tsx
<div className={`bg-slate-800 border-2 border-[COLOUR] rounded-2xl p-3 shadow-2xl text-white w-[WIDTH] flex flex-col transition-all hover:shadow-[COLOUR]/20 group relative${
    isAdjacent ? ' ring-2 ring-offset-2 ring-offset-slate-900 ring-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.25)]' : ''
}`}>
```
- Background is always `bg-slate-800`
- Adjacency glow is always `ring-cyan-400` — never change this

### Delete Button (top-left of every node)
```tsx
<button
    className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-[COLOUR] hover:text-white hover:border-[COLOUR-lighter] flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
    style={{ boxShadow: `0 0 6px rgba([COLOUR_RGB], 0.3)` }}
    onClick={(e) => { e.stopPropagation(); removeNodeAndCleanUp(id); }}
>
    ×
</button>
```

### Node Header Label
```tsx
<div className="text-[10px] font-black uppercase text-[COLOUR] tracking-[0.2em]">
    NODE NAME
</div>
```

### Parameter Labels
```tsx
<label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Param Name</label>
```
Always `text-slate-400`. Never the node accent colour.

### Sliders
```tsx
<input
    type="range"
    className="nodrag w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[COLOUR]"
/>
```
Track is always `h-1 bg-slate-800`. Thumb uses `accent-[COLOUR]`.

### Value Readouts
```tsx
<span className="text-[10px] font-mono text-[COLOUR] font-bold">{val}%</span>
```
Readouts use the node accent colour.

### "Not Connected" Indicator
```tsx
{isUnconnected && (
    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-[COLOUR]">
        <div className="flex-1 h-px bg-current" />
        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
        <div className="flex-1 h-px bg-current" />
    </div>
)}
```
Always `opacity-40` in the node accent colour.

### Handles
```tsx
<Handle
    type="target"
    id={AUDIO_INPUT_HANDLE_ID}
    position={Position.Top}
    className="w-4 h-4 border-4 border-slate-900 !-top-2 hover:scale-125 transition-all bg-[COLOUR]"
/>
<Handle
    type="source"
    id={AUDIO_OUTPUT_HANDLE_ID}
    position={Position.Bottom}
    className="w-4 h-4 border-4 border-slate-900 !-bottom-2 hover:scale-125 transition-all bg-[COLOUR]"
/>
```
Handle border is always `border-slate-900`. Size always `w-4 h-4`. Colour matches node accent.

**Exception — Generator top input handle:** uses `bg-yellow-400` (Controller family colour) to signal it receives Controller/note events.

### Dropdowns / Selects
```tsx
<select className="nodrag bg-slate-800 text-[10px] text-[COLOUR] border-none outline-none rounded p-1">
```
Background always `bg-slate-800`. Text in node accent colour.

---

## Node Width Reference

Standard widths used across node types. Keep nodes compact — these are the current values:

| Node | Width |
|---|---|
| Controller / Keys | `w-72` (288px) |
| Drum | `w-80` (320px) |
| Generator | `w-60` (240px) |
| Effect / Chord / ADSR / Speaker | `w-56` (224px) |
| Tempo | `w-64` (256px) |

New signal-chain nodes should default to `w-56` unless they need more space for controls.

---

## Menu Colour Coordination

Each contextual menu's draggable pill entries should match the node colour of the items they spawn:

- **Controllers menu** (left): yellow, white, amber
- **Signals menu** (top): red, orange, fuchsia + any new signal nodes
- **Global menu** (right): indigo, emerald
- **System menu** (bottom): neutral/slate

---

## Rules for New Nodes

1. **Pick a unique colour** from the Available list above and mark it as taken here
2. **Follow the structural patterns** above — don't invent new layout conventions
3. **Update `NODE_DIMS`** in `useStore.ts` with the correct pixel dimensions
4. **Update this file** — add the new node to the In Use table and remove the colour from Available
5. **Update `AGENTS.md`** if the node represents a significant architectural addition
