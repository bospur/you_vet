package vkid

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"
)

const (
	defaultAuthURL     = "https://id.vk.ru/oauth2/auth"
	defaultUserInfoURL = "https://id.vk.ru/oauth2/user_info"
)

// Client обменивает authorization code VK ID на токен и профиль.
type Client struct {
	AppID       string
	Secret      string
	RedirectURI string
	HTTP        *http.Client
	// test hooks
	authURL     string
	userInfoURL string
}

// TokenResponse — ответ oauth2/auth.
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"`
	UserID       int64  `json:"user_id"`
}

// UserInfo — профиль из user_info.
type UserInfo struct {
	UserID    int64  `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Phone     string `json:"phone"`
	Avatar    string `json:"avatar"`
	Email     string `json:"email"`
}

func (u UserInfo) DisplayName() string {
	name := strings.TrimSpace(u.FirstName + " " + u.LastName)
	if name != "" {
		return name
	}
	if u.UserID > 0 {
		return fmt.Sprintf("VK %d", u.UserID)
	}
	return "Пользователь VK"
}

// NewClientFromEnv читает VK_APP_ID, VK_APP_SECRET, VK_REDIRECT_URI.
func NewClientFromEnv() *Client {
	appID := os.Getenv("VK_APP_ID")
	secret := os.Getenv("VK_APP_SECRET")
	if appID == "" || secret == "" {
		return nil
	}
	redirect := os.Getenv("VK_REDIRECT_URI")
	if redirect == "" {
		redirect = "https://oauth.vk.com/blank.html"
	}
	return &Client{
		AppID:       appID,
		Secret:      secret,
		RedirectURI: redirect,
		HTTP:        &http.Client{Timeout: 15 * time.Second},
	}
}

// ExchangeCode обменивает code + PKCE на access_token.
func (c *Client) ExchangeCode(code, codeVerifier, deviceID, redirectURI string) (*TokenResponse, error) {
	if c == nil {
		return nil, errors.New("vk client is nil")
	}
	redir := redirectURI
	if redir == "" {
		redir = c.RedirectURI
	}

	form := url.Values{
		"grant_type":    {"authorization_code"},
		"code":            {code},
		"code_verifier":   {codeVerifier},
		"client_id":       {c.AppID},
		"client_secret":   {c.Secret},
		"device_id":       {deviceID},
		"redirect_uri":    {redir},
	}

	authEP := c.authURL
	if authEP == "" {
		authEP = defaultAuthURL
	}
	req, err := http.NewRequest(http.MethodPost, authEP, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("vk oauth: %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}

	var out TokenResponse
	if err := json.Unmarshal(body, &out); err != nil {
		return nil, err
	}
	if out.AccessToken == "" {
		return nil, errors.New("vk oauth: empty access_token")
	}
	return &out, nil
}

// FetchUserInfo загружает профиль по access_token.
func (c *Client) FetchUserInfo(accessToken string) (*UserInfo, error) {
	if c == nil {
		return nil, errors.New("vk client is nil")
	}

	form := url.Values{
		"access_token": {accessToken},
		"client_id":    {c.AppID},
	}
	userEP := c.userInfoURL
	if userEP == "" {
		userEP = defaultUserInfoURL
	}
	req, err := http.NewRequest(http.MethodPost, userEP, strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("vk user_info: %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}

	var wrapper struct {
		User struct {
			UserID    json.RawMessage `json:"user_id"`
			FirstName string          `json:"first_name"`
			LastName  string          `json:"last_name"`
			Phone     string          `json:"phone"`
			Avatar    string          `json:"avatar"`
			Email     string          `json:"email"`
		} `json:"user"`
	}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		return nil, err
	}
	userID, err := parseVKUserID(wrapper.User.UserID)
	if err != nil {
		return nil, fmt.Errorf("vk user_info: %w", err)
	}
	return &UserInfo{
		UserID:    userID,
		FirstName: wrapper.User.FirstName,
		LastName:  wrapper.User.LastName,
		Phone:     wrapper.User.Phone,
		Avatar:    wrapper.User.Avatar,
		Email:     wrapper.User.Email,
	}, nil
}

func parseVKUserID(raw json.RawMessage) (int64, error) {
	if len(raw) == 0 {
		return 0, errors.New("missing user_id")
	}
	trimmed := bytes.TrimSpace(raw)
	if len(trimmed) > 0 && trimmed[0] == '"' {
		var s string
		if err := json.Unmarshal(trimmed, &s); err != nil {
			return 0, err
		}
		id, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			return 0, err
		}
		return id, nil
	}
	var id int64
	if err := json.Unmarshal(trimmed, &id); err != nil {
		return 0, err
	}
	if id == 0 {
		return 0, errors.New("missing user_id")
	}
	return id, nil
}
