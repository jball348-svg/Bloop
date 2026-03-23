import { CAMPAIGN_SKINS } from '@/lib/nodePalette';
import type { CampaignLevel } from '@/lib/campaignTypes';
import { hasNodeMatching, hasNodeOfType, pathExists } from '@/lib/campaignVerifier';
import type { AudioNodeType } from '@/store/useStore';

const CONTROLLER_TYPES: readonly AudioNodeType[] = ['controller', 'keys', 'midiin', 'pulse', 'stepsequencer', 'moodpad'];

export const CAMPAIGN_LEVELS: CampaignLevel[] = [
    {
        id: 'first-sound',
        title: 'First Sound',
        objective: 'Add a Generator so the canvas has something ready to sing.',
        hint: 'Generators are in the top Signals menu.',
        conditions: [hasNodeOfType('generator', 'Place at least one Generator on the canvas.')],
        reward: {
            type: 'nodeSkin',
            label: 'Aurora Skin',
            value: 'aurora',
            description: 'A cool cyan glow palette for your favourite nodes.',
            previewColor: CAMPAIGN_SKINS.aurora.color,
        },
    },
    {
        id: 'add-space',
        title: 'Add Some Space',
        objective: 'Patch a reverb after your Generator to make it bloom.',
        hint: 'Use an Effect node set to Reverb and wire audio through it.',
        conditions: [
            hasNodeOfType('generator', 'Keep a Generator in the patch.'),
            hasNodeMatching(
                'Add an Effect node set to Reverb.',
                (node) => node.type === 'effect' && node.data.subType === 'reverb'
            ),
            pathExists('generator', 'effect', 'audio', 'Route audio from a Generator into an Effect.'),
        ],
        reward: {
            type: 'preset',
            label: 'Cave Echo',
            value: 'cave-echo',
            description: 'A roomy campaign reward preset built around delay and reverb.',
        },
    },
    {
        id: 'play-it',
        title: 'Play It',
        objective: 'Connect a Keys controller into a Generator so you can play notes.',
        hint: 'Keys lives in the left Controllers menu.',
        conditions: [
            hasNodeOfType('keys', 'Place a Keys node on the canvas.'),
            pathExists('keys', 'generator', 'control', 'Connect Keys to a Generator with a control cable.'),
        ],
        reward: {
            type: 'nodeSkin',
            label: 'Neon Skin',
            value: 'neon',
            description: 'A bright electric green accent set inspired by signal flow.',
            previewColor: CAMPAIGN_SKINS.neon.color,
        },
    },
    {
        id: 'make-it-groove',
        title: 'Make It Groove',
        objective: 'Set an Arpeggiator playing into a Generator to make the patch move on its own.',
        hint: 'Press Play on the Arpeggiator once it is wired in.',
        conditions: [
            hasNodeMatching(
                'Add an Arpeggiator and start it playing.',
                (node) => node.type === 'controller' && node.data.isPlaying === true
            ),
            pathExists('controller', 'generator', 'control', 'Connect the Arpeggiator to a Generator.'),
        ],
        reward: {
            type: 'preset',
            label: 'Late Night',
            value: 'late-night',
            description: 'A darker, bassier reward preset for after-hours patches.',
        },
    },
    {
        id: 'chain-reaction',
        title: 'Chain Reaction',
        objective: 'Build a full path from controller to generator to effect to visualiser.',
        hint: 'You only need one working chain. ADSR and Chord helpers are fine in the middle.',
        conditions: [
            pathExists(CONTROLLER_TYPES, 'generator', 'control', 'Get any controller signal into a Generator.'),
            pathExists('generator', 'effect', 'audio', 'Route Generator audio into an Effect.'),
            pathExists('effect', 'visualiser', 'audio', 'Feed the Effect into a Visualiser.'),
        ],
        reward: {
            type: 'nodeSkin',
            label: 'Signal Skin',
            value: 'signal',
            description: 'A vivid rose signal skin to celebrate finishing the beginner tier.',
            previewColor: CAMPAIGN_SKINS.signal.color,
        },
    },
];
