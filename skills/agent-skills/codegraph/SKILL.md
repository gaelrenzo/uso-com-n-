# CodeGraph

Local-first semantic code intelligence. Parses codebases with tree-sitter, stores symbols in SQLite, exposes a knowledge graph to AI agents.

## When to Use

- User wants semantic code search and navigation
- Finding symbol definitions, references, and relationships
- Reducing tool calls (58% fewer) and speeding up AI responses (22% faster)
- Setting up MCP server for code intelligence

## Overview

CodeGraph builds a local knowledge graph of your codebase. Enables surgical context retrieval without sending entire files to the LLM.

## Usage

```bash
# Install
npm install -g codegraph

# Index a codebase
codegraph index .

# Query symbols
codegraph query "functionName"

# Start MCP server
codegraph serve

# CLI mode
codegraph search "authenticateUser"
```

## Features

- Tree-sitter parsing for 30+ languages
- SQLite storage (local-first, no cloud)
- MCP server for AI agent integration
- Symbol definitions, references, call graphs
- 58% fewer tool calls, 22% faster responses

## Source

- **Repository**: https://github.com/colbymchenry/codegraph
- **License**: MIT
