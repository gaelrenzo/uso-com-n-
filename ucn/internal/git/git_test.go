package git

import (
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func run(t *testing.T, dir string, args ...string) string {
	t.Helper()
	cmd := exec.Command("git", args...)
	cmd.Dir = dir
	out, err := cmd.CombinedOutput()
	if err != nil {
		t.Fatalf("git %v: %v\n%s", args, err, out)
	}
	return strings.TrimSpace(string(out))
}

// newRepo creates a clone with one commit and a bare origin to push to.
func newRepo(t *testing.T) string {
	t.Helper()
	base := t.TempDir()
	origin := filepath.Join(base, "origin.git")
	repo := filepath.Join(base, "repo")
	run(t, base, "init", "-q", "--bare", origin)
	run(t, base, "clone", "-q", origin, repo)
	run(t, repo, "config", "user.email", "test@example.com")
	run(t, repo, "config", "user.name", "test")
	for _, name := range []string{"a.txt", "b.txt"} {
		if err := os.WriteFile(filepath.Join(repo, name), []byte("x"), 0644); err != nil {
			t.Fatal(err)
		}
	}
	run(t, repo, "add", ".")
	run(t, repo, "commit", "-qm", "inicial")
	run(t, repo, "push", "-q", "-u", "origin", "HEAD")
	return repo
}

func TestSafePushOnlyDeletionIsNotAnError(t *testing.T) {
	repo := newRepo(t)
	if err := os.Remove(filepath.Join(repo, "a.txt")); err != nil {
		t.Fatal(err)
	}
	before := run(t, repo, "rev-parse", "HEAD")
	if err := SafePush(repo, "m", true); err != nil {
		t.Fatalf("SafePush con solo borrados: %v", err)
	}
	if after := run(t, repo, "rev-parse", "HEAD"); after != before {
		t.Fatal("no debia crear commit con solo borrados")
	}
}

func TestSafePushCommitsAndPushes(t *testing.T) {
	repo := newRepo(t)
	if err := os.WriteFile(filepath.Join(repo, "c.txt"), []byte("y"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := SafePush(repo, "nuevo", true); err != nil {
		t.Fatal(err)
	}
	if local, remote := run(t, repo, "rev-parse", "HEAD"), run(t, repo, "rev-parse", "@{u}"); local != remote {
		t.Fatalf("push no llego al remoto: %s != %s", local, remote)
	}
}
