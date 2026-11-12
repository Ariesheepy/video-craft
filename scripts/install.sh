#!/usr/bin/env bash
# 把 video-craft 装进 DSH 技能目录
set -e
SRC="$(cd "$(dirname "$0")/.." && pwd)"
DST="${DSH_SKILLS:-$HOME/.dsh/skills}/video-craft"
mkdir -p "$(dirname "$DST")"
rm -rf "$DST"
mkdir -p "$DST"
cp "$SRC/SKILL.md" "$DST/"
cp -r "$SRC/docs" "$DST/docs"
cp -r "$SRC/tools" "$DST/tools"
echo "installed → $DST"
echo "重启 DSH 或新开会话，技能列表里应出现 video-craft"
