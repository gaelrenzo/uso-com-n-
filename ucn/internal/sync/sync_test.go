package sync

import (
	"os"
	"path/filepath"
	"testing"
)

func TestCleanExistingDestKeepsOlderBackups(t *testing.T) {
	dest := filepath.Join(t.TempDir(), "skill")
	for _, content := range []string{"uno", "dos", "tres"} {
		if err := os.Mkdir(dest, 0755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(filepath.Join(dest, "f"), []byte(content), 0644); err != nil {
			t.Fatal(err)
		}
		if err := cleanExistingDest(dest, "skill"); err != nil {
			t.Fatal(err)
		}
	}
	want := map[string]string{"skill_backup": "uno", "skill_2_backup": "dos", "skill_3_backup": "tres"}
	for name, content := range want {
		got, err := os.ReadFile(filepath.Join(filepath.Dir(dest), name, "f"))
		if err != nil || string(got) != content {
			t.Fatalf("%s: %q, %v", name, got, err)
		}
	}
}
