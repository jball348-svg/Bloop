import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Midi, Note, Scale } from '@tonaljs/tonal';
import { parse as parseYaml } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PLAN_DIR = path.join(ROOT, 'data', 'ai-song');
const COMPOSER_DIR = path.join(ROOT, '.agent', 'composer');
const PATCH_DIR = path.join(ROOT, 'public', 'patches');
const SAMPLE_DIR = path.join(ROOT, 'public', 'ai-song-kit');
const SAMPLE_RATE = 44100;
const STEPS_PER_BAR = 16;
const REQUIRED_ROLES = ['bass', 'lead', 'support', 'drums'];
const MELODIC_ROLES = ['bass', 'lead', 'support'];
const BRAIN_SOURCE_FILES = [
  { id: '10_music_ontology', fileName: '10_music_ontology.yaml', kind: 'yaml' },
  { id: '11_time_schema', fileName: '11_time_schema.yaml', kind: 'yaml' },
  { id: '12_pitch_harmony_schema', fileName: '12_pitch_harmony_schema.yaml', kind: 'yaml' },
  { id: '13_rhythm_schema', fileName: '13_rhythm_schema.yaml', kind: 'yaml' },
  { id: '21_transform_ops', fileName: '21_transform_ops.yaml', kind: 'yaml' },
  { id: '30_composition_pipeline', fileName: '30_composition_pipeline.md', kind: 'markdown' }
];
const EXPECTED_ROLE_IDS = {
  bass: {
    patternNodeId: 'song-bass-pattern',
    voiceNodeId: 'song-bass-gen'
  },
  lead: {
    patternNodeId: 'song-lead-pattern',
    voiceNodeId: 'song-lead-gen'
  },
  support: {
    patternNodeId: 'song-support-pattern',
    voiceNodeId: 'song-support-sampler'
  },
  drums: {
    rhythmNodeId: 'song-drums'
  }
};
const AUTOMATION_TARGETS = {
  'song-mixer': new Set(['volume', 'pan']),
  'song-support-reverb': new Set(['wet', 'roomSize']),
  'song-support-sampler': new Set(['playbackRate', 'pitchShift', 'mix']),
  'song-bass-eq': new Set(['low', 'mid', 'high', 'lowFrequency', 'highFrequency']),
  'song-drum-eq': new Set(['low', 'mid', 'high', 'lowFrequency', 'highFrequency']),
  'song-lead-delay': new Set(['wet', 'delayTime', 'feedback'])
};

const NODE_POSITIONS = {
  'song-tempo': { x: 72, y: 52 },
  'song-bass-pattern': { x: 92, y: 138 },
  'song-bass-adsr': { x: 430, y: 154 },
  'song-bass-gen': { x: 734, y: 154 },
  'song-bass-eq': { x: 1016, y: 154 },
  'song-lead-pattern': { x: 92, y: 450 },
  'song-lead-quant': { x: 432, y: 466 },
  'song-lead-gen': { x: 734, y: 466 },
  'song-lead-delay': { x: 1016, y: 466 },
  'song-support-pattern': { x: 92, y: 762 },
  'song-support-sampler': { x: 432, y: 742 },
  'song-support-reverb': { x: 794, y: 754 },
  'song-drums': { x: 90, y: 1060 },
  'song-drum-eq': { x: 472, y: 1060 },
  'song-mixer': { x: 1344, y: 508 },
  'song-arranger': { x: 1344, y: 868 },
  'song-speaker': { x: 1638, y: 512 }
};

const DEFAULT_LABELS = {
  tempo: 'Tempo',
  pattern: 'Pattern',
  adsr: 'ADSR',
  generator: 'Oscillator',
  eq: 'EQ',
  quantizer: 'Quantizer',
  effect: 'Effect',
  sampler: 'Sampler',
  advanceddrum: 'Advanced Drums',
  mixer: 'Mixer',
  arranger: 'Arranger',
  speaker: 'Amplifier'
};

const mulberry32 = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const basenameFromSamplePath = (samplePath = '') => samplePath.split('/').pop() ?? samplePath;
const deepClone = (value) => JSON.parse(JSON.stringify(value));
const getRoleField = (roleConfig, snakeCaseField, camelCaseField) =>
  roleConfig?.[snakeCaseField] ?? roleConfig?.[camelCaseField];

const createNode = (id, type, data = {}) => ({
  id,
  type,
  position: NODE_POSITIONS[id] ?? { x: 0, y: 0 },
  data: {
    label: data.label ?? DEFAULT_LABELS[type] ?? type,
    ...data
  }
});

const controlEdge = (id, source, target) => ({
  id,
  source,
  target,
  sourceHandle: 'control-out',
  targetHandle: 'control-in',
  data: { kind: 'control' }
});

const audioEdge = (id, source, target) => ({
  id,
  source,
  target,
  sourceHandle: 'audio-out',
  targetHandle: 'audio-in',
  data: { kind: 'audio' }
});

const tupleNotesToPatternNotes = (tuples, prefix) =>
  tuples.map(([note, startStep, lengthSteps, velocity], index) => ({
    id: `${prefix}-note-${index + 1}`,
    note,
    startStep,
    lengthSteps,
    velocity
  }));

const tuplePointsToAutomationPoints = (tuples, prefix) =>
  tuples.map(([barOffset, value], index) => ({
    id: `${prefix}-point-${index + 1}`,
    barOffset,
    value
  }));

const createIssue = (severity, code, message, extra = {}) => ({
  version: 1,
  severity,
  code,
  message,
  ...extra
});

const finalizeValidationReport = (issues) => {
  const errorCount = issues.filter((issue) => issue.severity === 'error').length;
  const warningCount = issues.filter((issue) => issue.severity === 'warning').length;

  return {
    version: 1,
    issues,
    errorCount,
    warningCount,
    hasErrors: errorCount > 0
  };
};

const quantizeNoteToScale = (note, root = 'C', scaleType = 'major') => {
  const sourceMidi = Midi.toMidi(note);
  if (sourceMidi === null) {
    return note;
  }

  const scaleNotes = Scale.get(`${root} ${scaleType}`).notes;
  if (scaleNotes.length === 0) {
    return note;
  }

  const sourceOctave = Math.floor(sourceMidi / 12) - 1;
  let bestMidi = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let octave = sourceOctave - 1; octave <= sourceOctave + 1; octave += 1) {
    scaleNotes.forEach((scaleNote) => {
      const candidateMidi = Midi.toMidi(`${scaleNote}${octave}`);
      if (candidateMidi === null) {
        return;
      }

      const distance = Math.abs(candidateMidi - sourceMidi);
      if (
        distance < bestDistance ||
        (distance === bestDistance && (bestMidi === null || candidateMidi < bestMidi))
      ) {
        bestMidi = candidateMidi;
        bestDistance = distance;
      }
    });
  }

  return bestMidi === null
    ? note
    : Midi.midiToNoteName(bestMidi, { sharps: true });
};

const transposeNote = (note, interval) => {
  const midi = Midi.toMidi(note);
  if (midi === null) {
    return note;
  }
  return Midi.midiToNoteName(midi + interval, { sharps: true });
};

const getPitchChroma = (note) => Note.chroma(note);

const getScaleChromaSet = (root, scaleType) => {
  const scale = Scale.get(`${root} ${scaleType}`);
  if (scale.notes.length === 0) {
    throw new Error(`Unknown scale "${root} ${scaleType}" in musical plan.`);
  }
  return new Set(scale.notes.map((note) => Note.chroma(note)).filter((value) => value !== null));
};

const rotateArray = (values, steps) => {
  if (!Array.isArray(values) || values.length === 0) {
    return values;
  }

  const normalized = ((steps % values.length) + values.length) % values.length;
  if (normalized === 0) {
    return [...values];
  }

  return [...values.slice(-normalized), ...values.slice(0, -normalized)];
};

const summarizeNotes = (notes) =>
  Array.from(new Set(notes.map(([note]) => note))).slice(0, 8);

const summarizeDrumLayer = (layer) => ({
  label: layer.label,
  length: layer.length,
  activeSteps: layer.steps.filter((step) => step > 0).length
});

const getSectionIds = (plan) => plan.structure.sections.map((section) => section.id);

const readRequiredFile = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`Required musical-brain source file is missing: ${path.relative(ROOT, filePath)}`);
    }
    throw error;
  }
};

const extractCompositionPipelineSummary = (markdown) => {
  const highLevelStages = markdown
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^\d+\.\s+/.test(line))
    .map((line) => line.replace(/^\d+\.\s+/, ''))
    .slice(0, 9);

  const evaluationAreas = ['Structural', 'Harmonic', 'Rhythmic', 'Arrangement', 'Expressive']
    .filter((area) => markdown.includes(area));

  return {
    highLevelStages,
    evaluationAreas
  };
};

const loadBrainSchemaBundle = async () => {
  const refs = [];
  const parsed = {};

  for (const source of BRAIN_SOURCE_FILES) {
    const filePath = path.join(COMPOSER_DIR, source.fileName);
    const raw = await readRequiredFile(filePath);

    refs.push({
      id: source.id,
      fileName: source.fileName,
      path: path.relative(ROOT, filePath)
    });

    try {
      parsed[source.id] = source.kind === 'yaml'
        ? parseYaml(raw)
        : raw;
    } catch (error) {
      throw new Error(`Malformed musical-brain source file: ${source.fileName}\n${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const ontology = parsed['10_music_ontology'];
  const time = parsed['11_time_schema'];
  const pitchHarmony = parsed['12_pitch_harmony_schema'];
  const rhythm = parsed['13_rhythm_schema'];
  const transformOps = parsed['21_transform_ops'];
  const compositionPipeline = parsed['30_composition_pipeline'];

  if (!ontology?.entities || !ontology?.relationships) {
    throw new Error('Malformed musical-brain bundle: 10_music_ontology.yaml is missing entities or relationships.');
  }

  if (!time?.time_systems || !time?.tempo_system || !time?.meter_system) {
    throw new Error('Malformed musical-brain bundle: 11_time_schema.yaml is missing time_systems, tempo_system, or meter_system.');
  }

  if (!pitchHarmony?.scales || !pitchHarmony?.harmonic_function || !pitchHarmony?.voice_leading) {
    throw new Error('Malformed musical-brain bundle: 12_pitch_harmony_schema.yaml is missing scales, harmonic_function, or voice_leading.');
  }

  if (!rhythm?.rhythm_systems || !rhythm?.roles || !rhythm?.transformations) {
    throw new Error('Malformed musical-brain bundle: 13_rhythm_schema.yaml is missing rhythm_systems, roles, or transformations.');
  }

  if (!transformOps?.meta || !transformOps?.pitch || !transformOps?.time) {
    throw new Error('Malformed musical-brain bundle: 21_transform_ops.yaml is missing meta, pitch, or time sections.');
  }

  if (typeof compositionPipeline !== 'string' || !compositionPipeline.includes('Intent Definition')) {
    throw new Error('Malformed musical-brain bundle: 30_composition_pipeline.md could not be parsed into the expected composition stages.');
  }

  const operationCategories = Object.entries(transformOps)
    .filter(([key, value]) =>
      !['version', 'meta', 'constraints', 'examples', 'reversibility'].includes(key) &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    )
    .reduce((accumulator, [category, operations]) => ({
      ...accumulator,
      [category]: Object.keys(operations)
    }), {});

  const operations = Array.from(new Set(Object.values(operationCategories).flat()));

  return {
    version: 1,
    refs,
    ontology: {
      entityNames: Object.keys(ontology.entities),
      relationshipCount: ontology.relationships.length
    },
    time: {
      expressiveModels: Object.keys(time.expressive_models ?? {}),
      meterDenominators: [1, 2, 4, 8, 16],
      tempoCurves: ['constant', 'linear', 'exponential']
    },
    pitchHarmony: {
      harmonicFunctions: pitchHarmony.harmonic_function.functions ?? [],
      voiceLeadingRules: (pitchHarmony.voice_leading.rules ?? []).map((rule) => rule.name),
      scaleOperations: Object.keys(pitchHarmony.scales.operations ?? {})
    },
    rhythm: {
      roles: rhythm.roles ?? [],
      generatorNames: Object.keys(rhythm.generators ?? {}),
      transformNames: Object.keys(rhythm.transformations ?? {})
    },
    transformOps: {
      categories: transformOps.meta.categories ?? [],
      operationsByCategory: operationCategories,
      operations
    },
    compositionPipeline: extractCompositionPipelineSummary(compositionPipeline),
    raw: parsed
  };
};

const loadMusicalPlan = async (fileName) => {
  const raw = await readRequiredFile(path.join(PLAN_DIR, fileName));

  try {
    return parseYaml(raw);
  } catch (error) {
    throw new Error(`Malformed MusicalPlanV1 file: ${fileName}\n${error instanceof Error ? error.message : String(error)}`);
  }
};

const validatePlanAgainstBrain = (plan, bundle) => {
  const issues = [];
  const sectionIds = new Set(getSectionIds(plan));

  if (plan.version !== 1) {
    issues.push(createIssue('error', 'plan_version_invalid', `Musical plan "${plan.id ?? 'unknown'}" must declare version: 1.`));
  }

  if (!plan.id) {
    issues.push(createIssue('error', 'plan_id_missing', 'Musical plan is missing an id.'));
  }

  if (!plan.intent?.title || !plan.intent?.mood) {
    issues.push(createIssue('error', 'intent_incomplete', 'Musical plan intent must include title and mood.'));
  }

  if (typeof plan.intent?.bpm !== 'number' || plan.intent.bpm <= 0) {
    issues.push(createIssue('error', 'tempo_invalid', 'Musical plan intent.bpm must be a positive number.'));
  }

  if (!plan.intent?.global_key?.root || !plan.intent?.global_key?.scale_type) {
    issues.push(createIssue('error', 'global_key_missing', 'Musical plan intent.global_key must include root and scale_type.'));
  } else if (Scale.get(`${plan.intent.global_key.root} ${plan.intent.global_key.scale_type}`).notes.length === 0) {
    issues.push(createIssue('error', 'global_key_unknown', `Global key "${plan.intent.global_key.root} ${plan.intent.global_key.scale_type}" is not recognized by Tonal.`));
  }

  if (!Array.isArray(plan.intent?.energy_curve) || plan.intent.energy_curve.length === 0) {
    issues.push(createIssue('error', 'energy_curve_missing', 'Musical plan intent.energy_curve must be a non-empty array.'));
  }

  if (!Array.isArray(plan.structure?.sections) || plan.structure.sections.length === 0) {
    issues.push(createIssue('error', 'sections_missing', 'Musical plan structure.sections must contain at least one section.'));
  }

  const meter = plan.structure?.meter;
  if (!meter || meter.numerator <= 0 || !bundle.time.meterDenominators.includes(meter.denominator)) {
    issues.push(createIssue('error', 'meter_invalid', 'Musical plan structure.meter must declare a valid numerator and denominator.'));
  }

  REQUIRED_ROLES.forEach((role) => {
    if (!plan.arrangement?.roles?.[role]) {
      issues.push(createIssue('error', 'role_missing', `Musical plan arrangement.roles must include "${role}".`, { role }));
    }
  });

  if (!plan.sound_design?.bass || !plan.sound_design?.lead || !plan.sound_design?.support || !plan.sound_design?.drums) {
    issues.push(createIssue('error', 'sound_design_incomplete', 'Musical plan sound_design must include bass, lead, support, and drums.'));
  }

  Object.entries(EXPECTED_ROLE_IDS).forEach(([role, expected]) => {
    const roleConfig = plan.arrangement?.roles?.[role];
    if (!roleConfig) {
      return;
    }

    Object.entries(expected).forEach(([field, expectedValue]) => {
      const snakeCaseField = field
        .replace(/[A-Z]/g, (character) => `_${character.toLowerCase()}`);
      const actualValue = getRoleField(roleConfig, snakeCaseField, field);

      if (actualValue !== expectedValue) {
        issues.push(createIssue(
          'error',
          'role_scaffold_mismatch',
          `Role "${role}" must use fixed scaffold field "${field}" = "${expectedValue}".`,
          { role, field }
        ));
      }
    });
  });

  (plan.structure?.sections ?? []).forEach((section) => {
    if (!section.id || !section.name) {
      issues.push(createIssue('error', 'section_identity_missing', 'Every section must include id and name.', { sectionId: section.id ?? 'unknown' }));
    }

    if (typeof section.bars !== 'number' || section.bars <= 0) {
      issues.push(createIssue('error', 'section_length_invalid', `Section "${section.id}" must declare a positive bar count.`, { sectionId: section.id }));
    }

    if (section.energy < 0 || section.energy > 1 || section.density < 0 || section.density > 1) {
      issues.push(createIssue('error', 'section_profile_invalid', `Section "${section.id}" energy and density must stay within 0-1.`, { sectionId: section.id }));
    }

    if (!Array.isArray(section.active_roles) || section.active_roles.length === 0) {
      issues.push(createIssue('error', 'section_roles_missing', `Section "${section.id}" must activate at least one role.`, { sectionId: section.id }));
    }

    section.active_roles?.forEach((role) => {
      if (!REQUIRED_ROLES.includes(role)) {
        issues.push(createIssue('error', 'section_role_unknown', `Section "${section.id}" references unknown role "${role}".`, { sectionId: section.id, role }));
      }
    });

    section.automation_lanes?.forEach((lane) => {
      if (!AUTOMATION_TARGETS[lane.targetNodeId]?.has(lane.targetParam)) {
        issues.push(createIssue(
          'error',
          'automation_target_invalid',
          `Section "${section.id}" lane "${lane.id}" targets unsupported automation parameter "${lane.targetNodeId}.${lane.targetParam}".`,
          { sectionId: section.id, laneId: lane.id }
        ));
      }
    });
  });

  const harmonicCenters = plan.harmony?.section_harmonic_centers ?? {};
  Object.entries(harmonicCenters).forEach(([sectionId, functionName]) => {
    if (!sectionIds.has(sectionId)) {
      issues.push(createIssue('error', 'harmonic_center_section_unknown', `Harmony references unknown section "${sectionId}".`, { sectionId }));
    }

    if (!bundle.pitchHarmony.harmonicFunctions.includes(functionName)) {
      issues.push(createIssue(
        'error',
        'harmonic_function_unknown',
        `Section "${sectionId}" uses unsupported harmonic function "${functionName}".`,
        { sectionId }
      ));
    }
  });

  (plan.rhythm?.drum_layers ?? []).forEach((layer) => {
    if (!bundle.rhythm.roles.includes(layer.role)) {
      issues.push(createIssue('error', 'rhythm_role_unknown', `Drum layer "${layer.id}" uses unsupported rhythmic role "${layer.role}".`, { layerId: layer.id }));
    }

    if (!Array.isArray(layer.steps) || layer.steps.length === 0) {
      issues.push(createIssue('error', 'drum_layer_steps_missing', `Drum layer "${layer.id}" must include a step pattern.`, { layerId: layer.id }));
    }
  });

  const sectionCoverage = new Map((plan.structure?.sections ?? []).map((section) => [section.id, 0]));
  (plan.transforms ?? []).forEach((transform) => {
    if (!bundle.transformOps.operations.includes(transform.operation)) {
      issues.push(createIssue(
        'error',
        'transform_unknown',
        `Transform "${transform.id}" uses operation "${transform.operation}" which is not defined in 21_transform_ops.yaml.`,
        { transformId: transform.id }
      ));
    }

    (transform.applies_to_sections ?? []).forEach((sectionId) => {
      if (!sectionIds.has(sectionId)) {
        issues.push(createIssue(
          'error',
          'transform_section_unknown',
          `Transform "${transform.id}" references unknown section "${sectionId}".`,
          { transformId: transform.id, sectionId }
        ));
      } else {
        sectionCoverage.set(sectionId, (sectionCoverage.get(sectionId) ?? 0) + 1);
      }
    });
  });

  sectionCoverage.forEach((coverageCount, sectionId) => {
    if (coverageCount === 0) {
      issues.push(createIssue(
        'error',
        'section_transform_provenance_missing',
        `Section "${sectionId}" has no explicit transform provenance.`,
        { sectionId }
      ));
    }
  });

  return finalizeValidationReport(issues);
};

const applyTransformsToPlan = (plan) => {
  const groundedRoles = deepClone(plan.arrangement.roles);
  const groundedDrumLayers = deepClone(plan.rhythm.drum_layers);
  let groundedSwingRatio = plan.rhythm?.swing_policy?.ratio ?? 0;
  const transformLog = [];

  (plan.transforms ?? []).forEach((transform) => {
    const parameters = transform.parameters ?? {};

    switch (transform.operation) {
      case 'quantize_to_scale': {
        const role = groundedRoles[transform.target_role];
        if (!role?.notes) {
          throw new Error(`Transform "${transform.id}" targets unknown melodic role "${transform.target_role}".`);
        }

        const beforeNotes = deepClone(role.notes);
        const nextNotes = role.notes.map(([note, startStep, lengthSteps, velocity]) => ([
          quantizeNoteToScale(
            note,
            parameters.root ?? plan.intent.global_key.root,
            parameters.scale_type ?? plan.intent.global_key.scale_type
          ),
          startStep,
          lengthSteps,
          velocity
        ]));

        role.notes = nextNotes;
        transformLog.push({
          version: 1,
          id: transform.id,
          operation: transform.operation,
          category: transform.category,
          target_role: transform.target_role,
          applies_to_sections: transform.applies_to_sections ?? [],
          description: transform.description ?? '',
          changed_count: beforeNotes.reduce((count, [beforeNote], index) => (
            count + (beforeNote === nextNotes[index][0] ? 0 : 1)
          ), 0),
          summary_before: summarizeNotes(beforeNotes),
          summary_after: summarizeNotes(nextNotes)
        });
        break;
      }
      case 'transpose': {
        const role = groundedRoles[transform.target_role];
        if (!role?.notes) {
          throw new Error(`Transform "${transform.id}" targets unknown melodic role "${transform.target_role}".`);
        }

        const beforeNotes = deepClone(role.notes);
        role.notes = role.notes.map(([note, startStep, lengthSteps, velocity]) => ([
          transposeNote(note, parameters.interval ?? 0),
          startStep,
          lengthSteps,
          velocity
        ]));

        transformLog.push({
          version: 1,
          id: transform.id,
          operation: transform.operation,
          category: transform.category,
          target_role: transform.target_role,
          applies_to_sections: transform.applies_to_sections ?? [],
          description: transform.description ?? '',
          changed_count: role.notes.length,
          summary_before: summarizeNotes(beforeNotes),
          summary_after: summarizeNotes(role.notes)
        });
        break;
      }
      case 'octave_shift': {
        const role = groundedRoles[transform.target_role];
        if (!role?.notes) {
          throw new Error(`Transform "${transform.id}" targets unknown melodic role "${transform.target_role}".`);
        }

        const beforeNotes = deepClone(role.notes);
        role.notes = role.notes.map(([note, startStep, lengthSteps, velocity]) => ([
          transposeNote(note, (parameters.octaves ?? 0) * 12),
          startStep,
          lengthSteps,
          velocity
        ]));

        transformLog.push({
          version: 1,
          id: transform.id,
          operation: transform.operation,
          category: transform.category,
          target_role: transform.target_role,
          applies_to_sections: transform.applies_to_sections ?? [],
          description: transform.description ?? '',
          changed_count: role.notes.length,
          summary_before: summarizeNotes(beforeNotes),
          summary_after: summarizeNotes(role.notes)
        });
        break;
      }
      case 'rotate': {
        const layer = groundedDrumLayers.find((entry) => entry.id === transform.target_layer_id);
        if (!layer) {
          throw new Error(`Transform "${transform.id}" targets unknown drum layer "${transform.target_layer_id}".`);
        }

        const beforeLayer = deepClone(layer);
        layer.steps = rotateArray(layer.steps, parameters.steps ?? 0);

        transformLog.push({
          version: 1,
          id: transform.id,
          operation: transform.operation,
          category: transform.category,
          target_layer_id: transform.target_layer_id,
          applies_to_sections: transform.applies_to_sections ?? [],
          description: transform.description ?? '',
          changed_count: layer.steps.length,
          summary_before: summarizeDrumLayer(beforeLayer),
          summary_after: summarizeDrumLayer(layer)
        });
        break;
      }
      case 'apply_swing': {
        const beforeRatio = groundedSwingRatio;
        groundedSwingRatio = parameters.ratio ?? groundedSwingRatio;
        transformLog.push({
          version: 1,
          id: transform.id,
          operation: transform.operation,
          category: transform.category,
          target_role: transform.target_role,
          applies_to_sections: transform.applies_to_sections ?? [],
          description: transform.description ?? '',
          changed_count: beforeRatio === groundedSwingRatio ? 0 : 1,
          summary_before: { swingRatio: beforeRatio },
          summary_after: { swingRatio: groundedSwingRatio }
        });
        break;
      }
      default:
        throw new Error(
          `Transform "${transform.id}" uses operation "${transform.operation}" which is defined in the brain schema but not implemented in the grounded compiler.`
        );
    }
  });

  return {
    roles: groundedRoles,
    drumLayers: groundedDrumLayers,
    swingRatio: groundedSwingRatio,
    transformLog
  };
};

const deriveBlueprintFromPlan = (plan, groundedMaterial) => {
  const bassRole = groundedMaterial.roles.bass;
  const leadRole = groundedMaterial.roles.lead;
  const supportRole = groundedMaterial.roles.support;
  const drumRole = groundedMaterial.roles.drums;
  const scenes = [];
  let startBar = 0;

  for (const section of plan.structure.sections) {
    scenes.push({
      id: `song-scene-${section.id}`,
      name: section.name,
      startBar,
      lengthBars: section.bars,
      patternNodeIds: section.active_roles
        .filter((role) => ['bass', 'lead', 'support'].includes(role))
        .map((role) => EXPECTED_ROLE_IDS[role].patternNodeId),
      rhythmNodeIds: section.active_roles.includes('drums')
        ? [EXPECTED_ROLE_IDS.drums.rhythmNodeId]
        : [],
      automationLanes: (section.automation_lanes ?? []).map((lane) => ({
        id: lane.id,
        targetNodeId: lane.targetNodeId,
        targetParam: lane.targetParam,
        mode: lane.mode,
        points: lane.points
      }))
    });

    startBar += section.bars;
  }

  return {
    version: 1,
    id: plan.id,
    title: plan.intent.title,
    description: plan.description,
    scaffoldId: plan.scaffold_id,
    tempo: plan.intent.bpm,
    masterVolume: plan.sound_design.speaker?.volume ?? 70,
    patterns: {
      [EXPECTED_ROLE_IDS.bass.patternNodeId]: {
        loopBars: bassRole.loop_bars,
        notes: bassRole.notes
      },
      [EXPECTED_ROLE_IDS.lead.patternNodeId]: {
        loopBars: leadRole.loop_bars,
        notes: leadRole.notes
      },
      [EXPECTED_ROLE_IDS.support.patternNodeId]: {
        loopBars: supportRole.loop_bars,
        notes: supportRole.notes
      }
    },
    voices: {
      [EXPECTED_ROLE_IDS.bass.voiceNodeId]: plan.sound_design.bass.generator,
      [EXPECTED_ROLE_IDS.lead.voiceNodeId]: plan.sound_design.lead.generator,
      [EXPECTED_ROLE_IDS.support.voiceNodeId]: plan.sound_design.support.sampler
    },
    drums: {
      [drumRole.rhythm_node_id]: {
        mix: plan.sound_design.drums.drumNode?.mix ?? 78,
        swing: groundedMaterial.swingRatio,
        tracks: groundedMaterial.drumLayers.map((layer) => ({
          label: layer.label,
          length: layer.length,
          samplePath: layer.sample_path,
          steps: layer.steps
        }))
      }
    },
    fx: {
      'song-bass-eq': plan.sound_design.bass.eq,
      'song-lead-quant': plan.sound_design.lead.quantizer,
      'song-lead-delay': plan.sound_design.lead.delay,
      'song-support-reverb': plan.sound_design.support.reverb,
      'song-drum-eq': plan.sound_design.drums.eq,
      'song-mixer': plan.sound_design.mixer
    },
    scenes
  };
};

const validateGroundedMaterial = (plan, groundedMaterial) => {
  const issues = [];
  const allowedScale = getScaleChromaSet(plan.intent.global_key.root, plan.intent.global_key.scale_type);
  const allowedExceptions = new Set(
    (plan.harmony?.allowed_exception_pitches ?? [])
      .map((note) => getPitchChroma(note))
      .filter((value) => value !== null)
  );
  const totalBars = plan.structure.sections.reduce((sum, section) => sum + section.bars, 0);
  const meter = plan.structure.meter;
  const secondsPerBar = (60 / plan.intent.bpm) * meter.numerator * (4 / meter.denominator);
  const durationSec = totalBars * secondsPerBar;
  const durationWindow = plan.evaluation_targets?.duration_window_sec ?? [];
  const coverageCounts = REQUIRED_ROLES.reduce((accumulator, role) => ({
    ...accumulator,
    [role]: plan.structure.sections.filter((section) => section.active_roles.includes(role)).length
  }), {});
  const minimumCoverage = plan.evaluation_targets?.minimum_role_coverage ?? {};

  if (durationWindow.length === 2 && (durationSec < durationWindow[0] || durationSec > durationWindow[1])) {
    issues.push(createIssue(
      'error',
      'duration_out_of_window',
      `Generated duration ${durationSec.toFixed(2)}s falls outside the declared window ${durationWindow[0]}-${durationWindow[1]}s.`,
      { durationSec }
    ));
  }

  Object.entries(minimumCoverage).forEach(([role, minimumSections]) => {
    if ((coverageCounts[role] ?? 0) < minimumSections) {
      issues.push(createIssue(
        'error',
        'role_coverage_too_low',
        `Role "${role}" appears in ${coverageCounts[role] ?? 0} sections but must appear in at least ${minimumSections}.`,
        { role }
      ));
    }
  });

  MELODIC_ROLES.forEach((roleName) => {
    const role = groundedMaterial.roles[roleName];
    const registerLow = Midi.toMidi(role.register_range?.low);
    const registerHigh = Midi.toMidi(role.register_range?.high);

    role.notes.forEach(([note], noteIndex) => {
      const noteMidi = Midi.toMidi(note);
      const noteChroma = getPitchChroma(note);

      if (
        noteChroma !== null &&
        !allowedScale.has(noteChroma) &&
        !allowedExceptions.has(noteChroma)
      ) {
        issues.push(createIssue(
          'error',
          'note_out_of_key',
          `Role "${roleName}" contains note "${note}" outside the declared key ${plan.intent.global_key.root} ${plan.intent.global_key.scale_type}.`,
          { role: roleName, note, noteIndex }
        ));
      }

      if (
        noteMidi !== null &&
        registerLow !== null &&
        registerHigh !== null &&
        (noteMidi < registerLow || noteMidi > registerHigh)
      ) {
        issues.push(createIssue(
          'error',
          'note_out_of_register',
          `Role "${roleName}" note "${note}" falls outside the declared register ${role.register_range.low}-${role.register_range.high}.`,
          { role: roleName, note, noteIndex }
        ));
      }
    });
  });

  const contrastThreshold = plan.evaluation_targets?.section_contrast_min ?? 0;
  const sections = plan.structure.sections;
  for (let index = 1; index < sections.length; index += 1) {
    const previous = sections[index - 1];
    const current = sections[index];
    const contrast = Math.abs(current.energy - previous.energy) + Math.abs(current.density - previous.density);

    if (contrast < contrastThreshold) {
      issues.push(createIssue(
        'warning',
        'low_section_contrast',
        `Sections "${previous.id}" and "${current.id}" have low contrast (${contrast.toFixed(2)}).`,
        { previousSectionId: previous.id, sectionId: current.id }
      ));
    }
  }

  const targetDensityCurve = plan.evaluation_targets?.density_curve_target ?? [];
  if (targetDensityCurve.length === sections.length) {
    const densityError = sections.reduce((sum, section, index) => (
      sum + Math.abs(section.density - targetDensityCurve[index])
    ), 0) / sections.length;

    if (densityError > 0.12) {
      issues.push(createIssue(
        'warning',
        'weak_density_progression',
        `Density curve deviates from target by ${densityError.toFixed(2)} on average.`,
        { densityError }
      ));
    }
  }

  const automationLaneCount = sections.reduce((sum, section) => sum + (section.automation_lanes?.length ?? 0), 0);
  if (automationLaneCount < (plan.evaluation_targets?.minimum_automation_lanes ?? 0)) {
    issues.push(createIssue(
      'warning',
      'automation_richness_low',
      `Song defines ${automationLaneCount} automation lanes but the target minimum is ${plan.evaluation_targets.minimum_automation_lanes}.`,
      { automationLaneCount }
    ));
  }

  if (plan.sound_design?.lead?.quantizer?.rootNote !== plan.intent.global_key.root ||
      plan.sound_design?.lead?.quantizer?.scaleType !== plan.intent.global_key.scale_type) {
    issues.push(createIssue(
      'warning',
      'sound_design_key_mismatch',
      'Lead quantizer settings do not match the declared global key.',
      { role: 'lead' }
    ));
  }

  if (!plan.sound_design?.support?.sampler?.samplePath) {
    issues.push(createIssue(
      'warning',
      'sound_design_support_sampler_missing',
      'Support role declares a texture intent but does not define a sampler sample path.',
      { role: 'support' }
    ));
  }

  if (!plan.sound_design?.bass?.generator?.generatorMode || !plan.sound_design?.lead?.generator?.generatorMode) {
    issues.push(createIssue(
      'warning',
      'sound_design_generator_incomplete',
      'Bass or lead sound design is missing generator mode information.',
      { roles: ['bass', 'lead'] }
    ));
  }

  return {
    report: finalizeValidationReport(issues),
    summary: {
      durationSec,
      totalBars,
      coverageCounts,
      automationLaneCount
    }
  };
};

const validateBlueprintAgainstRuntime = (blueprint) => {
  const issues = [];
  const patternIds = new Set(Object.keys(blueprint.patterns ?? {}));
  const rhythmIds = new Set(Object.keys(blueprint.drums ?? {}));
  const scenes = blueprint.scenes ?? [];
  const orderedScenes = [...scenes].sort((left, right) => left.startBar - right.startBar);

  Object.entries(blueprint.patterns ?? {}).forEach(([patternId, pattern]) => {
    if (pattern.loopBars < 1 || pattern.loopBars > 16) {
      issues.push(createIssue(
        'error',
        'pattern_loop_out_of_bounds',
        `Pattern "${patternId}" uses loopBars=${pattern.loopBars}, outside Bloop's 1-16 bar authoring surface.`,
        { patternId }
      ));
    }
  });

  Object.values(blueprint.drums ?? {}).forEach((drumNode) => {
    drumNode.tracks.forEach((track) => {
      if (!track.samplePath || !track.samplePath.startsWith('/')) {
        issues.push(createIssue(
          'error',
          'drum_sample_missing',
          `Drum track "${track.label}" is missing a browser-loadable sample path.`,
          { trackLabel: track.label }
        ));
      }
    });
  });

  scenes.forEach((scene) => {
    if (scene.lengthBars < 1 || scene.lengthBars > 32) {
      issues.push(createIssue(
        'error',
        'scene_length_out_of_bounds',
        `Scene "${scene.id}" uses lengthBars=${scene.lengthBars}, outside Bloop's 1-32 bar authoring surface.`,
        { sceneId: scene.id }
      ));
    }

    if (scene.patternNodeIds.length === 0 && scene.rhythmNodeIds.length === 0) {
      issues.push(createIssue(
        'error',
        'scene_empty',
        `Scene "${scene.id}" has no pattern or rhythm content.`,
        { sceneId: scene.id }
      ));
    }

    scene.patternNodeIds.forEach((patternId) => {
      if (!patternIds.has(patternId)) {
        issues.push(createIssue(
          'error',
          'scene_pattern_missing',
          `Scene "${scene.id}" references missing pattern "${patternId}".`,
          { sceneId: scene.id, patternId }
        ));
      }
    });

    scene.rhythmNodeIds.forEach((rhythmId) => {
      if (!rhythmIds.has(rhythmId)) {
        issues.push(createIssue(
          'error',
          'scene_rhythm_missing',
          `Scene "${scene.id}" references missing rhythm node "${rhythmId}".`,
          { sceneId: scene.id, rhythmId }
        ));
      }
    });

    scene.automationLanes.forEach((lane) => {
      const supportedParams = AUTOMATION_TARGETS[lane.targetNodeId];
      if (!supportedParams || !supportedParams.has(lane.targetParam)) {
        issues.push(createIssue(
          'error',
          'scene_automation_invalid',
          `Scene "${scene.id}" lane "${lane.id}" targets unsupported parameter "${lane.targetNodeId}.${lane.targetParam}".`,
          { sceneId: scene.id, laneId: lane.id }
        ));
      }

      if (!Array.isArray(lane.points) || lane.points.length === 0) {
        issues.push(createIssue(
          'error',
          'scene_automation_empty',
          `Scene "${scene.id}" lane "${lane.id}" has no automation points.`,
          { sceneId: scene.id, laneId: lane.id }
        ));
      }
    });
  });

  for (let index = 1; index < orderedScenes.length; index += 1) {
    const previous = orderedScenes[index - 1];
    const current = orderedScenes[index];
    const previousEnd = previous.startBar + previous.lengthBars;

    if (current.startBar > previousEnd) {
      issues.push(createIssue(
        'warning',
        'scene_gap',
        `Scene "${current.id}" starts at bar ${current.startBar}, leaving a gap after "${previous.id}".`,
        { sceneId: current.id }
      ));
    } else if (current.startBar < previousEnd) {
      issues.push(createIssue(
        'warning',
        'scene_overlap',
        `Scene "${current.id}" overlaps "${previous.id}".`,
        { sceneId: current.id }
      ));
    }
  }

  return finalizeValidationReport(issues);
};

const buildEvaluationReport = (plan, theorySummary, theoryReport, bundle) => {
  const sections = plan.structure.sections;
  const bars = sections.map((section) => section.bars);
  const meanBars = bars.reduce((sum, value) => sum + value, 0) / Math.max(bars.length, 1);
  const variance = bars.reduce((sum, value) => sum + ((value - meanBars) ** 2), 0) / Math.max(bars.length, 1);
  const sectionBalanceScore = clamp(1 - Math.sqrt(variance) / Math.max(meanBars, 1), 0, 1);
  const densityTargets = plan.evaluation_targets?.density_curve_target ?? [];
  const densityCurveError = densityTargets.length === sections.length
    ? sections.reduce((sum, section, index) => sum + Math.abs(section.density - densityTargets[index]), 0) / sections.length
    : 0;
  const densityCurveFitScore = clamp(1 - densityCurveError, 0, 1);
  const arrangementCoverageScore = REQUIRED_ROLES.reduce((sum, role) => {
    const minimum = plan.evaluation_targets?.minimum_role_coverage?.[role] ?? 1;
    const actual = theorySummary.coverageCounts[role] ?? 0;
    return sum + clamp(actual / minimum, 0, 1);
  }, 0) / REQUIRED_ROLES.length;
  const automationRichnessScore = clamp(
    theorySummary.automationLaneCount / Math.max(plan.evaluation_targets?.minimum_automation_lanes ?? 1, 1),
    0,
    1
  );
  const keyConsistencyScore = clamp(
    1 - (
      theoryReport.issues.filter((issue) => issue.code === 'note_out_of_key').length /
      Math.max(
        MELODIC_ROLES.reduce((count, role) => count + plan.arrangement.roles[role].notes.length, 0),
        1
      )
    ),
    0,
    1
  );
  const roleClarityScore = clamp(
    sections.reduce((sum, section) => sum + (new Set(section.active_roles).size / REQUIRED_ROLES.length), 0) / sections.length,
    0,
    1
  );

  return {
    version: 1,
    durationSec: theorySummary.durationSec,
    totalBars: theorySummary.totalBars,
    metrics: {
      key_consistency: {
        score: Number(keyConsistencyScore.toFixed(3)),
        detail: `Tracks out-of-key material against the declared ${plan.intent.global_key.root} ${plan.intent.global_key.scale_type} plan.`
      },
      section_balance: {
        score: Number(sectionBalanceScore.toFixed(3)),
        detail: 'Measures how evenly section bar lengths distribute the overall form.'
      },
      density_curve_fit: {
        score: Number(densityCurveFitScore.toFixed(3)),
        detail: 'Compares section densities against the intent-level density curve target.'
      },
      role_clarity: {
        score: Number(roleClarityScore.toFixed(3)),
        detail: 'Estimates whether section role assignments stay legible and purposeful.'
      },
      arrangement_coverage: {
        score: Number(arrangementCoverageScore.toFixed(3)),
        detail: 'Checks required bass/lead/support/drum coverage against the plan targets.'
      },
      automation_richness: {
        score: Number(automationRichnessScore.toFixed(3)),
        detail: 'Measures scene automation density against the minimum expressive target.'
      }
    },
    composition_pipeline_alignment: {
      stages: bundle.compositionPipeline.highLevelStages
    }
  };
};

const buildGroundingReport = (plan, bundle, theoryReport, runtimeReport, evaluationReport, transformLog) => ({
  version: 1,
  plan_id: plan.id,
  title: plan.intent.title,
  validation_pass: !theoryReport.hasErrors && !runtimeReport.hasErrors,
  brain_schema_bundle: {
    version: bundle.version,
    refs: bundle.refs,
    ontology: bundle.ontology,
    time: bundle.time,
    pitch_harmony: bundle.pitchHarmony,
    rhythm: bundle.rhythm,
    transform_ops: bundle.transformOps,
    composition_pipeline: bundle.compositionPipeline
  },
  intent_snapshot: plan.intent,
  section_plan: plan.structure.sections,
  transform_log: transformLog,
  theory_validation: theoryReport,
  runtime_validation: runtimeReport,
  evaluation: evaluationReport,
  revision_notes: plan.revision_notes ?? []
});

const compileSongBlueprintToPatch = (blueprint, metadata) => {
  const bassPattern = blueprint.patterns['song-bass-pattern'];
  const leadPattern = blueprint.patterns['song-lead-pattern'];
  const supportPattern = blueprint.patterns['song-support-pattern'];
  const bassVoice = blueprint.voices['song-bass-gen'];
  const leadVoice = blueprint.voices['song-lead-gen'];
  const supportVoice = blueprint.voices['song-support-sampler'];
  const drumConfig = blueprint.drums['song-drums'];

  const nodes = [
    createNode('song-tempo', 'tempo', { bpm: blueprint.tempo }),
    createNode('song-bass-pattern', 'pattern', {
      patternLoopBars: bassPattern.loopBars,
      patternStepsPerBar: STEPS_PER_BAR,
      patternNotes: tupleNotesToPatternNotes(bassPattern.notes, 'song-bass')
    }),
    createNode('song-bass-adsr', 'adsr', {
      attack: 0.01,
      decay: 0.24,
      sustain: 0.68,
      release: 0.32
    }),
    createNode('song-bass-gen', 'generator', bassVoice),
    createNode('song-bass-eq', 'eq', blueprint.fx['song-bass-eq']),
    createNode('song-lead-pattern', 'pattern', {
      patternLoopBars: leadPattern.loopBars,
      patternStepsPerBar: STEPS_PER_BAR,
      patternNotes: tupleNotesToPatternNotes(leadPattern.notes, 'song-lead')
    }),
    createNode('song-lead-quant', 'quantizer', blueprint.fx['song-lead-quant']),
    createNode('song-lead-gen', 'generator', leadVoice),
    createNode('song-lead-delay', 'effect', blueprint.fx['song-lead-delay']),
    createNode('song-support-pattern', 'pattern', {
      patternLoopBars: supportPattern.loopBars,
      patternStepsPerBar: STEPS_PER_BAR,
      patternNotes: tupleNotesToPatternNotes(supportPattern.notes, 'song-support')
    }),
    createNode('song-support-sampler', 'sampler', {
      label: supportVoice.label,
      hasSample: true,
      sampleName: supportVoice.sampleName ?? basenameFromSamplePath(supportVoice.samplePath),
      sampleDataUrl: supportVoice.samplePath,
      sampleWaveform: [],
      loop: supportVoice.loop ?? true,
      playbackRate: supportVoice.playbackRate ?? 1,
      reverse: supportVoice.reverse ?? false,
      pitchShift: supportVoice.pitchShift ?? 0,
      mix: supportVoice.mix ?? 60
    }),
    createNode('song-support-reverb', 'effect', blueprint.fx['song-support-reverb']),
    createNode('song-drums', 'advanceddrum', {
      label: 'Advanced Drums',
      mix: drumConfig.mix ?? 78,
      swing: drumConfig.swing ?? 0,
      advancedDrumTracks: drumConfig.tracks.map((track) => ({
        label: track.label,
        steps: track.steps,
        length: track.length,
        sampleName: basenameFromSamplePath(track.samplePath),
        sampleDataUrl: track.samplePath
      }))
    }),
    createNode('song-drum-eq', 'eq', blueprint.fx['song-drum-eq']),
    createNode('song-mixer', 'mixer', blueprint.fx['song-mixer']),
    createNode('song-arranger', 'arranger', {
      arrangerScenes: blueprint.scenes.map((scene) => ({
        id: scene.id,
        name: scene.name,
        startBar: scene.startBar,
        lengthBars: scene.lengthBars,
        patternNodeIds: scene.patternNodeIds,
        rhythmNodeIds: scene.rhythmNodeIds,
        automationLanes: scene.automationLanes.map((lane) => ({
          id: lane.id,
          targetNodeId: lane.targetNodeId,
          targetParam: lane.targetParam,
          mode: lane.mode,
          points: tuplePointsToAutomationPoints(lane.points, lane.id)
        }))
      }))
    }),
    createNode('song-speaker', 'speaker', {
      volume: blueprint.masterVolume
    })
  ];

  const edges = [
    controlEdge('song-edge-bass-pattern-adsr', 'song-bass-pattern', 'song-bass-adsr'),
    controlEdge('song-edge-bass-adsr-gen', 'song-bass-adsr', 'song-bass-gen'),
    controlEdge('song-edge-lead-pattern-quant', 'song-lead-pattern', 'song-lead-quant'),
    controlEdge('song-edge-lead-quant-gen', 'song-lead-quant', 'song-lead-gen'),
    controlEdge('song-edge-support-pattern-sampler', 'song-support-pattern', 'song-support-sampler'),
    audioEdge('song-edge-bass-gen-eq', 'song-bass-gen', 'song-bass-eq'),
    audioEdge('song-edge-bass-eq-mixer', 'song-bass-eq', 'song-mixer'),
    audioEdge('song-edge-lead-gen-delay', 'song-lead-gen', 'song-lead-delay'),
    audioEdge('song-edge-lead-delay-mixer', 'song-lead-delay', 'song-mixer'),
    audioEdge('song-edge-support-sampler-reverb', 'song-support-sampler', 'song-support-reverb'),
    audioEdge('song-edge-support-reverb-mixer', 'song-support-reverb', 'song-mixer'),
    audioEdge('song-edge-drums-eq', 'song-drums', 'song-drum-eq'),
    audioEdge('song-edge-drum-eq-mixer', 'song-drum-eq', 'song-mixer')
  ];

  return {
    version: 1,
    metadata,
    nodes,
    edges,
    masterVolume: blueprint.masterVolume
  };
};

const normalizePeak = (samples, peak = 0.92) => {
  let maxAmplitude = 0;
  for (let index = 0; index < samples.length; index += 1) {
    maxAmplitude = Math.max(maxAmplitude, Math.abs(samples[index]));
  }
  if (maxAmplitude <= 0) {
    return samples;
  }
  const scale = peak / maxAmplitude;
  return samples.map((sample) => sample * scale);
};

const writeMonoWav = async (targetPath, samples, sampleRate = SAMPLE_RATE) => {
  const normalized = normalizePeak(samples);
  const bytesPerSample = 2;
  const dataSize = normalized.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  normalized.forEach((sample, index) => {
    const clamped = clamp(sample, -1, 1);
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + index * 2);
  });

  await fs.writeFile(targetPath, buffer);
};

const generateKick = () => {
  const duration = 0.46;
  const samples = [];
  let phase = 0;
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const freq = 140 * Math.exp(-8 * t) + 36;
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    const body = Math.sin(phase) * Math.exp(-10 * t);
    const click = Math.sin(2 * Math.PI * 1800 * t) * Math.exp(-80 * t) * 0.12;
    samples.push(body + click);
  }
  return samples;
};

const generateSnare = (random) => {
  const duration = 0.22;
  const samples = [];
  let phase = 0;
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    phase += (2 * Math.PI * 180) / SAMPLE_RATE;
    const tone = Math.sin(phase) * Math.exp(-28 * t) * 0.24;
    const noise = (random() * 2 - 1) * Math.exp(-18 * t) * (0.9 - 0.3 * t);
    samples.push(tone + noise);
  }
  return samples;
};

const generateHat = (random) => {
  const duration = 0.1;
  const samples = [];
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const metallic = Math.sin(2 * Math.PI * 6000 * t) * 0.18 + Math.sin(2 * Math.PI * 8400 * t) * 0.12;
    const noise = (random() * 2 - 1) * Math.exp(-42 * t) * 0.75;
    samples.push((metallic + noise) * Math.exp(-26 * t));
  }
  return samples;
};

const generateClap = (random) => {
  const duration = 0.24;
  const bursts = [0, 0.03, 0.055];
  const samples = [];
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    let value = 0;
    bursts.forEach((burstTime, index) => {
      const dt = t - burstTime;
      if (dt >= 0) {
        value += (random() * 2 - 1) * Math.exp(-(20 + index * 4) * dt) * 0.5;
      }
    });
    samples.push(value);
  }
  return samples;
};

const generateSupportTexture = () => {
  const duration = 6;
  const notes = [261.63, 311.13, 392];
  const samples = [];
  const phases = notes.map(() => 0);
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    const pad = notes.reduce((sum, freq, index) => {
      phases[index] += (2 * Math.PI * freq) / SAMPLE_RATE;
      const shimmer = Math.sin(phases[index] * 2.01) * 0.15;
      return sum + Math.sin(phases[index]) * 0.18 + shimmer;
    }, 0);
    const swell = Math.sin(2 * Math.PI * 0.07 * t) * 0.2 + 0.8;
    const fadeIn = clamp(t / 1.2, 0, 1);
    const fadeOut = clamp((duration - t) / 1.6, 0, 1);
    samples.push(pad * swell * fadeIn * fadeOut * 0.7);
  }
  return samples;
};

const generateHookChime = () => {
  const duration = 1.6;
  const base = 523.25;
  const samples = [];
  let phaseA = 0;
  let phaseB = 0;
  let phaseC = 0;
  for (let i = 0; i < duration * SAMPLE_RATE; i += 1) {
    const t = i / SAMPLE_RATE;
    phaseA += (2 * Math.PI * base) / SAMPLE_RATE;
    phaseB += (2 * Math.PI * base * 2) / SAMPLE_RATE;
    phaseC += (2 * Math.PI * base * 3.01) / SAMPLE_RATE;
    const env = Math.exp(-3.4 * t);
    samples.push((Math.sin(phaseA) * 0.6 + Math.sin(phaseB) * 0.28 + Math.sin(phaseC) * 0.12) * env);
  }
  return samples;
};

const generateSampleKit = async () => {
  const random = mulberry32(1729);
  await fs.mkdir(SAMPLE_DIR, { recursive: true });

  const rendered = [
    ['kick.wav', generateKick()],
    ['snare.wav', generateSnare(random)],
    ['hat.wav', generateHat(random)],
    ['clap.wav', generateClap(random)],
    ['support-texture.wav', generateSupportTexture()],
    ['hook-chime.wav', generateHookChime()]
  ];

  await Promise.all(
    rendered.map(([fileName, samples]) => writeMonoWav(path.join(SAMPLE_DIR, fileName), samples))
  );
};

const buildPatchMetadata = (plan, bundle, theoryReport, runtimeReport, authoringMode) => {
  const errorCount = theoryReport.errorCount + runtimeReport.errorCount;
  const warningCount = theoryReport.warningCount + runtimeReport.warningCount;
  const validationPass = errorCount === 0;
  const globalKey = `${plan.intent.global_key.root} ${plan.intent.global_key.scale_type}`;

  return {
    title: plan.intent.title,
    description: plan.description,
    scaffoldId: plan.scaffold_id,
    blueprintId: plan.id,
    authoringMode,
    generatedAt: new Date().toISOString(),
    planId: plan.id,
    globalKey,
    brainRefs: bundle.refs.map((ref) => ref.id),
    validationPass,
    errorCount,
    warningCount,
    groundedSong: {
      version: 1,
      plan_id: plan.id,
      global_key: globalKey,
      brain_refs: bundle.refs.map((ref) => ref.id),
      validation_pass: validationPass,
      error_count: errorCount,
      warning_count: warningCount
    }
  };
};

const compilePlanFile = async (bundle, planFileName) => {
  const plan = await loadMusicalPlan(planFileName);
  const theoryStructureReport = validatePlanAgainstBrain(plan, bundle);
  let groundedMaterial = null;
  let transformLog = [];
  let blueprint = null;
  let theoryMaterialReport = finalizeValidationReport([]);
  let theorySummary = {
    durationSec: 0,
    totalBars: 0,
    coverageCounts: {},
    automationLaneCount: 0
  };
  let runtimeReport = finalizeValidationReport([]);

  if (!theoryStructureReport.hasErrors) {
    groundedMaterial = applyTransformsToPlan(plan);
    transformLog = groundedMaterial.transformLog;
    blueprint = deriveBlueprintFromPlan(plan, groundedMaterial);
    const materialValidation = validateGroundedMaterial(plan, groundedMaterial);
    theoryMaterialReport = materialValidation.report;
    theorySummary = materialValidation.summary;

    if (!theoryMaterialReport.hasErrors) {
      runtimeReport = validateBlueprintAgainstRuntime(blueprint);
    }
  }

  const combinedTheoryReport = finalizeValidationReport([
    ...theoryStructureReport.issues,
    ...theoryMaterialReport.issues
  ]);

  const evaluationReport = buildEvaluationReport(plan, theorySummary, combinedTheoryReport, bundle);
  const report = buildGroundingReport(
    plan,
    bundle,
    combinedTheoryReport,
    runtimeReport,
    evaluationReport,
    transformLog
  );

  await fs.writeFile(
    path.join(PLAN_DIR, plan.output.report_file),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8'
  );

  if (combinedTheoryReport.hasErrors || runtimeReport.hasErrors || !blueprint) {
    return {
      plan,
      success: false,
      report
    };
  }

  await fs.writeFile(
    path.join(PLAN_DIR, plan.output.blueprint_file),
    `${JSON.stringify(blueprint, null, 2)}\n`,
    'utf8'
  );

  const patchMetadata = buildPatchMetadata(
    plan,
    bundle,
    combinedTheoryReport,
    runtimeReport,
    plan.id === 'ai-song-scaffold' ? 'scaffold' : 'compiled'
  );

  const patch = compileSongBlueprintToPatch(blueprint, patchMetadata);

  await fs.writeFile(
    path.join(PATCH_DIR, plan.output.patch_file),
    `${JSON.stringify(patch, null, 2)}\n`,
    'utf8'
  );

  return {
    plan,
    success: true,
    report
  };
};

const main = async () => {
  const bundle = await loadBrainSchemaBundle();
  const planFiles = (await fs.readdir(PLAN_DIR))
    .filter((fileName) => fileName.endsWith('.plan.yaml'))
    .sort();

  if (planFiles.length === 0) {
    throw new Error('No MusicalPlanV1 source files were found in data/ai-song.');
  }

  await fs.mkdir(PATCH_DIR, { recursive: true });
  await generateSampleKit();

  const results = [];
  for (const planFileName of planFiles) {
    results.push(await compilePlanFile(bundle, planFileName));
  }

  const failed = results.filter((result) => !result.success);
  if (failed.length > 0) {
    const summary = failed
      .map((result) => {
        const theoryErrors = result.report.theory_validation.issues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => `- [theory] ${issue.code}: ${issue.message}`);
        const runtimeErrors = result.report.runtime_validation.issues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => `- [runtime] ${issue.code}: ${issue.message}`);
        return [`Plan ${result.plan.id} failed grounding validation:`, ...theoryErrors, ...runtimeErrors].join('\n');
      })
      .join('\n\n');

    throw new Error(summary);
  }

  console.log('Compiled grounded AI song assets, generated blueprints, and grounding reports.');
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
