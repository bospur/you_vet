package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"
)

var errInvalidInitData = errors.New("invalid init data")

const telegramInitDataHeader = "X-Telegram-Init-Data"

// ValidateTelegramInitData проверяет подпись initData Mini App (Telegram Web Apps).
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
func ValidateTelegramInitData(initData, botToken string, maxAge time.Duration) bool {
	if initData == "" || botToken == "" {
		return false
	}

	values, err := parseInitData(initData)
	if err != nil {
		return false
	}

	receivedHash := values.Get("hash")
	if receivedHash == "" {
		return false
	}

	if maxAge > 0 {
		authDateStr := values.Get("auth_date")
		authDate, err := strconv.ParseInt(authDateStr, 10, 64)
		if err != nil {
			return false
		}
		authTime := time.Unix(authDate, 0)
		if time.Since(authTime) > maxAge || authTime.After(time.Now().Add(2*time.Minute)) {
			return false
		}
	}

	dataCheckString := buildInitDataCheckString(values)
	secretKey := hmacSHA256([]byte("WebAppData"), botToken)
	calculated := hex.EncodeToString(hmacSHA256(secretKey, dataCheckString))

	return hmac.Equal([]byte(calculated), []byte(receivedHash))
}

func parseInitData(initData string) (url.Values, error) {
	values, err := url.ParseQuery(initData)
	if err != nil || len(values) == 0 {
		return nil, errInvalidInitData
	}
	return values, nil
}

func buildInitDataCheckString(values url.Values) string {
	keys := make([]string, 0, len(values))
	for k := range values {
		if k == "hash" {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		// Telegram передаёт по одному значению на ключ
		pairs = append(pairs, k+"="+values[k][0])
	}
	return strings.Join(pairs, "\n")
}

func hmacSHA256(key []byte, message string) []byte {
	mac := hmac.New(sha256.New, key)
	mac.Write([]byte(message))
	return mac.Sum(nil)
}

func initDataMaxAge() time.Duration {
	raw := os.Getenv("TELEGRAM_INITDATA_MAX_AGE")
	if raw == "" {
		return 24 * time.Hour
	}
	secs, err := strconv.Atoi(raw)
	if err != nil || secs <= 0 {
		return 24 * time.Hour
	}
	return time.Duration(secs) * time.Second
}

func initDataValidationEnabled() bool {
	return os.Getenv("TELEGRAM_INITDATA_SKIP") != "1"
}

// TelegramInitData защищает публичные Mini App эндпоинты.
func TelegramInitData(botToken string) func(http.HandlerFunc) http.HandlerFunc {
	maxAge := initDataMaxAge()

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !initDataValidationEnabled() {
				next(w, r)
				return
			}

			initData := r.Header.Get(telegramInitDataHeader)
			if !ValidateTelegramInitData(initData, botToken, maxAge) {
				http.Error(w, "invalid telegram init data", http.StatusUnauthorized)
				return
			}

			next(w, r)
		}
	}
}
