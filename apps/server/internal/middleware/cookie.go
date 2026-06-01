package middleware

import (
	"net/http"
	"os"
	"strings"
	"time"
)

const AdminTokenCookie = "vp_admin_token"

const adminTokenSessionMaxAge = 24 * time.Hour
const adminTokenRememberMaxAge = 30 * 24 * time.Hour

// AdminTokenTTL возвращает срок жизни JWT и cookie для admin.
func AdminTokenTTL(remember bool) time.Duration {
	if remember {
		return adminTokenRememberMaxAge
	}
	return adminTokenSessionMaxAge
}

func adminCookieDomain() string {
	return strings.TrimSpace(os.Getenv("COOKIE_DOMAIN"))
}

func adminCookieSecure() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SECURE")))
	return v == "1" || v == "true" || v == "yes"
}

// SetAdminAuthCookie сохраняет JWT в httpOnly cookie.
func SetAdminAuthCookie(w http.ResponseWriter, token string, remember bool) {
	http.SetCookie(w, &http.Cookie{
		Name:     AdminTokenCookie,
		Value:    token,
		Path:     "/",
		Domain:   adminCookieDomain(),
		MaxAge:   int(AdminTokenTTL(remember).Seconds()),
		HttpOnly: true,
		Secure:   adminCookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}

// ClearAdminAuthCookie удаляет cookie авторизации admin.
func ClearAdminAuthCookie(w http.ResponseWriter) {
	http.SetCookie(w, &http.Cookie{
		Name:     AdminTokenCookie,
		Value:    "",
		Path:     "/",
		Domain:   adminCookieDomain(),
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   adminCookieSecure(),
		SameSite: http.SameSiteLaxMode,
	})
}

// TokenFromRequest читает JWT из cookie или Authorization: Bearer.
func TokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(AdminTokenCookie); err == nil && c.Value != "" {
		return c.Value
	}

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}
	return parts[1]
}
