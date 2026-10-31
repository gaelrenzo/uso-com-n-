package profile

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gopkg.in/yaml.v3"
)

// Profile describes one available profile from profiles/<name>/profile.yaml.
type Profile struct {
	Name        string
	DisplayName string
	Description string
	Tools       []string
	Prompt      string
}

// ActiveFileName is where the active profile choice is stored (per device).
var ActiveFileName = "config/.current-profile"

// Discover lists available profiles under profiles/ of the repo root.
// Profiles are directories containing a profile.yaml.
func Discover(repoRoot string) ([]Profile, error) {
	profilesDir := filepath.Join(repoRoot, "profiles")
	entries, err := os.ReadDir(profilesDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var out []Profile
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		yamlPath := filepath.Join(profilesDir, e.Name(), "profile.yaml")
		if _, err := os.Stat(yamlPath); err != nil {
			continue
		}
		p := Profile{Name: e.Name()}
		parseProfileYAML(yamlPath, &p)
		out = append(out, p)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
	return out, nil
}

// Get returns a profile by name, or nil if it does not exist.
func Get(repoRoot, name string) (*Profile, error) {
	if name == "" {
		name = "default"
	}
	yamlPath := filepath.Join(repoRoot, "profiles", name, "profile.yaml")
	if _, err := os.Stat(yamlPath); err != nil {
		return nil, fmt.Errorf("perfil '%s' no encontrado en profiles/", name)
	}
	p := Profile{Name: name}
	if err := parseProfileYAML(yamlPath, &p); err != nil {
		return nil, err
	}
	return &p, nil
}

// Current returns the active profile name for this device. Defaults to "default".
func Current(repoRoot string) (string, error) {
	data, err := os.ReadFile(filepath.Join(repoRoot, ActiveFileName))
	if err != nil {
		return "default", nil
	}
	name := strings.TrimSpace(string(data))
	if name == "" {
		return "default", nil
	}
	return name, nil
}

// Use activates a profile by writing its name to config/.current-profile.
func Use(repoRoot, name string) error {
	if _, err := Get(repoRoot, name); err != nil {
		return err
	}
	path := filepath.Join(repoRoot, ActiveFileName)
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	return os.WriteFile(path, []byte(name+"\n"), 0644)
}

// ActivePrompt returns the prompt text of the currently active profile.
func ActivePrompt(repoRoot string) (string, error) {
	name, err := Current(repoRoot)
	if err != nil {
		return "", err
	}
	p, err := Get(repoRoot, name)
	if err != nil {
		return "", err
	}
	return p.Prompt, nil
}

// PromptDir is where per-profile prompt files are committed (consumed by
// the agent wrappers, e.g. claude --append-system-prompt-file).
const PromptDir = "config/profile-prompts"

// PromptFilePath returns the prompt file path for a given profile.
func PromptFilePath(repoRoot, name string) string {
	return filepath.Join(repoRoot, PromptDir, name+".md")
}

// ExportPrompt writes a profile's prompt to config/profile-prompts/<name>.md
// and returns the written path. An empty name uses the active profile.
func ExportPrompt(repoRoot, name string) (string, error) {
	if name == "" {
		n, err := Current(repoRoot)
		if err != nil {
			return "", err
		}
		name = n
	}
	p, err := Get(repoRoot, name)
	if err != nil {
		return "", err
	}
	path := PromptFilePath(repoRoot, name)
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return "", err
	}
	return path, os.WriteFile(path, []byte(strings.TrimSpace(p.Prompt)+"\n"), 0644)
}

// parseProfileYAML reads a profile.yaml. Scalars are collapsed to one line
// because the prompt is passed to the agents as plain text.
func parseProfileYAML(path string, p *Profile) error {
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var raw struct {
		Name        string   `yaml:"name"`
		Description string   `yaml:"description"`
		Tools       []string `yaml:"tools"`
		Prompt      string   `yaml:"prompt"`
	}
	if err := yaml.Unmarshal(data, &raw); err != nil {
		return fmt.Errorf("%s: %w", path, err)
	}
	p.DisplayName = p.Name
	if raw.Name != "" {
		p.DisplayName = raw.Name
	}
	p.Description = oneLine(raw.Description)
	p.Tools = raw.Tools
	p.Prompt = oneLine(raw.Prompt)
	return nil
}

func oneLine(text string) string {
	return strings.Join(strings.Fields(text), " ")
}
