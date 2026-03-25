# Codex Execution Plans (ExecPlans) — Bloop

This document defines the requirements for an ExecPlan: a design document that Codex follows to deliver a working feature or system change in the Bloop repository. Read this file in full before authoring or executing any plan.

Reference path from repo root: `.agent/PLANS.md`

## What is an ExecPlan and why does Bloop use them?

Bloop's roadmap spans several versions (v1–v17) and dozens of interconnected features across a real-time audio engine, a React Flow canvas, and a Zustand state store. A single ExecPlan is a living specification that allows Codex to work autonomously for hours on a complex milestone — writing the plan first, then implementing milestone by milestone, updating the plan as discoveries are made, so that any interruption can be resumed from only the plan file.

Every plan in `.agent/plans/` covers one roadmap version. Each version contains multiple GitHub issues (the tickets). The plan must be self-contained: a Codex agent starting fresh from only the plan file and the repo working tree must be able to complete the work end to end.

## How to use ExecPlans

When **authoring** a plan, follow this document to the letter. Read the GitHub issues, AGENTS.md, STYLE_GUIDE.md, and relevant source files thoroughly before writing. Start from the skeleton below and flesh it out as you research.

When **implementing** a plan, do not prompt the user for next steps — proceed to the next milestone automatically. Keep all sections up to date. Add or check off entries in the Progress section at every stopping point. Resolve ambiguities autonomously and commit frequently using the commit convention in AGENTS.md.

When **resuming** an interrupted plan, read the entire plan file before touching any code. The Progress and Decision Log sections tell you exactly where work stopped and why.

## Non-Negotiable Requirements

Every ExecPlan must be fully self-contained. It must contain all knowledge needed for a novice to succeed without reading anything except the plan and the repo source files it references. It must define every non-obvious term. It must produce demonstrably working behaviour — not merely compilable code. It must be a living document: update it as work progresses, decisions are made, and surprises occur.

## Bloop-Specific Context for All Plans

Every plan operates within these constraints, which come from AGENTS.md and must not be violated:

All Tone.js audio node instances live in Maps inside `store/useStore.ts`. Components are purely UI. Never instantiate Tone.js objects inside React components (the only exception is VisualiserNode's display-only analysers). Always call `.dispose()` when removing audio nodes. Always call `rebuildAudioGraph()` after any edge or node change. Always use `rampTo(value, 0.1)` for parameter changes — never set values directly. Always call `saveSnapshot()` before mutating canvas state. New node types must be registered in: `AudioNodeType` union, `nodeTypes` map in `app/page.tsx`, `SIGNAL_ORDER`, `VALID_AUTO_WIRE_PAIRS`, and `NODE_DIMS` in `store/useStore.ts`. Read STYLE_GUIDE.md before assigning any colour to a new node.

Dev commands:
- `npm run dev` — start dev server at http://localhost:3000
- `npm run build` — production build, must pass before closing any ticket
- `npm run lint` — ESLint, must pass before closing any ticket

## Formatting

Each ExecPlan is a single Markdown file. Do not use triple-backtick code fences inside the plan (they would close the outer fence if this were embedded). Present commands and code as indented blocks. Write in plain prose. Use headings and ordered lists for structure. Checklists are mandatory only in the Progress section.

## Required Sections

Every plan must contain and maintain these sections: **Progress**, **Surprises & Discoveries**, **Decision Log**, **Outcomes & Retrospective**. These are living sections — update them as work proceeds.

## Milestones

Each milestone must be independently verifiable. Introduce each with a prose paragraph: scope, what will exist at the end, commands to run, acceptance criteria. Milestones tell the story; Progress tracks the granular steps. Both must exist.

---

## Skeleton of a Good ExecPlan

# [Short, action-oriented title]

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. This document must be maintained in accordance with `.agent/PLANS.md`.

## Purpose / Big Picture

Explain in plain prose what a user gains after this change and how they can see it working. State the specific user-visible behaviour that will be enabled.

## Progress

- [ ] (date) Milestone 1 description
- [ ] (date) Milestone 2 description

## Surprises & Discoveries

- Observation: ...
  Evidence: ...

## Decision Log

- Decision: ...
  Rationale: ...
  Date: ...

## Outcomes & Retrospective

[Written at completion of major milestones or the full plan.]

## Context and Orientation

Describe the current state of the repo relevant to this task, as if the reader knows nothing. Name every key file by full repo-relative path. Define any non-obvious term. State which GitHub issues this plan implements.

## Plan of Work

Describe the sequence of changes in prose. For each change, name the exact file and the function or location to edit. Keep it concrete.

## Concrete Steps

State exact commands to run, with working directory and expected output. Update this section as work proceeds.

## Validation and Acceptance

Describe how to verify the work. State specific inputs and expected outputs. Include test commands and expected results.

## Idempotence and Recovery

State which steps are safe to repeat. Provide retry or rollback paths for risky steps.

## Interfaces and Dependencies

Name every library, file, function, and type that this plan introduces or depends on. Be prescriptive about signatures.
