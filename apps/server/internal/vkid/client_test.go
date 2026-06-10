package vkid

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestExchangeCodeAndUserInfo(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("/oauth2/auth", func(w http.ResponseWriter, r *http.Request) {
		if r.FormValue("grant_type") != "authorization_code" || r.FormValue("code") != "abc" {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"access_token":"tok","user_id":42,"expires_in":3600}`))
	})
	mux.HandleFunc("/oauth2/user_info", func(w http.ResponseWriter, r *http.Request) {
		if r.FormValue("access_token") != "tok" || r.FormValue("client_id") != "1" {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write([]byte(`{"user":{"user_id":42,"first_name":"Иван","last_name":"Петров","phone":"+79001234567"}}`))
	})

	srv := httptest.NewServer(mux)
	defer srv.Close()

	c := &Client{
		AppID:       "1",
		Secret:      "secret",
		RedirectURI: "https://example.com/cb",
		HTTP:        srv.Client(),
		authURL:     srv.URL + "/oauth2/auth",
		userInfoURL: srv.URL + "/oauth2/user_info",
	}

	tok, err := c.ExchangeCode("abc", "verifier", "device1", "https://example.com/cb")
	if err != nil {
		t.Fatalf("ExchangeCode: %v", err)
	}
	if tok.AccessToken != "tok" || tok.UserID != 42 {
		t.Fatalf("unexpected token: %+v", tok)
	}

	user, err := c.FetchUserInfo(tok.AccessToken)
	if err != nil {
		t.Fatalf("FetchUserInfo: %v", err)
	}
	if user.DisplayName() != "Иван Петров" || user.Phone != "+79001234567" {
		t.Fatalf("unexpected user: %+v", user)
	}
}
