package repository

import (
	"strconv"
	"strings"
	"unicode"
)

var ruLat = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "e",
	'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
	'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
	'ф': "f", 'х': "h", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "sch",
	'ъ': "", 'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
}

// SuggestStaffLogin — логин из фамилии (первое слово ФИО).
func SuggestStaffLogin(fullName string, doctorID int) string {
	name := strings.TrimSpace(fullName)
	first := name
	if i := strings.IndexFunc(name, unicode.IsSpace); i > 0 {
		first = name[:i]
	}
	var b strings.Builder
	for _, r := range strings.ToLower(first) {
		if lat, ok := ruLat[r]; ok {
			b.WriteString(lat)
			continue
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	login := b.String()
	if len(login) < 3 {
		return "doctor" + strconv.Itoa(doctorID)
	}
	if len(login) > 24 {
		login = login[:24]
	}
	return login
}
