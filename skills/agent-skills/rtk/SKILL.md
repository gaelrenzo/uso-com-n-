# RTK Skill

Use rtk (Rust Token Killer) to reduce LLM token consumption by 60-90% on common dev commands.

## When to Use

- User runs git, cargo, npm, pytest, docker, or other CLI commands
- User wants to optimize token usage in AI coding sessions
- User asks about rtk installation, configuration, or commands
- User wants to see token savings analytics

## Overview

rtk is a high-performance CLI proxy that filters and compresses command outputs before they reach the LLM context. Single Rust binary, zero dependencies, <10ms overhead.

## Installation

```bash
# Homebrew (recommended)
brew install rtk

# Quick Install (Linux/macOS)
curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh

# Cargo
cargo install --git https://github.com/rtk-ai/rtk

# Windows: download from https://github.com/rtk-ai/rtk/releases
```

## Setup for AI Tools

```bash
rtk init -g                     # Claude Code / Copilot (default)
rtk init -g --opencode          # OpenCode plugin
rtk init -g --gemini            # Gemini CLI
rtk init -g --codex             # Codex (OpenAI)
rtk init -g --agent cursor      # Cursor
rtk init -g --agent windsurf    # Windsurf
```

## Key Commands

### Files
- `rtk ls` - Token-optimized directory tree
- `rtk read <file>` - Smart file reading
- `rtk find "*.rs" .` - Compact find results
- `rtk grep "pattern" .` - Grouped search results

### Git
- `rtk git status` - Compact status
- `rtk git log -n 10` - One-line commits
- `rtk git diff` - Condensed diff
- `rtk git add` - → "ok"
- `rtk git commit -m "msg"` - → "ok abc1234"
- `rtk git push` - → "ok main"

### Test Runners
- `rtk cargo test` - Cargo tests (-90%)
- `rtk pytest` - Python tests (-90%)
- `rtk go test` - Go tests (-90%)
- `rtk test <cmd>` - Generic test wrapper

### Analytics
- `rtk gain` - Summary stats
- `rtk gain --graph` - ASCII graph (last 30 days)
- `rtk discover` - Find missed savings

## Token Savings

| Operation | Standard | rtk | Savings |
|-----------|----------|-----|---------|
| `ls` / `tree` | 2,000 | 400 | -80% |
| `cat` / `read` | 40,000 | 12,000 | -70% |
| `git status` | 3,000 | 600 | -80% |
| `cargo test` | 25,000 | 2,500 | -90% |
| **Total session** | **~118,000** | **~23,900** | **-80%** |

## Supported AI Tools (14)

Claude Code, GitHub Copilot, Cursor, Gemini CLI, Codex, Windsurf, Cline/Roo Code, OpenCode, OpenClaw, Pi, Hermes, Kilo Code, Google Antigravity, Mistral Vibe (planned)

## Source

- **Repository**: https://github.com/rtk-ai/rtk
- **License**: Apache-2.0
- **Authors**: Patrick Szymkowiak, Florian Bruniaux, Adrien Eppling
- **Stars**: 67.1k+
- **Website**: https://www.rtk-ai.app
