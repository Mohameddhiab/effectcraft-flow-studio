#!/usr/bin/env python3
"""Original sound-effect pack generator (CC0). Every sound is synthesised from oscillators and
seeded noise: nothing is sampled or copied. Run: python3 gen.py OUTDIR"""
import json, os, sys, wave, zlib
import numpy as np
from scipy import signal

SR = 44100

def rng_for(name):
    return np.random.default_rng(zlib.crc32(name.encode()) & 0xFFFFFFFF)

def tt(dur): return np.arange(int(dur * SR)) / SR
def noise(dur, r): return r.uniform(-1, 1, int(dur * SR))
def sine(f):
    f = np.asarray(f, dtype=float)
    return np.sin(np.cumsum(2 * np.pi * f / SR)) if f.ndim else None
def osc(f, n):
    f = np.full(n, f, dtype=float) if np.isscalar(f) else np.asarray(f, dtype=float)
    return np.sin(np.cumsum(2 * np.pi * f / SR))
def expsweep(f0, f1, n): return f0 * (f1 / f0) ** np.linspace(0, 1, n)
def linsweep(f0, f1, n): return np.linspace(f0, f1, n)
def decay(n, k): return np.exp(-np.arange(n) / SR * k)
def swell(n, peak=0.5):
    p = np.linspace(0, 1, n)
    return np.where(p < peak, p / max(peak, 1e-6), (1 - p) / max(1 - peak, 1e-6)) ** 1.3
def rise(n, power=2.0): return np.linspace(0, 1, n) ** power

def filt(x, kind, cut, order=2):
    nyq = SR / 2
    cut = np.clip(cut, 20, nyq * 0.95)
    if kind == "bp":
        lo, hi = cut
        sos = signal.butter(order, [max(20, lo) / nyq, min(hi, nyq * 0.95) / nyq], "band", output="sos")
    else:
        sos = signal.butter(order, cut / nyq, kind, output="sos")
    return signal.sosfilt(sos, x)

def sweep(x, f0, f1, kind="low", chunk=441, order=2):
    n = len(x); out = np.zeros(n); zi = None
    nb = (n + chunk - 1) // chunk
    freqs = expsweep(f0, f1, nb)
    for i in range(nb):
        a, b = i * chunk, min(n, (i + 1) * chunk)
        nyq = SR / 2
        sos = signal.butter(order, np.clip(freqs[i], 20, nyq * 0.95) / nyq, kind, output="sos")
        if zi is None: zi = np.zeros((sos.shape[0], 2))
        out[a:b], zi = signal.sosfilt(sos, x[a:b], zi=zi)
    return out

def bell(f, dur, k=4.0, partials=((1, 1), (2.76, .5), (5.4, .25), (8.93, .12))):
    t = tt(dur); y = np.zeros_like(t)
    for m, a in partials: y += a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * k * (1 + m * .3))
    return y

def pluck(f, dur, k=6.0):
    t = tt(dur)
    return (np.sin(2 * np.pi * f * t) + .4 * np.sin(4 * np.pi * f * t) + .2 * np.sin(6 * np.pi * f * t)) * np.exp(-t * k)

def square(f, n, duty=.5):
    ph = (np.cumsum(np.full(n, f) / SR) if np.isscalar(f) else np.cumsum(f / SR)) % 1
    return np.where(ph < duty, 1.0, -1.0)

def saw(f, n):
    ph = (np.cumsum(np.full(n, f) / SR) if np.isscalar(f) else np.cumsum(f / SR)) % 1
    return 2 * ph - 1

def reverb(x, r, tail=0.9, mix=0.25):
    n = int(tail * SR); ir = r.uniform(-1, 1, n) * np.exp(-np.arange(n) / SR * (6 / tail))
    wet = signal.fftconvolve(x, ir)[: len(x) + n]
    out = np.zeros(len(wet)); out[: len(x)] = x
    return (1 - mix) * out + mix * wet / (np.max(np.abs(wet)) + 1e-9) * (np.max(np.abs(x)) + 1e-9)

def place(parts, total):
    out = np.zeros(int(total * SR))
    for at, y in parts:
        a = int(at * SR); b = min(len(out), a + len(y))
        if a < len(out): out[a:b] += y[: b - a]
    return out

def sat(x, d=2.0): return np.tanh(x * d)
def bitcrush(x, bits=5, hold=1):
    q = 2 ** bits
    y = np.round(x * q) / q
    if hold > 1: y = np.repeat(y[::hold], hold)[: len(x)]
    return y

# ---------------------------------------------------------------- sounds
S = {}
def snd(cat, id_, name, tags):
    def deco(fn):
        S[id_] = (cat, name, tags, fn); return fn
    return deco

W = "Whoosh & Transition"; I = "Impact & Hit"; R = "Riser & Build"; D = "Drop & Bass"; U = "UI & Click"
N = "Notification & Chime"; M = "Magic & Sparkle"; G = "Glitch & Digital"; F = "Camera & Foley"; A = "Ambience"
C = "Cartoon & Pop"; X = "Sci-Fi & Laser"

def whoosh(dur, lo, hi, peak=.5, r=None, power=1.0):
    n = int(dur * SR); x = noise(dur, r)
    y = sweep(x, lo, hi, "low", order=2) if hi >= lo else sweep(x, lo, hi, "low")
    return y * swell(n, peak) ** power

@snd(W, "whoosh-soft", "Whoosh soft", "whoosh,transition,soft,swipe")
def _(r): return whoosh(.9, 300, 3500, .45, r)
@snd(W, "whoosh-fast", "Whoosh fast", "whoosh,transition,fast,cut")
def _(r): return whoosh(.35, 500, 7000, .4, r)
@snd(W, "whoosh-long", "Whoosh long", "whoosh,transition,long,cinematic")
def _(r): return whoosh(1.6, 200, 5000, .55, r)
@snd(W, "whoosh-deep", "Whoosh deep", "whoosh,transition,deep,bass")
def _(r): return whoosh(1.0, 90, 1200, .5, r) + .3 * osc(expsweep(120, 50, int(SR)), SR) * swell(SR, .4)
@snd(W, "swish", "Swish", "swish,swipe,fast,light")
def _(r): return filt(whoosh(.22, 1500, 9000, .4, r), "high", 1200)
@snd(W, "sweep-up", "Sweep up", "sweep,rise,transition")
def _(r): return sweep(noise(.8, r), 200, 8000, "low") * rise(int(.8 * SR), 1.4)
@snd(W, "sweep-down", "Sweep down", "sweep,fall,transition")
def _(r): return sweep(noise(.8, r), 8000, 200, "low") * (1 - rise(int(.8 * SR), 1.4))

def thump(f0, f1, dur, k):
    n = int(dur * SR); return osc(expsweep(f0, f1, n), n) * decay(n, k)
@snd(I, "impact-cinematic", "Impact cinematic", "impact,cinematic,boom,hit")
def _(r):
    t = thump(110, 32, 1.6, 3); c = filt(noise(1.6, r), "low", 2500) * decay(int(1.6 * SR), 22)
    tail = filt(noise(1.6, r), "low", 180) * decay(int(1.6 * SR), 2.2) * .5
    return t + .7 * c + tail
@snd(I, "impact-heavy", "Impact heavy", "impact,heavy,slam")
def _(r): return sat(thump(90, 28, 1.4, 2.6) * 1.4 + .6 * filt(noise(1.4, r), "low", 900) * decay(int(1.4 * SR), 9), 1.5)
@snd(I, "punch", "Punch", "punch,hit,short")
def _(r): return thump(170, 48, .35, 14) + .6 * filt(noise(.35, r), "low", 3000) * decay(int(.35 * SR), 60)
@snd(I, "slam", "Slam", "slam,door,heavy")
def _(r): return thump(140, 40, .8, 7) + .9 * filt(noise(.8, r), "low", 4000) * decay(int(.8 * SR), 30)
@snd(I, "thud", "Thud", "thud,soft,low")
def _(r): return thump(85, 45, .5, 11)
@snd(I, "boom-short", "Boom short", "boom,short,sub")
def _(r): return thump(100, 36, .7, 5.5) * 1.2
@snd(I, "hit-metal", "Hit metal", "hit,metal,clang")
def _(r): return bell(420, 1.0, 3.5, ((1, 1), (1.5, .6), (2.3, .5), (3.7, .4), (5.1, .3)))

@snd(R, "riser-noise", "Riser noise", "riser,build,noise")
def _(r): return sweep(noise(2.0, r), 250, 9000, "low") * rise(int(2 * SR), 1.8)
@snd(R, "riser-tone", "Riser tone", "riser,build,tone,synth")
def _(r):
    n = int(2.0 * SR); return (osc(expsweep(180, 1800, n), n) * .7 + .3 * saw(expsweep(90, 900, n), n)) * rise(n, 1.8)
@snd(R, "riser-long", "Riser long", "riser,build,long")
def _(r):
    n = int(4.0 * SR); return (.7 * sweep(noise(4.0, r), 200, 10000, "low") + .5 * osc(expsweep(120, 1400, n), n)) * rise(n, 2.2)
@snd(R, "riser-short", "Riser short", "riser,short,quick")
def _(r):
    n = int(.8 * SR); return (sweep(noise(.8, r), 400, 9000, "low") + .5 * osc(expsweep(300, 2200, n), n)) * rise(n, 1.4)
@snd(R, "tension-build", "Tension build", "tension,suspense,build")
def _(r):
    n = int(3.0 * SR); t = tt(3.0)
    return (osc(expsweep(60, 130, n), n) * .8 + .3 * osc(expsweep(61, 133, n), n) + .2 * sweep(noise(3.0, r), 300, 4000, "low")) * rise(n, 1.6) * (1 + .15 * np.sin(2 * np.pi * (3 + 4 * t / 3) * t))
@snd(R, "reverse-swell", "Reverse swell", "reverse,swell,cymbal")
def _(r):
    n = int(2.0 * SR); x = filt(noise(2.0, r), "high", 2500) * decay(n, 3.0)
    return x[::-1] * 1.0
@snd(R, "siren-rise", "Siren rise", "siren,rise,alert")
def _(r):
    n = int(1.6 * SR); t = tt(1.6); f = 400 + 600 * (t / 1.6) + 120 * np.sin(2 * np.pi * 5 * t)
    return osc(f, n) * rise(n, 1.0) * (1 - rise(n, 8))

@snd(D, "bass-drop", "Bass drop", "bass,drop,sub,edm")
def _(r):
    n = int(2.0 * SR); return osc(expsweep(150, 30, n), n) * decay(n, 1.4) * (1 - decay(n, 200))
@snd(D, "sub-drop", "Sub drop", "sub,drop,low")
def _(r):
    n = int(2.4 * SR); return osc(expsweep(70, 24, n), n) * decay(n, 1.0)
@snd(D, "drop-fall", "Drop fall", "drop,fall,pitch")
def _(r):
    n = int(1.4 * SR); return osc(expsweep(1200, 80, n), n) * decay(n, 1.6) * .8
@snd(D, "808-hit", "808 hit", "808,hit,trap,bass")
def _(r):
    n = int(1.2 * SR); return sat(osc(expsweep(120, 45, n) * 1.0, n) * decay(n, 3.2), 1.6)
@snd(D, "bass-wobble", "Bass wobble", "bass,wobble,dubstep")
def _(r):
    n = int(1.6 * SR); t = tt(1.6); x = saw(55, n)
    return sweep(x, 200, 2000, "low") * (.6 + .4 * np.sin(2 * np.pi * 4 * t)) * swell(n, .8)
@snd(D, "bass-pulse", "Bass pulse", "bass,pulse,rhythm")
def _(r):
    t = tt(1.6); return osc(55, len(t)) * (np.sin(2 * np.pi * 3 * t) > 0) * .9 * swell(len(t), .5) ** .5
@snd(D, "low-rumble", "Low rumble", "rumble,low,earthquake")
def _(r): return filt(noise(2.5, r), "low", 90) * swell(int(2.5 * SR), .35)

@snd(U, "click", "Click", "click,ui,short")
def _(r):
    n = noise(.05, r); return (n - filt(n, "low", 1500)) * decay(len(n), 160)
@snd(U, "tick", "Tick", "tick,ui,soft")
def _(r): return osc(2400, int(.04 * SR)) * decay(int(.04 * SR), 180)
@snd(U, "pop", "Pop", "pop,ui,bubble")
def _(r): n = int(.15 * SR); return osc(expsweep(900, 180, n), n) * decay(n, 30)
@snd(U, "tap", "Tap", "tap,ui,knock")
def _(r): n = int(.12 * SR); return osc(expsweep(500, 220, n), n) * decay(n, 45) + .3 * filt(noise(.12, r), "low", 2000) * decay(n, 120)
@snd(U, "toggle", "Toggle", "toggle,switch,ui")
def _(r): return place([(0, osc(1200, int(.04 * SR)) * decay(int(.04 * SR), 120)), (.06, osc(1800, int(.05 * SR)) * decay(int(.05 * SR), 100))], .2)
@snd(U, "key-press", "Key press", "key,typing,keyboard")
def _(r): n = int(.07 * SR); return filt(noise(.07, r), "low", 1800) * decay(n, 90) + .4 * osc(210, n) * decay(n, 70)
@snd(U, "slider-tick", "Slider tick", "slider,tick,ui")
def _(r): n = int(.03 * SR); return osc(3200, n) * decay(n, 260) * .8

@snd(N, "ding", "Ding", "ding,bell,notification")
def _(r): return bell(880, 1.4, 3.0)
@snd(N, "chime-up", "Chime up", "chime,up,positive")
def _(r): return place([(i * .12, bell(f, .8, 5)) for i, f in enumerate([523.25, 659.25, 783.99])], 1.2)
@snd(N, "chime-down", "Chime down", "chime,down,negative")
def _(r): return place([(i * .12, bell(f, .8, 5)) for i, f in enumerate([783.99, 659.25, 523.25])], 1.2)
@snd(N, "notify-two", "Notify two-tone", "notification,two-tone,message")
def _(r): return place([(0, bell(659.3, .5, 7)), (.2, bell(880, .6, 6))], .8)
@snd(N, "success", "Success", "success,ok,done")
def _(r): return place([(i * .1, bell(f, .8, 5)) for i, f in enumerate([523.25, 659.25, 783.99, 1046.5])], 1.2)
@snd(N, "error-buzz", "Error buzz", "error,buzz,wrong")
def _(r):
    n = int(.45 * SR); t = tt(.45); return filt(square(130, n), "low", 1200) * (.6 + .4 * np.sin(2 * np.pi * 22 * t)) * swell(n, .1) ** .3
@snd(N, "warning-beep", "Warning beep", "warning,beep,alert")
def _(r): return place([(i * .22, osc(1000, int(.12 * SR)) * np.hanning(int(.12 * SR))) for i in range(3)], .8)

@snd(M, "sparkle", "Sparkle", "sparkle,magic,glitter")
def _(r):
    parts = [(float(r.uniform(0, .9)), np.sin(2 * np.pi * float(r.uniform(2200, 6500)) * tt(.3)) * decay(int(.3 * SR), 18) * .35) for _ in range(16)]
    return place(parts, 1.2)
@snd(M, "glitter", "Glitter", "glitter,sparkle,shimmer")
def _(r):
    parts = [(float(r.uniform(0, 1.4)), np.sin(2 * np.pi * float(r.uniform(3500, 9000)) * tt(.15)) * decay(int(.15 * SR), 40) * .3) for _ in range(34)]
    return place(parts, 1.7)
@snd(M, "magic-wand", "Magic wand", "magic,wand,spell")
def _(r):
    n = int(1.0 * SR); return osc(expsweep(500, 3500, n), n) * decay(n, 3) * .6 + .4 * sweep(noise(1.0, r), 2000, 9000, "high") * decay(n, 4)
@snd(M, "shimmer", "Shimmer", "shimmer,pad,shine")
def _(r):
    t = tt(1.8); y = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(1760, 0), (2217, 1), (2637, 2), (3520, 3)])
    return y * (.6 + .4 * np.sin(2 * np.pi * 7 * t)) * swell(len(t), .35) * .3
@snd(M, "fairy-dust", "Fairy dust", "fairy,dust,sparkle,soft")
def _(r):
    parts = [(i * .06 + float(r.uniform(0, .02)), np.sin(2 * np.pi * f * tt(.25)) * decay(int(.25 * SR), 20) * .35) for i, f in enumerate(expsweep(1500, 5000, 22))]
    return place(parts, 1.7)
@snd(M, "power-up", "Power up", "power-up,game,rise")
def _(r):
    n = int(.9 * SR); return filt(square(expsweep(220, 1760, n), n, .25), "low", 5000) * (1 - decay(n, 60)) * decay(n, 1.2) * .7
@snd(M, "harp-gliss", "Harp gliss", "harp,gliss,magic")
def _(r):
    notes = [261.63 * 2 ** (k / 12) for k in [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]]
    return place([(i * .06, pluck(f, 1.2, 3.5) * .5) for i, f in enumerate(notes)], 2.0)

@snd(G, "glitch-short", "Glitch short", "glitch,digital,short")
def _(r):
    n = int(.5 * SR); hold = np.repeat(r.uniform(-1, 1, 14), n // 14 + 1)[:n]
    gate = np.repeat(r.integers(0, 2, 14), n // 14 + 1)[:n]; return bitcrush(hold * .6 + .4 * osc(expsweep(300, 1200, n), n), 4) * gate * (1 - rise(n, 1.0))
@snd(G, "glitch-stutter", "Glitch stutter", "glitch,stutter,repeat")
def _(r):
    seg = osc(740, int(.06 * SR)) * np.hanning(int(.06 * SR)); return place([(i * .09, seg * (1 - i * .08)) for i in range(8)], .9)
@snd(G, "data-burst", "Data burst", "data,burst,digital")
def _(r):
    n = int(.6 * SR); f = np.repeat(r.uniform(400, 3000, 30), n // 30 + 1)[:n]; return osc(f, n) * .6 * (np.repeat(r.integers(0, 2, 30), n // 30 + 1)[:n]) * (1 - rise(n, 2))
@snd(G, "bit-crush", "Bit crush", "bitcrush,lofi,digital")
def _(r):
    n = int(.8 * SR); return bitcrush(osc(expsweep(1200, 200, n), n), 3, 12) * decay(n, 3)
@snd(G, "digital-noise", "Digital noise", "noise,digital,static")
def _(r): return bitcrush(noise(.5, r), 3, 4) * swell(int(.5 * SR), .2) ** .5
@snd(G, "static-burst", "Static burst", "static,tv,noise")
def _(r): return filt(noise(.6, r), "high", 1500) * np.where(tt(.6) % .12 < .08, 1, .2) * decay(int(.6 * SR), 3)
@snd(G, "modem-chirp", "Modem chirp", "modem,chirp,retro")
def _(r):
    n = int(1.0 * SR); f = np.repeat(r.choice([1200, 1800, 2100, 2400, 980], 25), n // 25 + 1)[:n]; return osc(f, n) * .6 * swell(n, .7) ** .2

@snd(F, "shutter", "Camera shutter", "camera,shutter,photo")
def _(r):
    def c(): n = noise(.06, r); return (n - filt(n, "low", 2000)) * decay(len(n), 110)
    return place([(0, c()), (.09, c() * .8)], .25)
@snd(F, "double-shutter", "Double shutter", "camera,shutter,burst")
def _(r):
    def c(): n = noise(.06, r); return (n - filt(n, "low", 2000)) * decay(len(n), 110)
    return place([(i * .12, c() * (1 - i * .15)) for i in range(4)], .6)
@snd(F, "paper-rustle", "Paper rustle", "paper,rustle,foley")
def _(r): return filt(noise(.7, r), "bp", (2000, 9000)) * (np.abs(np.sin(2 * np.pi * 9 * tt(.7))) ** 3) * swell(int(.7 * SR), .4)
@snd(F, "swipe-cloth", "Swipe cloth", "cloth,swipe,foley")
def _(r): return whoosh(.35, 400, 3000, .5, r) * .8
@snd(F, "footstep-soft", "Footstep soft", "footstep,foley,soft")
def _(r): n = int(.2 * SR); return thump(120, 60, .2, 28) + .4 * filt(noise(.2, r), "low", 1500) * decay(n, 40)
@snd(F, "door-knock", "Door knock", "knock,door,foley")
def _(r): return place([(i * .18, thump(220, 120, .18, 30) + .3 * filt(noise(.18, r), "low", 1500) * decay(int(.18 * SR), 60)) for i in range(3)], .8)
@snd(F, "stamp", "Stamp", "stamp,thud,office")
def _(r): return thump(160, 70, .3, 22) + .5 * filt(noise(.3, r), "low", 2500) * decay(int(.3 * SR), 70)

def pad(freqs, dur, r, wob=.3):
    t = tt(dur); y = sum(np.sin(2 * np.pi * f * t + i) * (1 + .1 * np.sin(2 * np.pi * (wob + i * .05) * t)) for i, f in enumerate(freqs))
    y = y / len(freqs)
    n = len(t); fade = np.minimum(1, np.minimum(np.arange(n) / (.5 * SR), (n - np.arange(n)) / (.5 * SR)))
    return y * fade
@snd(A, "air-pad", "Air pad", "ambience,pad,air")
def _(r): return pad([220, 277.18, 329.63, 440], 4.0, r)
@snd(A, "wind-soft", "Wind soft", "ambience,wind,soft")
def _(r):
    n = int(4.0 * SR); return sweep(noise(4.0, r), 300, 900, "low") * (.6 + .4 * np.sin(2 * np.pi * .4 * tt(4.0))) * np.minimum(1, np.minimum(np.arange(n) / (.6 * SR), (n - np.arange(n)) / (.6 * SR)))
@snd(A, "room-tone", "Room tone", "ambience,room,quiet")
def _(r): return filt(noise(4.0, r), "low", 500) * .5
@snd(A, "drone-low", "Drone low", "ambience,drone,dark")
def _(r): return pad([55, 82.4, 110, 164.8], 4.0, r, .1)
@snd(A, "shimmer-pad", "Shimmer pad", "ambience,pad,shimmer")
def _(r): return pad([523.25, 659.25, 783.99, 1046.5, 1318.5], 4.0, r, .8)
@snd(A, "noise-wash", "Noise wash", "ambience,wash,noise")
def _(r): return sweep(noise(4.0, r), 600, 6000, "low") * swell(int(4.0 * SR), .5) * .8
@snd(A, "sub-hum", "Sub hum", "ambience,hum,low")
def _(r): return pad([50, 100, 150], 3.5, r, .2)

@snd(C, "boing", "Boing", "boing,cartoon,spring")
def _(r):
    n = int(.7 * SR); t = tt(.7); return osc(300 + 250 * np.sin(2 * np.pi * 7 * t) * np.exp(-t * 4) + 120 * np.exp(-t * 6), n) * decay(n, 3.5)
@snd(C, "bubble-pop", "Bubble pop", "bubble,pop,cartoon")
def _(r): n = int(.12 * SR); return osc(expsweep(300, 1400, n), n) * decay(n, 35)
@snd(C, "slide-whistle-up", "Slide whistle up", "whistle,slide,up,cartoon")
def _(r): n = int(.8 * SR); return osc(expsweep(400, 2400, n), n) * np.hanning(n) * .8
@snd(C, "slide-whistle-down", "Slide whistle down", "whistle,slide,down,cartoon")
def _(r): n = int(.8 * SR); return osc(expsweep(2400, 400, n), n) * np.hanning(n) * .8
@snd(C, "squeak", "Squeak", "squeak,cartoon,toy")
def _(r): n = int(.25 * SR); return osc(expsweep(1500, 2600, n), n) * np.hanning(n) * (1 + .3 * np.sin(2 * np.pi * 30 * tt(.25)))
@snd(C, "bonk", "Bonk", "bonk,cartoon,hit")
def _(r): n = int(.4 * SR); return osc(expsweep(500, 180, n), n) * decay(n, 12) + .3 * filt(noise(.4, r), "low", 1500) * decay(n, 60)
@snd(C, "zip", "Zip", "zip,cartoon,fast")
def _(r): n = int(.3 * SR); return osc(expsweep(300, 3000, n), n) * decay(n, 8) * .6 + .3 * filt(noise(.3, r), "high", 3000) * decay(n, 10)

@snd(X, "laser", "Laser", "laser,scifi,shot")
def _(r): n = int(.4 * SR); return osc(expsweep(2400, 140, n), n) * decay(n, 7)
@snd(X, "zap", "Zap", "zap,electric,scifi")
def _(r): n = int(.3 * SR); return sat(osc(expsweep(1800, 300, n) * (1 + .4 * np.sin(2 * np.pi * 60 * tt(.3))), n), 2) * decay(n, 9)
@snd(X, "charge-up", "Charge up", "charge,power,scifi")
def _(r): n = int(1.4 * SR); return osc(expsweep(150, 2000, n), n) * rise(n, 1.4) * .7 + .2 * sweep(noise(1.4, r), 400, 6000, "low") * rise(n, 1.4)
@snd(X, "power-down", "Power down", "power-down,scifi,fall")
def _(r): n = int(1.4 * SR); return osc(expsweep(1500, 60, n), n) * decay(n, 2.2) * .8
@snd(X, "scanner", "Scanner", "scanner,scifi,sweep")
def _(r):
    n = int(1.5 * SR); t = tt(1.5); return osc(600 + 500 * np.abs(np.sin(2 * np.pi * 1.3 * t)), n) * swell(n, .5) ** .5 * .7
@snd(X, "teleport", "Teleport", "teleport,warp,scifi")
def _(r):
    n = int(1.0 * SR); return (osc(expsweep(200, 3000, n), n) * rise(n, 1.0) * (1 - rise(n, 6)) + .3 * sweep(noise(1.0, r), 500, 9000, "low") * swell(n, .4))
@snd(X, "hologram", "Hologram", "hologram,ui,scifi")
def _(r):
    t = tt(.9); n = len(t); return (osc(880, n) + .5 * osc(1320, n)) * (.5 + .5 * np.sin(2 * np.pi * 14 * t)) * np.hanning(n) * .5

def finish(x):
    x = np.nan_to_num(np.asarray(x, dtype=float))
    x = x - np.mean(x) if len(x) > 2000 and np.abs(np.mean(x)) > 1e-4 else x
    f = min(len(x) // 2, int(.004 * SR))
    if f > 0:
        x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    peak = np.max(np.abs(x))
    return x * (0.9 / peak) if peak > 1e-9 else x

def write_wav(path, x):
    pcm = np.clip(x, -1, 1)
    data = (pcm * 32767).astype("<i2").tobytes()
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(data)

def main(out):
    items = []
    for id_, (cat, name, tags, fn) in S.items():
        x = finish(fn(rng_for(id_)))
        folder = os.path.join(out, "wav", cat.replace(" & ", "-").replace(" ", "-").lower())
        os.makedirs(folder, exist_ok=True)
        rel = os.path.relpath(os.path.join(folder, id_ + ".wav"), out).replace(os.sep, "/")
        write_wav(os.path.join(out, rel), x)
        items.append({"id": id_, "name": name, "category": cat, "tags": [t for t in tags.split(",")],
                      "seconds": round(len(x) / SR, 3), "sampleRate": SR, "channels": 1, "peak": round(float(np.max(np.abs(x))), 3),
                      "rms": round(float(np.sqrt(np.mean(x ** 2))), 4), "file": rel})
    cats = sorted({i["category"] for i in items})
    json.dump({"name": "Flow Studio Original SFX", "license": "CC0-1.0", "sampleRate": SR, "count": len(items),
               "categories": cats, "items": items}, open(os.path.join(out, "catalog.json"), "w"), indent=2, ensure_ascii=False)
    print(len(items), "sounds,", len(cats), "categories")

if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "sfx-pack")
