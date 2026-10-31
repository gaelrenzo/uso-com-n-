package personal

import (
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func write(t *testing.T, path, content string) {
	t.Helper()
	if err := os.MkdirAll(filepath.Dir(path), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
}

func read(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return string(data)
}

func setup(t *testing.T) (repo, home string) {
	t.Helper()
	repo, home = t.TempDir(), t.TempDir()
	t.Setenv("HOME", home)
	t.Setenv("USERPROFILE", home)
	write(t, filepath.Join(repo, filepath.FromSlash(rulesDir), "01.md"), "compartida\n")
	write(t, filepath.Join(repo, filepath.FromSlash(settingsFile)), `{"theme": "dark", "nuevo": true}`)
	return repo, home
}

func TestApplyKeepsLocalVersionsAsBackup(t *testing.T) {
	repo, home := setup(t)
	rule := filepath.Join(home, ".claude", "rules", "01.md")
	write(t, rule, "mia\n")
	write(t, filepath.Join(home, ".claude", "settings.json"), `{"theme": "light", "propio": 1}`)

	if err := Apply(repo); err != nil {
		t.Fatal(err)
	}
	if read(t, rule) != "compartida\n" || read(t, rule+".bak") != "mia\n" {
		t.Fatal("la regla local debe quedar respaldada")
	}
	var got map[string]any
	if err := json.Unmarshal([]byte(read(t, filepath.Join(home, ".claude", "settings.json"))), &got); err != nil {
		t.Fatal(err)
	}
	if got["theme"] != "light" || got["propio"] != float64(1) || got["nuevo"] != true {
		t.Fatalf("ajustes: %v", got)
	}
	if err := Apply(repo); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(rule + ".2.bak"); !os.IsNotExist(err) {
		t.Fatal("repetir no debe crear mas respaldos")
	}
}

func TestApplySkipsDeviceWithoutClaude(t *testing.T) {
	repo, home := setup(t)
	if err := Apply(repo); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(filepath.Join(home, ".claude")); !os.IsNotExist(err) {
		t.Fatal("no debe crear ~/.claude")
	}
}

func TestApplyDoesNotTouchInvalidSettings(t *testing.T) {
	repo, home := setup(t)
	settings := filepath.Join(home, ".claude", "settings.json")
	write(t, settings, "{roto")
	if err := Apply(repo); err == nil {
		t.Fatal("debe avisar del JSON invalido")
	}
	if read(t, settings) != "{roto" {
		t.Fatal("no debe modificar el archivo")
	}
}

func TestSaveCopiesRulesAndRejectsSecrets(t *testing.T) {
	repo, home := setup(t)
	rule := filepath.Join(home, ".claude", "rules", "02.md")
	write(t, rule, "regla nueva\n")
	if err := Save(repo); err != nil {
		t.Fatal(err)
	}
	saved := filepath.Join(repo, filepath.FromSlash(rulesDir), "02.md")
	if read(t, saved) != "regla nueva\n" {
		t.Fatal("no se guardo la regla")
	}
	write(t, rule, "ghp_"+strings.Repeat("a", 36))
	if err := Save(repo); err == nil {
		t.Fatal("debe rechazar secretos")
	}
	if read(t, saved) != "regla nueva\n" {
		t.Fatal("no debe guardar nada si hay secretos")
	}
}
