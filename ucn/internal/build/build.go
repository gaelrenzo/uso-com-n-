package build

import (
	"fmt"
	"io"
	"os"
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
	return BuildTo(repoRoot, BinaryPath(repoRoot))
}

// BuildTo compiles the UCN CLI into the specified output path.
// If direct compilation fails (for example, on Android sdcardfs/FUSE filesystems
// where file locking returns "RLock: function not implemented"), it falls back
// to building in a temporary directory on a POSIX filesystem.
func BuildTo(repoRoot, out string) error {
	goBin, err := exec.LookPath("go")
	if err != nil {
		return fmt.Errorf("Go no esta instalado. Instala Go o compila manualmente: cd ucn && go build -o %s ./cmd/ucn/", BinaryName())
	}

	srcDir := filepath.Join(repoRoot, "ucn")

	tmpDir, err := os.MkdirTemp("", "ucn-build-*")
	if err != nil {
		return fmt.Errorf("no se pudo crear directorio temporal para build: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	tmpOut := filepath.Join(tmpDir, BinaryName())

	// First try building directly from the source directory
	cmd := exec.Command(goBin, "build", "-o", tmpOut, "./cmd/ucn/")
	cmd.Dir = srcDir
	if output, err := cmd.CombinedOutput(); err != nil {
		// Fallback: copy source to temporary directory to support filesystems
		// without file locking (e.g. Android FUSE / storage / sdcard)
		tmpSrc := filepath.Join(tmpDir, "src")
		if errCopy := copyDir(srcDir, tmpSrc); errCopy != nil {
			return fmt.Errorf("go build fallo: %v: %s", err, strings.TrimSpace(string(output)))
		}
		cmd = exec.Command(goBin, "build", "-o", tmpOut, "./cmd/ucn/")
		cmd.Dir = tmpSrc
		if fallbackOut, fallbackErr := cmd.CombinedOutput(); fallbackErr != nil {
			return fmt.Errorf("go build fallo: %v: %s", fallbackErr, strings.TrimSpace(string(fallbackOut)))
		}
	}

	if err := copyFile(tmpOut, out); err != nil {
		return fmt.Errorf("error al escribir binario en %s: %w", out, err)
	}

	postInstall(out)
	return nil
}

func copyDir(src, dst string) error {
	return filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rel, err := filepath.Rel(src, path)
		if err != nil {
			return err
		}
		target := filepath.Join(dst, rel)
		if info.IsDir() {
			return os.MkdirAll(target, 0755)
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		return copyFile(path, target)
	})
}

func copyFile(src, dst string) error {
	if err := os.MkdirAll(filepath.Dir(dst), 0755); err != nil {
		return err
	}
	sf, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sf.Close()

	tmpDst := dst + ".tmp"
	df, err := os.OpenFile(tmpDst, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0755)
	if err != nil {
		return err
	}
	if _, err := io.Copy(df, sf); err != nil {
		df.Close()
		_ = os.Remove(tmpDst)
		return err
	}
	if err := df.Close(); err != nil {
		_ = os.Remove(tmpDst)
		return err
	}
	return os.Rename(tmpDst, dst)
}

func postInstall(out string) {
	_ = os.Chmod(out, 0755)
	if runtime.GOOS == "windows" {
		return
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return
	}
	binDir := filepath.Join(home, ".local", "bin")
	target := filepath.Join(binDir, BinaryName())
	if target == out {
		return
	}
	if stat, err := os.Stat(binDir); err == nil && stat.IsDir() {
		_ = copyFile(out, target)
		_ = os.Chmod(target, 0755)
	}
}
