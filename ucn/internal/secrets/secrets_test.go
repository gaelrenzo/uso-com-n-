package secrets

import (
	"strings"
	"testing"
)

func TestScanFindsCredentialsWithoutKeepingThem(t *testing.T) {
	token := "ghp_" + strings.Repeat("a", 36)
	findings := Scan("a.txt", []byte("uno\nTOKEN="+token+"\n"))
	if len(findings) != 1 || findings[0].Line != 2 {
		t.Fatalf("hallazgos: %v", findings)
	}
	if strings.Contains(findings[0].String(), token) {
		t.Fatal("el reporte no debe mostrar el secreto")
	}
}

func TestScanPatterns(t *testing.T) {
	samples := []string{
		"github_pat_" + strings.Repeat("a", 30),
		"sk-ant-" + strings.Repeat("a", 30),
		"sk-" + strings.Repeat("a", 40),
		"AIza" + strings.Repeat("a", 35),
		"AKIA" + strings.Repeat("A", 16),
		"-----BEGIN OPENSSH " + "PRIVATE KEY-----",
	}
	for _, sample := range samples {
		if len(Scan("a", []byte(sample))) == 0 {
			t.Errorf("no detectado: %.12s", sample)
		}
	}
}

func TestScanIgnoresPlaceholdersAndBinaries(t *testing.T) {
	for _, text := range []string{"OPENAI_API_KEY=sk-...", "GITHUB_TOKEN=tu_token_aqui"} {
		if findings := Scan("a", []byte(text)); len(findings) != 0 {
			t.Errorf("falso positivo: %v", findings)
		}
	}
	binary := []byte("ghp_" + strings.Repeat("a", 36) + "\x00")
	if len(Scan("a", binary)) != 0 {
		t.Error("los binarios se omiten")
	}
}

func TestBlockedPath(t *testing.T) {
	blocked := []string{
		"super_organizador/reports/arbol.txt", "super_organizador/logs/a.csv",
		"super_organizador/fake_log.csv", "x/inventario_archivos.csv",
		"core/__pycache__/a.pyc", "config/.env", ".env.local",
	}
	for _, name := range blocked {
		if !BlockedPath(name) {
			t.Errorf("debe bloquearse: %s", name)
		}
	}
	for _, name := range []string{"config/.env.example", "README.md", "super_organizador/core/planner.py"} {
		if BlockedPath(name) {
			t.Errorf("no debe bloquearse: %s", name)
		}
	}
}
