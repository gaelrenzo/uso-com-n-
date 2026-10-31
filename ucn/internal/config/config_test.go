package config

import (
	"os"
	"path/filepath"
	"testing"
)

func write(t *testing.T, content string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "f.yaml")
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestLoadConfigKeepsDefaultsAndReadsValues(t *testing.T) {
	cfg, err := LoadConfig(write(t, `
developer:
  name: "Ana"
workspace: "~/w"
agents:
  claude:
    enabled: true
    path: "~/.claude"
settings:
    weather_city: Lima
    auto_pull_on_sync: false
otra_seccion:
  ignorada: 1
`))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Developer.Name != "Ana" || cfg.Workspace != "~/w" || !cfg.Agents["claude"].Enabled {
		t.Fatalf("config: %+v", cfg)
	}
	if cfg.Settings.WeatherCity != "Lima" || cfg.Settings.AutoPullOnSync {
		t.Fatalf("settings con otra indentacion: %+v", cfg.Settings)
	}
	if !cfg.Settings.SafePushIgnoreRemoval {
		t.Fatal("debe conservar el valor por defecto")
	}
}

func TestLoadConfigReportsInvalidYAML(t *testing.T) {
	if _, err := LoadConfig(write(t, "developer: [sin cerrar")); err == nil {
		t.Fatal("un YAML invalido debe dar error")
	}
}

func TestLoadAgentsKeepsOrderAndPaths(t *testing.T) {
	agents, err := LoadAgents(write(t, `
agents:
  zeta:
    command: z
    full_args: --yolo
    known_paths:
      linux: ["/a", "/b"]
  alfa:
    command: a
`))
	if err != nil {
		t.Fatal(err)
	}
	if len(agents) != 2 || agents[0].Name != "zeta" || agents[1].Name != "alfa" {
		t.Fatalf("agentes: %+v", agents)
	}
	if agents[0].FullArgs != "--yolo" || len(agents[0].KnownPaths["linux"]) != 2 {
		t.Fatalf("campos: %+v", agents[0])
	}
}

func TestLoadAgentsMissingFile(t *testing.T) {
	agents, err := LoadAgents(filepath.Join(t.TempDir(), "no.yaml"))
	if err != nil || agents != nil {
		t.Fatalf("%v %v", agents, err)
	}
}
