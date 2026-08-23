package handler

import "testing"

func TestNormalizeDocsPath(t *testing.T) {
	okCases := map[string]string{
		"/":               "/",
		"/board":          "/board",
		"/board?task=12":  "/board?task=12",
		"/sales":          "/sales",
		"/roadmap#anchor": "/roadmap",
		"  /mobile  ":     "/mobile",
	}
	for in, want := range okCases {
		got, ok := normalizeDocsPath(in)
		if !ok || got != want {
			t.Errorf("normalizeDocsPath(%q) = %q, %v; want %q, true", in, got, ok, want)
		}
	}

	bad := []string{"", "board", "//evil", "/../etc/passwd", "/has space", "https://evil", stringsRepeat("/a", 201)}
	for _, in := range bad {
		if _, ok := normalizeDocsPath(in); ok {
			t.Errorf("normalizeDocsPath(%q) should fail", in)
		}
	}
}

func stringsRepeat(s string, n int) string {
	out := make([]byte, 0, n)
	for len(out) < n {
		out = append(out, s...)
	}
	return string(out[:n])
}

func TestValidateDocsPassword(t *testing.T) {
	if err := validateDocsPassword("short"); err == nil {
		t.Fatal("expected error for short password")
	}
	if err := validateDocsPassword("longenough"); err != nil {
		t.Fatal(err)
	}
}
