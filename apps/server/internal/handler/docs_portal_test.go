package handler

import "testing"

func TestValidateDocsPassword(t *testing.T) {
	if err := validateDocsPassword("short"); err == nil {
		t.Fatal("expected error for short password")
	}
	if err := validateDocsPassword("longenough"); err != nil {
		t.Fatal(err)
	}
}
