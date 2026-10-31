package build

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestBinaryPathIsInsideRepo(t *testing.T) {
	got := BinaryPath("/repo")
	if !strings.HasPrefix(filepath.ToSlash(got), "/repo/ucn/ucn") {
		t.Fatalf("ruta: %s", got)
	}
}

func TestCopyDirCopiesRegularFiles(t *testing.T) {
	src := t.TempDir()
	if err := os.MkdirAll(filepath.Join(src, "a", "b"), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(src, "a", "b", "f.go"), []byte("x"), 0644); err != nil {
		t.Fatal(err)
	}
	dst := filepath.Join(t.TempDir(), "copia")
	if err := copyDir(src, dst); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join(dst, "a", "b", "f.go"))
	if err != nil || string(data) != "x" {
		t.Fatalf("%q %v", data, err)
	}
	if _, err := os.Stat(filepath.Join(dst, "a", "b", "f.go.tmp")); !os.IsNotExist(err) {
		t.Fatal("no debe quedar el archivo temporal")
	}
}
