package mailer

import (
	"fmt"
	"net"
	"net/smtp"
	"os"
	"strings"
)

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
		port = "587"
	}
	return &SMTP{
		host: host,
		port: port,
		user: strings.TrimSpace(os.Getenv("SMTP_USER")),
		pass: os.Getenv("SMTP_PASSWORD"),
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
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")

	addr := net.JoinHostPort(s.host, s.port)
	var auth smtp.Auth
	if s.user != "" {
		auth = smtp.PlainAuth("", s.user, s.pass, s.host)
	}
	return smtp.SendMail(addr, auth, s.from, []string{to}, []byte(msg))
}
