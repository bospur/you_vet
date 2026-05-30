package middleware

import (
	"net/http"
	"os"
	"strings"
)

var defaultAllowedOrigins = []string{
	"https://admin.snzbeachvolleyball25.ru",
	"https://app.snzbeachvolleyball25.ru",
	"http://localhost:5173",
	"http://localhost:5174",
}

func allowedOrigins() []string {
	raw := os.Getenv("CORS_ORIGINS")
	if raw == "" {
		return defaultAllowedOrigins
	}
	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, p := range parts {
		if o := strings.TrimSpace(p); o != "" {
			origins = append(origins, o)
		}
	}
	if len(origins) == 0 {
		return defaultAllowedOrigins
	}
	return origins
}

func isOriginAllowed(origin string, allowed []string) bool {
	for _, o := range allowed {
		if o == origin {
			return true
		}
	}
	return false
}

func CORS(next http.Handler) http.Handler {
	allowed := allowedOrigins()

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin != "" && isOriginAllowed(origin, allowed) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}
