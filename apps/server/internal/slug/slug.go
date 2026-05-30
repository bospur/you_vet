package slug

import (
	"regexp"
	"strconv"
	"strings"
)

var nonSlugChars = regexp.MustCompile(`[^a-z0-9]+`)

var ruMap = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "yo",
	'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
	'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
	'ф': "f", 'х': "h", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "sch", 'ъ': "",
	'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
}

// FromTitle строит URL-slug из заголовка (латиница + транслитерация кириллицы).
func FromTitle(title string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(strings.TrimSpace(title)) {
		if mapped, ok := ruMap[r]; ok {
			b.WriteString(mapped)
			continue
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		} else if r == ' ' || r == '-' || r == '_' {
			b.WriteByte('-')
		}
	}
	s := nonSlugChars.ReplaceAllString(b.String(), "-")
	s = strings.Trim(s, "-")
	if s == "" {
		return "article"
	}
	return s
}

// UniqueSuffix добавляет суффикс -2, -3… если base уже занят.
func UniqueSuffix(base string, exists func(string) bool) string {
	if !exists(base) {
		return base
	}
	for i := 2; i < 10000; i++ {
		candidate := base + "-" + strconv.Itoa(i)
		if !exists(candidate) {
			return candidate
		}
	}
	return base + "-" + strconv.FormatInt(int64(len(base)), 10)
}
