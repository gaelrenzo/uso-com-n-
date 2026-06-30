# SkillSpector

Security scanner for AI agent skills. Detects vulnerabilities, malicious patterns, and supply chain risks.

## When to Use

- User wants to audit or scan agent skills for security issues
- Checking SKILL.md files, plugins, or MCP configs for vulnerabilities
- Supply chain risk analysis for AI agent dependencies

## Overview

NVIDIA SkillSpector uses a two-stage pipeline: static analysis (68 vulnerability patterns across 17 categories) + optional LLM-powered semantic analysis. Outputs in Terminal/JSON/Markdown/SARIF with risk scores 0–100.

## Usage

```bash
# Install
pip install skillspector

# Scan a skill
skillspector scan <path-to-skill>

# Scan with LLM analysis
skillspector scan <path> --llm

# Output formats
skillspector scan <path> --format json
skillspector scan <path> --format sarif
```

## Categories Checked

- Prompt injection
- Data exfiltration
- Unauthorized file access
- Dependency vulnerabilities
- Obfuscated code
- Privilege escalation

## Source

- **Repository**: https://github.com/NVIDIA/SkillSpector
- **License**: Apache-2.0
