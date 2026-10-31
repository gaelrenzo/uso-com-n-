package git

import (
	"errors"
	"fmt"
	"os/exec"
	"strings"
	"ucn/internal/secrets"
)

// Pull runs "git pull --rebase" in the repo directory
func Pull(repoRoot string) error {
	fmt.Println("📥 Actualizando repositorio local (git pull --rebase)...")
	cmd := exec.Command("git", "pull", "--rebase")
	cmd.Dir = repoRoot
	output, err := cmd.CombinedOutput()
	if err != nil {
		return fmt.Errorf("error al ejecutar git pull: %v\nOutput: %s", err, string(output))
	}
	fmt.Println(string(output))
	return nil
}

// hasStagedChanges reports whether the index differs from HEAD.
func hasStagedChanges(repoRoot string) (bool, error) {
	cmd := exec.Command("git", "diff", "--cached", "--quiet")
	cmd.Dir = repoRoot
	err := cmd.Run()
	if err == nil {
		return false, nil
	}
	var exitErr *exec.ExitError
	if errors.As(err, &exitErr) && exitErr.ExitCode() == 1 {
		return true, nil
	}
	return false, err
}

// checkStaged blocks private paths and credentials before they are committed.
func checkStaged(repoRoot string) error {
	names := exec.Command("git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z")
	names.Dir = repoRoot
	out, err := names.Output()
	if err != nil {
		return fmt.Errorf("error al listar cambios: %v", err)
	}

	var problems []string
	for _, name := range strings.Split(string(out), "\x00") {
		if name == "" {
			continue
		}
		if secrets.BlockedPath(name) {
			problems = append(problems, name+": archivo privado")
			continue
		}
		show := exec.Command("git", "show", ":"+name)
		show.Dir = repoRoot
		content, err := show.Output()
		if err != nil {
			return fmt.Errorf("error al leer %s: %v", name, err)
		}
		for _, finding := range secrets.Scan(name, content) {
			problems = append(problems, finding.String())
		}
	}
	if len(problems) > 0 {
		return fmt.Errorf("push bloqueado, no se subio nada:\n  %s", strings.Join(problems, "\n  "))
	}
	return nil
}

// SafePush runs "git add --ignore-removal", commits with a message, and pushes
func SafePush(repoRoot string, message string, ignoreRemoval bool) error {
	if message == "" {
		message = "sync: actualización automática de skills"
	}

	addArgs := []string{"add"}
	if ignoreRemoval {
		fmt.Println("🛡️ Preparando cambios en modo seguro (git add --ignore-removal)...")
		addArgs = append(addArgs, "--ignore-removal", ".")
	} else {
		fmt.Println("📝 Preparando cambios con git add . ...")
		addArgs = append(addArgs, ".")
	}

	addCmd := exec.Command("git", addArgs...)
	addCmd.Dir = repoRoot
	if output, err := addCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("error en git add: %v\nOutput: %s", err, string(output))
	}

	// Only staged changes can be committed: with --ignore-removal a deletion
	// stays unstaged, so "git status" would report work that commit rejects.
	staged, err := hasStagedChanges(repoRoot)
	if err != nil {
		return fmt.Errorf("error al verificar estado del git: %v", err)
	}

	if !staged {
		fmt.Println("✅ No hay cambios nuevos para subir.")
		return nil
	}

	if err := checkStaged(repoRoot); err != nil {
		unstage := exec.Command("git", "reset", "-q")
		unstage.Dir = repoRoot
		_ = unstage.Run()
		return err
	}

	fmt.Printf("💾 Creando commit: \"%s\"...\n", message)
	commitCmd := exec.Command("git", "commit", "-m", message)
	commitCmd.Dir = repoRoot
	if output, err := commitCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("error en git commit: %v\nOutput: %s", err, string(output))
	}

	fmt.Println("🚀 Subiendo cambios a GitHub (git push)...")
	pushCmd := exec.Command("git", "push")
	pushCmd.Dir = repoRoot
	if output, err := pushCmd.CombinedOutput(); err != nil {
		return fmt.Errorf("error en git push: %v\nOutput: %s", err, string(output))
	}

	fmt.Println("🎉 ¡Cambios subidos a GitHub con éxito!")
	return nil
}
