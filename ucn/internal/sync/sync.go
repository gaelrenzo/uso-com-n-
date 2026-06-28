package sync

import (
	"fmt"
	"io/fs"
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
	home, err := os.UserHomeDir()
	if err != nil {
		return fmt.Errorf("error al obtener directorio home: %w", err)
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

	// Active targets set to avoid duplicates
	activeTargets := make(map[string]bool)

	for _, target := range standardTargets {
		agentBase := filepath.Dir(target)
		// Special case for opencode custom path check
		if strings.HasSuffix(filepath.ToSlash(target), "/opencode/skills") {
			agentBase = filepath.Join(home, ".config", "opencode")
		}

		if stat, err := os.Stat(agentBase); err == nil && stat.IsDir() {
			activeTargets[target] = true
		}
	}

	// Add user-defined targets from config if enabled
	for agentName, agentOpt := range cfg.Agents {
		if agentOpt.Enabled && agentOpt.Path != "" {
			expandedPath := config.ExpandHome(agentOpt.Path)
			if stat, err := os.Stat(expandedPath); err == nil && stat.IsDir() {
				// We sync inside /skills directory for that agent
				targetDir := filepath.Join(expandedPath, "skills")
				activeTargets[targetDir] = true
				fmt.Printf("💡 Agente configurado encontrado: %s -> %s\n", agentName, targetDir)
			}
		}
	}

	if len(activeTargets) == 0 {
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

		for targetDir := range activeTargets {
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
		backupPath := destLink + "_backup"
		// If backup already exists, remove it first
		if _, err := os.Stat(backupPath); err == nil {
			_ = os.RemoveAll(backupPath)
		}
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
