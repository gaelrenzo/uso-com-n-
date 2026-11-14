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

func TestSyncSharedMemorySkillCopiesARegularFile(t *testing.T) {
	source := filepath.Join(t.TempDir(), "skills")
	skillDir := filepath.Join(source, "ucn-shared-memory")
	if err := os.MkdirAll(skillDir, 0755); err != nil {
		t.Fatal(err)
	}
	want := []byte("shared instruction")
	if err := os.WriteFile(filepath.Join(skillDir, "SKILL.md"), want, 0644); err != nil {
		t.Fatal(err)
	}
	shared := t.TempDir()
	if err := syncSharedMemorySkill(source, shared); err != nil {
		t.Fatal(err)
	}
	dest := filepath.Join(shared, "skills", "ucn-shared-memory", "SKILL.md")
	got, err := os.ReadFile(dest)
	if err != nil || string(got) != string(want) {
		t.Fatalf("copied skill = %q, %v; want %q", got, err, want)
	}
	info, err := os.Lstat(dest)
	if err != nil || info.Mode()&os.ModeSymlink != 0 {
		t.Fatalf("shared skill must be a regular file, got %v, %v", info, err)
	}
}
