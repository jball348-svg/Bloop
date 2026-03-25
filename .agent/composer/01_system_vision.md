# Musical Brain — System Vision

## 1. Purpose

The Musical Brain is a system designed to enable an AI agent to think, compose, perform, and refine music as a structured, iterative, and explainable process.

It is not a single model. It is a layered system composed of:

- explicit musical representations
- transformation rules
- planning and reasoning processes
- evaluation and revision mechanisms
- rendering pathways into sound

The goal is to produce music that is:

- structurally coherent
- transformable and editable
- explainable at every level
- adaptable across styles and systems
- intelligible to both humans and machines


---

## 2. Core Principles

### 2.1 Music as Structure

Music is treated as structured data, not just audio output.

All musical elements must be representable as:

- discrete entities
- relationships between entities
- transformations over time

No concept should exist only in prose.


### 2.2 Separation of Concerns

The system is divided into independent but connected layers:

1. Intent (why)
2. Composition (what)
3. Arrangement (who/where)
4. Performance (how)
5. Sound (timbre)
6. Rendering (audio)

Each layer:
- has its own schema
- can be modified independently
- can be reasoned about in isolation


### 2.3 Transformations Over Generation

Music is not only generated — it is transformed.

All meaningful musical change should be representable as:

- explicit operations
- deterministic transformations
- composable processes

Examples:
- transpose
- invert
- vary rhythm
- reharmonize
- thin texture
- increase tension


### 2.4 Intermediate Representations

The system must not jump directly from prompt → audio.

Instead, it operates through layered representations:

- intent specification
- structural plan
- motif graph
- harmonic map
- rhythmic map
- arrangement plan
- performance instructions
- render specification

Each layer is inspectable and editable.


### 2.5 Agent-Readable by Design

All core knowledge must be:

- machine-readable (YAML/JSON schemas)
- explicit (no hidden assumptions)
- validated (constraints + invariants)
- composable (small reusable units)

Natural language is secondary to structure.


### 2.6 Iteration and Revision

The system must support:

- critique of outputs
- targeted modification
- non-destructive editing
- versioned transformations

Music is treated as a process, not a one-shot result.


---

## 3. System Architecture Overview

### 3.1 Core Subsystems

The Musical Brain consists of:

#### A. Ontology Layer
Defines all musical entities and relationships.

Examples:
- note
- chord
- phrase
- section
- instrument
- gesture

#### B. Schema Layer
Formal definitions of structure.

Examples:
- time systems
- pitch systems
- rhythm systems
- form models

#### C. Transformation Layer
Operations that modify musical material.

Examples:
- inversion
- augmentation
- fragmentation
- canon generation

#### D. Planning Layer
Agent-level reasoning.

Responsible for:
- structuring compositions
- allocating roles
- managing form
- resolving constraints

#### E. Evaluation Layer
Self-critique and analysis.

Checks:
- structural coherence
- balance and contrast
- density and space
- harmonic movement
- rhythmic clarity

#### F. Rendering Layer
Bridges symbolic structure to sound.

Includes:
- performance interpretation
- sound design mapping
- audio synthesis / playback


---

## 4. Musical Representation Model

All musical content must adhere to the following properties:

### 4.1 Hierarchical

Music is nested:

- note → motif → phrase → section → composition

### 4.2 Multi-Dimensional

Each event has:

- time
- pitch
- duration
- dynamics
- articulation
- role

### 4.3 Referential

Objects reference each other:

- phrases reference motifs
- arrangements reference phrases
- instruments reference roles

### 4.4 Transformable

All structures must support:

- copying
- modification
- transformation chaining

### 4.5 Validatable

Every structure must be checkable against:

- schema rules
- domain constraints
- invariants


---

## 5. Agent Workflow

A typical composition cycle:

### Step 1 — Intent Definition
Define high-level goal.

Example:
- mood
- duration
- style constraints
- structural targets


### Step 2 — Structural Planning
Generate:

- sections
- form
- energy curve


### Step 3 — Material Generation
Create:

- motifs
- harmonic progression
- rhythmic patterns


### Step 4 — Arrangement
Assign:

- instruments
- registers
- densities


### Step 5 — Performance Mapping
Apply:

- dynamics
- articulation
- timing variation


### Step 6 — Rendering
Convert to:

- MIDI / symbolic output
- synthesis instructions
- audio output


### Step 7 — Evaluation
Analyze:

- coherence
- contrast
- balance
- novelty


### Step 8 — Revision
Apply targeted transformations.


---

## 6. Design Constraints

The system must:

- avoid implicit knowledge
- avoid monolithic generation
- avoid irreversible steps
- avoid collapsing layers prematurely

The system must support:

- partial recomposition
- localized edits
- explainable decisions
- reproducible outputs


---

## 7. Non-Goals

The Musical Brain does NOT aim to:

- directly model raw audio as its primary representation
- rely solely on end-to-end black-box models
- encode music purely as MIDI without structure
- limit itself to a single musical tradition

Audio models may be used, but they are not the core reasoning system.


---

## 8. Extensibility

The system should support:

- alternate tuning systems
- non-Western musical structures
- generative systems (fractal, stochastic, rule-based)
- live interaction and performance
- multi-agent collaboration

All extensions must integrate via existing schemas and transformation systems.


---

## 9. Guiding Philosophy

The Musical Brain is not a generator.

It is:

- a planner
- a transformer
- a performer
- a critic

It should behave less like:
"produce music"

and more like:
"develop, refine, and perform a musical idea over time"


---

## 10. Success Criteria

The system is successful if it can:

- represent any musical idea structurally
- explain what it is doing at each step
- modify music without breaking coherence
- generate variation without losing identity
- critique its own output meaningfully
- collaborate with humans or other agents
