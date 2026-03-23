'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Handle, Position } from 'reactflow';
import * as Tone from 'tone';
import {
    CONTROL_OUTPUT_HANDLE_ID,
    getAdjacencyGlowClasses,
    isControlEdge,
    useStore,
} from '@/store/useStore';
import { useNodeAccentStyle } from '@/store/usePreferencesStore';
import LockButton from './LockButton';
import PackedNode from './PackedNode';

type MidiInputDevice = {
    id: string;
    name: string;
};

export default function MidiInNode({ id }: { id: string }) {
    const fireNoteOn = useStore((state) => state.fireNoteOn);
    const fireNoteOff = useStore((state) => state.fireNoteOff);
    const updateNodeData = useStore((state) => state.updateNodeData);
    const removeNodeAndCleanUp = useStore((state) => state.removeNodeAndCleanUp);
    const nodeData = useStore((state) => state.nodes.find((node) => node.id === id)?.data);
    const isAdjacent = useStore((state) => state.adjacentNodeIds.has(id));
    const isUnconnected = useStore((state) => {
        const edges = state.edges;
        return !edges.some((edge) => isControlEdge(edge) && (edge.source === id || edge.target === id));
    });

    const accessRef = useRef<MIDIAccess | null>(null);
    const activeInputRef = useRef<MIDIInput | null>(null);
    const [devices, setDevices] = useState<MidiInputDevice[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const selectedDeviceId = nodeData?.midiDeviceId ?? '';
    const selectedDeviceName = nodeData?.midiDeviceName ?? '';
    const midiSupported = nodeData?.midiSupported ?? true;
    const accentStyle = useNodeAccentStyle('midiin');

    const refreshDevices = useMemo(
        () => () => {
            const access = accessRef.current;
            if (!access) {
                setDevices([]);
                return;
            }

            const nextDevices = Array.from(access.inputs.values()).map((input) => ({
                id: input.id,
                name: input.name || 'Unnamed MIDI Device',
            }));
            setDevices(nextDevices);

            if (selectedDeviceId && !nextDevices.some((device) => device.id === selectedDeviceId)) {
                updateNodeData(id, {
                    midiDeviceId: '',
                    midiDeviceName: '',
                });
            } else if (!selectedDeviceId && nextDevices.length === 1) {
                updateNodeData(id, {
                    midiDeviceId: nextDevices[0]?.id ?? '',
                    midiDeviceName: nextDevices[0]?.name ?? '',
                });
            }
        },
        [id, selectedDeviceId, updateNodeData]
    );

    useEffect(() => {
        let isCancelled = false;

        const loadMidiAccess = async () => {
            if (typeof navigator === 'undefined' || typeof navigator.requestMIDIAccess !== 'function') {
                updateNodeData(id, { midiSupported: false });
                setIsLoading(false);
                return;
            }

            try {
                const access = await navigator.requestMIDIAccess();
                if (isCancelled) {
                    return;
                }

                accessRef.current = access;
                updateNodeData(id, { midiSupported: true });
                refreshDevices();
                access.onstatechange = () => refreshDevices();
            } catch (error) {
                console.error('Failed to access MIDI devices', error);
                updateNodeData(id, { midiSupported: false });
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        void loadMidiAccess();

        return () => {
            isCancelled = true;
            if (accessRef.current) {
                accessRef.current.onstatechange = null;
            }
        };
    }, [id, refreshDevices, updateNodeData]);

    useEffect(() => {
        const access = accessRef.current;
        if (!access) {
            return;
        }

        if (activeInputRef.current) {
            activeInputRef.current.onmidimessage = null;
            activeInputRef.current = null;
        }

        if (!selectedDeviceId) {
            return;
        }

        const selectedInput = access.inputs.get(selectedDeviceId);
        if (!selectedInput) {
            return;
        }

        activeInputRef.current = selectedInput;
        selectedInput.onmidimessage = (event) => {
            const data = event.data ?? new Uint8Array();
            const status = data[0] ?? 0;
            const noteNumber = data[1] ?? 0;
            const velocityValue = data[2] ?? 0;
            const command = status & 0xf0;
            const note = Tone.Frequency(noteNumber, 'midi').toNote();

            if (command === 0x90 && velocityValue > 0) {
                fireNoteOn(id, note, velocityValue / 127);
                return;
            }

            if (command === 0x80 || (command === 0x90 && velocityValue === 0)) {
                fireNoteOff(id, note);
            }
        };

        return () => {
            selectedInput.onmidimessage = null;
        };
    }, [fireNoteOff, fireNoteOn, id, selectedDeviceId]);

    if (nodeData?.isPackedVisible) {
        return <PackedNode id={id} />;
    }

    return (
        <div
            data-node-accent
            style={accentStyle}
            className={`themed-node bg-slate-800 border-2 border-neutral-300 rounded-2xl p-3 shadow-2xl text-white w-64 flex flex-col transition-all hover:shadow-neutral-300/20 group relative select-none${
                isAdjacent ? getAdjacencyGlowClasses('midiin') : ''
            }`}
        >
            <div className="relative z-10 flex flex-1 flex-col">
                <div className="flex justify-between items-center mb-3">
                    <button
                        className="nodrag relative flex-shrink-0 mr-1.5 w-3.5 h-3.5 rounded-full bg-slate-800/90 border border-slate-600/50 text-slate-400 hover:bg-neutral-300 hover:text-slate-950 hover:border-neutral-200 flex items-center justify-center text-[8px] z-20 transition-all hover:scale-110 backdrop-blur-sm"
                        style={{ boxShadow: '0 0 6px rgba(212, 212, 212, 0.3)' }}
                        onClick={(event) => {
                            event.stopPropagation();
                            removeNodeAndCleanUp(id);
                        }}
                    >
                        ×
                    </button>
                    <div className="flex-1 text-center text-[10px] font-black uppercase tracking-[0.2em] text-neutral-200">
                        MIDI IN
                    </div>
                    <LockButton id={id} isAdjacent={isAdjacent} accentColor="neutral-300" />
                </div>

                <div className="flex flex-col gap-3">
                    <div className="rounded-xl border border-neutral-300/20 bg-slate-900/40 px-3 py-2">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-200">
                            {midiSupported ? 'Hardware Control' : 'Unavailable'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                            {isLoading
                                ? 'Scanning for MIDI devices...'
                                : !midiSupported
                                    ? 'MIDI is not available in this browser. Use Chrome or Edge.'
                                    : devices.length === 0
                                        ? 'No MIDI inputs detected yet.'
                                        : selectedDeviceName
                                            ? `Listening to ${selectedDeviceName}.`
                                            : 'Select a MIDI input to start playing.'}
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                            Device
                        </label>
                        <select
                            value={selectedDeviceId}
                            disabled={!midiSupported || devices.length === 0}
                            onChange={(event) => {
                                const nextDevice = devices.find((device) => device.id === event.target.value);
                                updateNodeData(id, {
                                    midiDeviceId: event.target.value,
                                    midiDeviceName: nextDevice?.name ?? '',
                                });
                            }}
                            className="nodrag rounded-lg border border-neutral-300/20 bg-slate-900/60 px-2 py-2 text-[11px] font-bold text-neutral-100 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="" className="bg-slate-900 text-neutral-200">
                                {devices.length === 0 ? 'No devices' : 'Choose device'}
                            </option>
                            {devices.map((device) => (
                                <option key={device.id} value={device.id} className="bg-slate-900 text-neutral-100">
                                    {device.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedDeviceName && (
                        <div className="flex items-center justify-between rounded-xl border border-neutral-300/15 bg-slate-900/40 px-3 py-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                Status
                            </span>
                            <span className="rounded-full bg-neutral-300 px-2 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-slate-950">
                                Listening
                            </span>
                        </div>
                    )}
                </div>

                {isUnconnected && (
                    <div className="mt-3 flex items-center gap-1.5 opacity-40 text-neutral-200">
                        <div className="flex-1 h-px bg-current" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">not connected</span>
                        <div className="flex-1 h-px bg-current" />
                    </div>
                )}
            </div>

            {(!nodeData?.isLocked || nodeData?.isExit) && (
                <Handle
                    type="source"
                    id={CONTROL_OUTPUT_HANDLE_ID}
                    position={Position.Right}
                    className="w-4 h-4 border-4 border-slate-900 !-right-2 hover:scale-125 transition-all bg-neutral-300"
                />
            )}
        </div>
    );
}
