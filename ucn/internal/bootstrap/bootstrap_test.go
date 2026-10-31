package bootstrap

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestInstallShellHookMigratesLegacyAndStaysIdempotent(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Windows usa el perfil de PowerShell")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)
	bashrc := filepath.Join(home, ".bashrc")
	if err := os.WriteFile(bashrc, []byte("source /repo/skills/skills.sh\n"), 0644); err != nil {
		t.Fatal(err)
	}
	for i := 0; i < 2; i++ {
		if err := installShellHook("/repo"); err != nil {
			t.Fatal(err)
		}
	}
	data, err := os.ReadFile(bashrc)
	if err != nil {
		t.Fatal(err)
	}
	content := string(data)
	if strings.Contains(content, "skills/skills.sh") {
		t.Fatalf("hook antiguo sin migrar: %s", content)
	}
	if strings.Count(content, "termux-bash.sh") != 1 {
		t.Fatalf("debe existir un solo hook: %s", content)
	}
}

func TestInstallShellHookCreatesBashrc(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Windows usa el perfil de PowerShell")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)
	if err := installShellHook("/repo"); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join(home, ".bashrc"))
	if err != nil || !strings.Contains(string(data), "termux-bash/termux-bash.sh") {
		t.Fatalf("hook no creado: %q, %v", data, err)
	}
}

func TestStaleHookGetsReplacementAndUserBlockStays(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("Windows usa el perfil de PowerShell")
	}
	home := t.TempDir()
	t.Setenv("HOME", home)
	bashrc := filepath.Join(home, ".bashrc")
	old := "if [ -f \"/no/existe/termux-bash/termux-bash.sh\" ]; then\n    source \"/no/existe/termux-bash/termux-bash.sh\"\nfi\n"
	if err := os.WriteFile(bashrc, []byte(old), 0644); err != nil {
		t.Fatal(err)
	}
	repo := t.TempDir()
	if err := installShellHook(repo); err != nil {
		t.Fatal(err)
	}
	if err := installShellHook(repo); err != nil {
		t.Fatal(err)
	}
	data, _ := os.ReadFile(bashrc)
	content := string(data)
	if !strings.HasPrefix(content, old) {
		t.Fatalf("el bloque del usuario debe quedar intacto: %s", content)
	}
	if strings.Count(content, filepath.Join(repo, "termux-bash", "termux-bash.sh")) != 1 {
		t.Fatalf("debe agregarse un hook nuevo: %s", content)
	}
}

func TestExistingHookIsKept(t *testing.T) {
	script := filepath.Join(t.TempDir(), "termux-bash.sh")
	if err := os.WriteFile(script, nil, 0644); err != nil {
		t.Fatal(err)
	}
	if !hookIsCurrent("source \""+script+"\"\n", "/otro/termux-bash.sh") {
		t.Fatal("un hook que existe es valido aunque sea de otra ruta")
	}
}
