"""Real installed Agent Synth VST3, native JSON graph/state, offline MIDI host.

No oscillator/audio generation is implemented here. DSP runs in Agent Synth.
JUCE MemoryBlock encoding follows its documented 6-bit little-endian format.
"""
from pathlib import Path
import json, struct, xml.etree.ElementTree as ET
import numpy as np
from pedalboard import load_plugin

PLUGIN = Path.home() / 'Library/Audio/Plug-Ins/VST3/Agent Synth.vst3'
ALPHABET = '.ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+'

def encode(data):
    acc = bits = 0; out = []
    for byte in data:
        acc |= byte << bits; bits += 8
        while bits >= 6:
            out.append(ALPHABET[acc & 63]); acc >>= 6; bits -= 6
    if bits: out.append(ALPHABET[acc & 63])
    return str(len(data)) + '.' + ''.join(out)

def decode(text):
    length, text = text.split('.', 1); acc = bits = 0; out = bytearray()
    for char in text:
        acc |= ALPHABET.index(char) << bits; bits += 6
        while bits >= 8:
            out.append(acc & 255); acc >>= 8; bits -= 8
    return bytes(out[:int(length)])

def graph_from_plugin(plugin):
    root = ET.fromstring(plugin.raw_state[8:-1])
    data, _ = json.JSONDecoder().raw_decode(decode(root.find('IComponent').text).decode(errors='replace'))
    return data.get('patch', data)

def load_graph(graph):
    plugin = load_plugin(str(PLUGIN))
    root = ET.fromstring(plugin.raw_state[8:-1])
    root.find('IComponent').text = encode(json.dumps(graph).encode())
    xml = ET.tostring(root, encoding='utf-8')
    plugin.raw_state = b'VC2!' + struct.pack('<I', len(xml)) + xml + b'\0'
    plugin([], duration=.03, sample_rate=48000, num_channels=2, reset=False)
    actual = graph_from_plugin(plugin)
    expected = {(n['id'], n['type']) for n in graph['nodes']}
    observed = {(n['id'], n['type']) for n in actual['nodes']}
    # Native patch import may insert its own modulation attenuverter.
    # Required authored nodes must survive; a silently retained default must fail.
    if not expected.issubset(observed):
        raise RuntimeError(f'Native graph rejected: expected {expected}, read back {observed}')
    return plugin

def midi_events(notes, bpm):
    import mido
    events = []
    for n in notes:
        pitch, beat, duration, velocity = n[:4]
        channel = n[4] if len(n) > 4 else 0
        events += [(bytes(mido.Message('note_on', note=pitch, velocity=velocity, channel=channel).bytes()), beat*60/bpm),
                   (bytes(mido.Message('note_off', note=pitch, velocity=0, channel=channel).bytes()), (beat+duration)*60/bpm)]
    return sorted(events, key=lambda x: (x[1], x[0][0] >> 4 != 8))

def render(plugin, notes, bpm, seconds):
    # One continuous processor call retains every native envelope/delay/reverb tail.
    audio = plugin(midi_events(notes, bpm), duration=seconds, sample_rate=48000,
                   num_channels=2, buffer_size=512, reset=False).T
    if not np.isfinite(audio).all() or np.max(abs(audio)) < 1e-6:
        raise RuntimeError('Native render nonfinite or silent')
    return audio
