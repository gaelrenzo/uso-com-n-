package git

import (
	"fmt"
	"os/exec"
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

	// Check if there are changes to commit
	statusCmd := exec.Command("git", "status", "--porcelain")
	statusCmd.Dir = repoRoot
	statusOut, err := statusCmd.Output()
	if err != nil {
		return fmt.Errorf("error al verificar estado del git: %v", err)
	}

	if len(statusOut) == 0 {
		fmt.Println("✅ No hay cambios nuevos para subir.")
		return nil
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
