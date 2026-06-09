package phone

import "testing"

func TestNormalize(t *testing.T) {
	tests := []struct {
		in, want string
	}{
		{"+7 (999) 123-45-67", "+79991234567"},
		{"89991234567", "+79991234567"},
		{"79991234567", "+79991234567"},
		{"", ""},
		{"abc", ""},
	}
	for _, tc := range tests {
		if got := Normalize(tc.in); got != tc.want {
			t.Errorf("Normalize(%q) = %q, want %q", tc.in, got, tc.want)
		}
	}
}

func TestIsValidRF(t *testing.T) {
	if !IsValidRF("+79991234567") {
		t.Fatal("expected valid RF phone")
	}
	if IsValidRF("+7123456") {
		t.Fatal("expected invalid short phone")
	}
}
