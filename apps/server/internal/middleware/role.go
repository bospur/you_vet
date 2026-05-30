package middleware

import "net/http"

// RequireRole проверяет, что роль из JWT входит в список разрешённых.
// Вызывать только после Auth — claims уже в контексте.
func RequireRole(next http.HandlerFunc, roles ...string) http.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, role := range roles {
		allowed[role] = struct{}{}
	}

	return func(w http.ResponseWriter, r *http.Request) {
		claims := ClaimsFromContext(r)
		if claims == nil {
			http.Error(w, "требуется авторизация", http.StatusUnauthorized)
			return
		}
		if _, ok := allowed[claims.Role]; !ok {
			http.Error(w, "доступ запрещён", http.StatusForbidden)
			return
		}
		next(w, r)
	}
}
