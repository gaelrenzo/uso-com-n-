package bootstrap

import (
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	ucnbuild "ucn/internal/build"
	"ucn/internal/config"
	"ucn/internal/sync"
)

// Run prepares a device so it matches the rest of the fleet:
// config files, data dirs, shell hook, skills sync and agent check.
// It is safe to run multiple times (idempotent).
func Run(cfg *config.Config, repoRoot string) error {
	fmt.Println("🚀 UCN bootstrap - configurando este dispositivo")
	fmt.Println("────────────────────────────────────────────────")

	platform := detectPlatform()
	fmt.Printf("Detecting platform... %s ✓\n", platform)

	// 1. Config files (from .example if missing)
	if err := ensureConfigFile(repoRoot, "config.yaml"); err != nil {
		return err
	}
	if err := ensureConfigFile(repoRoot, ".env"); err != nil {
		return err
	}

	// 2. Data directories
	dataDir, err := resolveDataDir()
	if err != nil {
		fmt.Printf("  ⚠ No se pudo resolver directorio de datos: %v\n", err)
	} else {
		for _, sub := range []string{"", "notas", "informes", "cursos", "laboratorios"} {
			d := filepath.Join(dataDir, sub)
			if st, err := os.Stat(d); err == nil && st.IsDir() {
				fmt.Printf("Directory.. %s ✓\n", d)
			} else if err := os.MkdirAll(d, 0755); err == nil {
				fmt.Printf("Directory.. %s ✓ (creado)\n", d)
			} else {
				fmt.Printf("Directory.. %s ✗ (%v)\n", d, err)
			}
		}
	}

	// 3. Shell hook (bash / termux)
	if err := installShellHook(repoRoot); err != nil {
		fmt.Printf("  ⚠ Hook de shell: %v\n", err)
	} else {
		fmt.Println("Shell hook... fuente de termux-bash/termux-bash.sh ✓")
	}

	// 4. Skills sync (best effort, re-links all agents)
	fmt.Println("\nSincronizando skills de agentes...")
	if err := sync.SyncSkills(cfg, repoRoot); err != nil {
		fmt.Printf("  ⚠ Sync de skills incompleto: %v\n", err)
	}

	// 5. Agent check
	agentsPath := filepath.Join(repoRoot, "config", "agents.yaml")
	agents, _ := config.LoadAgents(agentsPath)
	if len(agents) > 0 {
		fmt.Println("\nAI AGENTS")
		ok := 0
		for _, a := range agents {
			if bin := a.ResolveBin(); bin != "" {
				fmt.Printf("  %-10s ✓ %s\n", a.Name, bin)
				ok++
			} else {
				fmt.Printf("  %-10s ✗ no instalado\n", a.Name)
			}
		}
		fmt.Printf("\n%d/%d agentes disponibles\n", ok, len(agents))
	}

	fmt.Println("────────────────────────────────────────────────")
	fmt.Println("🎉 Dispositivo configurado. Cierra y abre la terminal (source ~/.bashrc).")
	fmt.Println("Verifica con: ucn doctor")
	return nil
}

// detectPlatform returns the platform name.
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

// ensureConfigFile copies a file from its .example sibling if missing.
func ensureConfigFile(repoRoot, name string) error {
	configDir := filepath.Join(repoRoot, "config")
	dst := filepath.Join(configDir, name)
	example := dst + ".example"
	if _, err := os.Stat(dst); err == nil {
		fmt.Printf("Config....... %s ✓\n", name)
		return nil
	}
	data, err := os.ReadFile(example)
	if err != nil {
		fmt.Printf("Config....... %s ⚠ (no existe plantilla %s)\n", name, filepath.Base(example))
		return nil
	}
	if err := os.MkdirAll(configDir, 0755); err != nil {
		return err
	}
	if err := os.WriteFile(dst, data, 0644); err != nil {
		return err
	}
	fmt.Printf("Config....... %s ✓ (creado desde %s.example)\n", name, name)
	return nil
}

// installShellHook adds the source of termux-bash.sh to ~/.bashrc (POSIX).
func installShellHook(repoRoot string) error {
	if runtime.GOOS == "windows" {
		// Windows uses the PowerShell profile, handled by install instructions.
		fmt.Println("  ℹ En Windows, copia el perfil: laptop-powershell/Microsoft.PowerShell_profile.ps1")
		return nil
	}

	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}
	bashrc := filepath.Join(home, ".bashrc")
	hook := fmt.Sprintf("source %q", filepath.Join(repoRoot, "termux-bash", "termux-bash.sh"))

	fh, err := os.OpenFile(bashrc, os.O_APPEND|os.O_CREATE|os.O_RDWR, 0644)
	if err != nil {
		return err
	}
	defer fh.Close()

	existing, err := os.ReadFile(bashrc)
	if err == nil && strings.Contains(string(existing), "termux-bash.sh") {
		return nil // already installed
	}
	if _, err := fmt.Fprintf(fh, "\n# UCN - configuracion sincronizada via GitHub\n%s\n", hook); err != nil {
		return err
	}
	return nil
}

// resolveDataDir mirrors scripts/ucn-platform.sh candidates.
func resolveDataDir() (string, error) {
	if d := os.Getenv("UCN_DATA_DIR"); d != "" {
		return d, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	if detectPlatform() == "Termux / Android" {
		for _, c := range []string{"/storage/emulated/0/universida-datos", "/sdcard/universida-datos", "/mnt/sdcard/universida-datos"} {
			if st, err := os.Stat(c); err == nil && st.IsDir() {
				return c, nil
			}
		}
	}
	if repo := os.Getenv("UCN_REPO_DIR"); repo != "" && filepath.Base(repo) == "uso-com-n-" {
		return filepath.Dir(repo), nil
	}
	return filepath.Join(home, "universida-datos"), nil
}

// BuildAndInstall compiles the Go CLI and installs it to ~/.local/bin/ucn
// for convenience (Termux/Linux/macOS). Returns the bin path or an error.
func BuildAndInstall(repoRoot string) (string, error) {
	if runtime.GOOS == "windows" {
		return "", fmt.Errorf("en Windows usa: go build -o ucn.exe cmd/ucn/main.go")
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	binDir := filepath.Join(home, ".local", "bin")
	if err := os.MkdirAll(binDir, 0755); err != nil {
		return "", err
	}
	out := filepath.Join(binDir, "ucn")
	if err := ucnbuild.BuildTo(repoRoot, out); err != nil {
		return "", err
	}
	return out, nil
}
