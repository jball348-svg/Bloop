# Manual Intervention Points

## 1. Purpose

This document defines the places where the composer overlay must not pretend to have full control.

It exists to make the system:

- honest
- predictable
- debuggable
- collaborational rather than deceptive

A manual intervention point is any step where:

- the required Bloop behavior depends on UI-local state the overlay cannot safely assume
- the exact execution route is not guaranteed by the known action surface
- the musical plan is valid, but execution requires a human click, selection, or confirmation
- the overlay can continue only after a real-world action outside its safe control surface

The composer agent must treat these points as normal and expected, not as hidden failures.


---

## 2. Core Rule

When a task reaches a manual intervention point, the agent must:

1. stop implying full autonomous control
2. describe the blocked operation precisely
3. preserve the musical intent
4. request the smallest useful human action
5. continue from the new state if possible

The agent must not:
- invent hidden capabilities
- imply the operation already happened when it did not
- silently substitute a different musical goal without recording it


---

## 3. Manual Intervention Categories

### 3.1 UI-Selection Dependency

The intended mutation depends on a currently selected UI object that is not safely addressable through persisted state.

Examples:
- selected Pattern note
- selected Arranger scene

### 3.2 Context-Creation Dependency

The intended mutation depends on a resource that may not yet exist.

Examples:
- mixer channel target before channel creation
- subtype-specific effect target before effect subtype is chosen

### 3.3 Execution-Path Uncertainty

The overlay has a conceptual action, but no guaranteed execution path should be assumed.

Examples:
- creating a node where no trusted execution route has been confirmed
- connecting nodes where a public, stable action path is not guaranteed

### 3.4 Human Aesthetic Choice

A step is technically possible, but the useful decision is genuinely artistic and better treated as a human approval point.

Examples:
- choosing between several equally valid section moods
- selecting one of multiple timbral identities when no project preference exists


---

## 4. Known Manual Intervention Points

This section should only include points that the overlay is expected to treat as real blocking or semi-blocking conditions.

---

### 4.1 Pattern Note Selection

#### Description
Detailed Pattern note targeting depends on the currently selected note in UI-local state.

#### Why It Matters
The composer may know exactly which musical note it wants to modify, but if the runtime only exposes mutation through the currently selected note, the overlay cannot safely assume direct note addressing.

#### Typical Musical Intent Affected
- editing melody note pitch
- editing note start position
- editing note duration
- editing note velocity
- detailed motif shaping
- hook refinement

#### Risk
High

#### Agent Policy
- do not assume direct autonomous access to an arbitrary Pattern note
- use Pattern note targeting only if the required selected-note context is already known to be valid
- otherwise prefer a fallback route

#### Preferred Fallbacks
- use Step Sequencer where possible
- use Arpeggiator-based motion instead of note-by-note Pattern editing
- shift variation into rhythm, rate, timbre, or layering
- preserve intended melodic edit in overlay memory for later execution

#### Minimal Manual Action
“Select the target note in the Pattern editor so the composer can apply the planned note-level change.”

#### Resume Condition
Resume once note-selection context is explicitly available.

---

### 4.2 Arranger Scene Selection

#### Description
Detailed Arranger scene targeting depends on the currently selected scene in UI-local state.

#### Why It Matters
The composer may have a clear section/form plan, but cannot safely assume direct scene addressing if execution depends on which scene is selected in the UI.

#### Typical Musical Intent Affected
- changing section start bar
- changing section length
- refining form boundaries
- adjusting build/drop timing
- scheduling formal contrast

#### Risk
High

#### Agent Policy
- do not claim scene edits happened unless selection context is valid
- store section plan in overlay memory even when execution is blocked
- treat formal planning and formal execution as separate when necessary

#### Preferred Fallbacks
- continue composing around the intended section plan without claiming it is fully realized
- use density/timbral contrast conceptually even if scene placement is not yet updated
- postpone fine arrangement scheduling

#### Minimal Manual Action
“Select the target Arranger scene so the composer can apply the planned section timing change.”

#### Resume Condition
Resume once scene-selection context is explicitly available.

---

### 4.3 Mixer Channel-Dependent Targeting

#### Description
Some mixer-facing targets only make sense if channels already exist.

#### Why It Matters
The composer may intend to rebalance or process a specific channel, but cannot assume the target exists before the underlying channel exists.

#### Typical Musical Intent Affected
- per-layer balance
- send-like control
- channel-specific shaping
- source-specific level correction

#### Risk
Medium

#### Agent Policy
- check for channel existence before targeting
- do not address non-existent channel targets
- if channels are absent, use source-level simplification or role-based reduction instead

#### Preferred Fallbacks
- reduce density at source level
- mute or simplify competing layers
- adjust source/effect settings rather than nonexistent mixer targets

#### Minimal Manual Action
“Create or expose the relevant mixer channel, then re-run the intended channel-level adjustment.”

#### Resume Condition
Resume once channel existence is confirmed.

---

### 4.4 Node Creation Path Not Guaranteed

#### Description
The composer may conceptually want to add a node, but should not assume an execution path unless it is explicitly grounded.

#### Why It Matters
A composition plan often needs a new source, effect, or control node. If the overlay does not have a trusted route to create it, it must not imply the node now exists.

#### Typical Musical Intent Affected
- adding a bass source
- adding a reverb
- adding drums
- adding a quantizer
- creating a new support layer

#### Risk
Medium

#### Agent Policy
- treat node creation as conceptual unless the execution route is known
- prefer reuse of existing nodes before requesting new ones
- if a node is essential and cannot be safely created, request a human action

#### Preferred Fallbacks
- repurpose an existing compatible node
- simplify the arrangement
- defer optional layers

#### Minimal Manual Action
“Create a new [node type] node so the composer can continue the planned arrangement.”

#### Resume Condition
Resume once the created node is visible in session state.

---

### 4.5 Edge / Routing Creation Path Not Guaranteed

#### Description
The composer may conceptually want to connect nodes, but should not imply that a connection exists unless a trusted route is available.

#### Why It Matters
A musically valid plan may fail if the needed routing step is assumed instead of confirmed.

#### Typical Musical Intent Affected
- routing source to effect
- routing sequencer to sound source
- routing control/modulation path
- building layered signal flow

#### Risk
Medium

#### Agent Policy
- treat routing changes as real only when confirmed
- avoid building later decisions on hypothetical routing
- if routing is required and not safely executable, request the smallest manual step

#### Preferred Fallbacks
- use already connected sources
- simplify the graph
- defer non-essential effect chains

#### Minimal Manual Action
“Connect [source] to [target] using the intended compatible handles.”

#### Resume Condition
Resume once the connection is confirmed.

---

### 4.6 Generator Mode-Specific Assumptions Not Yet Confirmed

#### Description
Some target assumptions may depend on the current Generator mode.

#### Why It Matters
A timbral plan may rely on parameters that only make sense in a given mode.

#### Typical Musical Intent Affected
- brightening or darkening a synth voice
- changing unison-like or mode-specific behavior
- shaping attack character via mode-dependent controls

#### Risk
Low to Medium

#### Agent Policy
- verify mode before planning a mode-specific control move
- if mode is unknown, use broader timbral strategies first

#### Preferred Fallbacks
- use effects or density/rate changes
- use a role-level timbral substitution rather than fine parameter assumptions

#### Minimal Manual Action
“Confirm or set the Generator mode intended for this sound so the composer can apply the planned timbral adjustment.”

#### Resume Condition
Resume once mode context is known.

---

### 4.7 Effect Subtype-Specific Assumptions Not Yet Confirmed

#### Description
Some effect parameter assumptions depend on the active effect subtype.

#### Why It Matters
A spatial or timbral move may rely on reverb-like, delay-like, or other subtype-specific targets.

#### Typical Musical Intent Affected
- increasing space
- tightening depth
- introducing motion tails
- changing wetness or room-like behavior

#### Risk
Low to Medium

#### Agent Policy
- verify subtype before attempting subtype-specific mapping
- if subtype is unknown, keep the move conceptual or ask for confirmation

#### Preferred Fallbacks
- use general source simplification or textural changes
- use a different known effect already present in the patch

#### Minimal Manual Action
“Confirm or choose the intended effect subtype so the composer can apply the planned space/tone adjustment.”

#### Resume Condition
Resume once subtype context is known.

---

### 4.8 Formal Plan Exists but Execution Is Partial

#### Description
The composer may know the intended form, but not be able to fully realize it in the Arranger without UI-contextual steps.

#### Why It Matters
The session may still be musically useful, but the formal execution lags behind the formal plan.

#### Typical Musical Intent Affected
- intro/build/drop layout
- breakdown placement
- scene duration planning
- macro-structure edits

#### Risk
Medium

#### Agent Policy
- preserve the full structure plan in overlay memory
- distinguish clearly between “planned form” and “executed form”
- continue composing section material if useful

#### Preferred Fallbacks
- work section-by-section conceptually
- develop internal contrast without claiming full timeline realization

#### Minimal Manual Action
“Apply the current section plan in the Arranger by selecting and editing the relevant scenes.”

#### Resume Condition
Resume once executed form matches or sufficiently approximates planned form.

---

### 4.9 Human Preference Tie-Break

#### Description
The system has multiple musically valid options and no grounded basis to prefer one.

#### Why It Matters
Not every choice should be automated. Some are genuine taste decisions.

#### Typical Musical Intent Affected
- warm vs bright lead identity
- sparse vs medium intro density
- aggressive vs restrained build profile
- pad vs arpeggio as support layer

#### Risk
Low

#### Agent Policy
- present the real options internally or in session memory
- do not pretend one is objectively correct
- choose a default only if the playbook or existing intent strongly supports it

#### Preferred Fallbacks
- choose the simpler option
- choose the option that preserves clarity
- choose the option that needs fewer fragile actions

#### Minimal Manual Action
“Choose between the available musical directions: [option A] / [option B].”

#### Resume Condition
Resume once one direction is selected.

---

## 5. Decision Rules Around Manual Intervention

### 5.1 When to Stop Immediately
Stop immediately when:
- the next action would require pretending a blocked operation succeeded
- the next steps depend on a state change that has not actually occurred
- the blocked action is central to the musical result

### 5.2 When to Continue Despite a Block
Continue only when:
- the blocked action is optional
- the musical plan can still be developed honestly
- the blocked step is recorded as unresolved
- later work does not depend on falsely assuming completion

### 5.3 When to Substitute a Fallback
Use a fallback when:
- the original intent can be expressed musically by another route
- the substitution is close enough to the original goal
- the substitution is logged clearly

### 5.4 When to Ask for Human Choice
Ask for human choice when:
- there are multiple equally valid directions
- the difference is primarily aesthetic, not technical
- no clear prior preference exists in session memory


---

## 6. Manual Intervention Request Format

Whenever possible, requests for manual action should be minimal and specific.

Preferred structure:

### Blocked Operation
One sentence describing what the composer tried to do.

### Why It Is Blocked
One sentence describing the actual limitation.

### Minimal Human Action
One sentence describing the smallest useful action.

### What Happens After
One sentence describing how the composer will continue.

Example:

**Blocked Operation**  
Adjust the length of the build section in the Arranger.

**Why It Is Blocked**  
Scene timing control depends on the currently selected Arranger scene.

**Minimal Human Action**  
Select the build scene in the Arranger.

**What Happens After**  
The composer will apply the planned length adjustment and continue section balancing.


---

## 7. What Must Be Preserved During a Block

When a manual intervention point is reached, always preserve:

- original musical intent
- exact blocked step
- intended target object
- chosen fallback if any
- remaining next actions
- whether the block is hard or soft

Do not lose the thread of the composition just because one step is blocked.


---

## 8. Hard vs Soft Blocks

### Hard Block
The composition cannot safely proceed in the intended direction until the step is completed.

Examples:
- required scene selection before form edit
- required routing before source can be heard

### Soft Block
The ideal action is blocked, but nearby work can continue honestly.

Examples:
- desired Pattern note refinement blocked, but groove and bass can still be developed
- exact timbral choice unresolved, but section structure can still be planned

The agent must label blocks correctly.


---

## 9. Logging Rules

Every manual intervention point should be logged with:

- timestamp or step index
- block type
- severity
- target object
- blocked musical intention
- fallback used or deferred
- resume condition

This log should feed session memory rather than vanish into chat history.


---

## 10. Anti-Patterns

The composer must avoid these behaviors:

### 10.1 Silent Fake Completion
Pretending a blocked task already happened.

### 10.2 Hidden Goal Drift
Quietly changing the musical goal without recording it.

### 10.3 Excessive Escalation
Requesting large human interventions when a tiny one would do.

### 10.4 Repeated Re-Blocking
Retrying the same blocked step without changed context.

### 10.5 Manual Panic
Stopping the whole session when the blocked step is only local and soft.

Manual intervention should be precise, not dramatic.


---

## 11. Collaboration Philosophy

Manual intervention is not a breakdown of the system.

It is part of the design.

The composer overlay is intended to work with Bloop-as-instrument, which means some actions remain instrument-side, UI-side, or taste-side.

A good session is one where:
- the composer knows what it can do
- the human knows what they need to do
- the composition remains coherent across both


---

## 12. Cross References

- ./bloop_action_surface.yaml
- ./bloop_musical_mapping.yaml
- ./composer_playbook.md
- ./session_state_schema.yaml