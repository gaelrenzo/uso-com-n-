package config

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"

	"gopkg.in/yaml.v3"
)

// AgentDescriptor describe un agente IA en el registro central (config/agents.yaml)
type AgentDescriptor struct {
	Name        string `yaml:"-"`
	Command     string `yaml:"command"`
	Env         string `yaml:"env"`
	Wrapper     string `yaml:"wrapper"`
	FullArgs    string `yaml:"full_args"`
	Description string `yaml:"description"`
	// KnownPaths es un mapa plataforma -> lista de rutas candidatas
	KnownPaths map[string][]string `yaml:"known_paths"`
}

// LoadAgents reads config/agents.yaml and returns the registry of AI agents
// in file order. A missing file is not an error: it returns an empty registry.
func LoadAgents(agentsPath string) ([]AgentDescriptor, error) {
	data, err := os.ReadFile(agentsPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}

	var doc struct {
		Agents yaml.Node `yaml:"agents"`
	}
	if err := yaml.Unmarshal(data, &doc); err != nil {
		return nil, fmt.Errorf("%s: %w", agentsPath, err)
	}

	var agents []AgentDescriptor
	content := doc.Agents.Content
	for i := 0; i+1 < len(content); i += 2 {
		agent := AgentDescriptor{Name: content[i].Value}
		if err := content[i+1].Decode(&agent); err != nil {
			return nil, fmt.Errorf("%s: agente %s: %w", agentsPath, agent.Name, err)
		}
		agent.Name = content[i].Value
		if agent.KnownPaths == nil {
			agent.KnownPaths = make(map[string][]string)
		}
		agents = append(agents, agent)
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
