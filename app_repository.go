package main

import (
	"errors"
	"os"
	"path/filepath"
	"slices"
	"strings"

	"nodz/internal/reposcan"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// ScanForRepositories scans the base code directory plus any individually
// added external repositories, and returns a summary for each.
func (app *App) ScanForRepositories() ([]reposcan.Repository, error) {
	results, err := reposcan.ScanDirectory(app.baseDirectory)
	if err != nil {
		return nil, app.logError("ScanForRepositories: ScanDirectory", err)
	}

	for _, path := range app.externalRepos {
		summary := reposcan.BasicRepositoryScan(path)
		summary.External = true
		results = append(results, summary)
	}

	failed := 0
	for _, r := range results {
		if r.Error == "" {
			continue
		}
		failed++
		app.logError("ScanForRepositories: "+r.Path, errors.New(r.Error))
	}
	app.logInfof("ScanForRepositories: %d repos scanned, %d failed", len(results), failed)

	return results, nil
}

// OpenRepositoryFile opens a file from the currently open repository in the
// configured editor.
//
// Mock: there's no real per-file backend data yet (Structure runs on the
// mock repo graph, not a real scan of an opened repo), so every call opens
// this project's own README.md via os.Getwd() regardless of which file node
// was clicked. Swap for a real path once Structure has one.
func (app *App) OpenRepositoryFile() error {
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	return app.OpenInEditor(filepath.Join(root, "README.md"))
}

// OpenRepositoryInEditor opens the currently open repository's root folder
// in the configured editor.
//
// Mock: same caveat as OpenRepositoryFile, there's no real "which repo is
// open" concept yet, so this opens this project's own root via os.Getwd().
func (app *App) OpenRepositoryInEditor() error {
	root, err := os.Getwd()
	if err != nil {
		return err
	}
	return app.OpenInEditor(root)
}

// AddExternalRepository opens the native "choose a folder" dialog so the
// user can point at a git repo living outside the base code directory, then
// remembers it across restarts. Returns "" if the user cancelled.
func (app *App) AddExternalRepository() (string, error) {
	path, err := runtime.OpenDirectoryDialog(app.ctx, runtime.OpenDialogOptions{
		Title: "Choose a repository",
	})
	if err != nil {
		return "", app.logError("AddExternalRepository", err)
	}
	if path == "" {
		return "", nil
	}

	if !slices.Contains(app.externalRepos, path) {
		app.externalRepos = append(app.externalRepos, path)
		if err := app.persistConfig(); err != nil {
			return path, err
		}
		app.logInfof("AddExternalRepository: %q", path)
	}

	return path, nil
}

// scanProgressEvent is the name the frontend listens for via
// runtime.EventsOn to drive the "opening repository" progress bar.
const scanProgressEvent = "repo:scan-progress"

// OpenRepository scans path in depth (branch/commit already known from the
// basic scan; this adds the file tree + per-file language) and caches the
// result for GetSelectedRepo. Emits scanProgressEvent as it goes, since this
// can take a while on a large repo and the frontend has nothing else to show
// progress from during the single blocking Wails call.
func (app *App) OpenRepository(path string) error {
	files, err := reposcan.ListFiles(path)
	if err != nil {
		return app.logError("OpenRepository: ListFiles", err)
	}

	detail := reposcan.DetailedRepoScan(path, files, func(done, total int) {
		runtime.EventsEmit(app.ctx, scanProgressEvent, done, total)
	})
	detail.Owner, detail.Name = reposcan.RepoIdentity(path)
	app.selectedRepo = &detail
	app.logInfof("OpenRepository: %q (%d files)", path, len(files))
	return nil
}

func (app *App) GetSelectedRepo() (*reposcan.DetailedRepository, error) {
	if app.selectedRepo == nil {
		return nil, app.logError("GetSelectedRepo", errors.New("no repository open"))
	}
	return app.selectedRepo, nil
}

func (app *App) CloseRepository() {
	app.selectedRepo = nil
	app.logInfof("CloseRepository")
}

// CreateNewRepository makes a new directory at path/name, git-inits it, and
// opens it in the configured editor. If it doesn't land as an immediate
// child of the base code directory (e.g. the user picked an arbitrary
// folder via the dialog's folder picker), it's remembered the same way
// AddExternalRepository does, otherwise the next scan wouldn't find it.
func (app *App) CreateNewRepository(name, path string) (string, error) {
	target := filepath.Join(path, name)

	if name == "" || strings.Contains(target, "..") {
		return "", app.logError("CreateNewRepository", errors.New("invalid path"))
	}

	if _, err := os.Stat(target); err == nil {
		return "", app.logError("CreateNewRepository", errors.New("directory already exists"))
	}

	if err := os.MkdirAll(target, 0755); err != nil {
		return "", app.logError("CreateNewRepository: MkdirAll", err)
	}

	if err := reposcan.InitRepository(target); err != nil {
		os.RemoveAll(target)
		return "", app.logError("CreateNewRepository: git init", err)
	}

	if filepath.Dir(target) != app.baseDirectory && !slices.Contains(app.externalRepos, target) {
		app.externalRepos = append(app.externalRepos, target)
		if err := app.persistConfig(); err != nil {
			return target, err
		}
	}

	if err := app.OpenInEditor(target); err != nil {
		app.logError("CreateNewRepository: OpenInEditor", err)
	}

	app.logInfof("CreateNewRepository: %q", target)
	return target, nil
}
