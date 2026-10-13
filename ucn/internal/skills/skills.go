package skills

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// SourceDir returns the repository folder that holds the source skills.
func SourceDir(repoRoot string) string {
	return filepath.Join(repoRoot, "skills", "agent-skills")
}

// TargetState is the link state of one skill in one agent target.
type TargetState struct {
	Target string
	State  string // linked | broken | missing | dir | file | error
	Note   string
}

// Skill is the link state of one source skill across the active targets.
type Skill struct {
	Name    string
	Linked  int
	Broken  int
	Missing int
	Plain   int
	Detail  []TargetState
}

// State returns a short human readable status for the skill row.
func (s Skill) State() string {
	if len(s.Detail) == 0 {
		return "sin agentes"
	}
	if s.Broken > 0 {
		return "✗ roto"
	}
	if s.Plain > 0 {
		return "⚠ dir local"
	}
	if s.Linked == 0 {
		return "✗ no enlazada"
	}
	if s.Missing > 0 {
		return "⚠ parcial"
	}
	return "✓ ok"
}

// List returns the link state of every source skill against the active targets.
// An empty source folder returns an empty slice (not an error).
func List(skillsDir string, targets []string) ([]Skill, error) {
	entries, err := os.ReadDir(skillsDir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, fmt.Errorf("no existe el directorio de skills del repo: %s", skillsDir)
		}
		return nil, err
	}

	var out []Skill
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		s := Skill{Name: e.Name()}
		for _, target := range targets {
			s.Detail = append(s.Detail, probe(filepath.Join(target, s.Name), target))
		}
		for _, d := range s.Detail {
			switch d.State {
			case "linked":
				s.Linked++
			case "broken":
				s.Broken++
			case "missing":
				s.Missing++
			case "dir", "file":
				s.Plain++
			}
		}
		out = append(out, s)
	}
	return out, nil
}

// Find returns the link state of a single source skill by name.
func Find(skillsDir string, targets []string, name string) (*Skill, error) {
	src := filepath.Join(skillsDir, name)
	if st, err := os.Stat(src); err != nil || !st.IsDir() {
		return nil, fmt.Errorf("la skill %q no existe en %s", name, skillsDir)
	}
	all, err := List(skillsDir, targets)
	if err != nil {
		return nil, err
	}
	for i := range all {
		if all[i].Name == name {
			return &all[i], nil
		}
	}
	return nil, fmt.Errorf("la skill %q no existe en %s", name, skillsDir)
}

func probe(link, target string) TargetState {
	fi, err := os.Lstat(link)
	if err != nil {
		if os.IsNotExist(err) {
			return TargetState{Target: target, State: "missing"}
		}
		return TargetState{Target: target, State: "error", Note: err.Error()}
	}
	if fi.Mode()&os.ModeSymlink != 0 {
		if _, serr := os.Stat(link); serr == nil {
			return TargetState{Target: target, State: "linked"}
		}
		return TargetState{Target: target, State: "broken", Note: "el destino no existe"}
	}
	if fi.IsDir() {
		return TargetState{Target: target, State: "dir", Note: "directorio real (no es enlace UCN)"}
	}
	return TargetState{Target: target, State: "file", Note: "archivo inesperado"}
}

// Issue is a problem detected inside an agent skill target directory.
type Issue struct {
	Path string
	Kind string // "enlace-roto" | "respaldo"
	Note string
}

// FindIssues scans the active targets for broken links and leftover *_backup
// directories created when sync displaced a real directory.
func FindIssues(targets []string) []Issue {
	var issues []Issue
	for _, target := range targets {
		entries, err := os.ReadDir(target)
		if err != nil {
			continue
		}
		for _, e := range entries {
			path := filepath.Join(target, e.Name())
			fi, err := os.Lstat(path)
			if err != nil {
				continue
			}
			if fi.Mode()&os.ModeSymlink != 0 {
				if _, err := os.Stat(path); err != nil {
					issues = append(issues, Issue{Path: path, Kind: "enlace-roto", Note: "apunta a una skill inexistente"})
				}
				continue
			}
			if fi.IsDir() && strings.HasSuffix(e.Name(), "_backup") {
				issues = append(issues, Issue{Path: path, Kind: "respaldo", Note: "respaldo dejado por sync"})
			}
		}
	}
	return issues
}

// Remove deletes a broken link. Only symlinks and junctions are removed, so a
// real directory is never deleted by accident.
func Remove(path string) error {
	fi, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if fi.Mode()&os.ModeSymlink == 0 {
		return fmt.Errorf("no es un enlace, se omite: %s", path)
	}
	return os.Remove(path)
}

// RemoveBackup deletes a backup directory created during previous syncs.
func RemoveBackup(path string) error {
	fi, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if !fi.IsDir() || !strings.HasSuffix(path, "_backup") {
		return fmt.Errorf("no es un directorio de respaldo seguro para eliminar: %s", path)
	}
	return os.RemoveAll(path)
}
