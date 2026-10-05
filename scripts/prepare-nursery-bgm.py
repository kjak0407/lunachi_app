"""Render our own upbeat instrumental arrangements of ten historic melodies.

No commercial recordings or modern arrangements are sampled. Degrees are 1-based
in a major scale; :n is a duration in quarter-note beats. Japanese lyrics are not
included. Two complete melody passes, a short cadence, then the playlist advances.
"""
from pathlib import Path
import wave
import numpy as np

RATE = 22050
OUT = Path(__file__).resolve().parents[1] / 'dist/assets/bgm'
SONGS = {
    'twinkle': ('きらきら星', 168, 60,
        '1 1 5 5 6 6 5:2 4 4 3 3 2 2 1:2 '
        '5 5 4 4 3 3 2:2 5 5 4 4 3 3 2:2 '
        '1 1 5 5 6 6 5:2 4 4 3 3 2 2 1:2'),
    'mary': ('メリーさんのひつじ', 172, 62,
        '3 2 1 2 3 3 3:2 2 2 2:2 3 5 5:2 '
        '3 2 1 2 3 3 3 3 2 2 3 2 1:4'),
    'butterfly': ('ちょうちょう', 170, 65,
        '5 3 3:2 4 2 2:2 1 2 3 4 5 5 5:2 '
        '5 3 3:2 4 2 2:2 1 3 5 5 3:4 '
        '2 2 2 2 2 3 4:2 3 3 3 3 3 4 5:2 '
        '5 3 3:2 4 2 2:2 1 3 5 5 1:4'),
    'bees': ('ぶんぶんぶん', 176, 60,
        '5 4 3:2 2 3 4 2 1:4 '
        '3 4 5 3 4 5 4 3 2 3 4 2 '
        '5 4 3:2 2 3 4 2 1:4'),
    'london': ('ロンドン橋', 174, 67,
        '5:1.5 6:0.5 5 4 3 4 5:2 2 3 4:2 3 4 5:2 '
        '5:1.5 6:0.5 5 4 3 4 5:2 2:2 5:2 3 1:3'),
    'yankee': ('アルプス一万尺', 176, 60,
        '1 1 2 3 1 3 2 -:1 1 1 2 3 1:2 7,1:2 '
        '1 1 2 3 4 3 2 1 7,1 5,1 6,1 7,1 1:4 '
        '6,1:1.5 7,1:0.5 6,1 5,1 6,1 7,1 1:2 5,1 6,1 5,1 4,1 3,1:4 '
        '6,1:1.5 7,1:0.5 6,1 5,1 6,1 7,1 1 6,1 5,1 1 7,1 2 1:4'),
    'jacques': ('グーチョキパーでなにつくろう', 168, 62,
        '1 2 3 1 1 2 3 1 3 4 5:2 3 4 5:2 '
        '5:0.5 6:0.5 5:0.5 4:0.5 3 1 5:0.5 6:0.5 5:0.5 4:0.5 3 1 '
        '1 5,1 1:2 1 5,1 1:2'),
    'row': ('こげこげボート', 160, 65,
        '1:1.5 1:1.5 1 2:0.5 3:1.5 3 2:0.5 3 4:0.5 5:3 '
        '8:0.5 8:0.5 8:0.5 5:0.5 5:0.5 5:0.5 3:0.5 3:0.5 3:0.5 1:0.5 1:0.5 1:0.5 '
        '5:1.5 4 3:0.5 2 1:0.5 1:3'),
    'joy': ('よろこびのうた', 170, 60,
        '3 3 4 5 5 4 3 2 1 1 2 3 3:1.5 2:0.5 2:2 '
        '3 3 4 5 5 4 3 2 1 1 2 3 2:1.5 1:0.5 1:2 '
        '2 2 3 1 2 3:0.5 4:0.5 3 1 2 3:0.5 4:0.5 3 2 1 2 5,1:2 '
        '3 3 4 5 5 4 3 2 1 1 2 3 2:1.5 1:0.5 1:2'),
    'jingle': ('ジングルベル', 176, 67,
        '3 3 3:2 3 3 3:2 3 5 1:1.5 2:0.5 3:4 '
        '4 4 4:1.5 4:0.5 4 3 3 3:0.5 3:0.5 3 2 2 3 2:2 5:2 '
        '3 3 3:2 3 3 3:2 3 5 1:1.5 2:0.5 3:4 '
        '4 4 4:1.5 4:0.5 4 3 3 3:0.5 3:0.5 5 5 4 2 1:4'),
}
SCALE = [0, 2, 4, 5, 7, 9, 11]

def parse(score):
    notes = []
    for item in score.split():
        degree, _, duration = item.partition(':')
        if degree == '-': midi = None
        else:
            value, _, lower = degree.partition(',')
            n = int(value) - 1
            midi = SCALE[n % 7] + 12 * (n // 7) - (12 if lower else 0)
        notes.append((midi, float(duration or 1)))
    return notes

for name, (title, bpm, root, score) in SONGS.items():
    beat = 60 / bpm
    notes = parse(score)
    phrase_beats = sum(d for _, d in notes)
    total_beats = phrase_beats * 2 + 4
    mix = np.zeros(round((total_beats * beat + .45) * RATE))
    rng = np.random.default_rng(sum(map(ord, name)))
    def add(start, sound):
        index = round(start * RATE)
        size = min(len(sound), len(mix) - index)
        if size > 0: mix[index:index + size] += sound[:size]
    def note(start, midi, duration, gain, kind='lead'):
        t = np.arange(round(duration * RATE)) / RATE
        phase = 2 * np.pi * 440 * 2 ** ((midi - 69) / 12) * t
        if kind == 'lead':
            sound = (np.sin(phase) + .28 * np.sin(2 * phase) + .12 * np.sin(3 * phase)) * np.exp(-t * 1.5)
        elif kind == 'bell':
            sound = (np.sin(phase) + .22 * np.sin(2 * phase)) * np.exp(-t * 6)
        else:
            sound = (np.sin(phase) + .2 * np.sin(2 * phase)) * np.exp(-t * 5)
        envelope = np.minimum(t / .008, 1) * np.clip((duration - t) / .04, 0, 1)
        add(start, sound * envelope * gain)
    def drum(start, kind, gain):
        t = np.arange(round(.18 * RATE)) / RATE
        if kind == 'kick': sound = np.sin(2 * np.pi * (52 * t + 65 * .02 * (1 - np.exp(-t / .02)))) * np.exp(-t * 28)
        else:
            noise = rng.normal(0, .35, len(t))
            sound = np.diff(noise, prepend=0) * np.exp(-t * (65 if kind == 'hat' else 35))
        add(start, sound * np.minimum(t / .002, 1) * gain)
    # Keep the original melody rhythm; the second pass adds a sparkling octave.
    timeline = []
    for repeat in range(2):
        position = repeat * phrase_beats
        for semitone, duration in notes:
            timeline.append((position, semitone, duration))
            if semitone is not None:
                note(position * beat, root + semitone, duration * beat * .88, .31)
                note(position * beat, root + semitone + 12, min(duration * beat, .3), .075 if repeat else .04, 'bell')
            position += duration
    # Match each accompaniment bar to the melody, with a tonic closing cadence.
    for bar in range(int(np.ceil(total_beats / 4))):
        position = bar * 4
        sounding = [n % 12 for p, n, d in timeline if n is not None and p < position + 4 and p + d > position]
        chords = [(0, [0, 4, 7]), (5, [5, 9, 0]), (7, [7, 11, 2])]
        bass, chord = max(chords, key=lambda c: sum(n in c[1] for n in sounding)) if sounding else chords[0]
        for step in range(4):
            p = position + step
            if p >= total_beats: break
            note(p * beat, root - 12 + (bass if step % 2 == 0 else (bass + 7) % 12), beat * .55, .16, 'pluck')
            if step % 2:
                for degree in chord: note(p * beat, root + degree, beat * .35, .055, 'pluck')
            drum(p * beat, 'kick' if step % 2 == 0 else 'clap', .18)
            drum((p + .5) * beat, 'hat', .065)
    for degree in [0, 4, 7, 12]: note(phrase_beats * 2 * beat, root + degree, beat * 2, .08, 'bell')
    mix = np.tanh(mix * 1.9)
    mix *= .72 / np.max(np.abs(mix))
    fade = min(round(.12 * RATE), len(mix))
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(str(OUT / f'nursery-{name}.wav'), 'wb') as out:
        out.setnchannels(1); out.setsampwidth(2); out.setframerate(RATE)
        out.writeframes((mix * 32767).astype('<i2').tobytes())
    print(f'{title}: {bpm} BPM, {len(mix) / RATE:.1f}s')
