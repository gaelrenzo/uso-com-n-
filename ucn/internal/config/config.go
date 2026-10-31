package config

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v3"
)

// Developer holds name and email config
type Developer struct {
	Name  string `yaml:"name"`
	Email string `yaml:"email"`
}

// Agent represents individual IA agent rules path and toggle
type Agent struct {
	Enabled bool   `yaml:"enabled"`
	Path    string `yaml:"path"`
}

// Settings represents general CLI options
type Settings struct {
	AutoPullOnSync        bool   `yaml:"auto_pull_on_sync"`
	SafePushIgnoreRemoval bool   `yaml:"safe_push_ignore_removal"`
	WeatherCity           string `yaml:"weather_city"`
}

// Config maps the overall yaml configuration structure
type Config struct {
	Developer Developer        `yaml:"developer"`
	Workspace string           `yaml:"workspace"`
	Agents    map[string]Agent `yaml:"agents"`
	Settings  Settings         `yaml:"settings"`
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

	data, err := os.ReadFile(configPath)
	if err != nil {
		return nil, err
	}
	if err := yaml.Unmarshal(data, cfg); err != nil {
		return nil, fmt.Errorf("%s: %w", configPath, err)
	}
	if cfg.Agents == nil {
		cfg.Agents = make(map[string]Agent)
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
