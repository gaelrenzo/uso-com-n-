package tunnel

import (
	"fmt"
	"os"
	"os/exec"
)

// StartTunnel runs the cloudflared tunnel using the token from environment or a given name
func StartTunnel(nameOrToken string) error {
	token := os.Getenv("CLOUDFLARE_TUNNEL_TOKEN")
	if token == "" && nameOrToken == "" {
		return fmt.Errorf("no se encontró token de túnel en CLOUDFLARE_TUNNEL_TOKEN ni se especificó un nombre de túnel")
	}

	if token != "" {
		fmt.Println("☁️  Iniciando túnel de Cloudflare usando token de entorno...")
	} else {
		fmt.Printf("☁️  Iniciando túnel de Cloudflare: %s...\n", nameOrToken)
	}

	cmd := buildCommand(nameOrToken, token)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

// buildCommand passes the token through the environment: command line
// arguments are visible to any process that can read "ps".
func buildCommand(name, token string) *exec.Cmd {
	if token != "" {
		cmd := exec.Command("cloudflared", "tunnel", "run")
		cmd.Env = append(os.Environ(), "TUNNEL_TOKEN="+token)
		return cmd
	}
	return exec.Command("cloudflared", "tunnel", "run", name)
}
