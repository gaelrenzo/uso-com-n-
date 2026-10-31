package doctor

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestFixConfigFileCopiesExampleOnlyIfPresent(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.yaml")
	if fixConfigFile(path) {
		t.Fatal("sin plantilla no debe crear nada")
	}
	if err := os.WriteFile(path+".example", []byte("a: 1\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if !fixConfigFile(path) {
		t.Fatal("debe crear desde la plantilla")
	}
	data, _ := os.ReadFile(path)
	if string(data) != "a: 1\n" {
		t.Fatalf("contenido: %q", data)
	}
}

func TestBrokenLinks(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("requiere symlinks")
	}
	dir := t.TempDir()
	if err := os.Symlink(filepath.Join(dir, "no-existe"), filepath.Join(dir, "rota")); err != nil {
		t.Fatal(err)
	}
	target := filepath.Join(dir, "skill")
	if err := os.Mkdir(target, 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.Symlink(target, filepath.Join(dir, "valida")); err != nil {
		t.Fatal(err)
	}
	if got := brokenLinks(dir); got != 1 {
		t.Fatalf("enlaces rotos: %d", got)
	}
	if got := brokenLinks(filepath.Join(dir, "no-hay")); got != 0 {
		t.Fatalf("carpeta inexistente: %d", got)
	}
}
