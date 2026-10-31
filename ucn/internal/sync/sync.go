package sync

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"ucn/internal/config"
)

// SyncSkills loops through all agent skill directories and creates links
func SyncSkills(cfg *config.Config, repoRoot string) error {
	skillsDir := filepath.Join(repoRoot, "skills", "agent-skills")
	fmt.Printf("🔄 Sincronizando skills de agentes desde: %s\n", skillsDir)

	// Ensure the skills source directory exists
	if err := os.MkdirAll(skillsDir, 0755); err != nil {
		return fmt.Errorf("error al crear el directorio de origen: %w", err)
	}

	// 1. Gather default and configured target directories
	targets, err := ActiveTargetDirs(cfg)
	if err != nil {
		return err
	}

	if len(targets) == 0 {
		fmt.Println("⚠️ No se encontraron agentes de IA instalados en las rutas habituales. Instala Claude, Codex, etc., o configúralos en config.yaml.")
		return nil
	}

	// 2. Read all skills in source folder
	skills, err := os.ReadDir(skillsDir)
	if err != nil {
		return fmt.Errorf("error al leer skills del repositorio: %w", err)
	}

	for _, skill := range skills {
		if !skill.IsDir() {
			continue
		}
		skillName := skill.Name()
		skillPath := filepath.Join(skillsDir, skillName)
		fmt.Printf("📦 Procesando skill: %s\n", skillName)

		for _, targetDir := range targets {
			// Ensure target skills directory exists
			if err := os.MkdirAll(targetDir, 0755); err != nil {
				fmt.Printf("  ❌ Error al crear carpeta destino %s: %v\n", targetDir, err)
				continue
			}

			destLink := filepath.Join(targetDir, skillName)

			// Clean existing links/folders if any
			if err := cleanExistingDest(destLink, skillName); err != nil {
				fmt.Printf("  ❌ Error limpiando destino %s: %v\n", destLink, err)
				continue
			}

			// Create symbolic link or junction
			if err := createOSLink(skillPath, destLink); err != nil {
				fmt.Printf("  ❌ Error enlazando %s a %s: %v\n", skillPath, destLink, err)
			} else {
				fmt.Printf("  ✅ Enlazado en: %s\n", destLink)
			}
		}
	}

	fmt.Println("🎉 ¡Sincronización de skills completada con éxito!")
	return nil
}

func cleanExistingDest(destLink string, name string) error {
	fi, err := os.Lstat(destLink)
	if err != nil {
		if os.IsNotExist(err) {
			return nil // Nothing to clean
		}
		return err
	}

	// Check if it is a symlink or junction (Reparse Point)
	isLink := (fi.Mode()&os.ModeSymlink != 0)

	// In Windows, a directory junction might not always have os.ModeSymlink set in some situations,
	// but standard Lstat on junctions shows them with ModeSymlink.
	// Let's also check if it's a directory but we can delete it if it is a link.
	if isLink {
		return os.Remove(destLink)
	}

	if fi.IsDir() {
		// It's a real directory. Backup it.
		backupPath := nextBackupPath(destLink)
		err := os.Rename(destLink, backupPath)
		if err != nil {
			return fmt.Errorf("no se pudo respaldar directorio existente: %w", err)
		}
		fmt.Printf("  ⚠️ Directorio real existente respaldado en: %s\n", backupPath)
		return nil
	}

	// Otherwise it's a file, remove it
	return os.Remove(destLink)
}

// nextBackupPath returns a free "*_backup" path so an older backup is never
// overwritten. The suffix is kept because "ucn skills clean" looks for it.
func nextBackupPath(destLink string) string {
	backupPath := destLink + "_backup"
	for n := 2; ; n++ {
		if _, err := os.Lstat(backupPath); os.IsNotExist(err) {
			return backupPath
		}
		backupPath = fmt.Sprintf("%s_%d_backup", destLink, n)
	}
}

func createOSLink(target, link string) error {
	if runtime.GOOS == "windows" {
		// Use Directory Junction on Windows (does not require admin privileges)
		// mklink /J Link Target
		// Target and link should use backslashes
		t := filepath.Clean(target)
		l := filepath.Clean(link)
		cmd := exec.Command("cmd", "/c", "mklink", "/J", l, t)
		output, err := cmd.CombinedOutput()
		if err != nil {
			return fmt.Errorf("%v: %s", err, string(output))
		}
		return nil
	}

	// Linux / macOS / Termux
	return os.Symlink(target, link)
}

// ActiveTargetDirs returns the ordered list of agent skill directories that
// are active on this device: standard agents whose base directory exists plus
// agents configured in config.yaml. The list has no duplicates.
func ActiveTargetDirs(cfg *config.Config) ([]string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil, fmt.Errorf("error al obtener directorio home: %w", err)
	}

	// Define standard targets
	standardTargets := []string{
		filepath.Join(home, ".agents", "skills"),
		filepath.Join(home, ".claude", "skills"),
		filepath.Join(home, ".codex", "skills"),
		filepath.Join(home, ".config", "opencode", "skills"),
		filepath.Join(home, ".copilot", "skills"),
		filepath.Join(home, ".cursor", "skills"),
		filepath.Join(home, ".hermes", "skills"),
		filepath.Join(home, ".antigravitycli", "skills"),
		filepath.Join(home, ".gemini", "skills"),
		filepath.Join(home, ".gemini", "antigravity-cli", "skills"),
	}

	var targets []string
	seen := make(map[string]bool)
	addTarget := func(target string) {
		if seen[target] {
			return
		}
		seen[target] = true
		targets = append(targets, target)
	}

	for _, target := range standardTargets {
		agentBase := filepath.Dir(target)
		// Special case for opencode custom path check
		if strings.HasSuffix(filepath.ToSlash(target), "/opencode/skills") {
			agentBase = filepath.Join(home, ".config", "opencode")
		}

		if stat, err := os.Stat(agentBase); err == nil && stat.IsDir() {
			addTarget(target)
		}
	}

	// Add user-defined targets from config if enabled
	for agentName, agentOpt := range cfg.Agents {
		if agentOpt.Enabled && agentOpt.Path != "" {
			expandedPath := config.ExpandHome(agentOpt.Path)
			if stat, err := os.Stat(expandedPath); err == nil && stat.IsDir() {
				// We sync inside /skills directory for that agent
				targetDir := filepath.Join(expandedPath, "skills")
				if !seen[targetDir] {
					fmt.Printf("💡 Agente configurado encontrado: %s -> %s\n", agentName, targetDir)
				}
				addTarget(targetDir)
			}
		}
	}

	return targets, nil
}
