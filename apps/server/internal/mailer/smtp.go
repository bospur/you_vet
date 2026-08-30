package mailer

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strings"
	"time"
)

const smtpTimeout = 12 * time.Second

// SMTP sends OTP over email. Nil / !Enabled if SMTP_HOST or SMTP_FROM empty.
type SMTP struct {
	host string
	port string
	user string
	pass string
	from string
}

func NewSMTPFromEnv() *SMTP {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	from := strings.TrimSpace(os.Getenv("SMTP_FROM"))
	if host == "" || from == "" {
		return nil
	}
	port := strings.TrimSpace(os.Getenv("SMTP_PORT"))
	if port == "" {
		port = "465"
	}
	return &SMTP{
		host: host,
		port: port,
		user: strings.TrimSpace(os.Getenv("SMTP_USER")),
		pass: strings.ReplaceAll(strings.TrimSpace(os.Getenv("SMTP_PASSWORD")), " ", ""),
		from: from,
	}
}

func (s *SMTP) Enabled() bool {
	return s != nil && s.host != "" && s.from != ""
}

func (s *SMTP) SendAuthCode(to, code string) error {
	if !s.Enabled() {
		return fmt.Errorf("smtp not configured")
	}
	subject := "Код входа в Ветпрактику"
	body := fmt.Sprintf("Ваш код: %s\n\nДействует 5 минут. Если вы не запрашивали вход, проигнорируйте письмо.\n", code)
	msg := strings.Join([]string{
		"From: " + s.from,
		"To: " + to,
		"Subject: =?UTF-8?B?" + base64.StdEncoding.EncodeToString([]byte(subject)) + "?=",
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	addr := net.JoinHostPort(s.host, s.port)
	tlsCfg := &tls.Config{ServerName: s.host, MinVersion: tls.VersionTLS12}

	dialer := &net.Dialer{Timeout: smtpTimeout}
	raw, err := dialer.Dial("tcp", addr)
	if err != nil {
		return fmt.Errorf("smtp dial %s: %w", addr, err)
	}

	deadline := time.Now().Add(smtpTimeout)
	_ = raw.SetDeadline(deadline)

	var conn net.Conn = raw
	if s.port == "465" {
		tlsConn := tls.Client(raw, tlsCfg)
		if err := tlsConn.Handshake(); err != nil {
			_ = raw.Close()
			return fmt.Errorf("smtp tls handshake: %w", err)
		}
		conn = tlsConn
		_ = conn.SetDeadline(deadline)
	}

	client, err := smtp.NewClient(conn, s.host)
	if err != nil {
		_ = conn.Close()
		return fmt.Errorf("smtp hello: %w", err)
	}
	defer func() { _ = client.Close() }()

	if s.port != "465" {
		if ok, _ := client.Extension("STARTTLS"); ok {
			if err := client.StartTLS(tlsCfg); err != nil {
				return fmt.Errorf("smtp starttls: %w", err)
			}
		}
	}

	if s.user != "" {
		auth := &loginAuth{username: s.user, password: s.pass}
		if err := client.Auth(auth); err != nil {
			return fmt.Errorf("smtp auth: %w", err)
		}
	}

	if err := client.Mail(s.from); err != nil {
		return fmt.Errorf("smtp mail from: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("smtp rcpt: %w", err)
	}
	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("smtp data: %w", err)
	}
	if _, err := w.Write([]byte(msg)); err != nil {
		_ = w.Close()
		return fmt.Errorf("smtp write: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("smtp body: %w", err)
	}
	return client.Quit()
}

// AUTH LOGIN — Mail.ru / Yandex.
type loginAuth struct {
	username, password string
}

func (a *loginAuth) Start(_ *smtp.ServerInfo) (string, []byte, error) {
	return "LOGIN", nil, nil
}

func (a *loginAuth) Next(fromServer []byte, more bool) ([]byte, error) {
	if !more {
		return nil, nil
	}
	prompt := strings.ToLower(string(fromServer))
	switch {
	case strings.Contains(prompt, "user"):
		return []byte(a.username), nil
	case strings.Contains(prompt, "pass"):
		return []byte(a.password), nil
	default:
		return nil, fmt.Errorf("неожиданный challenge: %q", fromServer)
	}
}
