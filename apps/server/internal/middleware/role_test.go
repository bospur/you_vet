package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestRequireRole_Allowed(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := RequireRole(next, "admin", "editor")

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	ctx := context.WithValue(req.Context(), ClaimsKey, &Claims{Role: "editor"})
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()

	handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("ожидали 200, получили %d", rr.Code)
	}
}

func TestRequireRole_Forbidden(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	handler := RequireRole(next, "admin", "editor")

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	ctx := context.WithValue(req.Context(), ClaimsKey, &Claims{Role: "groomer"})
	req = req.WithContext(ctx)
	rr := httptest.NewRecorder()

	handler(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("ожидали 403, получили %d", rr.Code)
	}
}

func TestRequireRole_NoClaims(t *testing.T) {
	handler := RequireRole(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}, "admin")

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()

	handler(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("ожидали 401, получили %d", rr.Code)
	}
}
