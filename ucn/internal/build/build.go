package build

import (
	"fmt"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

// BinaryName returns the compiled UCN CLI binary name for the current OS.
func BinaryName() string {
	if runtime.GOOS == "windows" {
		return "ucn.exe"
	}
	return "ucn"
}

// BinaryPath returns the compiled CLI path inside the repository.
func BinaryPath(repoRoot string) string {
	return filepath.Join(repoRoot, "ucn", BinaryName())
}

// Build compiles the UCN CLI (ucn/cmd/ucn) into the repository.
// Returns an error if Go is not installed or the build fails.
func Build(repoRoot string) error {
	goBin, err := exec.LookPath("go")
	if err != nil {
		return fmt.Errorf("Go no esta instalado. Instala Go o compila manualmente: cd ucn && go build -o %s ./cmd/ucn/", BinaryName())
	}
	out := BinaryPath(repoRoot)
	cmd := exec.Command(goBin, "build", "-o", out, "./cmd/ucn/")
	cmd.Dir = filepath.Join(repoRoot, "ucn")
	if output, err := cmd.CombinedOutput(); err != nil {
		return fmt.Errorf("go build fallo: %v: %s", err, strings.TrimSpace(string(output)))
	}
	return nil
}
