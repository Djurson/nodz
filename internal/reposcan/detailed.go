package reposcan

import (
	"nodz/internal/util"
	"os"
	"path/filepath"
	"strings"

	"github.com/go-enry/go-enry/v2"
)

// DetailedRepository is the deeper, single-repo scan result cached in memory
// once a user opens a specific repository, as opposed to Repository, which
// is the cheap top-level scan used to list repos.
type DetailedRepository struct {
	Path    string
	Tree    FolderNode
	Owner   string
	Name    string
	Commits []Commits
}

type Commits struct{}

// FileEntry is one file inside an opened repository.
type FileEntry struct {
	Path     string // relative to the repo root
	Size     int64
	Language string
}

// FolderNode is one directory inside an opened repository's file tree.
type FolderNode struct {
	Name     string
	Path     string // relative to the repo root; "" for the root itself
	Files    []FileEntry
	Children []FolderNode
}

// DetailedRepoScan walks files (from ListFiles) into a FolderNode tree,
// reading each file once for size + language. onProgress, if non-nil, is
// called after each file with (files scanned so far, total files) — this
// package stays Wails-free (see language.go), so the caller is responsible
// for turning that into e.g. a runtime.EventsEmit progress event.
func DetailedRepoScan(path string, files []string, onProgress func(done, total int)) DetailedRepository {
	// Files/Children start as empty (non-nil) slices, not the zero-value nil:
	// encoding/json marshals a nil slice as `null`, and the generated TS
	// models pass that straight through unchanged, so the frontend's tree
	// walk (node.Files.length, for...of node.Children, etc.) would throw on
	// any leaf folder or an empty root instead of iterating zero times.
	root := FolderNode{Name: "", Path: "", Files: []FileEntry{}, Children: []FolderNode{}}

	for i, f := range files {
		parts := strings.Split(f, "/")
		filename, parts := util.Pop(parts)

		// &root, not root: root is a value, and every node below is reached
		// by descending through slice-index pointers, so mutations actually
		// land in the tree we return instead of a throwaway copy.
		current := &root
		pathSoFar := ""
		for _, part := range parts {
			// Path fields are repo-relative virtual keys (git's own "/" style,
			// same as f), not filesystem paths, keep them "/"-joined rather
			// than filepath.Join, which would use "\" on Windows and make
			// FolderNode.Path inconsistent with FileEntry.Path.
			if pathSoFar == "" {
				pathSoFar = part
			} else {
				pathSoFar = pathSoFar + "/" + part
			}

			child := findChild(current, part)
			if child == nil {
				current.Children = append(current.Children, FolderNode{Name: part, Path: pathSoFar, Files: []FileEntry{}, Children: []FolderNode{}})
				child = &current.Children[len(current.Children)-1]
			}
			current = child
		}

		entry := FileEntry{Path: f}
		// The actual filesystem read does use filepath.Join: this one needs
		// the OS-native separator to reach the real file on disk.
		if content, err := os.ReadFile(filepath.Join(path, f)); err == nil {
			// No IsVendor/IsBinary/IsGenerated filtering here (unlike
			// detectLanguages): this lists every tracked file for a file
			// tree UI, not an aggregate language stat that filtering
			// like that would otherwise skew.
			entry.Size = int64(len(content))
			entry.Language = enry.GetLanguage(filename, content)
		}
		current.Files = append(current.Files, entry)

		if onProgress != nil {
			onProgress(i+1, len(files))
		}
	}

	return DetailedRepository{Path: path, Tree: root}
}

// findChild returns node's direct child named name, or nil if none exists
// yet.
func findChild(node *FolderNode, name string) *FolderNode {
	for i := range node.Children {
		if node.Children[i].Name == name {
			return &node.Children[i]
		}
	}
	return nil
}
