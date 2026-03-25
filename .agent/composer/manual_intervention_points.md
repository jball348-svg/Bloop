# Manual Intervention Points

## 1. Purpose

This document defines the places where the composer overlay must stop pretending it has full control.

It exists to keep the system:

- honest
- predictable
- debuggable
- collaborative rather than deceptive

Manual intervention is reserved for real human-only or browser/device-only steps.

Not every contextual condition is manual.

The composer must first check whether a direct store-backed route or another supported fallback already exists.


---

## 2. Core Rule

When a task appears blocked, the composer must follow this order:

1. check for a direct persisted-ID or store-backed route
2. check whether the needed context already exists
3. use a supported fallback if it preserves the musical goal
4. request the smallest real human action only if no safe autonomous route remains
5. resume from the new confirmed state

The composer must not:

- invent hidden capabilities
- escalate a merely contextual condition into a manual block without checking direct routes first
- imply a manual step already happened when it did not
- silently replace the musical goal without recording the substitution


---

## 3. Conditions That Are Contextual But Not Manual By Default

These situations may affect target availability or planning, but they are not automatic reasons to ask a human for help.

### 3.1 Node Creation And Explicit Routing

- node creation has a direct shipped path through `addNode(...)`
- explicit audio, control, and modulation routing have direct shipped paths through `onConnect(...)`
- explicit edge removal has a direct shipped path through `onEdgesChange(...)`

Do not treat supported node creation or supported explicit routing as manual by default.

### 3.2 Generator Modes And Effect Subtypes

- generator mode and effect subtype are real runtime state
- they can change which math targets are available
- target availability is contextual, but the existence of the node and its mode/subtype is not inherently manual

Inspect or mutate runtime state first before escalating.

### 3.3 Step Sequencer Step Targeting

- `selectedStep` is persisted in node data
- contextual math targets use that persisted selector
- direct step mutation also exists by explicit step index through `updateSequencerStep(...)`

Do not treat Step Sequencer step targeting as a UI-only manual dependency.

### 3.4 Mixer Channel Availability

- mixer channel targets only appear after routed sources create channels
- this is a graph-state precondition, not a default human-only step
- direct channel mutation exists once a channel is present

Check routing and current channel state before escalating.

### 3.5 Pattern And Arranger Direct Refs

- Pattern notes can be mutated directly by persisted note ID through `upsertPatternNote(...)`
- Arranger scenes can be mutated directly by persisted scene ID through `upsertArrangerScene(...)`

Do not ask for note or scene selection if the needed persisted IDs are already known.


---

## 4. Known Manual Intervention Points

This section only includes intervention points that are genuinely manual or external.

### 4.1 Pattern Selected-Note Math Route

#### Description

Selected-note Pattern math targeting depends on `selectedNoteId`, which is local component state rather than persisted Bloop state.

#### Why It Matters

If the composer intentionally wants to use the contextual Pattern math route, it cannot safely assume which note is selected unless that selection has already been confirmed in the UI.

#### When It Is Actually Manual

Only treat this as manual when all of the following are true:

- the intended move specifically depends on selected-note math targeting
- persisted note IDs are not available for direct mutation
- no acceptable fallback preserves the musical goal closely enough

#### Agent Policy

- prefer direct note-ID mutation first
- use selected-note math only when the relevant selection is already confirmed
- otherwise record a block and request the smallest useful selection action

#### Preferred Fallbacks

- direct `upsertPatternNote(...)` by note ID
- Step Sequencer editing by step index
- Arpeggiator or density/timbre variation instead of note-by-note micro-editing

#### Minimal Manual Action

“Select the target Pattern note so the composer can apply the planned math-targeted note change.”

#### Resume Condition

Resume once the intended note selection is explicitly available, or once a direct note ID is known.

### 4.2 Arranger Selected-Scene Math Route

#### Description

Selected-scene Arranger math targeting depends on `selectedSceneId`, which is local component state rather than persisted Bloop state.

#### Why It Matters

If the composer intentionally wants to use the contextual Arranger math route, it cannot safely assume which scene is selected unless that selection has already been confirmed in the UI.

#### When It Is Actually Manual

Only treat this as manual when all of the following are true:

- the intended move specifically depends on selected-scene math targeting
- persisted scene IDs are not available for direct mutation
- no supported fallback is close enough to the formal intent

#### Agent Policy

- prefer direct scene-ID mutation first
- use selected-scene math only when the relevant selection is already confirmed
- otherwise preserve the section plan in overlay memory and request the smallest useful selection action

#### Preferred Fallbacks

- direct `upsertArrangerScene(...)` by scene ID
- partial realization of form through already-known scenes
- density, exposure, or timbral contrast while formal timing changes remain pending

#### Minimal Manual Action

“Select the target Arranger scene so the composer can apply the planned math-targeted scene change.”

#### Resume Condition

Resume once the intended scene selection is explicitly available, or once a direct scene ID is known.

### 4.3 External Asset Or Device Provision

#### Description

Some plans depend on assets or device access that require browser or operating-system interaction outside the overlay's control.

#### Real Examples In The Repo

- loading a Sampler file through file input and `FileReader`
- loading Advanced Drum custom samples through file input and `FileReader`
- enabling Audio In through browser microphone permission
- choosing a MIDI device through browser MIDI access

#### Why It Matters

The composer cannot truthfully claim a sample exists, a microphone is active, or a MIDI device is selected unless runtime state confirms it.

#### Agent Policy

- do not claim external assets or live devices are ready until node state confirms they are
- keep the musical role in overlay memory while waiting for the asset or device
- continue with other supported work if the blocked source is optional

#### Minimal Manual Action

“Load the sample file, grant the requested device permission, or choose the intended input device.”

#### Resume Condition

Resume once node state confirms the sample is loaded, the input is active, or the MIDI device is selected.

### 4.4 Human Preference Tie-Break

#### Description

The system has multiple musically valid options and no grounded reason to prefer one.

#### Why It Matters

Not every choice should be automated. Some are genuine taste decisions.

#### Typical Musical Intent Affected

- warm vs bright lead identity
- sparse vs medium intro density
- aggressive vs restrained build profile
- pad vs arpeggio as support layer

#### Agent Policy

- present the real choice clearly
- prefer the simpler or clearer option only when no meaningful preference is available
- do not pretend one option is objectively correct when it is not

#### Minimal Manual Action

“Choose between the available musical directions: [option A] / [option B].”

#### Resume Condition

Resume once one direction is selected.


---

## 5. Decision Rules Around Manual Intervention

### 5.1 When To Stop Immediately

Stop immediately when:

- the next step would require pretending a blocked operation succeeded
- the next step depends on a human-only selection, asset, permission, or taste decision that has not happened
- no safe direct or fallback route remains

### 5.2 When To Continue Despite A Block

Continue when:

- the blocked action is local rather than central
- the musical plan can still progress honestly
- the unresolved dependency is logged explicitly
- later work does not depend on falsely assuming completion

### 5.3 When To Substitute A Fallback

Use a fallback when:

- the original intent can be expressed musically by another supported route
- the fallback stays close to the original goal
- the substitution is recorded in session memory

### 5.4 When To Ask For Human Choice

Ask for human choice when:

- several musically valid options remain
- the difference is mainly aesthetic rather than technical
- session memory does not already imply a preference


---

## 6. Manual Intervention Request Format

Whenever possible, requests for manual action should be minimal and specific.

Preferred structure:

### Blocked Operation

One sentence describing what the composer tried to do.

### Why It Is Blocked

One sentence describing the real limitation.

### Minimal Human Action

One sentence describing the smallest useful action.

### What Happens After

One sentence describing how the composer will continue.

Example:

**Blocked Operation**  
Apply a selected-scene math change to the build section in the Arranger.

**Why It Is Blocked**  
That route depends on the currently selected Arranger scene, which is local UI state.

**Minimal Human Action**  
Select the intended build scene in the Arranger.

**What Happens After**  
The composer will apply the planned scene-level change and continue balancing the section arc.


---

## 7. What Must Be Preserved During A Block

When a manual intervention point is reached, always preserve:

- original musical intent
- exact blocked step
- intended target object
- whether a direct route was checked first
- chosen fallback if any
- remaining next actions
- whether the block is hard or soft

Do not lose the composition thread because one step needs a human action.


---

## 8. Hard vs Soft Blocks

### Hard Block

The intended direction cannot safely continue until the manual step is completed.

Examples:

- a required selected-note math edit with no usable note ID
- a required sample-based hook before any equivalent source exists

### Soft Block

The ideal move is blocked, but nearby work can continue honestly.

Examples:

- a desired selected-scene math edit is pending, but material for the section can still be developed
- a MIDI device is not yet chosen, but the patch can still be arranged around existing internal sources

The composer must label blocks correctly.


---

## 9. Logging Rules

Every manual intervention point should be logged with:

- timestamp or step index
- block type
- severity
- target object
- blocked musical intention
- whether a direct route was unavailable or insufficient
- fallback used or deferred
- resume condition

This log should live in session memory rather than vanish into chat history.


---

## 10. Anti-Patterns

The composer must avoid these behaviors:

### 10.1 Silent Fake Completion

Pretending a blocked task already happened.

### 10.2 False Manual Escalation

Requesting a human step even though a direct persisted-ID or store-backed route exists.

### 10.3 Hidden Goal Drift

Quietly changing the musical goal without recording it.

### 10.4 Unsupported-Route Reframing

Treating unsupported ideas like shipped math-send authoring or live tempo-edge routing as if they were merely waiting for a human click.

### 10.5 Repeated Re-Blocking

Retrying the same blocked step without changed context.

### 10.6 Manual Panic

Stopping the whole session when the block is only local and soft.

Manual intervention should be precise, not dramatic.


---

## 11. Collaboration Philosophy

Manual intervention is not a breakdown of the system.

It is part of the design boundary between:

- musical planning in the overlay
- confirmed execution in Bloop
- genuinely human artistic or browser/device actions

A good session is one where:

- the composer knows what it can do directly
- the composer knows what is merely contextual
- the human only intervenes where intervention is actually needed
- the composition remains coherent across both


---

## 12. Cross References

- ./bloop_action_surface.yaml
- ./bloop_musical_mapping.yaml
- ./composer_playbook.md
- ./session_state_schema.yaml
