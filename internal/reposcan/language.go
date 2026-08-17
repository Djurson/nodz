package reposcan

import (
	"log"
	"os"
	"path/filepath"
	"sort"

	"github.com/go-enry/go-enry/v2"
)

// LanguageStat is one language's share of a repo, by file size in bytes
// (not file count, so one huge lockfile can't outweigh actual source).
type LanguageStat struct {
	Language string
	Bytes    int64
}

// detectLanguages logs via the standard "log" package rather than the
// app.logError/logInfof helpers used elsewhere: this package is deliberately
// kept free of any Wails dependency (no ctx, no App receiver) so it stays
// unit-testable standalone. Both still end up in the same `wails dev`
// console/native log output, since it's the same process either way.
func detectLanguages(repoPath string, files []os.File) []LanguageStat {
	bytesByLanguage := map[string]int64{}

	for _, f := range files {
		path := filepath.Join(repoPath, f.Name())
		if enry.IsVendor(path) || enry.IsDotFile(path) || enry.IsConfiguration(path) || enry.IsDocumentation(path) || enry.IsImage(path) {
			continue
		}

		content, err := os.ReadFile(path)
		if err != nil {
			log.Printf("reposcan: detectLanguages: failed to read %s: %v", path, err)
			continue
		}
		if enry.IsBinary(content) || enry.IsGenerated(path, content) {
			continue
		}

		lang := enry.GetLanguage(path, content)
		if lang == "" {
			continue
		}

		bytesByLanguage[lang] += int64(len(content))
	}

	stats := make([]LanguageStat, 0, len(bytesByLanguage))
	for lang, size := range bytesByLanguage {
		stats = append(stats, LanguageStat{Language: lang, Bytes: size})
	}
	sort.Slice(stats, func(i, j int) bool { return stats[i].Bytes > stats[j].Bytes })
	return stats
}
