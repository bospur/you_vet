package repository

import "testing"

func TestSuggestStaffLogin(t *testing.T) {
	got := SuggestStaffLogin("Иванов Пётр Сергеевич", 3)
	if got != "ivanov" {
		t.Fatalf("got %q", got)
	}
	got = SuggestStaffLogin("Li", 9)
	if got != "doctor9" {
		t.Fatalf("short name: %q", got)
	}
}
