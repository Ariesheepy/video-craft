"""BGM 拍点分析：给出 BPM、拍格起点、逐拍时间。

用法：
    python beats.py <audio> [--from 12.0] [--length 15.0]

依赖 numpy + soundfile（lemo 库的 .pylibs 里已装）。
输出 JSON，含 bpm / gridOffset / beats（秒）/ bar（每 4 拍一组的起点）。
"""
import sys, json, subprocess, os, tempfile, argparse

import glob, shutil
if os.environ.get('LEMO_PYLIBS'):
    sys.path.insert(0, os.environ['LEMO_PYLIBS'])
def _candidate_libs():
    c = []
    if os.environ.get('LEMO_PYLIBS'): c.append(os.environ['LEMO_PYLIBS'])
    if os.environ.get('LEMO_LIB'):    c.append(os.path.join(os.environ['LEMO_LIB'], '.pylibs'))
    cwd = os.getcwd()
    for base in (cwd, os.path.dirname(cwd), os.path.dirname(os.path.dirname(cwd))):
        c.append(os.path.join(base, 'lemo-opuscar', '.pylibs'))
        c.append(os.path.join(base, '.pylibs'))
    c.append(os.path.expanduser('~/lemo-opuscar/.pylibs'))
    c += glob.glob(os.path.expanduser('~/.dsh/skills/*/.pylibs'))
    return c

try:
    import soundfile as sf
except ImportError:
    for _p in _candidate_libs():
        if os.path.isdir(_p):
            sys.path.insert(0, _p)
            try:
                import soundfile as sf
                break
            except ImportError:
                continue
    else:
        sys.exit('缺 soundfile：pip install soundfile，或用 LEMO_PYLIBS=<装了 soundfile 的目录> 指路')
import numpy as np

FFMPEG = os.environ.get('FFMPEG') or shutil.which('ffmpeg') or 'ffmpeg'


def load(path, sr=22050):
    wav = tempfile.mktemp(suffix='.wav')
    subprocess.run([FFMPEG, '-y', '-v', 'error', '-i', path, '-ac', '1', '-ar', str(sr), wav], check=True)
    y, _ = sf.read(wav, dtype='float32')
    os.remove(wav)
    return y, sr


def onset_env(y, sr, hop=256, win=1024):
    n = 1 + max(0, (len(y) - win) // hop)
    idx = np.arange(win)[None, :] + hop * np.arange(n)[:, None]
    frames = y[idx] * np.hanning(win)[None, :]
    spec = np.abs(np.fft.rfft(frames, axis=1))
    # 对数压缩 + 半波整流差分 = 频谱通量
    logspec = np.log1p(10 * spec)
    flux = np.maximum(0, np.diff(logspec, axis=0)).sum(axis=1)
    flux = np.concatenate([[0], flux])
    fps = sr / hop
    # 去趋势 + 归一
    k = int(fps * 0.3) | 1
    trend = np.convolve(flux, np.ones(k) / k, mode='same')
    env = np.maximum(0, flux - trend)
    if env.max() > 0:
        env = env / env.max()
    return env, fps


def bpm_and_phase(env, fps, bpm_lo=70, bpm_hi=170):
    # 用自相关求周期
    e = env - env.mean()
    ac = np.correlate(e, e, mode='full')[len(e) - 1:]
    lo = int(fps * 60 / bpm_hi)
    hi = int(fps * 60 / bpm_lo)
    seg = ac[lo:hi]
    lag = lo + int(np.argmax(seg))
    bpm = 60 * fps / lag
    # 用梳状滤波精修相位：试 0..lag 每个偏移，累计环上能量
    best, best_ph = -1, 0
    for ph in range(lag):
        idxs = np.arange(ph, len(env), lag)
        s = env[idxs].sum()
        if s > best:
            best, best_ph = s, ph
    return bpm, best_ph / fps, lag / fps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio')
    ap.add_argument('--from', dest='t0', type=float, default=0.0)
    ap.add_argument('--length', type=float, default=15.0)
    ap.add_argument('--bpm', type=float, default=0, help='已知 BPM 时强制使用')
    a = ap.parse_args()

    y, sr = load(a.audio)
    env, fps = onset_env(y, sr)
    bpm, phase, period = bpm_and_phase(env, fps)
    if a.bpm > 0:
        period = 60.0 / a.bpm
        bpm = a.bpm
        # 相位：在给定 BPM 下找最有能量的偏移
        best, best_ph = -1, 0.0
        for ph_s in np.arange(0, period, 1.0 / fps):
            idxs = np.arange(int(ph_s * fps), len(env), int(round(period * fps)))
            s = env[idxs].sum()
            if s > best:
                best, best_ph = s, ph_s
        phase = best_ph

    beats = []
    t = phase
    while t < len(y) / sr:
        if t >= 0:
            beats.append(round(t, 4))
        t += period

    sel = [b for b in beats if a.t0 - 0.001 <= b <= a.t0 + a.length + 0.001]
    bars = [b for i, b in enumerate(beats) if i % 4 == 0]

    out = {
        'bpm': round(bpm, 2),
        'period': round(period, 4),
        'phase': round(phase, 4),
        'duration': round(len(y) / sr, 2),
        'beats_in_window': sel,
        'relative_beats': [round(b - a.t0, 4) for b in sel],
        'bars': [b for b in bars if a.t0 <= b <= a.t0 + a.length],
        'relative_bars': [round(b - a.t0, 4) for b in bars if a.t0 <= b <= a.t0 + a.length],
    }
    # 窗口内每拍的能量，标记重拍
    energy = []
    for b in sel:
        i = int(b * fps)
        energy.append(round(float(env[max(0, i - 2):i + 3].max()), 3))
    out['beat_energy'] = energy
    print(json.dumps(out, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
