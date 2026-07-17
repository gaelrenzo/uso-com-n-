package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"ucn/internal/config"
	"ucn/internal/doctor"
	"ucn/internal/git"
	"ucn/internal/sync"
	"ucn/internal/tunnel"
)

func main() {
	if len(os.Args) < 2 {
		printHelp()
		os.Exit(0)
	}

	repoRoot, err := findRepoRoot()
	if err != nil {
		fmt.Printf("❌ Error: No se pudo determinar la raíz del repositorio. ¿Estás dentro de la carpeta del proyecto? (%v)\n", err)
		os.Exit(1)
	}

	configPath := filepath.Join(repoRoot, "config", "config.yaml")
	envPath := filepath.Join(repoRoot, "config", ".env")

	// Try loading .env file to inject environment variables
	_ = config.LoadEnv(envPath)

	// Try loading config.yaml file
	var cfg *config.Config
	if _, err := os.Stat(configPath); err == nil {
		cfg, err = config.LoadConfig(configPath)
		if err != nil {
			fmt.Printf("⚠️  Error al cargar config/config.yaml: %v. Usando valores por defecto.\n", err)
			cfg = defaultConfig()
		}
	} else {
		cfg = defaultConfig()
	}

	command := strings.ToLower(os.Args[1])
	switch command {
	case "sync":
		if cfg.Settings.AutoPullOnSync {
			if err := git.Pull(repoRoot); err != nil {
				fmt.Printf("⚠️  Advertencia: Git Pull falló (%v). Continuando con la sincronización...\n", err)
			}
		}
		if err := sync.SyncSkills(cfg, repoRoot); err != nil {
			fmt.Printf("❌ Error al sincronizar skills: %v\n", err)
			os.Exit(1)
		}

	case "push":
		commitMsg := ""
		if len(os.Args) > 2 {
			commitMsg = strings.Join(os.Args[2:], " ")
		}
		if err := git.SafePush(repoRoot, commitMsg, cfg.Settings.SafePushIgnoreRemoval); err != nil {
			fmt.Printf("❌ Error en safe push: %v\n", err)
			os.Exit(1)
		}

	case "doctor":
		doctor.CheckHealth(cfg, repoRoot)

	case "tunnel":
		name := ""
		if len(os.Args) > 2 {
			name = os.Args[2]
		}
		if err := tunnel.StartTunnel(name); err != nil {
			fmt.Printf("❌ Error al iniciar el túnel: %v\n", err)
			os.Exit(1)
		}

	case "help", "-h", "--help":
		printHelp()

	default:
		fmt.Printf("❌ Comando desconocido: %s\n\n", command)
		printHelp()
		os.Exit(1)
	}
}

func findRepoRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}

	for {
		gitDir := filepath.Join(dir, ".git")
		cfgEx := filepath.Join(dir, "config", "config.yaml.example")

		if stat, err := os.Stat(gitDir); err == nil && stat.IsDir() {
			return dir, nil
		}
		if _, err := os.Stat(cfgEx); err == nil {
			return dir, nil
		}

		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}

	return "", fmt.Errorf("no se encontró .git ni config/config.yaml.example en las rutas superiores")
}

func defaultConfig() *config.Config {
	return &config.Config{
		Workspace: "~/workspace",
		Agents:    make(map[string]config.Agent),
		Settings: config.Settings{
			AutoPullOnSync:        true,
			SafePushIgnoreRemoval: true,
			WeatherCity:           "Puno",
		},
	}
}

func printHelp() {
	fmt.Println("🚀 UCN CLI - Entorno de Desarrollo y Skills de Agentes IA")
	fmt.Println("Uso:")
	fmt.Println("  ucn <comando> [argumentos]")
	fmt.Println("\nComandos disponibles:")
	fmt.Println("  sync            Actualiza el repositorio y sincroniza los enlaces simbólicos de las skills")
	fmt.Println("  push \"[msj]\"    Agrega cambios de forma segura (sin borrar eliminaciones locales) y hace commit/push")
	fmt.Println("  doctor          Diagnostica dependencias del sistema y estado de las skills locales")
	fmt.Println("  tunnel [nombre] Levanta un túnel de Cloudflare utilizando tokens locales o un túnel configurado")
	fmt.Println("  help            Muestra este mensaje de ayuda")
	fmt.Println("\nConfiguración:")
	fmt.Println("  Edita 'config/config.yaml' para rutas y alias locales.")
	fmt.Println("  Edita 'config/.env' para tokens y variables sensibles.")
}
