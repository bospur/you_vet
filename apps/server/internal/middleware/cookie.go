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

func cookieDomain() string {
	return strings.TrimSpace(os.Getenv("COOKIE_DOMAIN"))
}

func cookieSecure() bool {
	v := strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SECURE")))
	return v == "1" || v == "true" || v == "yes"
}

func adminCookieDomain() string { return cookieDomain() }

func adminCookieSecure() bool { return cookieSecure() }

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

const (
	DocsAccessCookie  = "yv_docs_access"
	DocsRefreshCookie = "yv_docs_refresh"
	DocsSessionCookie = "yv_docs_session"

	DocsAccessTTL  = 15 * time.Minute
	DocsRefreshTTL = 30 * 24 * time.Hour
)

func docsCookie(name, value string, maxAge int, httpOnly bool) *http.Cookie {
	return &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		Domain:   cookieDomain(),
		MaxAge:   maxAge,
		HttpOnly: httpOnly,
		Secure:   cookieSecure(),
		SameSite: http.SameSiteLaxMode,
	}
}

// SetDocsAuthCookies ставит access + refresh (httpOnly) и флаг сессии (виден JS).
func SetDocsAuthCookies(w http.ResponseWriter, access, refresh string) {
	http.SetCookie(w, docsCookie(DocsAccessCookie, access, int(DocsAccessTTL.Seconds()), true))
	http.SetCookie(w, docsCookie(DocsRefreshCookie, refresh, int(DocsRefreshTTL.Seconds()), true))
	http.SetCookie(w, docsCookie(DocsSessionCookie, "1", int(DocsRefreshTTL.Seconds()), false))
}

// ClearDocsAuthCookies снимает все cookies портала.
func ClearDocsAuthCookies(w http.ResponseWriter) {
	http.SetCookie(w, docsCookie(DocsAccessCookie, "", -1, true))
	http.SetCookie(w, docsCookie(DocsRefreshCookie, "", -1, true))
	http.SetCookie(w, docsCookie(DocsSessionCookie, "", -1, false))
}

func DocsAccessTokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(DocsAccessCookie); err == nil && c.Value != "" {
		return c.Value
	}
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}

func DocsRefreshTokenFromRequest(r *http.Request) string {
	if c, err := r.Cookie(DocsRefreshCookie); err == nil && c.Value != "" {
		return c.Value
	}
	return ""
}
