#!/usr/bin/env python
# 读者视角体检：全画面动 vs 物件动 vs 字幕条动不动
# 用法: python viewer_audit.py <video.mp4> [--band 996,1046] [--fps 24]
import subprocess, sys, numpy as np

import os, shutil
FFMPEG = os.environ.get("FFMPEG") or shutil.which("ffmpeg") or "ffmpeg"
W, H = 480, 270

def load(path, fps=24):
    cmd = [FFMPEG, "-v", "error", "-i", path, "-vf", f"scale={W}:{H},format=gray",
           "-r", str(fps), "-f", "rawvideo", "-"]
    raw = subprocess.run(cmd, capture_output=True).stdout
    n = len(raw) // (W*H)
    return np.frombuffer(raw[:n*W*H], dtype=np.uint8).reshape(n, H, W).astype(np.float32)

def audit(path, band=None, fps=24):
    f = load(path, fps)
    d = np.abs(np.diff(f, axis=0))          # (n-1, H, W)
    m = max(6, W//40)                        # 12px 边
    border = np.zeros((H, W), bool)
    border[:m, :] = border[-m:, :] = border[:, :m] = border[:, -m:] = True
    rows = []
    for i, fr in enumerate(d):
        t = (i+1)/fps
        rows.append((t, fr.mean(), fr[border].mean()))
    bmax = max(r[2] for r in rows)
    gmax = max(r[1] for r in rows)
    out = {
        "file": path, "frames": len(f),
        "global_mean": round(float(np.mean([r[1] for r in rows])), 3),
        "global_peak": round(float(gmax), 3),
        "border_mean": round(float(np.mean([r[2] for r in rows])), 3),
        "border_peak": round(float(bmax), 3),
    }
    if band:
        y0, y1 = [int(v*H/1080) for v in band]
        bm = np.zeros((H, W), bool); bm[y0:y1, :] = True
        vals = [fr[bm].mean() for fr in d]
        out["band_mean"] = round(float(np.mean(vals)), 3)
        out["band_idle_peak"] = round(float(np.percentile(vals, 90)), 3)
        out["band_max"] = round(float(max(vals)), 3)
    # 逐秒
    per = []
    for s in range(int(rows[-1][0]) + 1):
        seg = [r for r in rows if s <= r[0] < s+1]
        if seg:
            per.append((s, round(float(np.mean([r[1] for r in seg])), 2),
                           round(float(np.mean([r[2] for r in seg])), 2)))
    return out, per

if __name__ == "__main__":
    p = sys.argv[1]
    band = None
    if "--band" in sys.argv:
        band = [int(v) for v in sys.argv[sys.argv.index("--band")+1].split(",")]
    o, per = audit(p, band)
    for k, v in o.items(): print(f"{k:14s} {v}")
    print("per-second: t / 全画面 / 边缘")
    for s, a, b in per: print(f"  {s:2d}s  {a:6.2f}  {b:6.2f}")
