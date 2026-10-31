package update

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
	"ucn/internal/config"
)

func run(t *testing.T, dir string, args ...string) {
	t.Helper()
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	if out, err := cmd.CombinedOutput(); err != nil {
		t.Fatalf("git %v: %v\n%s", args, err, out)
	}
}

func commit(t *testing.T, repo, content string) {
	t.Helper()
	if err := os.WriteFile(filepath.Join(repo, "a.txt"), []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	run(t, repo, "add", ".")
	run(t, repo, "commit", "-qm", content)
}

func clone(t *testing.T, origin, repo string) {
	t.Helper()
	run(t, filepath.Dir(repo), "clone", "-q", origin, repo)
	run(t, repo, "config", "user.email", "test@example.com")
	run(t, repo, "config", "user.name", "test")
	run(t, repo, "config", "pull.rebase", "true")
}

func TestRunReportsFailedPull(t *testing.T) {
	t.Setenv("HOME", t.TempDir())
	base := t.TempDir()
	origin := filepath.Join(base, "origin.git")
	repo := filepath.Join(base, "repo")
	other := filepath.Join(base, "other")
	run(t, base, "init", "-q", "--bare", origin)
	clone(t, origin, repo)
	commit(t, repo, "base")
	run(t, repo, "push", "-q", "-u", "origin", "HEAD")
	clone(t, origin, other)
	commit(t, other, "remoto")
	run(t, other, "push", "-q")
	commit(t, repo, "local")

	err := Run(&config.Config{}, repo, false, false)
	if err == nil || !strings.Contains(err.Error(), "actualizacion incompleta") {
		t.Fatalf("un pull con conflicto debe devolver error, got %v", err)
	}
}
