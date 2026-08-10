package profile

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
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

// parseProfileYAML parses the small profile.yaml format used by UCN.
func parseProfileYAML(path string, p *Profile) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()

	p.DisplayName = p.Name
	var promptLines []string
	promptBlock := false
	descBlock := false
	var descLines []string
	toolsBlock := false

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		indent := len(line) - len(strings.TrimLeft(line, " "))

		// Continuation of a scalar block (description / prompt)
		if promptBlock || descBlock {
			if indent >= 2 {
				if promptBlock {
					promptLines = append(promptLines, trimmed)
				} else {
					descLines = append(descLines, trimmed)
				}
				continue
			}
			promptBlock = false
			descBlock = false
		}

		// Block list items under tools:
		if toolsBlock {
			if indent >= 2 && strings.HasPrefix(trimmed, "-") {
				item := strings.TrimSpace(strings.TrimPrefix(trimmed, "-"))
				if item != "" {
					p.Tools = append(p.Tools, strings.Trim(item, `"'`))
				}
				continue
			}
			toolsBlock = false
		}

		parts := strings.SplitN(trimmed, ":", 2)
		if len(parts) != 2 {
			continue
		}
		key := strings.TrimSpace(parts[0])
		val := strings.TrimSpace(parts[1])

		switch key {
		case "name":
			p.DisplayName = strings.Trim(val, `"`)
		case "description":
			switch val {
			case ">", "|":
				descBlock = true
				descLines = nil
				continue
			default:
				p.Description = val
			}
		case "tools":
			if val == "" {
				toolsBlock = true
				p.Tools = nil
			} else {
				p.Tools = parseList(val)
			}
		case "prompt":
			if val == "|" || val == ">" {
				promptBlock = true
				promptLines = nil
			} else {
				p.Prompt = strings.Trim(val, `"`)
			}
		}
	}
	if err := scanner.Err(); err != nil {
		return err
	}
	if len(promptLines) > 0 {
		p.Prompt = strings.Join(promptLines, " ")
	}
	if len(descLines) > 0 {
		p.Description = strings.Join(descLines, " ")
	}
	return nil
}

func parseList(raw string) []string {
	raw = strings.TrimSpace(raw)
	if raw == "" {
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
