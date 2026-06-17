package config

import (
	"bufio"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Developer holds name and email config
type Developer struct {
	Name  string
	Email string
}

// Agent represents individual IA agent rules path and toggle
type Agent struct {
	Enabled bool
	Path    string
}

// Settings represents general CLI options
type Settings struct {
	AutoPullOnSync        bool
	SafePushIgnoreRemoval bool
	WeatherCity           string
}

// Config maps the overall yaml configuration structure
type Config struct {
	Developer Developer
	Workspace string
	Agents    map[string]Agent
	Settings  Settings
}

// LoadConfig reads config.yaml and returns a parsed Config struct
func LoadConfig(configPath string) (*Config, error) {
	cfg := &Config{
		Agents: make(map[string]Agent),
		Settings: Settings{
			AutoPullOnSync:        true,
			SafePushIgnoreRemoval: true,
			WeatherCity:           "Puno",
		},
	}

	file, err := os.Open(configPath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var currentSection string
	var currentSubAgent string

	for scanner.Scan() {
		line := scanner.Text()
		trimmed := strings.TrimSpace(line)

		// Omit empty lines and comments
		if trimmed == "" || strings.HasPrefix(trimmed, "#") {
			continue
		}

		// Determine current indentation
		indent := len(line) - len(strings.TrimLeft(line, " "))

		if indent == 0 {
			if strings.HasSuffix(trimmed, ":") {
				currentSection = strings.TrimSuffix(trimmed, ":")
				currentSubAgent = ""
			} else if strings.Contains(trimmed, ":") {
				parts := strings.SplitN(trimmed, ":", 2)
				key := strings.TrimSpace(parts[0])
				val := cleanValue(parts[1])
				if key == "workspace" {
					cfg.Workspace = val
				}
			}
			continue
		}

		if indent == 2 {
			if strings.HasSuffix(trimmed, ":") {
				if currentSection == "agents" {
					currentSubAgent = strings.TrimSuffix(trimmed, ":")
				}
			} else if strings.Contains(trimmed, ":") {
				parts := strings.SplitN(trimmed, ":", 2)
				key := strings.TrimSpace(parts[0])
				val := cleanValue(parts[1])

				switch currentSection {
				case "developer":
					if key == "name" {
						cfg.Developer.Name = val
					} else if key == "email" {
						cfg.Developer.Email = val
					}
				case "settings":
					if key == "auto_pull_on_sync" {
						cfg.Settings.AutoPullOnSync = parseBool(val)
					} else if key == "safe_push_ignore_removal" {
						cfg.Settings.SafePushIgnoreRemoval = parseBool(val)
					} else if key == "weather_city" {
						cfg.Settings.WeatherCity = val
					}
				}
			}
			continue
		}

		if indent == 4 && currentSection == "agents" && currentSubAgent != "" {
			if strings.Contains(trimmed, ":") {
				parts := strings.SplitN(trimmed, ":", 2)
				key := strings.TrimSpace(parts[0])
				val := cleanValue(parts[1])

				agent := cfg.Agents[currentSubAgent]
				if key == "enabled" {
					agent.Enabled = parseBool(val)
				} else if key == "path" {
					agent.Path = val
				}
				cfg.Agents[currentSubAgent] = agent
			}
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// LoadEnv loads environment variables from a .env file and sets them in the OS process
func LoadEnv(envPath string) error {
	file, err := os.Open(envPath)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			val := strings.TrimSpace(parts[1])
			val = strings.Trim(val, `"'`)
			os.Setenv(key, val)
		}
	}
	return scanner.Err()
}

func cleanValue(val string) string {
	val = strings.TrimSpace(val)
	val = strings.Trim(val, `"'`)
	return val
}

func parseBool(val string) bool {
	b, _ := strconv.ParseBool(val)
	return b
}

// ExpandHome resolves "~" to the user's home directory path
func ExpandHome(path string) string {
	if strings.HasPrefix(path, "~") {
		home, err := os.UserHomeDir()
		if err != nil {
			return path
		}
		// Replace ~ with home path
		if len(path) == 1 {
			return home
		}
		if path[1] == '/' || path[1] == '\\' {
			return filepath.Join(home, path[2:])
		}
		return filepath.Join(home, path[1:])
	}
	return path
}
