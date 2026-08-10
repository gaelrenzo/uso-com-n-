package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"ucn/internal/bootstrap"
	"ucn/internal/config"
	"ucn/internal/doctor"
	"ucn/internal/git"
	"ucn/internal/profile"
	"ucn/internal/sync"
	"ucn/internal/tunnel"
	"ucn/internal/update"
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
		fixMode := false
		for _, a := range os.Args[2:] {
			if a == "--fix" || a == "-f" {
				fixMode = true
			}
		}
		if fixMode {
			doctor.CheckHealthFix(cfg, repoRoot)
		} else {
			doctor.CheckHealth(cfg, repoRoot, false)
		}

	case "agents":
		listAgents(repoRoot)

	case "bootstrap":
		if err := bootstrap.Run(cfg, repoRoot); err != nil {
			fmt.Printf("❌ Error durante bootstrap: %v\n", err)
			os.Exit(1)
		}

	case "update":
		checkOnly := false
		for _, a := range os.Args[2:] {
			if a == "--check" || a == "-c" {
				checkOnly = true
			}
		}
		if err := update.Run(cfg, repoRoot, checkOnly); err != nil {
			fmt.Printf("❌ Error en update: %v\n", err)
			os.Exit(1)
		}

	case "profile":
		handleProfile(repoRoot, os.Args[2:])

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

func listAgents(repoRoot string) {
	agentsPath := filepath.Join(repoRoot, "config", "agents.yaml")
	agents, err := config.LoadAgents(agentsPath)
	if err != nil {
		fmt.Printf("❌ Error al leer config/agents.yaml: %v\n", err)
		os.Exit(1)
	}
	if len(agents) == 0 {
		fmt.Println("⚠ No se encontró ninguna entrada en config/agents.yaml")
		return
	}

	fmt.Println("NAME       STATUS   BIN / COMMAND")
	fmt.Println("──────────────────────────────────────")
	for _, a := range agents {
		bin := a.ResolveBin()
		status := "✓"
		detail := a.Command
		if bin == "" {
			status = "✗"
		} else if bin != a.Command {
			detail = bin
		}
		fmt.Printf("%-10s %-8s %s\n", a.Name, status, detail)
	}
}

func handleProfile(repoRoot string, args []string) {
	if len(args) == 0 {
		fmt.Println("Uso: ucn profile <list|use <nombre>|current|show>")
		fmt.Println("\nPerfiles disponibles:")
		profiles, err := profile.Discover(repoRoot)
		if err != nil {
			fmt.Printf("  ⚠ %v\n", err)
		}
		cur, _ := profile.Current(repoRoot)
		for _, p := range profiles {
			mark := " "
			if p.Name == cur {
				mark = "▶"
			}
			fmt.Printf("  %s %-14s %s\n", mark, p.Name, p.DisplayName)
		}
		return
	}

	sub := strings.ToLower(args[0])
	switch sub {
	case "list":
		profiles, err := profile.Discover(repoRoot)
		if err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		cur, _ := profile.Current(repoRoot)
		if len(profiles) == 0 {
			fmt.Println("No hay perfiles en profiles/")
			return
		}
		fmt.Println("PERFIL            DESCRIPCION")
		fmt.Println("────────────────────────────────────────────")
		for _, p := range profiles {
			mark := " "
			if p.Name == cur {
				mark = "▶"
			}
			desc := p.Description
			if len(desc) > 48 {
				desc = desc[:48] + "..."
			}
			fmt.Printf("%s %-14s %s\n", mark, p.Name, desc)
		}

	case "use":
		if len(args) < 2 {
			fmt.Println("Uso: ucn profile use <nombre>")
			os.Exit(1)
		}
		if err := profile.Use(repoRoot, args[1]); err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		cur, _ := profile.Current(repoRoot)
		fmt.Printf("✅ Perfil activo: %s\n", cur)

	case "current":
		cur, err := profile.Current(repoRoot)
		if err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		fmt.Println(cur)

	case "show":
		cur, err := profile.Current(repoRoot)
		if err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		p, err := profile.Get(repoRoot, cur)
		if err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("Perfil: %s (%-12s)\n", p.Name, p.DisplayName)
		fmt.Printf("Herramientas: %s\n", strings.Join(p.Tools, ", "))
		if p.Prompt != "" {
			fmt.Println("\nPrompt activo:")
			fmt.Println("───────")
			fmt.Println(p.Prompt)
		}

	default:
		fmt.Printf("❌ Subcomando desconocido: %s\n", sub)
		fmt.Println("Uso: ucn profile <list|use <nombre>|current|show>")
		os.Exit(1)
	}
}

func printHelp() {
	fmt.Println("🚀 UCN CLI - Entorno de Desarrollo y Skills de Agentes IA")
	fmt.Println("Uso:")
	fmt.Println("  ucn <comando> [argumentos]")
	fmt.Println("\nComandos disponibles:")
	fmt.Println("  sync            Actualiza el repositorio y sincroniza los enlaces simbólicos de las skills")
	fmt.Println("  push \"[msj]\"    Agrega cambios de forma segura (sin borrar eliminaciones locales) y hace commit/push")
	fmt.Println("  doctor          Diagnostica plataforma, dependencias, agentes IA y configuración")
	fmt.Println("  doctor --fix    Corrige automáticamente configuraciones seguras (config/, .env, directorios)")
	fmt.Println("  agents          Muestra el estado de los agentes IA registrados en config/agents.yaml")
	fmt.Println("  bootstrap       Prepara este dispositivo: config, directorios, hook de shell y skills")
	fmt.Println("  update          Actualiza el repo, sincroniza skills y verifica agentes")
	fmt.Println("  update --check  Solo comprueba si hay actualizaciones disponibles")
	fmt.Println("  profile list    Lista los perfiles de especialidad disponibles")
	fmt.Println("  profile use X   Activa el perfil X (default|ingenieria|programacion|investigacion|universidad)")
	fmt.Println("  profile current Muestra el perfil activo")
	fmt.Println("  profile show    Muestra el detalle del perfil activo")
	fmt.Println("  tunnel [nombre] Levanta un túnel de Cloudflare utilizando tokens locales o un túnel configurado")
	fmt.Println("  help            Muestra este mensaje de ayuda")
	fmt.Println("\nConfiguración:")
	fmt.Println("  Edita 'config/config.yaml' para rutas y alias locales.")
	fmt.Println("  Edita 'config/.env' para tokens y RUTAS de agentes (UCN_<AGENTE>_BIN).")
	fmt.Println("  Edita 'config/agents.yaml' para el registro central de agentes IA.")
}
