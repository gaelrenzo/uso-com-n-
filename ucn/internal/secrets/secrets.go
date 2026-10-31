// Package secrets detects credentials and private files before they are published.
package secrets

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path"
	"path/filepath"
	"regexp"
	"strings"
)

// Finding is one credential found in a file. It never stores the value, so
// reporting a finding cannot leak the secret.
type Finding struct {
	File string
	Line int
	Kind string
}

func (f Finding) String() string {
	return fmt.Sprintf("%s:%d: posible %s", f.File, f.Line, f.Kind)
}

var patterns = []struct {
	kind string
	re   *regexp.Regexp
}{
	{"token de GitHub", regexp.MustCompile(`\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36}\b`)},
	{"token de GitHub", regexp.MustCompile(`\bgithub_pat_[A-Za-z0-9_]{22,}`)},
	{"clave de Anthropic", regexp.MustCompile(`\bsk-ant-[A-Za-z0-9_-]{20,}`)},
	{"clave de OpenAI", regexp.MustCompile(`\bsk-(?:proj-)?[A-Za-z0-9]{32,}`)},
	{"clave de Google", regexp.MustCompile(`\bAIza[0-9A-Za-z_-]{35}\b`)},
	{"clave de AWS", regexp.MustCompile(`\bAKIA[0-9A-Z]{16}\b`)},
	{"token de Slack", regexp.MustCompile(`\bxox[abprs]-[0-9A-Za-z-]{10,}`)},
	{"clave privada", regexp.MustCompile(`-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----`)},
}

// Scan returns the credentials found in a text file. Binary files are skipped.
func Scan(name string, content []byte) []Finding {
	if bytes.IndexByte(content, 0) >= 0 {
		return nil
	}
	var findings []Finding
	for i, line := range bytes.Split(content, []byte("\n")) {
		for _, p := range patterns {
			if p.re.Match(line) {
				findings = append(findings, Finding{File: name, Line: i + 1, Kind: p.kind})
			}
		}
	}
	return findings
}

// BlockedPath reports whether a repository path must never be published.
func BlockedPath(name string) bool {
	name = filepath.ToSlash(name)
	base := path.Base(name)
	switch {
	case strings.HasPrefix(name, "super_organizador/reports/"),
		strings.HasPrefix(name, "super_organizador/logs/"),
		base == "fake_log.csv",
		strings.HasPrefix(base, "inventario_archivos."),
		strings.HasSuffix(base, ".pyc"):
		return true
	case base == ".env", strings.HasPrefix(base, ".env."):
		return !strings.HasSuffix(base, ".example")
	}
	return false
}

// ScanRepo checks every file tracked by git and returns the problems found.
func ScanRepo(repoRoot string) ([]string, error) {
	cmd := exec.Command("git", "ls-files", "-z")
	cmd.Dir = repoRoot
	out, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("error al listar archivos: %v", err)
	}
	var problems []string
	for _, name := range strings.Split(string(out), "\x00") {
		if name == "" {
			continue
		}
		if BlockedPath(name) {
			problems = append(problems, name+": archivo privado")
			continue
		}
		content, err := os.ReadFile(filepath.Join(repoRoot, name))
		if err != nil {
			continue
		}
		for _, finding := range Scan(name, content) {
			problems = append(problems, finding.String())
		}
	}
	return problems, nil
}
