package doctor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"ucn/internal/config"
)

// CheckHealth performs diagnostics on dependencies, environment variables and links
func CheckHealth(cfg *config.Config, repoRoot string) {
	fmt.Println("🏥 Iniciando diagnóstico de salud del sistema (ucn doctor)...")
	fmt.Println("=================================================================")

	// 1. Dependency checks
	dependencies := []struct {
		name string
		cmd  string
		args []string
	}{
		{"Git", "git", []string{"--version"}},
		{"Node.js", "node", []string{"--version"}},
		{"NPM", "npm", []string{"--version"}},
		{"Live-Server", "live-server", []string{"--version"}},
		{"Cloudflared", "cloudflared", []string{"--version"}},
	}

	for _, dep := range dependencies {
		cmd := exec.Command(dep.cmd, dep.args...)
		if err := cmd.Run(); err != nil {
			fmt.Printf("❌ %s: NO instalado o no disponible en el PATH\n", dep.name)
		} else {
			fmt.Printf("✅ %s: Instalado y accesible\n", dep.name)
		}
	}

	// 2. Config files checks
	configPath := filepath.Join(repoRoot, "config", "config.yaml")
	envPath := filepath.Join(repoRoot, "config", ".env")

	if _, err := os.Stat(configPath); err != nil {
		fmt.Println("❌ config/config.yaml: NO encontrado. Crea uno copiando config.yaml.example")
	} else {
		fmt.Println("✅ config/config.yaml: Encontrado")
	}

	if _, err := os.Stat(envPath); err != nil {
		fmt.Println("⚠️  config/.env: NO encontrado (Opcional, pero recomendado para tokens)")
	} else {
		fmt.Println("✅ config/.env: Encontrado")
	}

	// 3. Symlink / Junction health checks
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("❌ No se pudo obtener directorio home: %v\n", err)
		return
	}

	// Build target list from config + standard defaults
	targets := buildAgentTargets(cfg, home)

	fmt.Println("\n🔍 Analizando enlaces de skills en agentes locales:")
	for _, target := range targets {
		if stat, err := os.Stat(target); err == nil && stat.IsDir() {
			fmt.Printf("  📁 Encontrado directorio de skills en: %s\n", target)
			// Look for broken links
			files, err := os.ReadDir(target)
			if err == nil {
				for _, f := range files {
					filePath := filepath.Join(target, f.Name())
					fi, err := os.Lstat(filePath)
					if err == nil && (fi.Mode()&os.ModeSymlink != 0) {
						_, statErr := os.Stat(filePath)
						if statErr != nil {
							fmt.Printf("    ⚠️ Enlace roto detectado: %s\n", f.Name())
						}
					}
				}
			}
		}
	}

	fmt.Println("=================================================================")
	fmt.Println("🎉 Diagnóstico finalizado.")
}

// buildAgentTargets builds the list of skill directories from config and defaults
func buildAgentTargets(cfg *config.Config, home string) []string {
	seen := make(map[string]bool)
	var targets []string

	// Standard targets
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

	for _, t := range standardTargets {
		if !seen[t] {
			targets = append(targets, t)
			seen[t] = true
		}
	}

	// Add from config
	if cfg != nil {
		for _, agentOpt := range cfg.Agents {
			if agentOpt.Enabled && agentOpt.Path != "" {
				expandedPath := config.ExpandHome(agentOpt.Path)
				targetDir := filepath.Join(expandedPath, "skills")
				if !seen[targetDir] {
					targets = append(targets, targetDir)
					seen[targetDir] = true
				}
			}
		}
	}

	return targets
}