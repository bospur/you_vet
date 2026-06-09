package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type mobileContextKey string

const MobileClaimsKey mobileContextKey = "mobile_claims"

// MobileClaims — JWT mobile-пользователя.
type MobileClaims struct {
	MobileUserID   int64
	TelegramUserID int64
	Phone          string
	ClinicID       int
}

func MobileClaimsFromContext(r *http.Request) *MobileClaims {
	v := r.Context().Value(MobileClaimsKey)
	if v == nil {
		return nil
	}
	return v.(*MobileClaims)
}

// ClientTelegramUserID — initData (Mini App) или mobile JWT.
func ClientTelegramUserID(r *http.Request) (int64, bool) {
	if c := MobileClaimsFromContext(r); c != nil && c.TelegramUserID > 0 {
		return c.TelegramUserID, true
	}
	if visit, ok := ParseInitDataUser(InitDataFromRequest(r)); ok {
		return visit.TelegramUserID, true
	}
	return 0, false
}

// MobileAuth проверяет Bearer JWT mobile-приложения.
func MobileAuth(secret string, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw := mobileTokenFromRequest(r)
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

		if typ, _ := mapClaims["typ"].(string); typ != "access" {
			http.Error(w, "недействительный токен", http.StatusUnauthorized)
			return
		}

		claims := &MobileClaims{
			MobileUserID:   int64(mapClaims["sub"].(float64)),
			TelegramUserID: int64(mapClaims["tg_id"].(float64)),
			Phone:          mapClaims["phone"].(string),
			ClinicID:       int(mapClaims["clinic_id"].(float64)),
		}

		ctx := context.WithValue(r.Context(), MobileClaimsKey, claims)
		next(w, r.WithContext(ctx))
	}
}

func mobileTokenFromRequest(r *http.Request) string {
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "Bearer ") {
		return strings.TrimPrefix(auth, "Bearer ")
	}
	return ""
}
