"""Create short vehicle effects from CC0 BigSoundBank recordings (see credits)."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools/audio'))
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
rate = 44100

def excerpt(name, seconds, target=.18):
    data, original_rate = sf.read(root / '.tools/audio-source' / (name + '.mp3'), always_2d=True)
    data = data.mean(axis=1)
    data = np.interp(np.arange(round(len(data) * rate / original_rate)) * original_rate / rate, np.arange(len(data)), data)
    length = min(round(seconds * rate), len(data))
    energy = np.concatenate([[0], np.cumsum(data ** 2)])
    choices = np.arange(0, len(data) - length + 1, round(rate * .05))
    start = int(choices[np.argmax(energy[choices + length] - energy[choices])])
    data = data[start:start + length].copy()
    data -= data.mean()
    data *= min(target / max(np.sqrt(np.mean(data ** 2)), 1e-8), .8 / max(abs(data).max(), 1e-8))
    edge = round(rate * .035)
    data[:edge] *= np.linspace(0, 1, edge)
    data[-edge:] *= np.linspace(1, 0, edge)
    print(name, 'excerpt', round(start / rate, 2))
    return data

car = excerpt('car-source', 2.6)
train = excerpt('train-rails', 2.8, .12)
train[:round(1.3 * rate)] += excerpt('train-whistle', 1.3, .16)
boat = excerpt('boat-water', 2.8, .07)
boat[:round(2.2 * rate)] += excerpt('boat-horn', 2.2, .18)
for name, data in [('car', car), ('train', train), ('boat', boat)]:
    data *= min(1, .85 / max(abs(data).max(), 1e-8))
    sf.write(root / 'dist/assets/audio' / (name + '.wav'), data, rate, subtype='PCM_16')
    print(name, len(data) / rate, 'peak', round(abs(data).max(), 3))

for name in ['airplane', 'bus', 'helicopter']:
    data = excerpt(name + '-source', 2.8)
    data = np.pad(data, (0, max(0, round(2.8 * rate) - len(data))))
    sf.write(root / 'dist/assets/audio' / (name + '.wav'), data, rate, subtype='PCM_16')

# Original sirens: alternating ambulance tones, rising police wail,
# and a slower fire engine wail with a bell. Never replay an endless alarm.
t = np.arange(round(rate * 2.8)) / rate
for name in ['ambulance', 'police', 'firetruck']:
    if name == 'ambulance':
        frequency = np.where((t % .8) < .4, 960, 770)
    else:
        cycle = 1.35 if name == 'police' else 2.1
        frequency = 470 + 440 * (.5 - .5 * np.cos(2 * np.pi * t / cycle))
    phase = 2 * np.pi * np.cumsum(frequency) / rate
    data = .18 * (np.sin(phase) + .18 * np.sin(3 * phase))
    if name == 'firetruck':
        for start in [.12, .72, 1.32, 1.92]:
            u = np.maximum(0, t - start)
            data += .06 * np.sin(2 * np.pi * 1800 * u) * np.exp(-u * 12) * (t >= start)
    edge = round(rate * .04)
    data[:edge] *= np.linspace(0, 1, edge)
    data[-edge:] *= np.linspace(1, 0, edge)
    sf.write(root / 'dist/assets/audio' / (name + '.wav'), data, rate, subtype='PCM_16')
