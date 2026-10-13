package update

import (
	"fmt"
	"os"
	"os/exec"
	"strings"
	ucnbuild "ucn/internal/build"
	"ucn/internal/config"
	"ucn/internal/git"
	"ucn/internal/sync"
)

// Run performs the update flow: fetch, detect changes, pull, sync skills,
// fix config and run quick doctor. With checkOnly it only reports availability.
// With build it also recompiles the ucn CLI after the update.
func Run(cfg *config.Config, repoRoot string, checkOnly bool, build bool) error {
	fmt.Println("🔄 UCN UPDATE")
	fmt.Println("──────────────────────────────")

	// 1. Git disponible?
	if err := runGit(repoRoot, "rev-parse", "--is-inside-work-tree"); err != nil {
		return fmt.Errorf("el repositorio no es un worktree git: %v", err)
	}
	fmt.Println("Repository... ✓ git disponible")

	// 2. Fetch remoto para comparar
	if err := runGit(repoRoot, "fetch", "origin"); err != nil {
		fmt.Println("  ⚠ No se pudo hacer git fetch (sin red?). Se usa el estado local.")
	}

	// 3. Detectar rama actual y commits pendientes
	branch := currentBranch(repoRoot)
	behind := 0
	if d, _ := remoteDivergence(repoRoot, branch); d >= 0 {
		behind = d
	}
	ahead := 0
	if a, _ := remoteAhead(repoRoot, branch); a >= 0 {
		ahead = a
	}
	if behind == 0 && ahead == 0 {
		fmt.Println("Changes..... ✓ al dia")
	} else if behind == 0 && ahead > 0 {
		fmt.Printf("Changes..... ✓ al dia con remoto (%d commits locales pendientes de push)\n", ahead)
	} else if behind > 0 && ahead == 0 {
		fmt.Printf("Changes..... %d nuevos commits disponibles\n", behind)
	} else if behind > 0 && ahead > 0 {
		fmt.Printf("Changes..... %d nuevos commits disponibles (%d locales pendientes de push)\n", behind, ahead)
	} else {
		fmt.Println("Changes..... ⚠ la rama difiere del remoto")
	}

	if checkOnly {
		if behind > 0 {
			fmt.Println("→ Ejecuta 'ucn update' para aplicarlos.")
		} else if ahead > 0 {
			fmt.Println("→ Ejecuta 'ucn push' para subir tus commits locales a GitHub.")
		} else {
			fmt.Println("✓ UCN esta al dia.")
		}
		fmt.Println("──────────────────────────────")
		return nil
	}

	// 4. Aplicar pull --rebase (salvo que no haya nada que traer)
	if behind > 0 {
		if err := git.Pull(repoRoot); err != nil {
			fmt.Printf("  ⚠ Pull con conflictos: %v\n", err)
			fmt.Println("  Resuelve los conflictos y vuelve a ejecutar ucn update.")
		}
	} else {
		fmt.Println("Pull........ ✓ nothing to pull")
	}

	// 5. Elegir si los cambios del repo afectan config (asegurar plantillas)
	if _, err := os.Stat(repoRoot + "/config/config.yaml"); err != nil {
		fmt.Println("Config...... 🔧 (faltante, se creara en doctor --fix)")
	}

	// 6. Re-sincronizar skills
	fmt.Println("\nSincronizando skills...")
	if err := sync.SyncSkills(cfg, repoRoot); err != nil {
		fmt.Printf("  ⚠ Sync de skills: %v\n", err)
	}

	// 7. Estado de agentes
	agentsPath := repoRoot + "/config/agents.yaml"
	agents, _ := config.LoadAgents(agentsPath)
	if len(agents) > 0 {
		ok := 0
		for _, a := range agents {
			if a.ResolveBin() != "" {
				ok++
			}
		}
		fmt.Printf("Agents...... %d/%d disponibles\n", ok, len(agents))
	}

	// 8. (Opcional) Recompilar el CLI ucn
	if build {
		fmt.Println("\n🔨 Reconstruyendo el CLI ucn...")
		if err := ucnbuild.Build(repoRoot); err != nil {
			fmt.Printf("  ⚠ %v\n", err)
		} else {
			fmt.Printf("  ✅ Binario actualizado: %s\n", ucnbuild.BinaryPath(repoRoot))
		}
	}

	fmt.Println("──────────────────────────────")
	fmt.Println("✓ UCN actualizado. Verifica con: ucn doctor")
	return nil
}

// currentBranch returns the local branch name (e.g. "main").
func currentBranch(repoRoot string) string {
	out, err := exec.Command("git", "-C", repoRoot, "symbolic-ref", "--short", "HEAD").Output()
	if err != nil {
		return "main"
	}
	return strings.TrimSpace(string(out))
}

// remoteDivergence returns how many commits the local branch is behind
// its upstream. A negative value means it cannot be determined.
func remoteDivergence(repoRoot, branch string) (int, error) {
	out, err := exec.Command("git", "-C", repoRoot, "rev-list", "--count", "HEAD..origin/"+branch).Output()
	if err != nil {
		return -1, err
	}
	n := 0
	_, _ = fmt.Sscan(strings.TrimSpace(string(out)), &n)
	return n, nil
}

// remoteAhead returns how many commits the local branch is ahead of its upstream.
func remoteAhead(repoRoot, branch string) (int, error) {
	out, err := exec.Command("git", "-C", repoRoot, "rev-list", "--count", "origin/"+branch+"..HEAD").Output()
	if err != nil {
		return -1, err
	}
	n := 0
	_, _ = fmt.Sscan(strings.TrimSpace(string(out)), &n)
	return n, nil
}

func runGit(repoRoot string, args ...string) error {
	cmd := exec.Command("git", append([]string{"-C", repoRoot}, args...)...)
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("%v: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}
