package memory

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestSharedDirHonorsExplicitPath(t *testing.T) {
	want := filepath.Join(t.TempDir(), "private", "memory")
	t.Setenv("UCN_SHARED_MEMORY_DIR", want)
	if got, err := SharedDir(); err != nil || got != want {
		t.Fatalf("SharedDir() = %q, %v; want %q", got, err, want)
	}
}

func TestInitAtPreservesExistingMemory(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "MEMORY.md")
	if err := os.WriteFile(path, []byte("private note\n"), 0600); err != nil {
		t.Fatal(err)
	}
	if err := InitAt(dir); err != nil {
		t.Fatal(err)
	}
	got, err := os.ReadFile(path)
	if err != nil || string(got) != "private note\n" {
		t.Fatalf("existing memory changed: %q, %v", got, err)
	}
	for _, name := range []string{"AGENTS.md", "README.md", filepath.Join("memory", "notes")} {
		if _, err := os.Stat(filepath.Join(dir, name)); err != nil {
			t.Fatalf("InitAt did not create %s: %v", name, err)
		}
	}
}

func TestAddAtCreatesIndependentNotesAndContext(t *testing.T) {
	dir := t.TempDir()
	if err := InitAt(dir); err != nil {
		t.Fatal(err)
	}
	first, err := AddAt(dir, "Decision one", "codex")
	if err != nil {
		t.Fatal(err)
	}
	second, err := AddAt(dir, "Decision two", "openclaw")
	if err != nil {
		t.Fatal(err)
	}
	if first == second {
		t.Fatal("notes should have unique paths")
	}
	context, err := ContextAt(dir)
	if err != nil {
		t.Fatal(err)
	}
	for _, want := range []string{"Decision one", "Decision two", "Memoria compartida UCN"} {
		if !strings.Contains(context, want) {
			t.Errorf("context missing %q", want)
		}
	}
}

func TestSyncMarker(t *testing.T) {
	dir := t.TempDir()
	if SyncMarker(dir) {
		t.Fatal("marker should not be detected before creation")
	}
	if err := os.WriteFile(filepath.Join(dir, ".stfolder"), nil, 0600); err != nil {
		t.Fatal(err)
	}
	if !SyncMarker(dir) {
		t.Fatal("marker should be detected")
	}
}
