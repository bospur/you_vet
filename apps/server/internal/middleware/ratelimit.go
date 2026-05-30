package middleware

import (
	"net/http"
	"sync"
	"time"
)

// LoginRateLimit ограничивает попытки входа: maxAttempts за window на IP.
func LoginRateLimit(maxAttempts int, window time.Duration, next http.HandlerFunc) http.HandlerFunc {
	limiter := &ipLimiter{
		maxAttempts: maxAttempts,
		window:      window,
		attempts:    make(map[string][]time.Time),
	}

	return func(w http.ResponseWriter, r *http.Request) {
		ip := r.RemoteAddr
		if !limiter.allow(ip) {
			http.Error(w, "слишком много попыток, попробуйте позже", http.StatusTooManyRequests)
			return
		}
		next(w, r)
	}
}

type ipLimiter struct {
	mu          sync.Mutex
	maxAttempts int
	window      time.Duration
	attempts    map[string][]time.Time
}

func (l *ipLimiter) allow(ip string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()

	now := time.Now()
	cutoff := now.Add(-l.window)

	times := l.attempts[ip]
	filtered := times[:0]
	for _, t := range times {
		if t.After(cutoff) {
			filtered = append(filtered, t)
		}
	}

	if len(filtered) >= l.maxAttempts {
		l.attempts[ip] = filtered
		return false
	}

	l.attempts[ip] = append(filtered, now)
	return true
}
