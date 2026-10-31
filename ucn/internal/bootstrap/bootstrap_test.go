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
