package phone

import (
	"strings"
	"unicode"
)

// Normalize приводит номер к виду +7XXXXXXXXXX (РФ) или +<digits>.
func Normalize(raw string) string {
	var digits strings.Builder
	for _, r := range raw {
		if unicode.IsDigit(r) {
			digits.WriteRune(r)
		}
	}
	d := digits.String()
	if d == "" {
		return ""
	}
	if strings.HasPrefix(d, "8") && len(d) == 11 {
		d = "7" + d[1:]
	}
	if strings.HasPrefix(d, "7") && len(d) == 11 {
		return "+" + d
	}
	if len(d) >= 10 && len(d) <= 15 {
		return "+" + d
	}
	return ""
}

// IsValidRF проверяет российский мобильный +79XXXXXXXXX.
func IsValidRF(normalized string) bool {
	return len(normalized) == 12 && strings.HasPrefix(normalized, "+79")
}
