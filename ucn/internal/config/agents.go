package config

import (
	"bufio"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// AgentDescriptor describe un agente IA en el registro central (config/agents.yaml)
type AgentDescriptor struct {
	Name        string
	Command     string
	Env         string
	Wrapper     string
	FullArgs    string
	Description string
	// KnownPaths es un mapa plataforma -> lista de rutas candidatas
	KnownPaths map[string][]string
}

// LoadAgents reads config/agents.yaml and returns the registry of AI agents.
// A missing file is not an error: it returns an empty registry.
func LoadAgents(agentsPath string) ([]AgentDescriptor, error) {
	file, err := os.Open(agentsPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	defer file.Close()

	var agents []AgentDescriptor
	var current *AgentDescriptor
	inKnownPaths := false
	var knownPlatform string

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		indent := len(line) - len(strings.TrimLeft(line, " "))

		if indent == 6 && inKnownPaths && current != nil {
			// Plataforma: ["/path1", "/path2"]
			if strings.Contains(trimmed, ":") {
				parts := strings.SplitN(trimmed, ":", 2)
				knownPlatform = strings.TrimSpace(parts[0])
				paths := parseInlineList(parts[1])
				if current.KnownPaths == nil {
					current.KnownPaths = make(map[string][]string)
				}
				current.KnownPaths[knownPlatform] = paths
				continue
			}
		}

		if indent >= 4 && current != nil && !inKnownPaths {
			if strings.HasSuffix(trimmed, ":") {
				key := strings.TrimSuffix(trimmed, ":")
				if key == "known_paths" {
					inKnownPaths = true
					continue
				}
			}
			parts := strings.SplitN(trimmed, ":", 2)
			if len(parts) != 2 {
				if inKnownPaths && indent >= 6 {
					continue
				}
				continue
			}
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			switch key {
			case "command", "env", "wrapper", "full_args", "description":
				assignAgentField(current, key, val)
			}
			continue
		}

		if indent < 4 {
			inKnownPaths = false
			knownPlatform = ""
		}

		if indent == 2 {
			if strings.HasSuffix(trimmed, ":") {
				name := strings.TrimSuffix(trimmed, ":")
				agents = append(agents, AgentDescriptor{Name: name, KnownPaths: make(map[string][]string)})
				current = &agents[len(agents)-1]
				continue
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return agents, nil
}

// KnownPathsFor returns the known paths for the current platform.
// On Linux it checks Termux first (redirected /data/data/com.termux path).
func (a *AgentDescriptor) KnownPathsFor() []string {
	if pk := platformKey(); pk != "" {
		if paths := a.KnownPaths[pk]; len(paths) > 0 {
			return paths
		}
	}
	return nil
}

func platformKey() string {
	switch runtime.GOOS {
	case "windows":
		return "windows"
	case "darwin":
		return "macos"
	default:
		// Detect Termux: canonical Android home redirects the prefix dir
		if _, err := os.Stat("/data/data/com.termux/files/usr/bin"); err == nil {
			return "termux"
		}
		return "linux"
	}
}

func parseInlineList(raw string) []string {
	// Handle YAML inline lists:  ["a", "b"]  or  [a, b]
	raw = strings.TrimSpace(raw)
	raw = strings.TrimPrefix(raw, "[")
	raw = strings.TrimSuffix(raw, "]")
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	var out []string
	for _, part := range strings.Split(raw, ",") {
		part = strings.TrimSpace(part)
		part = strings.Trim(part, `"'`)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func assignAgentField(a *AgentDescriptor, key, val string) {
	switch key {
	case "command":
		a.Command = val
	case "env":
		a.Env = val
	case "wrapper":
		a.Wrapper = val
	case "full_args":
		a.FullArgs = val
	case "description":
		a.Description = val
	}
}

// ResolveBin tries to find the agent binary following the canonical order:
//  1. UCN_<NAME>_BIN env var (already loaded from config/.env)
//  2. Command in PATH
//  3. Known paths of the current platform
//
// Returns the found binary path or an empty string.
func (a *AgentDescriptor) ResolveBin() string {
	// 1. Environment variable override
	if a.Env != "" {
		if v, ok := os.LookupEnv(a.Env); ok && v != "" {
			// env may be an absolute path or a bare command name in PATH
			if stat, err := os.Stat(v); err == nil && !stat.IsDir() {
				return v
			}
			if p, err := lookPath(v); err == nil {
				return p
			}
		}
	}

	// 2. Command in PATH
	if a.Command != "" {
		if p, err := lookPath(a.Command); err == nil {
			return p
		}
	}

	// 3. Known paths for current platform
	for _, cand := range a.KnownPathsFor() {
		expanded := FilePath(cand)
		if stat, err := os.Stat(expanded); err == nil && !stat.IsDir() {
			return expanded
		}
	}

	return ""
}

// FilePath expands a path that may contain %USERPROFILE% style tokens or ~
// and normalizes backslashes for the current OS.
func FilePath(p string) string {
	if strings.HasPrefix(p, "~") {
		if home, err := os.UserHomeDir(); err == nil {
			if p == "~" {
				return home
			}
			if len(p) > 1 && (p[1] == '/' || p[1] == '\\') {
				return filepath.Join(home, p[2:])
			}
			return filepath.Join(home, p[1:])
		}
	}
	// Windows %VAR% tokens
	if runtime.GOOS == "windows" {
		p = os.ExpandEnv(p)
		return p
	}
	// On non-windows strip backslashes (they only appear in windows known paths)
	if strings.Contains(p, "\\") && !strings.Contains(p, "/") {
		return p
	}
	return p
}

func lookPath(name string) (string, error) {
	if strings.Contains(name, string(filepath.Separator)) {
		return "", os.ErrNotExist
	}
	// Windows command names may use backslash separators
	if runtime.GOOS == "windows" {
		name = filepath.FromSlash(name)
		if strings.Contains(name, `\`) {
			return "", os.ErrNotExist
		}
	}
	path := os.Getenv("PATH")
	for _, dir := range filepath.SplitList(path) {
		if dir == "" {
			dir = "."
		}
		cand := filepath.Join(dir, name)
		if stat, err := os.Stat(cand); err == nil && !stat.IsDir() {
			return cand, nil
		}
		if runtime.GOOS == "windows" {
			for _, ext := range []string{".exe", ".cmd", ".bat"} {
				candExt := cand + ext
				if stat, err := os.Stat(candExt); err == nil && !stat.IsDir() {
					return candExt, nil
				}
			}
		}
	}
	return "", os.ErrNotExist
}
