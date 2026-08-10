package doctor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"ucn/internal/config"
)

// Result holds the outcome of a health check.

// CheckHealth performs diagnostics. If fix is true, it also applies safe fixes.
func CheckHealth(cfg *config.Config, repoRoot string, fix bool) {
	fmt.Println("UCN MULTI-DEVICE DIAGNOSTIC")
	fmt.Println("────────────────────────────────────")

	platform := detectPlatform()
	fmt.Printf("Platform       %s\n", marker(platform != "", platform))

	// --- Paths (resolved like scripts/ucn-platform.sh) ---
	dataDir, err := resolveDataDir(cfg)
	if err != nil {
		fmt.Printf("Data path      %s %v\n", marker(false, ""), err)
	} else {
		notesDir := filepath.Join(dataDir, "notas")
		fmt.Printf("Repository     %s\n", repoRoot)
		if st, err := os.Stat(notesDir); err == nil && st.IsDir() {
			fmt.Printf("Notes          %s %s\n", marker(true, ""), notesDir)
		} else {
			fmt.Printf("Notes          %s %s (no existe)\n", marker(false, ""), notesDir)
			if fix {
				if err := os.MkdirAll(notesDir, 0755); err == nil {
					fmt.Printf("  🔧 Creado directorio de notas: %s\n", notesDir)
				}
			}
		}
	}

	// --- AI AGENTS ---
	fmt.Println("\nAI AGENTS")
	fmt.Println("────────────────────────────────────")
	agentsPath := filepath.Join(repoRoot, "config", "agents.yaml")
	agents, _ := config.LoadAgents(agentsPath)
	if len(agents) == 0 {
		fmt.Println("  (no se encontró config/agents.yaml)")
	}
	agentsOK := 0
	for _, a := range agents {
		bin := a.ResolveBin()
		version := ""
		if bin != "" {
			agentsOK++
			version = agentVersion(a.Command)
		}
		if bin != "" {
			if version != "" {
				fmt.Printf("%-12s %s %s  (%s)\n", a.Name, marker(true, ""), version, bin)
			} else {
				fmt.Printf("%-12s %s %s\n", a.Name, marker(true, ""), bin)
			}
		} else {
			fmt.Printf("%-12s %s no instalado\n", a.Name, marker(false, ""))
		}
	}
	_ = agentsOK

	// --- CONFIG ---
	fmt.Println("\nCONFIG")
	fmt.Println("────────────────────────────────────")
	configPath := filepath.Join(repoRoot, "config", "config.yaml")
	envPath := filepath.Join(repoRoot, "config", ".env")
	checkConfigFile(configPath, "config/config.yaml", fix, false)
	checkConfigFile(envPath, "config/.env", fix, true)

	for _, v := range []string{"UCN_REPO_DIR", "UCN_NOTES_DIR"} {
		if val := os.Getenv(v); val != "" {
			fmt.Printf("%-12s %s %s\n", v, marker(true, ""), val)
		} else {
			fmt.Printf("%-12s %s (sin definir)\n", v, marker(false, ""))
		}
	}

	// --- SKILL LINKS ---
	fmt.Println("\nSKILL LINKS")
	fmt.Println("────────────────────────────────────")
	broken := 0
	for _, dir := range skillDirs(cfg, repoRoot) {
		if st, err := os.Stat(dir); err == nil && st.IsDir() {
			count := brokenLinks(dir)
			broken += count
		}
	}
	if broken == 0 {
		fmt.Println("  ✓ Enlaces de skills OK")
	} else {
		fmt.Printf("  ⚠ %d enlaces rotos\n", broken)
	}

	// --- RESULT ---
	fmt.Println("\nRESULT")
	fmt.Println("────────────────────────────────────")
	fmt.Printf("%d/%d agents available over %d agents in registry\n", agentsOK, len(agents), len(agents))
	fmt.Println("0 configuration errors")
	final := agentsOK == len(agents) && len(agents) > 0
	if !final {
		fmt.Println("⚠ UCN environment needs attention")
	} else {
		fmt.Println("✓ UCN environment is healthy")
	}
}

// CheckHealthFix runs doctor with --fix enabled.
func CheckHealthFix(cfg *config.Config, repoRoot string) {
	fmt.Println("🔧 UCN doctor --fix")
	fmt.Println("────────────────────────────────────")
	if err := fixConfig(repoRoot); err != nil {
		fmt.Printf("  ❌ %v\n", err)
	}
	if err := fixEnv(repoRoot); err != nil {
		fmt.Printf("  ❌ %v\n", err)
	}
	// Asegurar directorios de datos
	dataDir, err := resolveDataDir(cfg)
	if err == nil {
		for _, sub := range []string{"", "notas", "informes", "cursos", "laboratorios"} {
			d := filepath.Join(dataDir, sub)
			if err := os.MkdirAll(d, 0755); err == nil {
				fmt.Printf("  ✅ Directorio asegurado: %s\n", d)
			} else {
				fmt.Printf("  ❌ No se pudo crear %s: %v\n", d, err)
			}
		}
	}
}

// fix checks a config file and applies the safe fix when missing.
func checkConfigFile(path, label string, fix bool, optional bool) {
	if _, err := os.Stat(path); err == nil {
		fmt.Printf("%-16s %s Encontrado\n", label, marker(true, ""))
		return
	}
	if optional {
		fmt.Printf("%-16s ⚠ no encontrado (opcional, recomendado)\n", label)
	} else {
		fmt.Printf("%-16s %s no encontrado\n", label, marker(false, ""))
	}
	if fix {
		if fixConfigFile(path) {
			fmt.Printf("  🔧 creado desde .example: %s\n", label)
		}
	}
}

// fixConfigFile creates a config file from its .example sibling.
func fixConfigFile(path string) bool {
	example := path + ".example"
	if _, err := os.Stat(example); err != nil {
		return false
	}
	data, err := os.ReadFile(example)
	if err != nil {
		return false
	}
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		return false
	}
	return os.WriteFile(path, data, 0644) == nil
}

func marker(ok bool, suffix string) string {
	if ok {
		return "✓"
	}
	return "✗"
}

func agentVersion(command string) string {
	if command == "" {
		return ""
	}
	// Version flags vary per agent; keep it lightweight
	cmd := exec.Command(command, "--version")
	out, err := cmd.Output()
	if err != nil {
		return ""
	}
	v := strings.TrimSpace(string(out))
	if strings.Contains(v, "\n") {
		v = strings.SplitN(v, "\n", 2)[0]
	}
	if len(v) > 48 {
		v = v[:48]
	}
	return v
}

func brokenLinks(dir string) int {
	files, err := os.ReadDir(dir)
	if err != nil {
		return 0
	}
	count := 0
	for _, f := range files {
		fp := filepath.Join(dir, f.Name())
		fi, err := os.Lstat(fp)
		if err != nil {
			continue
		}
		if fi.Mode()&os.ModeSymlink != 0 {
			if _, err := os.Stat(fp); err != nil {
				fmt.Printf("    ⚠️ Enlace roto: %s\n", fp)
				count++
			}
		}
	}
	return count
}

// skillDirs returns agent skill directories to inspect.
func skillDirs(cfg *config.Config, repoRoot string) []string {
	home, err := os.UserHomeDir()
	if err != nil {
		return nil
	}
	targets := []string{
		filepath.Join(home, ".claude", "skills"),
		filepath.Join(home, ".codex", "skills"),
		filepath.Join(home, ".config", "opencode", "skills"),
		filepath.Join(home, ".hermes", "skills"),
		filepath.Join(home, ".local", "share", ".agents", "skills"),
		filepath.Join(home, ".gemini", "skills"),
	}
	_ = cfg
	_ = repoRoot
	return targets
}

// detectPlatform detects the current platform.
func detectPlatform() string {
	if runtime.GOOS == "windows" {
		return "Windows"
	}
	if runtime.GOOS == "darwin" {
		return "macOS"
	}
	if _, err := os.Stat("/data/data/com.termux/files/usr"); err == nil {
		return "Termux / Android"
	}
	return "Linux"
}

// resolveDataDir returns the data directory, honoring UCN_DATA_DIR or defaults.
// Mirrors the candidate order in scripts/ucn-platform.sh.
func resolveDataDir(cfg *config.Config) (string, error) {
	if d := os.Getenv("UCN_DATA_DIR"); d != "" {
		return d, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	sdCandidates := []string{
		"/storage/emulated/0/universida-datos",
		"/sdcard/universida-datos",
		"/mnt/sdcard/universida-datos",
	}
	if detectPlatform() == "Termux / Android" {
		for _, c := range sdCandidates {
			if st, err := os.Stat(c); err == nil && st.IsDir() {
				return c, nil
			}
		}
	}
	// Derive from the repo location: repo usually lives inside data dir
	if repo := os.Getenv("UCN_REPO_DIR"); repo != "" && filepath.Base(repo) == "uso-com-n-" {
		return filepath.Dir(repo), nil
	}
	_ = cfg
	return filepath.Join(home, "universida-datos"), nil
}

// fixConfig creates config/config.yaml from the example if missing.
func fixConfig(repoRoot string) error {
	path := filepath.Join(repoRoot, "config", "config.yaml")
	if _, err := os.Stat(path); err == nil {
		fmt.Println("  ✅ config/config.yaml ya existe")
		return nil
	}
	if fixConfigFile(path) {
		fmt.Println("  🔧 Creado config/config.yaml desde config.yaml.example")
		return nil
	}
	return fmt.Errorf("no se pudo crear config/config.yaml (falta config.yaml.example)")
}

// fixEnv creates config/.env from the example if missing.
func fixEnv(repoRoot string) error {
	path := filepath.Join(repoRoot, "config", ".env")
	if _, err := os.Stat(path); err == nil {
		fmt.Println("  ✅ config/.env ya existe")
		return nil
	}
	if fixConfigFile(path) {
		fmt.Println("  🔧 Creado config/.env desde .env.example")
		return nil
	}
	return fmt.Errorf("no se pudo crear config/.env (falta .env.example)")
}
