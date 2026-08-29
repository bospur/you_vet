package whatsapp

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// GreenAPI sends WhatsApp messages via green-api.com (works in RU).
type GreenAPI struct {
	baseURL    string
	instanceID string
	token      string
	client     *http.Client
}

func NewGreenAPIFromEnv() *GreenAPI {
	id := strings.TrimSpace(os.Getenv("GREEN_API_ID"))
	token := strings.TrimSpace(os.Getenv("GREEN_API_TOKEN"))
	base := strings.TrimRight(strings.TrimSpace(os.Getenv("GREEN_API_URL")), "/")
	if id == "" || token == "" || base == "" {
		return nil
	}
	return &GreenAPI{
		baseURL:    base,
		instanceID: id,
		token:      token,
		client:     &http.Client{Timeout: 15 * time.Second},
	}
}

func (g *GreenAPI) Enabled() bool {
	return g != nil && g.instanceID != "" && g.token != "" && g.baseURL != ""
}

func (g *GreenAPI) SendAuthCode(phone, code string) error {
	if !g.Enabled() {
		return fmt.Errorf("whatsapp not configured")
	}
	digits := strings.TrimPrefix(phone, "+")
	payload, err := json.Marshal(map[string]string{
		"chatId":  digits + "@c.us",
		"message": fmt.Sprintf("Код входа в Ветпрактику: %s", code),
	})
	if err != nil {
		return err
	}
	url := fmt.Sprintf("%s/waInstance%s/sendMessage/%s", g.baseURL, g.instanceID, g.token)
	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := g.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(io.LimitReader(resp.Body, 2048))
	if resp.StatusCode >= 300 {
		return fmt.Errorf("green-api %s: %s", resp.Status, strings.TrimSpace(string(body)))
	}
	return nil
}
