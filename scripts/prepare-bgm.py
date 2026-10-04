"""Compose ten original, seamlessly looping instrumental tracks; no third-party audio."""
from pathlib import Path
import wave
import numpy as np

RATE = 22050
ROOT = Path(__file__).resolve().parents[1] / 'dist/assets/bgm'
ROOT.mkdir(parents=True, exist_ok=True)
# 32 beats, eight bars. Melodies are scale degrees, with -1 denoting a rest.
TRACKS = {
 'home': (92, 60, 'bell', [0,2,4,7,4,2,1,-1,2,4,5,9,7,5,4,-1,4,7,9,7,5,4,2,1,2,4,1,2,0,-1,0,-1]),
 'animals': (88, 65, 'wood', [0,0,2,4,2,1,0,-1,4,4,5,7,5,4,2,-1,2,4,5,4,2,0,1,2,4,2,1,2,0,-1,0,-1]),
 'piano': (76, 62, 'piano', [4,-1,2,0,1,-1,2,4,5,-1,4,2,1,2,0,-1,7,-1,5,4,2,-1,1,2,4,2,1,-1,0,-1,0,-1]),
 'balloons': (104, 67, 'bell', [0,4,7,9,7,4,2,-1,2,5,9,11,9,5,4,-1,4,7,11,9,7,5,4,2,5,4,2,1,0,-1,7,-1]),
 'vehicles': (108, 60, 'wood', [0,2,0,4,7,7,4,-1,1,2,1,5,9,9,5,-1,2,4,2,5,7,5,4,2,4,2,1,2,0,0,7,-1]),
 'drums': (112, 62, 'wood', [0,-1,4,0,2,-1,4,2,5,-1,9,5,4,2,1,-1,7,-1,4,7,5,-1,2,5,4,2,1,2,0,-1,0,-1]),
 'drawing': (82, 64, 'piano', [0,2,4,-1,7,5,4,2,1,2,5,-1,9,7,5,4,2,4,7,-1,9,7,5,4,5,4,2,1,0,-1,0,-1]),
 'peekaboo': (96, 65, 'bell', [0,-1,2,-1,4,2,0,-1,5,-1,4,-1,2,1,0,-1,7,9,7,-1,5,4,2,-1,1,-1,2,4,0,-1,0,-1]),
 'fruit': (100, 60, 'piano', [4,4,2,0,2,4,7,-1,5,5,4,2,4,5,9,-1,7,5,4,2,5,4,2,1,2,4,1,2,0,-1,0,-1]),
 'water': (68, 65, 'soft', [7,-1,4,-1,2,4,5,-1,9,-1,5,-1,4,2,1,-1,4,-1,7,-1,9,7,5,4,2,-1,1,-1,0,-1,0,-1]),
}
SCALE = [0,2,4,5,7,9,11]
def pitch(root, degree):
    return 440 * 2 ** ((root + SCALE[degree % 7] + 12*(degree//7) - 69)/12)

for name, (bpm, root, instrument, melody) in TRACKS.items():
    beat = 60/bpm
    length = round(32*beat*RATE)
    mix = np.zeros(length, dtype=np.float64)
    def note(start, frequency, duration, gain, kind):
        t=np.arange(round(duration*RATE))/RATE
        if kind=='bell':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*3)+.25*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*6)
        elif kind=='wood':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*5)+.16*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*10)
        elif kind=='piano':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*2.7)+.22*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*5)+.06*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*8)
        else:
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*1.5)+.10*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*3)
        envelope=np.minimum(t/.015,1)*np.minimum((duration-t)/.07,1)
        indices=(round(start*RATE)+np.arange(len(t)))%length
        np.add.at(mix,indices,tone*envelope*gain)
    # Warm bass and a quiet broken-chord bed; each game has its own melody and tempo.
    chords=[0,3,4,0,5,3,4,0]
    for bar, chord in enumerate(chords):
        note(bar*4*beat,pitch(root-24,chord),beat*2.6,.11,'soft')
        for step, degree in enumerate([chord,chord+2,chord+4,chord+2]):
            note((bar*4+step)*beat,pitch(root-12,degree),beat*.85,.075,'soft')
    for step, degree in enumerate(melody):
        if degree >= 0:
            note(step*beat,pitch(root+12,degree),beat*1.35,.24,instrument)
    if name in ('vehicles','drums'):
        for step in range(32):
            note(step*beat,95 if step%2==0 else 180,.13,.055,'wood')
    # Wrapped tails make the last-to-first transition periodic rather than silent.
    mix=np.tanh(mix*1.4)*.7
    pcm=(mix*32767).astype('<i2')
    with wave.open(str(ROOT/f'{name}.wav'),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE);out.writeframes(pcm.tobytes())
    print(f'{name}: {length/RATE:.1f}s, peak {np.max(np.abs(mix)):.3f}')
