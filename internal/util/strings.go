package util

// pop returns s's last element and s with that element removed. Go slices
// have no built-in pop, unlike JS/Python. Assumes s is non-empty, callers
// here always split a non-empty git-reported path, which never yields [].
func Pop(s []string) (string, []string) {
	last := len(s) - 1
	return s[last], s[:last]
}
