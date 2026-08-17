package main

import (
	"context"
	"nodz/internal/reposcan"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// App struct
type App struct {
	ctx           context.Context
	baseDirectory string
	externalRepos []string
	editor        string
	selectedRepo  *reposcan.DetailedRepository
}

// NewApp creates a new App application struct
func NewApp() *App { return &App{} }

// startup is called when the app starts. The context is saved so we can
// call the runtime methods, and any previously saved base directory /
// external repos are restored so they survive an app restart.
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	cfg, err := loadConfig()
	if err != nil {
		a.logError("startup: loadConfig", err)
		return // no saved config yet, or unreadable; start fresh
	}
	a.baseDirectory = cfg.BaseDirectory
	a.externalRepos = cfg.ExternalRepos
	a.editor = cfg.Editor
	a.logInfof("startup: restored config (baseDirectory=%q, externalRepos=%d, editor=%q)", a.baseDirectory, len(a.externalRepos), a.editor)
}

// logError logs err via the Wails runtime (visible in `wails dev`'s console
// and the native app's log output) and returns it unchanged, so call sites
// can write `return "", app.logError("ChooseCodeDirectory", err)`.
func (a *App) logError(context string, err error) error {
	if a.ctx != nil {
		runtime.LogErrorf(a.ctx, "%s: %v", context, err)
	}
	return err
}

func (a *App) logInfof(format string, args ...any) {
	if a.ctx != nil {
		runtime.LogInfof(a.ctx, format, args...)
	}
}

// LogFrontendError forwards a frontend-side error into the same Wails log
// output as backend errors, so both sides show up in one log stream instead
// of frontend errors being invisible outside the browser/webview devtools.
func (a *App) LogFrontendError(context string, message string) {
	if a.ctx != nil {
		runtime.LogErrorf(a.ctx, "[frontend] %s: %s", context, message)
	}
}
