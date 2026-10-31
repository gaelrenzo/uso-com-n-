package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"ucn/internal/bootstrap"
	ucnbuild "ucn/internal/build"
	"ucn/internal/config"
	"ucn/internal/doctor"
	"ucn/internal/git"
	"ucn/internal/profile"
	"ucn/internal/secrets"
	"ucn/internal/skills"
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
		build := false
		for _, a := range os.Args[2:] {
			switch a {
			case "--check", "-c":
				checkOnly = true
			case "--build", "-b":
				build = true
			}
		}
		if err := update.Run(cfg, repoRoot, checkOnly, build); err != nil {
			fmt.Printf("❌ Error en update: %v\n", err)
			os.Exit(1)
		}

	case "build":
		fmt.Println("🔨 Compilando el CLI ucn...")
		if err := ucnbuild.Build(repoRoot); err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Binario listo: %s\n", ucnbuild.BinaryPath(repoRoot))

	case "skills":
		handleSkills(cfg, repoRoot, os.Args[2:])

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

	case "secrets":
		handleSecrets(repoRoot)

	case "help", "-h", "--help":
		printHelp()

	default:
		fmt.Printf("❌ Comando desconocido: %s\n\n", command)
		printHelp()
		os.Exit(1)
	}
}

func isRepoRoot(dir string) bool {
	gitDir := filepath.Join(dir, ".git")
	cfgEx := filepath.Join(dir, "config", "config.yaml.example")
	if stat, err := os.Stat(gitDir); err == nil && stat.IsDir() {
		return true
	}
	if _, err := os.Stat(cfgEx); err == nil {
		return true
	}
	return false
}

func findRepoRoot() (string, error) {
	// 1. Check UCN_REPO_DIR environment variable
	if envDir := os.Getenv("UCN_REPO_DIR"); envDir != "" && isRepoRoot(envDir) {
		return envDir, nil
	}

	// 2. Check current directory and ancestors
	if dir, err := os.Getwd(); err == nil {
		for {
			if isRepoRoot(dir) {
				return dir, nil
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}

	// 3. Fallback candidates for multi-device environments
	candidates := []string{
		"/data/data/com.termux/files/home/workspace/uso-com-n-",
		"/storage/emulated/0/universida-datos/uso-com-n-",
	}
	if home := os.Getenv("HOME"); home != "" {
		candidates = append(candidates,
			filepath.Join(home, "workspace", "uso-com-n-"),
			filepath.Join(home, "universida-datos", "uso-com-n-"),
		)
	}
	for _, cand := range candidates {
		if isRepoRoot(cand) {
			return cand, nil
		}
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

// handleSecrets scans the tracked files; CI uses its exit code.
func handleSecrets(repoRoot string) {
	problems, err := secrets.ScanRepo(repoRoot)
	if err != nil {
		fmt.Printf("❌ %v\n", err)
		os.Exit(1)
	}
	if len(problems) == 0 {
		fmt.Println("✓ Sin secretos ni archivos privados en los archivos versionados")
		return
	}
	for _, problem := range problems {
		fmt.Printf("❌ %s\n", problem)
	}
	os.Exit(1)
}

func handleSkills(cfg *config.Config, repoRoot string, args []string) {
	targets, err := sync.ActiveTargetDirs(cfg)
	if err != nil {
		fmt.Printf("❌ %v\n", err)
		os.Exit(1)
	}
	skillsDir := skills.SourceDir(repoRoot)

	if len(args) == 0 {
		fmt.Println("Uso: ucn skills <list|sync|status [nombre]|clean [--apply]>")
		fmt.Println("\nSubcomandos:")
		fmt.Println("  sync              Enlaza las skills en cada agente (sin git pull)")
		fmt.Println("  list              Lista las skills del repo y su estado por agente")
		fmt.Println("  status [nombre]   Detalle de enlaces de una skill (o todas)")
		fmt.Println("  clean [--apply] [--backups]   Muestra enlaces rotos y respaldos huérfanos (--apply los elimina)")
		return
	}

	switch strings.ToLower(args[0]) {
	case "list":
		rows, err := skills.List(skillsDir, targets)
		if err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		if len(rows) == 0 {
			fmt.Println("No hay skills en skills/agent-skills/")
			return
		}
		fmt.Println("SKILL                          ESTADO            ENLACES")
		fmt.Println("──────────────────────────────────────────────────────────")
		for _, s := range rows {
			fmt.Printf("%-30s %-17s %d/%d\n", s.Name, s.State(), s.Linked, len(s.Detail))
		}
		fmt.Println("\nUsa 'ucn skills status <nombre>' para ver el detalle por agente.")

	case "status":
		name := ""
		if len(args) >= 2 {
			name = args[1]
		}
		var rows []skills.Skill
		if name != "" {
			one, err := skills.Find(skillsDir, targets, name)
			if err != nil {
				fmt.Printf("❌ %v\n", err)
				os.Exit(1)
			}
			rows = []skills.Skill{*one}
		} else {
			var err error
			rows, err = skills.List(skillsDir, targets)
			if err != nil {
				fmt.Printf("❌ %v\n", err)
				os.Exit(1)
			}
		}
		for _, s := range rows {
			fmt.Printf("\n%s  [%s]\n", s.Name, s.State())
			for _, d := range s.Detail {
				mark := map[string]string{
					"linked":  "✓",
					"broken":  "✗",
					"missing": "…",
					"dir":     "≡",
					"file":    "?",
					"error":   "!",
				}[d.State]
				note := d.Note
				if note != "" {
					note = "  " + note
				}
				fmt.Printf("  %s %s%s\n", mark, d.Target, note)
			}
		}

	case "clean":
		apply := false
		cleanBackups := false
		for _, a := range args[1:] {
			if a == "--apply" || a == "-a" {
				apply = true
			}
			if a == "--backups" || a == "-b" || a == "--all" {
				cleanBackups = true
			}
		}
		issues := skills.FindIssues(targets)
		if len(issues) == 0 {
			fmt.Println("✓ No hay enlaces rotos ni respaldos huérfanos.")
			return
		}
		fmt.Println("Problemas encontrados:")
		removed := 0
		removedBackups := 0
		for _, is := range issues {
			extra := ""
			if is.Kind == "enlace-roto" && apply {
				if err := skills.Remove(is.Path); err != nil {
					extra = "  ❌ " + err.Error()
				} else {
					extra = "  ✅ eliminado"
					removed++
				}
			} else if is.Kind == "respaldo" && apply && cleanBackups {
				if err := skills.RemoveBackup(is.Path); err != nil {
					extra = "  ❌ " + err.Error()
				} else {
					extra = "  ✅ respaldo eliminado"
					removedBackups++
				}
			}
			fmt.Printf("  • [%s] %s%s\n", is.Kind, is.Path, extra)
		}
		if !apply {
			fmt.Println("\nUsa 'ucn skills clean --apply' para eliminar los enlaces rotos.")
			fmt.Println("Usa 'ucn skills clean --apply --backups' para eliminar también respaldos (*_backup).")
		} else {
			if cleanBackups {
				fmt.Printf("\n%d enlaces rotos y %d respaldos eliminados.\n", removed, removedBackups)
			} else {
				fmt.Printf("\n%d enlaces rotos eliminados.\n", removed)
			}
		}

	case "sync":
		if err := sync.SyncSkills(cfg, repoRoot); err != nil {
			fmt.Printf("❌ Error al sincronizar skills: %v\n", err)
			os.Exit(1)
		}

	default:
		fmt.Printf("❌ Subcomando desconocido: %s\n", args[0])
		fmt.Println("Uso: ucn skills <list|sync|status [nombre]|clean [--apply] [--backups]>")
		os.Exit(1)
	}
}

func handleProfile(repoRoot string, args []string) {
	if len(args) == 0 {
		fmt.Println("Uso: ucn profile <list|use <nombre>|current|show|export>")
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

	case "export":
		name := ""
		if len(args) >= 2 {
			name = args[1]
		}
		path, err := profile.ExportPrompt(repoRoot, name)
		if err != nil {
			fmt.Printf("❌ %v\n", err)
			os.Exit(1)
		}
		fmt.Printf("✅ Prompt exportado a %s\n", path)

	default:
		fmt.Printf("❌ Subcomando desconocido: %s\n", sub)
		fmt.Println("Uso: ucn profile <list|use <nombre>|current|show|export>")
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
	fmt.Println("  build           Recompila el CLI ucn (ucn/ucn o ucn/ucn.exe)")
	fmt.Println("  update          Actualiza el repo, sincroniza skills y verifica agentes")
	fmt.Println("  update --check  Solo comprueba si hay actualizaciones disponibles")
	fmt.Println("  update --build  Además, recompila el CLI ucn tras actualizar")
	fmt.Println("  skills list     Lista las skills del repo con su estado por agente")
	fmt.Println("  skills status X Muestra el detalle de enlaces de una skill")
	fmt.Println("  skills clean    Detecta enlaces rotos y respaldos huérfanos (--apply elimina)")
	fmt.Println("  profile list    Lista los perfiles de especialidad disponibles")
	fmt.Println("  profile use X   Activa el perfil X (default|ingenieria|programacion|investigacion|universidad)")
	fmt.Println("  profile current Muestra el perfil activo")
	fmt.Println("  profile show    Muestra el detalle del perfil activo")
	fmt.Println("  profile export  Genera config/profile-prompts/<perfil>.md (lo usan los wrappers de agentes)")
	fmt.Println("  tunnel [nombre] Levanta un túnel de Cloudflare utilizando tokens locales o un túnel configurado")
	fmt.Println("  help            Muestra este mensaje de ayuda")
	fmt.Println("\nConfiguración:")
	fmt.Println("  Edita 'config/config.yaml' para rutas y alias locales.")
	fmt.Println("  Edita 'config/.env' para tokens y RUTAS de agentes (UCN_<AGENTE>_BIN).")
	fmt.Println("  Edita 'config/agents.yaml' para el registro central de agentes IA.")
}
