package profile

import (
	"os"
	"path/filepath"
	"testing"
)

func newRepo(t *testing.T) string {
	t.Helper()
	repo := t.TempDir()
	dir := filepath.Join(repo, "profiles", "ing")
	if err := os.MkdirAll(dir, 0755); err != nil {
		t.Fatal(err)
	}
	yaml := "name: \"Ingenieria\"\ndescription: >\n  uno\n  dos\ntools:\n  - matlab\n  - latex\nprompt: |\n  linea uno\n  linea dos\n"
	if err := os.WriteFile(filepath.Join(dir, "profile.yaml"), []byte(yaml), 0644); err != nil {
		t.Fatal(err)
	}
	return repo
}

func TestGetParsesProfile(t *testing.T) {
	p, err := Get(newRepo(t), "ing")
	if err != nil {
		t.Fatal(err)
	}
	if p.DisplayName != "Ingenieria" || p.Description != "uno dos" || p.Prompt != "linea uno linea dos" {
		t.Fatalf("perfil: %+v", p)
	}
	if len(p.Tools) != 2 || p.Tools[1] != "latex" {
		t.Fatalf("tools: %v", p.Tools)
	}
}

func TestUseCurrentAndActivePrompt(t *testing.T) {
	repo := newRepo(t)
	if name, _ := Current(repo); name != "default" {
		t.Fatalf("sin eleccion debe ser default: %s", name)
	}
	if err := Use(repo, "ing"); err != nil {
		t.Fatal(err)
	}
	if name, _ := Current(repo); name != "ing" {
		t.Fatalf("actual: %s", name)
	}
	if prompt, err := ActivePrompt(repo); err != nil || prompt != "linea uno linea dos" {
		t.Fatalf("prompt: %q, %v", prompt, err)
	}
	if err := Use(repo, "no-existe"); err == nil {
		t.Fatal("un perfil inexistente debe fallar")
	}
}

func TestExportPrompt(t *testing.T) {
	repo := newRepo(t)
	path, err := ExportPrompt(repo, "ing")
	if err != nil {
		t.Fatal(err)
	}
	data, _ := os.ReadFile(path)
	if string(data) != "linea uno linea dos\n" {
		t.Fatalf("exportado: %q", data)
	}
}

func TestDiscover(t *testing.T) {
	profiles, err := Discover(newRepo(t))
	if err != nil || len(profiles) != 1 || profiles[0].Name != "ing" {
		t.Fatalf("%+v %v", profiles, err)
	}
}
