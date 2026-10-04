"""Prepare locally downloaded, licensed recordings for the toddler app."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools/audio'))
import numpy as np
import soundfile as sf

root = Path(__file__).resolve().parents[1]
destination = root / 'dist/assets/audio'
destination.mkdir(parents=True, exist_ok=True)
for animal in ['dog', 'cat', 'cow', 'chick', 'pig', 'sheep']:
    source = next((root / '.tools/audio-source').glob(animal + '.*'))
    data, rate = sf.read(source, always_2d=True)
    data = data.mean(axis=1)
    data -= data.mean()
    # Keep natural timbre; remove only rumble below 65 Hz.
    spectrum = np.fft.rfft(data)
    spectrum[np.fft.rfftfreq(len(data), 1 / rate) < 65] = 0
    data = np.fft.irfft(spectrum, n=len(data))
    if animal in ['sheep', 'chick']:
        length = int((2.1 if animal == 'sheep' else 1.8) * rate)
        # Select a short active passage. For chicks, prefer the chirp band
        # over low-frequency handling noise when choosing the excerpt.
        selector = data
        if animal == 'chick':
            spectrum = np.fft.rfft(data)
            spectrum[np.fft.rfftfreq(len(data), 1 / rate) < 1600] = 0
            selector = np.fft.irfft(spectrum, n=len(data))
        energy = np.concatenate([[0], np.cumsum(selector ** 2)])
        choices = np.arange(0, len(data) - length, int(rate * .05))
        start = int(choices[np.argmax(energy[choices + length] - energy[choices])])
        print(animal, 'excerpt starts', round(start / rate, 2))
        data = data[start:start + length]
    # Remove quiet lead-in/trailing time using 10 ms energy windows.
    window = max(1, int(rate * .01))
    bins = np.array([np.sqrt(np.mean(data[i:i + window] ** 2)) for i in range(0, len(data), window)])
    active = np.flatnonzero(bins > max(bins.max() * .12, .001))
    if len(active):
        start = max(0, (active[0] - 2) * window)
        end = min(len(data), (active[-1] + 3) * window)
        data = data[start:end]
    # Brief edge fades prevent clicks without blurring the call.
    edge = min(int(rate * .008), len(data) // 4)
    data[:edge] *= np.linspace(0, 1, edge)
    data[-edge:] *= np.linspace(1, 0, edge)
    if animal == 'pig':
        data = np.concatenate([data, np.zeros(int(rate * .18)), data])
    rms = np.sqrt(np.mean(data ** 2))
    target = .12 if animal == 'chick' else .18
    data *= min(target / max(rms, 1e-8), .88 / max(np.abs(data).max(), 1e-8))
    sf.write(destination / (animal + '.wav'), data, rate, subtype='PCM_16')
    print(animal, f'{len(data)/rate:.2f}s', f'rms={np.sqrt(np.mean(data**2)):.3f}', f'peak={np.abs(data).max():.3f}')
