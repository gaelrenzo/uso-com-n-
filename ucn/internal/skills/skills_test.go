package skills

import (
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func mkdir(t *testing.T, path string) string {
	t.Helper()
	if err := os.MkdirAll(path, 0755); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestListReportsMissingAndLinked(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("requiere symlinks")
	}
	base := t.TempDir()
	source := mkdir(t, filepath.Join(base, "src"))
	skill := mkdir(t, filepath.Join(source, "kicad"))
	mkdir(t, filepath.Join(source, "spice"))
	target := mkdir(t, filepath.Join(base, "agent"))
	if err := os.Symlink(skill, filepath.Join(target, "kicad")); err != nil {
		t.Fatal(err)
	}
	rows, err := List(source, []string{target})
	if err != nil || len(rows) != 2 {
		t.Fatalf("%+v %v", rows, err)
	}
	for _, row := range rows {
		if row.Name == "kicad" && row.Linked != 1 {
			t.Fatalf("kicad: %+v", row)
		}
		if row.Name == "spice" && row.Missing != 1 {
			t.Fatalf("spice: %+v", row)
		}
	}
}

func TestListMissingSource(t *testing.T) {
	if _, err := List(filepath.Join(t.TempDir(), "no"), nil); err == nil {
		t.Fatal("debe fallar si no existe el directorio")
	}
}

func TestFindIssuesAndSafeRemoval(t *testing.T) {
	if runtime.GOOS == "windows" {
		t.Skip("requiere symlinks")
	}
	target := t.TempDir()
	broken := filepath.Join(target, "rota")
	if err := os.Symlink(filepath.Join(target, "no-existe"), broken); err != nil {
		t.Fatal(err)
	}
	backup := mkdir(t, filepath.Join(target, "kicad_backup"))
	real := mkdir(t, filepath.Join(target, "kicad"))

	issues := FindIssues([]string{target})
	if len(issues) != 2 {
		t.Fatalf("issues: %+v", issues)
	}
	if err := Remove(real); err == nil || !strings.Contains(err.Error(), "no es un enlace") {
		t.Fatalf("no debe borrar carpetas reales: %v", err)
	}
	if err := RemoveBackup(real); err == nil {
		t.Fatal("solo se borran carpetas *_backup")
	}
	if err := Remove(broken); err != nil {
		t.Fatal(err)
	}
	if err := RemoveBackup(backup); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(real); err != nil {
		t.Fatal("la carpeta real debe seguir ahi")
	}
}

func TestStateLabels(t *testing.T) {
	detail := []TargetState{{}}
	cases := map[string]Skill{
		"sin agentes":   {},
		"✗ roto":        {Detail: detail, Broken: 1},
		"⚠ dir local":   {Detail: detail, Plain: 1},
		"✗ no enlazada": {Detail: detail},
		"⚠ parcial":     {Detail: detail, Linked: 1, Missing: 1},
		"✓ ok":          {Detail: detail, Linked: 1},
	}
	for want, skill := range cases {
		if got := skill.State(); got != want {
			t.Errorf("%+v: %s != %s", skill, got, want)
		}
	}
}
