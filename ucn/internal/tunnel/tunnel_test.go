package tunnel

import (
	"slices"
	"testing"
)

func TestTokenIsNotPassedAsArgument(t *testing.T) {
	cmd := buildCommand("", "SECRETO")
	if slices.Contains(cmd.Args, "SECRETO") {
		t.Fatalf("token visible en argumentos: %v", cmd.Args)
	}
	if !slices.Contains(cmd.Env, "TUNNEL_TOKEN=SECRETO") {
		t.Fatal("falta TUNNEL_TOKEN en el entorno")
	}
}

func TestNamedTunnel(t *testing.T) {
	cmd := buildCommand("mi-tunel", "")
	if !slices.Equal(cmd.Args[1:], []string{"tunnel", "run", "mi-tunel"}) {
		t.Fatalf("argumentos: %v", cmd.Args)
	}
}
