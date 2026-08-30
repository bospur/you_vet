package bot

import (
	"fmt"
	"html"
)

// NotifyChatMessage — consult: клиент → группа врачей, врач → личка клиента.
func (b *Bot) NotifyChatMessage(clinicID int, kind, preview, authorName string, clientTelegramID int64, fromStaff bool) {
	if kind != "consult" {
		return
	}
	safeName := html.EscapeString(authorName)
	safePreview := html.EscapeString(preview)
	if fromStaff {
		b.sendClientMessage(clientTelegramID, fmt.Sprintf(
			"Ответ клиники в приложении от <b>%s</b>:\n%s",
			safeName, safePreview,
		))
		return
	}
	b.sendStaffMessage(clinicID, fmt.Sprintf(
		"💬 Вопрос в приложении от <b>%s</b>:\n%s\n\nОтветьте в PWA → Чаты.",
		safeName, safePreview,
	))
}
