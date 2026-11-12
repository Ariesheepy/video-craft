# 装到 DSH 技能目录（Windows）
$ErrorActionPreference = "Stop"
$Src = Split-Path -Parent $PSScriptRoot
$Base = if ($env:DSH_SKILLS) { $env:DSH_SKILLS } else { Join-Path $HOME ".dsh\skills" }
$Dst = Join-Path $Base "video-craft"

if (Test-Path $Dst) { Remove-Item -Recurse -Force $Dst }
New-Item -ItemType Directory -Force -Path $Dst | Out-Null
Copy-Item (Join-Path $Src "SKILL.md") $Dst
Copy-Item -Recurse (Join-Path $Src "docs")  (Join-Path $Dst "docs")
Copy-Item -Recurse (Join-Path $Src "tools") (Join-Path $Dst "tools")

Write-Host "installed -> $Dst"
Write-Host "重启 DSH 或新开会话，技能列表里应出现 video-craft"
