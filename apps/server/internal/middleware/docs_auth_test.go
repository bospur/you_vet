package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go-server/internal/middleware"

	"github.com/golang-jwt/jwt/v5"
)

func docsToken(secret, typ string, expired bool) string {
	exp := time.Now().Add(15 * time.Minute)
	if expired {
		exp = time.Now().Add(-time.Minute)
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  float64(7),
		"typ":  typ,
		"name": "Тест",
		"exp":  exp.Unix(),
	})
	str, _ := token.SignedString([]byte(secret))
	return str
}

func TestDocsAuth_AccessCookie(t *testing.T) {
	token := docsToken(testSecret, "docs_access", false)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: middleware.DocsAccessCookie, Value: token})
	rr := httptest.NewRecorder()

	middleware.DocsAuth(testSecret, okHandler)(rr, req)
	if rr.Code != http.StatusOK {
		t.Errorf("ожидали 200, получили %d", rr.Code)
	}
}

func TestDocsAuth_RefreshCookieRejected(t *testing.T) {
	token := docsToken(testSecret, "docs_refresh", false)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: middleware.DocsAccessCookie, Value: token})
	rr := httptest.NewRecorder()

	middleware.DocsAuth(testSecret, okHandler)(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("ожидали 401, получили %d", rr.Code)
	}
}

func TestDocsAuth_LegacyTypRejected(t *testing.T) {
	token := docsToken(testSecret, "docs", false)
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	rr := httptest.NewRecorder()

	middleware.DocsAuth(testSecret, okHandler)(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Errorf("ожидали 401, получили %d", rr.Code)
	}
}
