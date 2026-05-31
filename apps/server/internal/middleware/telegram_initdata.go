package middleware

import (
	"crypto/ed25519"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"net/url"
	"os"
	"sort"
	"strconv"
	"strings"
	"time"

	"go-server/internal/repository"
)

var errInvalidInitData = errors.New("invalid init data")

const telegramInitDataHeader = "X-Telegram-Init-Data"

// Production Ed25519 key from https://core.telegram.org/bots/webapps
var telegramProdPublicKey, _ = hex.DecodeString("e7bf03a2fa4602af4580703d88dda5bb59f32ed8b02a56c187fe7d34caed242d")

// ValidateTelegramInitData проверяет initData Mini App: HMAC (hash) или Ed25519 (signature).
func ValidateTelegramInitData(initData, botToken string, maxAge time.Duration) bool {
	if initData == "" || botToken == "" {
		return false
	}

	values, err := parseInitData(initData)
	if err != nil {
		return false
	}

	if !validateAuthDate(values, maxAge) {
		return false
	}

	hash := values.Get("hash")
	if hash != "" {
		dataCheckString := buildInitDataCheckString(values)
		secretKey := hmacSHA256([]byte("WebAppData"), botToken)
		calculated := hex.EncodeToString(hmacSHA256(secretKey, dataCheckString))
		if strings.EqualFold(calculated, hash) {
			return true
		}
	}

	// Telegram iOS / новые клиенты: поле signature (Ed25519), hash может отсутствовать или не совпадать.
	return validateInitDataSignature(values, botToken)
}

func validateAuthDate(values url.Values, maxAge time.Duration) bool {
	if maxAge <= 0 {
		return true
	}
	authDateStr := values.Get("auth_date")
	authDate, err := strconv.ParseInt(authDateStr, 10, 64)
	if err != nil {
		return false
	}
	authTime := time.Unix(authDate, 0)
	return time.Since(authTime) <= maxAge && !authTime.After(time.Now().Add(2*time.Minute))
}

func validateInitDataSignature(values url.Values, botToken string) bool {
	sigB64 := values.Get("signature")
	if sigB64 == "" {
		return false
	}
	signature, err := base64.RawURLEncoding.DecodeString(sigB64)
	if err != nil {
		return false
	}

	botID, err := botIDFromToken(botToken)
	if err != nil {
		return false
	}

	pairs := initDataPairs(values)
	sort.Strings(pairs)
	payload := strconv.FormatInt(botID, 10) + ":WebAppData\n" + strings.Join(pairs, "\n")

	return ed25519.Verify(telegramProdPublicKey, []byte(payload), signature)
}

func botIDFromToken(token string) (int64, error) {
	idStr, _, ok := strings.Cut(token, ":")
	if !ok {
		return 0, errInvalidInitData
	}
	return strconv.ParseInt(idStr, 10, 64)
}

func parseInitData(initData string) (url.Values, error) {
	values, err := url.ParseQuery(initData)
	if err != nil || len(values) == 0 {
		return nil, errInvalidInitData
	}
	return values, nil
}

func initDataPairs(values url.Values) []string {
	keys := make([]string, 0, len(values))
	for k := range values {
		if k == "hash" || k == "signature" {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)

	pairs := make([]string, 0, len(keys))
	for _, k := range keys {
		pairs = append(pairs, k+"="+values.Get(k))
	}
	return pairs
}

func buildInitDataCheckString(values url.Values) string {
	return strings.Join(initDataPairs(values), "\n")
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

// InitDataFromRequest возвращает строку initData из заголовка Mini App.
func InitDataFromRequest(r *http.Request) string {
	return initDataFromRequest(r)
}

func initDataFromRequest(r *http.Request) string {
	if v := r.Header.Get(telegramInitDataHeader); v != "" {
		return v
	}
	auth := r.Header.Get("Authorization")
	if strings.HasPrefix(auth, "tma ") {
		return strings.TrimPrefix(auth, "tma ")
	}
	return ""
}

type initDataTelegramUser struct {
	ID        int64  `json:"id"`
	FirstName string `json:"first_name"`
	Username  string `json:"username"`
}

// ParseInitDataUser извлекает пользователя Telegram из строки initData.
func ParseInitDataUser(initData string) (repository.TelegramUserVisit, bool) {
	values, err := parseInitData(initData)
	if err != nil {
		return repository.TelegramUserVisit{}, false
	}
	raw := values.Get("user")
	if raw == "" {
		return repository.TelegramUserVisit{}, false
	}
	var u initDataTelegramUser
	if err := json.Unmarshal([]byte(raw), &u); err != nil || u.ID == 0 {
		return repository.TelegramUserVisit{}, false
	}
	return repository.TelegramUserVisit{
		TelegramUserID: u.ID,
		FirstName:      u.FirstName,
		Username:       u.Username,
	}, true
}

func trackTelegramVisit(r *http.Request, initData string, repo *repository.TelegramUserRepository) {
	if repo == nil {
		return
	}
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		return
	}
	visit, ok := ParseInitDataUser(initData)
	if !ok {
		return
	}
	if err := repo.UpsertVisit(clinicSlug, visit); err != nil {
		log.Printf("telegram_users upsert: %v", err)
	}
}

// TelegramInitData защищает публичные Mini App эндпоинты.
func TelegramInitData(botToken string, telegramRepo *repository.TelegramUserRepository) func(http.HandlerFunc) http.HandlerFunc {
	maxAge := initDataMaxAge()

	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			if !initDataValidationEnabled() {
				next(w, r)
				return
			}

			initData := initDataFromRequest(r)
			if !ValidateTelegramInitData(initData, botToken, maxAge) {
				http.Error(w, "invalid telegram init data", http.StatusUnauthorized)
				return
			}

			trackTelegramVisit(r, initData, telegramRepo)
			next(w, r)
		}
	}
}
