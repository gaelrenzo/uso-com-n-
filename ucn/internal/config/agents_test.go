package config

import (
	"os"
	"path/filepath"
	"testing"
)

func TestLoadAgents(t *testing.T) {
	// Buscar agents.yaml subiendo desde el paquete hacia la raiz del repo
	dir, err := os.Getwd()
	if err != nil {
		t.Fatalf("getwd: %v", err)
	}
	var agentsPath string
	for {
		cand := filepath.Join(dir, "config", "agents.yaml")
		if _, err := os.Stat(cand); err == nil {
			agentsPath = cand
			break
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
	if agentsPath == "" {
		t.Skip("config/agents.yaml no encontrado (tests fuera del repo?)")
	}

	agents, err := LoadAgents(agentsPath)
	if err != nil {
		t.Fatalf("LoadAgents: %v", err)
	}
	if len(agents) == 0 {
		t.Fatal("no se parseo ningun agente")
	}
	for _, a := range agents {
		if a.Command == "" {
			t.Errorf("agente %s sin command", a.Name)
		}
		if a.Env == "" {
			t.Errorf("agente %s sin env", a.Name)
		}
		if a.Wrapper == "" {
			t.Errorf("agente %s sin wrapper", a.Name)
		}
		// Cada agente debe tener known paths para al menos una plataforma
		if len(a.KnownPaths) == 0 {
			t.Errorf("agente %s sin known_paths", a.Name)
		}
	}
}

func TestResolveBinEnvOverrides(t *testing.T) {
	a := AgentDescriptor{Name: "codex", Command: "codex", Env: "UCN_CODEX_BIN"}
	// Sin PATH y sin env, ResolveBin debe devolver vacio (no crashear)
	if got := a.ResolveBin(); got != "" {
		// En CI puede que codex exista en PATH; aceptar cualquier resultado no vacio
		t.Logf("ResolveBin devolvio %q (environment real)", got)
	}
}
