"""Compose ten original, seamlessly looping instrumental tracks; no third-party audio."""
from pathlib import Path
import wave
import numpy as np

RATE = 22050
ROOT = Path(__file__).resolve().parents[1] / 'dist/assets/bgm'
ROOT.mkdir(parents=True, exist_ok=True)
# 32 beats, eight bars. Melodies are scale degrees, with -1 denoting a rest.
TRACKS = {
 'home': (166, 60, 'bell', [0,2,4,7,4,2,1,-1,2,4,5,9,7,5,4,-1,4,7,9,7,5,4,2,1,2,4,1,2,0,-1,0,-1]),
 'animals': (160, 65, 'wood', [0,0,2,4,2,1,0,-1,4,4,5,7,5,4,2,-1,2,4,5,4,2,0,1,2,4,2,1,2,0,-1,0,-1]),
 'piano': (156, 62, 'piano', [4,-1,2,0,1,-1,2,4,5,-1,4,2,1,2,0,-1,7,-1,5,4,2,-1,1,2,4,2,1,-1,0,-1,0,-1]),
 'balloons': (172, 67, 'bell', [0,4,7,9,7,4,2,-1,2,5,9,11,9,5,4,-1,4,7,11,9,7,5,4,2,5,4,2,1,0,-1,7,-1]),
 'vehicles': (170, 60, 'wood', [0,2,0,4,7,7,4,-1,1,2,1,5,9,9,5,-1,2,4,2,5,7,5,4,2,4,2,1,2,0,0,7,-1]),
 'drums': (176, 62, 'wood', [0,-1,4,0,2,-1,4,2,5,-1,9,5,4,2,1,-1,7,-1,4,7,5,-1,2,5,4,2,1,2,0,-1,0,-1]),
 'drawing': (158, 64, 'piano', [0,2,4,-1,7,5,4,2,1,2,5,-1,9,7,5,4,2,4,7,-1,9,7,5,4,5,4,2,1,0,-1,0,-1]),
 'peekaboo': (164, 65, 'bell', [0,-1,2,-1,4,2,0,-1,5,-1,4,-1,2,1,0,-1,7,9,7,-1,5,4,2,-1,1,-1,2,4,0,-1,0,-1]),
 'fruit': (168, 60, 'piano', [4,4,2,0,2,4,7,-1,5,5,4,2,4,5,9,-1,7,5,4,2,5,4,2,1,2,4,1,2,0,-1,0,-1]),
 'water': (160, 65, 'bell', [7,-1,4,-1,2,4,5,-1,9,-1,5,-1,4,2,1,-1,4,-1,7,-1,9,7,5,4,2,-1,1,-1,0,-1,0,-1]),
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
        if kind=='brass':
            # A bright parade lead: sustained harmonics, a little vibrato and rounded edges.
            phase=2*np.pi*frequency*t+.028*np.sin(2*np.pi*5.5*t)
            tone=(np.sin(phase)+.38*np.sin(2*phase)+.24*np.sin(3*phase)+.10*np.sin(5*phase))*np.exp(-t*1.6)
        elif kind=='bell':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*3)+.25*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*6)
        elif kind=='wood':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*5)+.16*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*10)
        elif kind=='pluck':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*6)+.26*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*9)+.12*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*12)
        elif kind=='piano':
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*2.7)+.22*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*5)+.06*np.sin(2*np.pi*frequency*3*t)*np.exp(-t*8)
        else:
            tone=np.sin(2*np.pi*frequency*t)*np.exp(-t*1.5)+.10*np.sin(2*np.pi*frequency*2*t)*np.exp(-t*3)
        envelope=np.minimum(t/.015,1)*np.minimum((duration-t)/.07,1)
        indices=(round(start*RATE)+np.arange(len(t)))%length
        np.add.at(mix,indices,tone*envelope*gain)
    # A bouncing bass/chord groove, playful eighth-note answers and soft percussion.
    # Keep the individual melodies and keys, with a distinct rhythm for each activity.
    rng=np.random.default_rng(sum(map(ord,name)))
    def percussion(start,kind,gain):
        duration=.16 if kind=='kick' else .09
        t=np.arange(round(duration*RATE))/RATE
        if kind=='kick':
            phase=2*np.pi*(55*t+65*.018*(1-np.exp(-t/.018)))
            tone=np.sin(phase)*np.exp(-t*28)
        else:
            noise=rng.normal(0,.45,len(t))
            bright=np.concatenate(([0],np.diff(noise)))
            tone=bright*np.exp(-t*(65 if kind=='hat' else 36))
            if kind=='clap':tone*=.7+.3*np.cos(2*np.pi*65*t)
        envelope=np.minimum(t/.003,1)*np.minimum((duration-t)/.015,1)
        indices=(round(start*RATE)+np.arange(len(t)))%length
        np.add.at(mix,indices,tone*envelope*gain)
    swing=.58 if name in ('animals','piano','fruit') else .5
    chords=[0,3,4,0,5,3,4,0]
    for bar, chord in enumerate(chords):
        for step in range(4):
            position=bar*4+step
            if step%2==0:
                note(position*beat,pitch(root-12,chord+(4 if step==2 else 0)),beat*.55,.15,'pluck')
                percussion(position*beat,'kick',.20 if name=='drums' else .16)
            else:
                for degree in (chord,chord+2,chord+4):
                    note(position*beat,pitch(root,degree),beat*.38,.055,'pluck')
                percussion(position*beat,'clap',.18 if name=='drums' else .12)
            percussion((position+swing)*beat,'hat',.055)
            percussion((position+.25)*beat,'hat',.028)
            note((position+swing)*beat,pitch(root-12,chord+(4 if step%2 else 0)),beat*.3,.13,'pluck')
        # Little turnarounds invite the next bar instead of a lull at the phrase ending.
        if bar%2==1:
            for i in range(3):
                note((bar*4+3+i*.25)*beat,pitch(root+12,chord+4+i%2),beat*.2,.05,'wood')
    for step, degree in enumerate(melody):
        if degree >= 0:
            # Bring the melody into a warm toy-instrument register and articulate it.
            note(step*beat,pitch(root,degree),beat*.85,.28,'brass')
            note(step*beat,pitch(root+12,degree),beat*.42,.07,instrument)
            answer=degree+(2 if name in ('balloons','drawing','water') else 0)
            note((step+swing)*beat,pitch(root,answer),beat*.4,.20,'brass')
        else:
            # Most former rests now contain a short answering note.
            previous=melody[step-1]
            if previous<0:previous=0
            note(step*beat,pitch(root,previous+2),beat*.45,.22,'brass')
            note((step+swing)*beat,pitch(root,previous),beat*.4,.18,'brass')
    # Wrapped tails make the last-to-first transition periodic rather than silent.
    mix=np.tanh(mix*2.4)
    mix*=.68/np.max(np.abs(mix))
    pcm=(mix*32767).astype('<i2')
    with wave.open(str(ROOT/f'{name}.wav'),'wb') as out:
        out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE);out.writeframes(pcm.tobytes())
    print(f'{name}: {bpm} BPM, {length/RATE:.1f}s, peak {np.max(np.abs(mix)):.3f}')
