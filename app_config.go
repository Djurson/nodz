package main

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
)

// AppConfig is persisted to disk so the base code directory, any
// individually added external repos, and the chosen editor survive an app
// restart.
type AppConfig struct {
	BaseDirectory string   `json:"baseDirectory"`
	ExternalRepos []string `json:"externalRepos"`
	Editor        string   `json:"editor"` // CLI command, e.g. "code", "cursor", "subl", "zed"
}

// configFilePath returns the on-disk location of the config file, creating
// its parent directory if needed (e.g. ~/Library/Application Support/nodz
// on macOS, %AppData%\nodz on Windows, ~/.config/nodz on Linux).
func configFilePath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", err
	}
	dir = filepath.Join(dir, "nodz")
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	return filepath.Join(dir, "config.json"), nil
}

// loadConfig returns a zero-value AppConfig (not an error) when nothing has
// been saved yet, e.g. on first launch.
func loadConfig() (AppConfig, error) {
	path, err := configFilePath()
	if err != nil {
		return AppConfig{}, err
	}

	data, err := os.ReadFile(path)
	if errors.Is(err, os.ErrNotExist) {
		return AppConfig{}, nil
	}
	if err != nil {
		return AppConfig{}, err
	}

	var cfg AppConfig
	if err := json.Unmarshal(data, &cfg); err != nil {
		return AppConfig{}, err
	}
	return cfg, nil
}

func saveConfig(cfg AppConfig) error {
	path, err := configFilePath()
	if err != nil {
		return err
	}
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0o644)
}

// persistConfig saves app's current baseDirectory/externalRepos/editor.
// Logs once here (rather than at each caller) since ChooseCodeDirectory,
// SetEditor, and AddExternalRepository all funnel through it.
func (app *App) persistConfig() error {
	if err := saveConfig(AppConfig{BaseDirectory: app.baseDirectory, ExternalRepos: app.externalRepos, Editor: app.editor}); err != nil {
		return app.logError("persistConfig", err)
	}
	return nil
}

// GetConfig returns the base directory / external repos / editor restored
// from disk at startup, so the frontend can pick up where the last session
// left off.
func (app *App) GetConfig() AppConfig {
	return AppConfig{BaseDirectory: app.baseDirectory, ExternalRepos: app.externalRepos, Editor: app.editor}
}
