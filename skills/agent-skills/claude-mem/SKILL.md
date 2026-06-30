# claude-mem

Persistent memory compression system for Claude. Captures observations across sessions, generates semantic summaries, injects relevant context.

## When to Use

- User wants Claude to remember context across sessions
- Building long-term knowledge base from coding work
- Automatically capturing tool usage patterns

## Features

- Automatic observation capture from tool usage
- Semantic summary generation via Claude Agent SDK
- SQLite + Chroma vector DB storage
- MCP server for context injection
- Web viewer UI

## Installation

```bash
npx claude-mem install
```

## How It Works

1. Captures observations during coding sessions
2. Compresses and stores in vector database
3. Injects relevant context into future sessions
4. Enables knowledge continuity after sessions end

## Source

- **Repository**: https://github.com/thedotmack/claude-mem
- **License**: Apache-2.0
