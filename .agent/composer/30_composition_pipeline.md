# Composition Pipeline

## 1. Purpose

This pipeline defines how an AI agent composes, evaluates, and refines music using the system's schemas and transformation operations.

It is designed to be:

- iterative (not one-shot)
- explainable (every step inspectable)
- modular (each stage separable)
- revisable (non-destructive changes)
- goal-driven (guided by intent)

The pipeline operates over structured representations, not raw audio.


---

## 2. High-Level Flow

1. Intent Definition
2. Structural Planning
3. Material Generation
4. Harmonic & Rhythmic Development
5. Arrangement
6. Performance Mapping
7. Rendering
8. Evaluation
9. Revision Loop

This is not strictly linear — the system may loop back at any stage.


---

## 3. Core Concepts

### 3.1 Intent

Intent defines *why* the piece exists.

Fields may include:
- mood
- energy curve
- duration
- tempo range
- stylistic constraints
- reference patterns
- structural expectations

Example:

```yaml
intent:
  mood: "tense, evolving"
  duration: 90
  tempo: [110, 125]
  structure: ["intro", "build", "drop", "outro"]
  density_curve: "low_to_high"

Intent guides all downstream decisions.

3.2 Plan vs Material

The system separates:

Plan → abstract structure (sections, energy, roles)
Material → actual musical content (notes, chords, rhythms)

This allows structural changes without regenerating everything.

4. Pipeline Stages
4.1 Intent Definition

Input:

user prompt OR system goal

Output:

structured intent object

Responsibilities:

extract constraints
define targets
set evaluation criteria
4.2 Structural Planning

Generate:

sections (intro, verse, etc.)
section durations
energy curve
density curve
transition points

Output:

structure_plan:
  sections:
    - name: intro
      bars: 8
      energy: 0.2
    - name: build
      bars: 16
      energy: 0.6
    - name: drop
      bars: 16
      energy: 0.9

This stage defines shape without content.

4.3 Material Generation

Generate core musical material:

motifs
chord progressions
rhythm patterns

Guided by:

intent
section roles
transformation strategies

Output:

motif library
harmonic map
rhythm map
4.4 Harmonic & Rhythmic Development

Apply transformations:

sequence motifs
reharmonize progressions
evolve rhythms
introduce variation

Use transformation chains:

development_chain:
  - sequence
  - invert
  - augment

Goal:

avoid repetition without variation
maintain identity across sections
4.5 Arrangement

Assign material to voices/instruments:

role allocation (bass, lead, etc.)
register placement
density control
layering

Example:

arrangement:
  voices:
    - role: bass
      register: low
    - role: lead
      register: mid_high

Goal:

clarity
balance
contrast
4.6 Performance Mapping

Apply expressive interpretation:

dynamics
articulation
timing deviation
phrasing

This transforms:

mechanical structure → musical expression

Example:

performance:
  humanization: 0.2
  dynamics_curve: crescendo
4.7 Rendering

Convert to output format:

MIDI
symbolic score
synthesis instructions
audio

This stage is external to reasoning.

4.8 Evaluation

Analyze output using defined metrics:

Structural
section balance
phrase completeness
Harmonic
tension curve alignment
resolution timing
Rhythmic
density vs intent
syncopation balance
Arrangement
frequency overlap
role clarity
Expressive
variation
phrasing quality

Output:

evaluation:
  issues:
    - type: low_contrast
      section: build
    - type: overcrowding
      region: bars_12_16
4.9 Revision Loop

Apply targeted transformations:

thin texture
increase tension
vary motif
simplify rhythm

Loop until:

constraints satisfied
evaluation thresholds met
5. Decision-Making Strategy

At each stage, the agent should:

Query current state
Compare against intent
Select transformation or generation strategy
Apply change
Validate result

This is a closed feedback loop, not a pipeline pass.

6. Local vs Global Reasoning
Local
note-level changes
motif variation
timing adjustments
Global
section contrast
energy curve
harmonic direction

The system must balance both.

7. Non-Destructive Editing

All operations should:

preserve previous versions
be reversible where possible
track transformation history

Example:

history:
  - op: transpose
  - op: reharmonize
8. Failure Modes

Common issues:

over-generation (too dense)
lack of variation
harmonic stagnation
rhythmic monotony
structural drift

The evaluation stage must detect these.

9. Iteration Model

The system should operate like:

Draft
Evaluate
Modify
Re-evaluate
Refine

Not:

generate once → output
10. Multi-Agent Extension

The pipeline can support multiple agents:

composer (structure + material)
arranger (orchestration)
performer (expression)
critic (evaluation)

Agents communicate via shared schema.

11. Success Criteria

A successful pipeline:

produces coherent structure
maintains identity across variation
balances repetition and novelty
aligns output with intent
supports iterative refinement