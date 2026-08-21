package middleware

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type docsContextKey string

const DocsClaimsKey docsContextKey = "docs_claims"

type DocsClaims struct {
	VisitorID   int64
	DisplayName string
}

func DocsClaimsFromContext(r *http.Request) *DocsClaims {
	v := r.Context().Value(DocsClaimsKey)
	if v == nil {
		return nil
	}
	return v.(*DocsClaims)
}

func DocsAuth(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw := docsTokenFromRequest(r)
		if raw == "" {
			http.Error(w, "требуется авторизация", http.StatusUnauthorized)
			return
		}

		token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, "недействительный токен", http.StatusUnauthorized)
			return
		}

		mapClaims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, "недействительный токен", http.StatusUnauthorized)
			return
		}

		if typ, _ := mapClaims["typ"].(string); typ != "docs" {
			http.Error(w, "недействительный токен", http.StatusUnauthorized)
			return
		}

		visitorID, ok := visitorIDFromClaims(mapClaims)
		if !ok {
			http.Error(w, "недействительный токен", http.StatusUnauthorized)
			return
		}

		claims := &DocsClaims{
			VisitorID: visitorID,
		}
		if v, ok := mapClaims["name"].(string); ok {
			claims.DisplayName = v
		}

		ctx := context.WithValue(r.Context(), DocsClaimsKey, claims)
		next(w, r.WithContext(ctx))
	}
}

func docsTokenFromRequest(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}

func visitorIDFromClaims(mapClaims jwt.MapClaims) (int64, bool) {
	switch v := mapClaims["sub"].(type) {
	case float64:
		if v <= 0 {
			return 0, false
		}
		return int64(v), true
	case json.Number:
		n, err := v.Int64()
		return n, err == nil && n > 0
	case string:
		n, err := strconv.ParseInt(v, 10, 64)
		return n, err == nil && n > 0
	default:
		return 0, false
	}
}
