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

	var cmd *exec.Cmd
	if token != "" {
		fmt.Println("☁️  Iniciando túnel de Cloudflare usando token de entorno...")
		cmd = exec.Command("cloudflared", "tunnel", "--token", token)
	} else {
		fmt.Printf("☁️  Iniciando túnel de Cloudflare: %s...\n", nameOrToken)
		cmd = exec.Command("cloudflared", "tunnel", "run", nameOrToken)
	}

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}
