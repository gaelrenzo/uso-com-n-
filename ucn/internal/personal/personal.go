// Package personal shares the user's non-secret customizations between devices.
package personal

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"ucn/internal/secrets"
)

const (
	rulesDir     = "config/personal/claude-rules"
	settingsFile = "config/personal/claude-settings.json"
)

// Apply installs the shared customizations on this device. It only acts on
// agents that are already set up here.
func Apply(repoRoot string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	claudeDir := filepath.Join(home, ".claude")
	if _, err := os.Stat(claudeDir); err != nil {
		fmt.Println("Personal..... sin ~/.claude, nada que aplicar")
		return nil
	}
	copied, err := applyRules(filepath.Join(repoRoot, rulesDir), filepath.Join(claudeDir, "rules"))
	if err != nil {
		return err
	}
	added, err := mergeSettings(filepath.Join(repoRoot, settingsFile), filepath.Join(claudeDir, "settings.json"))
	if err != nil {
		return err
	}
	fmt.Printf("Personal..... ✓ %d reglas actualizadas, %d ajustes agregados\n", copied, added)
	return nil
}

// applyRules copies each rule, keeping any different local version as a backup.
func applyRules(source, target string) (int, error) {
	files, err := filepath.Glob(filepath.Join(source, "*.md"))
	if err != nil {
		return 0, err
	}
	if err := os.MkdirAll(target, 0755); err != nil {
		return 0, err
	}
	copied := 0
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			return copied, err
		}
		dest := filepath.Join(target, filepath.Base(file))
		current, err := os.ReadFile(dest)
		if err == nil && bytes.Equal(current, data) {
			continue
		}
		if err == nil {
			if err := os.WriteFile(nextBackup(dest), current, 0644); err != nil {
				return copied, err
			}
		}
		if err := os.WriteFile(dest, data, 0644); err != nil {
			return copied, err
		}
		copied++
	}
	return copied, nil
}

func nextBackup(path string) string {
	backup := path + ".bak"
	for n := 2; ; n++ {
		if _, err := os.Lstat(backup); os.IsNotExist(err) {
			return backup
		}
		backup = fmt.Sprintf("%s.%d.bak", path, n)
	}
}

// mergeSettings adds the shared keys missing locally. Local values always win
// and unknown keys are preserved.
func mergeSettings(source, target string) (int, error) {
	data, err := os.ReadFile(source)
	if os.IsNotExist(err) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	shared := map[string]any{}
	if err := json.Unmarshal(data, &shared); err != nil {
		return 0, fmt.Errorf("%s: %w", source, err)
	}
	local := map[string]any{}
	if current, err := os.ReadFile(target); err == nil {
		if err := json.Unmarshal(current, &local); err != nil {
			return 0, fmt.Errorf("%s no es JSON valido, no se modifica: %w", target, err)
		}
	}
	added := 0
	for key, value := range shared {
		if _, ok := local[key]; !ok {
			local[key] = value
			added++
		}
	}
	if added == 0 {
		return 0, nil
	}
	out, err := json.MarshalIndent(local, "", "  ")
	if err != nil {
		return 0, err
	}
	return added, os.WriteFile(target, append(out, '\n'), 0644)
}

// Save copies this device's rules into the repo so "ucn push" can share them.
// A rule containing a credential stops the whole save.
func Save(repoRoot string) error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	files, err := filepath.Glob(filepath.Join(home, ".claude", "rules", "*.md"))
	if err != nil {
		return err
	}
	contents := make(map[string][]byte, len(files))
	for _, file := range files {
		data, err := os.ReadFile(file)
		if err != nil {
			return err
		}
		if findings := secrets.Scan(filepath.Base(file), data); len(findings) > 0 {
			return fmt.Errorf("no se guardo nada: %s", findings[0])
		}
		contents[filepath.Base(file)] = data
	}
	target := filepath.Join(repoRoot, rulesDir)
	if err := os.MkdirAll(target, 0755); err != nil {
		return err
	}
	for name, data := range contents {
		if err := os.WriteFile(filepath.Join(target, name), data, 0644); err != nil {
			return err
		}
	}
	fmt.Printf("Personal..... ✓ %d reglas guardadas en %s. Publica con: ucn push\n", len(contents), rulesDir)
	return nil
}
