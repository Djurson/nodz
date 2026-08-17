package main

import (
	"fmt"
	"os"
	"os/exec"
	goruntime "runtime"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// SetEditor saves the CLI command used to open files/repos in the user's
// editor of choice (e.g. "code", "cursor", "subl", "zed").
func (app *App) SetEditor(editor string) error {
	app.editor = strings.TrimSpace(editor)
	if err := app.persistConfig(); err != nil {
		return err
	}
	app.logInfof("SetEditor: %q", app.editor)
	return nil
}

// OpenInFileExplorer reveals path in the OS's native file browser
// (Finder / Explorer / the Linux desktop's default file manager).
func (app *App) OpenInFileExplorer(path string) error {
	path, err := expandHome(path)
	if err != nil {
		return app.logError("OpenInFileExplorer: expandHome", err)
	}

	var cmd *exec.Cmd
	switch goruntime.GOOS {
	case "darwin":
		cmd = exec.Command("open", path)
	case "windows":
		cmd = exec.Command("explorer", path)
	case "linux":
		cmd = exec.Command("xdg-open", path)
	default:
		return app.logError("OpenInFileExplorer", fmt.Errorf("unsupported platform: %s", goruntime.GOOS))
	}
	if err := cmd.Start(); err != nil {
		return app.logError("OpenInFileExplorer", err)
	}
	app.logInfof("OpenInFileExplorer: %q", path)
	return nil
}

// OpenInEditor opens path (a file or a directory) in the user's configured
// editor via its CLI shim (e.g. `code`, `cursor`, `subl`, `zed`). Unlike
// OpenInFileExplorer, this needs no per-OS branching: editor CLI shims are
// cross-platform once on PATH, they just take a path argument.
func (app *App) OpenInEditor(path string) error {
	if app.editor == "" {
		return app.logError("OpenInEditor", fmt.Errorf("no code editor configured, set one in Settings"))
	}
	path, err := expandHome(path)
	if err != nil {
		return app.logError("OpenInEditor: expandHome", err)
	}
	if err := exec.Command(app.editor, path).Start(); err != nil {
		return app.logError("OpenInEditor", err)
	}
	app.logInfof("OpenInEditor: %q via %q", path, app.editor)
	return nil
}

// ChooseCodeDirectory opens the native "choose a folder" dialog and returns
// the picked path, or "" if the user cancelled (Wails returns "", nil for a
// cancelled dialog rather than an error).
func (app *App) ChooseCodeDirectory() (string, error) {
	path, err := runtime.OpenDirectoryDialog(app.ctx, runtime.OpenDialogOptions{
		Title: "Choose your code directory",
	})
	if err != nil {
		return "", app.logError("ChooseCodeDirectory", err)
	}
	if path == "" {
		return "", nil // cancelled; leave any previously chosen directory alone
	}

	app.baseDirectory = path
	if err := app.persistConfig(); err != nil {
		return path, err
	}

	app.logInfof("ChooseCodeDirectory: %q", path)
	return path, nil
}

// ChooseDirectory opens the native "choose a folder" dialog and returns the
// picked path, or "" if the user cancelled. Unlike ChooseCodeDirectory, this
// has no side effects on app state, it doesn't touch app.baseDirectory or
// persist config, so it's safe to reuse as a plain folder picker anywhere
// (e.g. picking the parent directory for a new repository).
func (app *App) ChooseDirectory() (string, error) {
	path, err := runtime.OpenDirectoryDialog(app.ctx, runtime.OpenDialogOptions{
		Title: "Choose a folder",
	})
	if err != nil {
		return "", app.logError("ChooseDirectory", err)
	}
	return path, nil
}

// expandHome expands a leading "~" the way a shell would. exec.Command never
// goes through a shell, so this never happens automatically the way it would
// when a user types a "~" path into a terminal.
func expandHome(path string) (string, error) {
	if path != "~" && !strings.HasPrefix(path, "~/") {
		return path, nil
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return home + path[1:], nil
}
