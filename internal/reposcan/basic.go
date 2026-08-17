package reposcan

import (
	"bytes"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"sync"
)

type Repository struct {
	Path            string
	FileCount       int
	Branch          string
	LastCommit      string
	LastCommitUnix  int64 // seconds since epoch, for sorting; 0 if unknown (e.g. no commits yet)
	LastCommitTitle string
	Languages       []LanguageStat
	External        bool   // true if added individually rather than found under the base code directory
	Error           string // empty if ok; kept as a string so it serializes cleanly across the Wails bridge
}

// ScanDirectory finds every immediate subdirectory of root that is a git
// repository (contains .git) and scans each one in parallel, bounded to
// GOMAXPROCS concurrent `git` invocations at a time.
func ScanDirectory(root string) ([]Repository, error) {
	entries, err := os.ReadDir(root)
	if err != nil {
		return nil, err
	}

	var repoPaths []string
	for _, e := range entries {
		if !e.IsDir() {
			continue
		}
		repoPath := filepath.Join(root, e.Name())
		if _, err := os.Stat(filepath.Join(repoPath, ".git")); err == nil {
			repoPaths = append(repoPaths, repoPath)
		}
	}

	results := make([]Repository, len(repoPaths))
	sem := make(chan struct{}, runtime.GOMAXPROCS(0))
	var wg sync.WaitGroup

	for i, path := range repoPaths {
		wg.Add(1)
		go func(i int, path string) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()
			results[i] = BasicRepositoryScan(path)
		}(i, path)
	}

	wg.Wait()
	return results, nil
}

// ScanRepository gathers file count, current branch, latest commit info, and
// a language breakdown for a single repo at path.
func BasicRepositoryScan(path string) Repository {
	summary := Repository{Path: path}

	files, err := ListFiles(path)
	if err != nil {
		summary.Error = err.Error()
		return summary
	}
	summary.FileCount = len(files)

	// Best-effort: a freshly initialized repo with no commits yet is a
	// valid state and shouldn't fail the whole scan just because these
	// come back empty.
	summary.Branch, _ = gitOutput(path, "branch", "--show-current")
	summary.LastCommit, _ = gitOutput(path, "log", "-1", "--format=%cr")
	summary.LastCommitTitle, _ = gitOutput(path, "log", "-1", "--format=%s")
	if unix, err := gitOutput(path, "log", "-1", "--format=%ct"); err == nil {
		summary.LastCommitUnix, _ = strconv.ParseInt(unix, 10, 64)
	}

	return summary
}

// listFiles lists path's tracked + untracked, non-ignored files via
// `git ls-files`, which already respects .gitignore, .git/info/exclude, and
// the user's global excludes, no hand-rolled gitignore matching needed.
func ListFiles(path string) ([]string, error) {
	out, err := gitOutput(path, "ls-files", "--cached", "--others", "--exclude-standard")
	if err != nil {
		return nil, err
	}
	if out == "" {
		return nil, nil
	}
	return strings.Split(out, "\n"), nil
}

// gitOutput runs `git -C path <args...>` and returns trimmed stdout.
//
// Uses `-C` rather than os.Chdir, since Chdir mutates process-wide state and
// would race across the goroutines in ScanDirectory.
func gitOutput(path string, args ...string) (string, error) {
	cmd := exec.Command("git", append([]string{"-C", path}, args...)...)
	var out bytes.Buffer
	cmd.Stdout = &out
	if err := cmd.Run(); err != nil {
		return "", err
	}
	return strings.TrimSpace(out.String()), nil
}

// parseRemoteGitURL parses a git remote URL into (owner, name). Handles both:
//
//	git@github.com:owner/name.git      (SSH)
//	https://github.com/owner/name.git  (HTTPS, .git optional)
//
// Returns ("", "") if url doesn't contain an owner/name pair.
func parseRemoteGitURL(url string) (string, string) {
	url = strings.TrimSuffix(url, ".git")
	url = strings.TrimPrefix(url, "https://")
	url = strings.TrimPrefix(url, "http://")

	// SSH form has a user@host: prefix ("git@github.com:owner/name") rather
	// than a plain "/"-separated path; normalize the ":" to "/" once that
	// prefix is stripped so the split below handles both forms the same way.
	if at := strings.Index(url, "@"); at != -1 {
		url = url[at+1:]
		url = strings.Replace(url, ":", "/", 1)
	}

	parts := strings.Split(url, "/")
	if len(parts) < 2 {
		return "", ""
	}
	return parts[len(parts)-2], parts[len(parts)-1]
}

// RepoIdentity returns the repo's owner/name, parsed from its "origin"
// remote. Falls back to the local folder name (no owner) if there's no
// remote, or its URL doesn't parse into an owner/name pair.
func RepoIdentity(path string) (owner, name string) {
	url, _ := gitOutput(path, "remote", "get-url", "origin")
	if url != "" {
		if owner, name := parseRemoteGitURL(url); owner != "" && name != "" {
			return owner, name
		}
	}
	return "", filepath.Base(path)
}

// InitRepository runs `git init` in path, which must already exist.
func InitRepository(path string) error {
	cmd := exec.Command("git", "-C", path, "init")
	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		if msg := strings.TrimSpace(stderr.String()); msg != "" {
			return errors.New(msg)
		}
		return err
	}
	return nil
}
