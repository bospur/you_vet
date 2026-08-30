package handler

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"log"
	"math/big"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"time"

	"go-server/internal/mailer"
	"go-server/internal/phone"
	"go-server/internal/repository"
	"go-server/internal/vkid"
	"go-server/internal/whatsapp"

	"github.com/golang-jwt/jwt/v5"
)

const (
	authCodeTTL      = 5 * time.Minute
	maxCodesPer15Min = 5
	accessTokenTTL   = 15 * time.Minute
	refreshTokenTTL  = 30 * 24 * time.Hour
)

// AuthCodeSender отправляет OTP в Telegram.
type AuthCodeSender interface {
	SendAuthCode(telegramUserID int64, code string) error
}

type MobileAuthHandler struct {
	repo       *repository.MobileAuthRepository
	sender     AuthCodeSender
	mail       *mailer.SMTP
	wa         *whatsapp.GreenAPI
	vk         *vkid.Client
	clinicID   int
	secret     string
	uploadsDir string
}

func NewMobileAuthHandler(
	repo *repository.MobileAuthRepository,
	sender AuthCodeSender,
	mail *mailer.SMTP,
	wa *whatsapp.GreenAPI,
	vk *vkid.Client,
	clinicID int,
	secret string,
	uploadsDir string,
) *MobileAuthHandler {
	return &MobileAuthHandler{
		repo: repo, sender: sender, mail: mail, wa: wa, vk: vk,
		clinicID: clinicID, secret: secret, uploadsDir: uploadsDir,
	}
}

type authRequestBody struct {
	Channel string `json:"channel"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
}

type authVerifyBody struct {
	Channel string `json:"channel"`
	Phone   string `json:"phone"`
	Email   string `json:"email"`
	Code    string `json:"code"`
}

type authRefreshBody struct {
	RefreshToken string `json:"refresh_token"`
}

type authVKBody struct {
	Code         string `json:"code"`
	CodeVerifier string `json:"code_verifier"`
	DeviceID     string `json:"device_id"`
	RedirectURI  string `json:"redirect_uri"`
}

type tokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
}

func normalizeAuthChannel(raw string) string {
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "", "telegram", "phone":
		return "telegram"
	case "email":
		return "email"
	case "whatsapp":
		return "whatsapp"
	default:
		return ""
	}
}

func normalizeEmail(raw string) (string, bool) {
	s := strings.ToLower(strings.TrimSpace(raw))
	if s == "" || len(s) > 254 {
		return "", false
	}
	addr, err := mail.ParseAddress(s)
	if err != nil || addr.Address == "" {
		return "", false
	}
	return strings.ToLower(addr.Address), true
}

var errRateLimited = errSentinel("rate_limited")

type errSentinel string

func (e errSentinel) Error() string { return string(e) }

// AuthOptions — GET /api/mobile/v1/auth/options
func (h *MobileAuthHandler) AuthOptions(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{
		"telegram": true,
		"email":    h.mail.Enabled(),
		"whatsapp": h.wa.Enabled(),
	})
}

func (h *MobileAuthHandler) issueAndStoreOTP(channel, login, phoneValue string) (string, error) {
	since := time.Now().Add(-15 * time.Minute)
	count, err := h.repo.CountRecentAuthRequests(h.clinicID, channel, login, since)
	if err != nil {
		return "", err
	}
	if count >= maxCodesPer15Min {
		return "", errRateLimited
	}
	code, err := generateOTP(6)
	if err != nil {
		return "", err
	}
	hash := hashAuthCode(code)
	expires := time.Now().Add(authCodeTTL)
	if err := h.repo.SaveAuthCode(h.clinicID, channel, login, phoneValue, hash, expires); err != nil {
		return "", err
	}
	go h.repo.PurgeExpiredCodes(time.Now().Add(-24 * time.Hour))
	return code, nil
}

func (h *MobileAuthHandler) writeOTPStoreError(w http.ResponseWriter, err error) {
	if err == errRateLimited {
		writeAPIError(w, http.StatusTooManyRequests, "RATE_LIMIT", "слишком много запросов кода, попробуйте позже")
		return
	}
	log.Printf("mobile auth otp store: %v", err)
	writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
}

// RequestCode — POST /api/mobile/v1/auth/request
func (h *MobileAuthHandler) RequestCode(w http.ResponseWriter, r *http.Request) {
	var body authRequestBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_BODY", "неверный формат запроса")
		return
	}

	channel := normalizeAuthChannel(body.Channel)
	if channel == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_CHANNEL", "неизвестный канал")
		return
	}

	switch channel {
	case "email":
		h.requestEmailCode(w, body.Email)
	case "whatsapp":
		h.requestWhatsAppCode(w, body.Phone)
	default:
		h.requestTelegramCode(w, body.Phone)
	}
}

func (h *MobileAuthHandler) requestTelegramCode(w http.ResponseWriter, rawPhone string) {
	normalized := phone.Normalize(rawPhone)
	if !phone.IsValidRF(normalized) {
		writeAPIError(w, http.StatusBadRequest, "INVALID_PHONE", "укажите номер в формате +79XXXXXXXXX")
		return
	}

	user, err := h.repo.GetByPhone(h.clinicID, normalized)
	if err != nil {
		log.Printf("mobile auth GetByPhone: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
		return
	}
	if user == nil || !user.TelegramUserID.Valid || user.TelegramUserID.Int64 == 0 {
		writeAPIError(w, http.StatusNotFound, "PHONE_NOT_LINKED", "сначала привяжите номер в Telegram-боте")
		return
	}

	code, err := h.issueAndStoreOTP("telegram", normalized, normalized)
	if err != nil {
		h.writeOTPStoreError(w, err)
		return
	}

	if err := h.sender.SendAuthCode(user.TelegramUserID.Int64, code); err != nil {
		log.Printf("mobile auth send telegram: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "SEND_FAILED", "не удалось отправить код в Telegram")
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"expires_in": int(authCodeTTL.Seconds())})
}

func (h *MobileAuthHandler) requestEmailCode(w http.ResponseWriter, rawEmail string) {
	if !h.mail.Enabled() {
		writeAPIError(w, http.StatusServiceUnavailable, "EMAIL_NOT_CONFIGURED", "вход по почте пока не настроен")
		return
	}
	email, ok := normalizeEmail(rawEmail)
	if !ok {
		writeAPIError(w, http.StatusBadRequest, "INVALID_EMAIL", "укажите корректный email")
		return
	}

	code, err := h.issueAndStoreOTP("email", email, "")
	if err != nil {
		h.writeOTPStoreError(w, err)
		return
	}

	if err := h.mail.SendAuthCode(email, code); err != nil {
		log.Printf("mobile auth send email: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "SEND_FAILED", "не удалось отправить код на почту")
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"expires_in": int(authCodeTTL.Seconds())})
}

func (h *MobileAuthHandler) requestWhatsAppCode(w http.ResponseWriter, rawPhone string) {
	if !h.wa.Enabled() {
		writeAPIError(w, http.StatusServiceUnavailable, "WHATSAPP_NOT_CONFIGURED", "вход через WhatsApp пока не настроен")
		return
	}
	normalized := phone.Normalize(rawPhone)
	if !phone.IsValidRF(normalized) {
		writeAPIError(w, http.StatusBadRequest, "INVALID_PHONE", "укажите номер в формате +79XXXXXXXXX")
		return
	}

	code, err := h.issueAndStoreOTP("whatsapp", normalized, normalized)
	if err != nil {
		h.writeOTPStoreError(w, err)
		return
	}

	if err := h.wa.SendAuthCode(normalized, code); err != nil {
		log.Printf("mobile auth send whatsapp: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "SEND_FAILED", "не удалось отправить код в WhatsApp")
		return
	}

	writeJSON(w, http.StatusOK, map[string]int{"expires_in": int(authCodeTTL.Seconds())})
}

// VerifyCode — POST /api/mobile/v1/auth/verify
func (h *MobileAuthHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	var body authVerifyBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_BODY", "неверный формат запроса")
		return
	}

	channel := normalizeAuthChannel(body.Channel)
	if channel == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_CHANNEL", "неизвестный канал")
		return
	}

	code := trimDigits(body.Code)
	if len(code) != 6 {
		writeAPIError(w, http.StatusBadRequest, "INVALID_INPUT", "неверный код")
		return
	}

	var (
		user *repository.MobileUser
		err  error
	)

	switch channel {
	case "email":
		email, ok := normalizeEmail(body.Email)
		if !ok {
			writeAPIError(w, http.StatusBadRequest, "INVALID_EMAIL", "укажите корректный email")
			return
		}
		if err := h.assertValidCode(channel, email, code); err != nil {
			writeAPIError(w, http.StatusUnauthorized, "INVALID_CODE", "неверный или истёкший код")
			return
		}
		local := strings.Split(email, "@")[0]
		user, err = h.repo.UpsertEmailUser(h.clinicID, email, local)
	case "whatsapp":
		normalized := phone.Normalize(body.Phone)
		if !phone.IsValidRF(normalized) {
			writeAPIError(w, http.StatusBadRequest, "INVALID_PHONE", "укажите номер в формате +79XXXXXXXXX")
			return
		}
		if err := h.assertValidCode(channel, normalized, code); err != nil {
			writeAPIError(w, http.StatusUnauthorized, "INVALID_CODE", "неверный или истёкший код")
			return
		}
		user, err = h.repo.UpsertPhoneUser(h.clinicID, normalized)
	default:
		normalized := phone.Normalize(body.Phone)
		if !phone.IsValidRF(normalized) {
			writeAPIError(w, http.StatusBadRequest, "INVALID_PHONE", "укажите номер в формате +79XXXXXXXXX")
			return
		}
		user, err = h.repo.GetByPhone(h.clinicID, normalized)
		if err != nil || user == nil || !user.TelegramUserID.Valid {
			writeAPIError(w, http.StatusUnauthorized, "INVALID_CODE", "неверный или истёкший код")
			return
		}
		if err := h.assertValidCode(channel, normalized, code); err != nil {
			writeAPIError(w, http.StatusUnauthorized, "INVALID_CODE", "неверный или истёкший код")
			return
		}
	}

	if err != nil || user == nil {
		log.Printf("mobile auth verify user: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
		return
	}

	tokens, err := h.issueTokenPair(user)
	if err != nil {
		log.Printf("mobile auth issue tokens: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}

func (h *MobileAuthHandler) assertValidCode(channel, login, code string) error {
	storedHash, err := h.repo.LatestValidCodeHash(h.clinicID, channel, login, time.Now())
	if err != nil || storedHash == "" || storedHash != hashAuthCode(code) {
		if err != nil {
			return err
		}
		return errSentinel("invalid_code")
	}
	return nil
}

// Refresh — POST /api/mobile/v1/auth/refresh
func (h *MobileAuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body authRefreshBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_BODY", "refresh_token обязателен")
		return
	}

	token, err := jwt.Parse(body.RefreshToken, func(t *jwt.Token) (any, error) {
		return []byte(h.secret), nil
	})
	if err != nil || !token.Valid {
		writeAPIError(w, http.StatusUnauthorized, "INVALID_TOKEN", "недействительный refresh token")
		return
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok || mapClaims["typ"] != "refresh" {
		writeAPIError(w, http.StatusUnauthorized, "INVALID_TOKEN", "недействительный refresh token")
		return
	}

	userID := int64(mapClaims["sub"].(float64))
	user, err := h.repo.GetByID(userID)
	if err != nil || user == nil {
		writeAPIError(w, http.StatusUnauthorized, "INVALID_TOKEN", "недействительный refresh token")
		return
	}

	tokens, err := h.issueTokenPair(user)
	if err != nil {
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}

// AuthVK — POST /api/mobile/v1/auth/vk (обмен code VK ID → JWT)
func (h *MobileAuthHandler) AuthVK(w http.ResponseWriter, r *http.Request) {
	if h.vk == nil {
		writeAPIError(w, http.StatusServiceUnavailable, "VK_NOT_CONFIGURED", "вход через VK временно недоступен")
		return
	}

	var body authVKBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeAPIError(w, http.StatusBadRequest, "INVALID_BODY", "неверный формат запроса")
		return
	}
	if body.Code == "" || body.CodeVerifier == "" || body.DeviceID == "" {
		writeAPIError(w, http.StatusBadRequest, "INVALID_INPUT", "code, code_verifier и device_id обязательны")
		return
	}

	tok, err := h.vk.ExchangeCode(body.Code, body.CodeVerifier, body.DeviceID, body.RedirectURI)
	if err != nil {
		log.Printf("mobile auth vk exchange: %v", err)
		writeAPIError(w, http.StatusUnauthorized, "VK_AUTH_FAILED", "не удалось войти через VK")
		return
	}

	info, err := h.vk.FetchUserInfo(tok.AccessToken)
	if err != nil {
		log.Printf("mobile auth vk user_info: %v", err)
		if tok.UserID == 0 {
			writeAPIError(w, http.StatusUnauthorized, "VK_AUTH_FAILED", "не удалось получить профиль VK")
			return
		}
		info = &vkid.UserInfo{UserID: tok.UserID}
	}

	vkID := info.UserID
	if vkID == 0 && tok.UserID > 0 {
		vkID = tok.UserID
	}

	normalizedPhone := phone.Normalize(info.Phone)
	if normalizedPhone != "" && !phone.IsValidRF(normalizedPhone) {
		normalizedPhone = ""
	}

	user, err := h.repo.UpsertVKUser(h.clinicID, vkID, info.DisplayName(), normalizedPhone)
	if err != nil {
		log.Printf("mobile auth vk upsert: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
		return
	}

	tokens, err := h.issueTokenPair(user)
	if err != nil {
		log.Printf("mobile auth vk issue tokens: %v", err)
		writeAPIError(w, http.StatusInternalServerError, "INTERNAL", "внутренняя ошибка сервера")
		return
	}

	writeJSON(w, http.StatusOK, tokens)
}

func (h *MobileAuthHandler) issueTokenPair(user *repository.MobileUser) (tokenResponse, error) {
	now := time.Now()
	accessClaims := jwt.MapClaims{
		"typ":       "access",
		"sub":       user.ID,
		"clinic_id": user.ClinicID,
		"iat":       now.Unix(),
		"exp":       now.Add(accessTokenTTL).Unix(),
	}
	if user.TelegramUserID.Valid && user.TelegramUserID.Int64 > 0 {
		accessClaims["tg_id"] = user.TelegramUserID.Int64
	}
	if user.Phone != "" {
		accessClaims["phone"] = user.Phone
	}
	if user.Email != "" {
		accessClaims["email"] = user.Email
	}
	if user.VkUserID.Valid && user.VkUserID.Int64 > 0 {
		accessClaims["vk_id"] = user.VkUserID.Int64
	}
	if user.DisplayName.Valid && user.DisplayName.String != "" {
		accessClaims["name"] = user.DisplayName.String
	}
	accessClaims["app_role"] = repository.NormalizeAppRole(user.AppRole)
	refreshClaims := jwt.MapClaims{
		"typ": "refresh",
		"sub": user.ID,
		"iat": now.Unix(),
		"exp": now.Add(refreshTokenTTL).Unix(),
	}

	access, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(h.secret))
	if err != nil {
		return tokenResponse{}, err
	}
	refresh, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(h.secret))
	if err != nil {
		return tokenResponse{}, err
	}

	return tokenResponse{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int(accessTokenTTL.Seconds()),
	}, nil
}

func generateOTP(length int) (string, error) {
	var s string
	for i := 0; i < length; i++ {
		n, err := rand.Int(rand.Reader, big.NewInt(10))
		if err != nil {
			return "", err
		}
		s += n.String()
	}
	return s, nil
}

func hashAuthCode(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

func trimDigits(s string) string {
	var b []byte
	for i := 0; i < len(s); i++ {
		if s[i] >= '0' && s[i] <= '9' {
			b = append(b, s[i])
		}
	}
	return string(b)
}

func writeAPIError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]string{"error": code, "message": message})
}

// MobileJWTSecretFromEnv читает секрет mobile JWT.
func MobileJWTSecretFromEnv() string {
	if s := os.Getenv("JWT_MOBILE_SECRET"); s != "" {
		return s
	}
	return os.Getenv("JWT_SECRET")
}
