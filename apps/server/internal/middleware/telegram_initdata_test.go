package middleware

import (
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"sort"
	"strconv"
	"strings"
	"testing"
	"time"
)

func signInitData(botToken string, pairs map[string]string) string {
	keys := make([]string, 0, len(pairs))
	for k := range pairs {
		keys = append(keys, k)
	}
	sort.Strings(keys)

	checkParts := make([]string, 0, len(keys))
	queryParts := make([]string, 0, len(keys)+1)
	for _, k := range keys {
		line := k + "=" + pairs[k]
		checkParts = append(checkParts, line)
		queryParts = append(queryParts, line)
	}
	dataCheckString := strings.Join(checkParts, "\n")

	secretKey := hmacSHA256([]byte("WebAppData"), botToken)
	hash := hex.EncodeToString(hmacSHA256(secretKey, dataCheckString))

	return strings.Join(append(queryParts, "hash="+hash), "&")
}

func TestValidateTelegramInitData_OfficialVector(t *testing.T) {
	const (
		initData = "query_id=AAHdF6IQAAAAAN0XohDhrOrc&user=%7B%22id%22%3A279058397%2C%22first_name%22%3A%22Vladislav%22%2C%22last_name%22%3A%22Kibenko%22%2C%22username%22%3A%22vdkfrost%22%2C%22language_code%22%3A%22ru%22%2C%22is_premium%22%3Atrue%7D&auth_date=1662771648&hash=c501b71e775f74ce10e377dea85a7ea24ecd640b223ea86dfe453e0eaed2e2b2"
		token    = "5768337691:AAH5YkoiEuPk8-FZa32hStHTqXiLPtAEhx8"
	)
	if !ValidateTelegramInitData(initData, token, 0) {
		t.Fatal("official init-data test vector must pass")
	}
}

func TestValidateTelegramInitData_Valid(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	authDate := strconv.FormatInt(time.Now().Unix(), 10)
	initData := signInitData(botToken, map[string]string{"auth_date": authDate})

	if !ValidateTelegramInitData(initData, botToken, time.Hour) {
		t.Fatal("expected valid initData")
	}
}

func TestValidateTelegramInitData_InvalidHash(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	initData := "auth_date=123&hash=deadbeef"

	if ValidateTelegramInitData(initData, botToken, time.Hour) {
		t.Fatal("expected invalid initData")
	}
}

func TestValidateTelegramInitData_Expired(t *testing.T) {
	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	authDate := strconv.FormatInt(time.Now().Add(-2*time.Hour).Unix(), 10)
	initData := signInitData(botToken, map[string]string{"auth_date": authDate})

	if ValidateTelegramInitData(initData, botToken, time.Hour) {
		t.Fatal("expected expired initData")
	}
}

func TestTelegramInitData_Middleware(t *testing.T) {
	t.Setenv("TELEGRAM_INITDATA_SKIP", "")

	botToken := "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
	authDate := strconv.FormatInt(time.Now().Unix(), 10)
	initData := signInitData(botToken, map[string]string{"auth_date": authDate})

	called := false
	handler := TelegramInitData(botToken)(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Telegram-Init-Data", initData)
	rec := httptest.NewRecorder()
	handler(rec, req)

	if rec.Code != http.StatusOK || !called {
		t.Fatalf("expected 200, got %d called=%v", rec.Code, called)
	}

	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	rec2 := httptest.NewRecorder()
	handler(rec2, req2)

	if rec2.Code != http.StatusUnauthorized {
		t.Fatalf("expected 401, got %d", rec2.Code)
	}
}
