package middleware

import (
	"net"
	"net/http"
	"strings"
	"time"
)

// IPRateLimit ограничивает запросы по IP.
func IPRateLimit(maxAttempts int, window time.Duration, next http.HandlerFunc) http.HandlerFunc {
	limiter := &ipLimiter{
		maxAttempts: maxAttempts,
		window:      window,
		attempts:    make(map[string][]time.Time),
	}

	return func(w http.ResponseWriter, r *http.Request) {
		ip := clientIP(r)
		if !limiter.allow(ip) {
			http.Error(w, "слишком много запросов", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		return strings.TrimSpace(parts[0])
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		return r.RemoteAddr
	}
	return host
}
