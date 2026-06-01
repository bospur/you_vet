package bot

import (
	"fmt"
	"log"
	"strings"
	"time"

	"go-server/internal/repository"

	tele "gopkg.in/telebot.v3"
)

func formatBookingDate(iso string) string {
	t, err := time.Parse("2006-01-02", iso)
	if err != nil {
		return iso
	}
	return t.Format("02.01.2006")
}

func bookingStatusLabel(status string) string {
	switch status {
	case "pending":
		return "⏳ Ожидает подтверждения"
	case "confirmed":
		return "✅ Подтверждено"
	case "rejected":
		return "❌ Отклонено"
	case "cancelled":
		return "🚫 Отменено"
	case "rescheduled":
		return "📅 Перенесено"
	default:
		return status
	}
}

func (b *Bot) handleLinkStaff(c tele.Context) error {
	chat := c.Chat()
	if chat == nil {
		return nil
	}
	switch chat.Type {
	case tele.ChatGroup, tele.ChatSuperGroup, tele.ChatChannel:
	default:
		return c.Send("Отправьте /link_staff в групповой чат, супергруппу или канал, куда добавлен бот.")
	}

	if b.clinicID <= 0 || b.bookingRepo == nil {
		return c.Send("Привязка чата недоступна (ошибка конфигурации сервера).")
	}

	chatID := chat.ID
	if _, err := b.bookingRepo.UpdateStaffChatID(b.clinicID, &chatID); err != nil {
		log.Printf("link_staff: %v", err)
		return c.Send("Не удалось сохранить чат. Попробуйте позже.")
	}

	log.Printf("staff chat linked: clinic=%d chat_id=%d title=%q", b.clinicID, chatID, chat.Title)
	return c.Send(fmt.Sprintf(
		"✅ Чат «%s» привязан для уведомлений о записи.\n\nСюда будут приходить новые заявки и изменения статусов.",
		chat.Title,
	))
}

func (b *Bot) handleChannelPost(c tele.Context) error {
	text := strings.TrimSpace(c.Text())
	if text == "/link_staff" || strings.HasPrefix(text, "/link_staff@") {
		return b.handleLinkStaff(c)
	}
	return nil
}

func (b *Bot) sendStaffMessage(clinicID int, text string) {
	if b.bookingRepo == nil {
		return
	}
	settings, err := b.bookingRepo.GetSettings(clinicID)
	if err != nil || settings.StaffChatID == nil {
		return
	}
	recipient := &tele.Chat{ID: *settings.StaffChatID}
	if _, err := b.tele.Send(recipient, text, tele.ModeHTML); err != nil {
		log.Printf("staff booking notify: %v", err)
	}
}

func (b *Bot) sendClientMessage(userID int64, text string) {
	if userID <= 0 {
		return
	}
	recipient := &tele.User{ID: userID}
	if _, err := b.tele.Send(recipient, text, tele.ModeHTML); err != nil {
		log.Printf("client booking notify (user %d): %v", userID, err)
	}
}

func staffRequestMessage(req repository.BookingRequest, title string) string {
	phone := req.ClientPhone
	if phone == "" {
		phone = "—"
	}
	return fmt.Sprintf(
		"%s\n\n"+
			"<b>Услуга:</b> %s\n"+
			"<b>Дата:</b> %s\n"+
			"<b>Клиент:</b> %s\n"+
			"<b>Телефон:</b> %s\n"+
			"<b>Питомец:</b> %s\n"+
			"<b>Статус:</b> %s\n"+
			"<i>Заявка #%d</i>",
		title,
		escapeHTML(req.ServiceName),
		formatBookingDate(req.RequestedDate),
		escapeHTML(req.ClientName),
		escapeHTML(phone),
		escapeHTML(req.PetName),
		bookingStatusLabel(req.Status),
		req.ID,
	)
}

func clientRequestMessage(req repository.BookingRequest) string {
	var body strings.Builder
	body.WriteString(fmt.Sprintf("<b>%s</b>\n\n", bookingStatusLabel(req.Status)))
	body.WriteString(fmt.Sprintf("Услуга: %s\n", escapeHTML(req.ServiceName)))
	body.WriteString(fmt.Sprintf("Дата: %s\n", formatBookingDate(req.RequestedDate)))

	switch req.Status {
	case "pending":
		body.WriteString("\nМы свяжемся с вами после проверки заявки.")
	case "confirmed":
		if req.StaffNote != nil && strings.TrimSpace(*req.StaffNote) != "" {
			body.WriteString(fmt.Sprintf("\n%s", escapeHTML(strings.TrimSpace(*req.StaffNote))))
		} else {
			body.WriteString("\nЖдём вас в клинике в указанный день.")
		}
	case "rejected":
		if req.RejectReason != nil && *req.RejectReason != "" {
			body.WriteString(fmt.Sprintf("\nПричина: %s", escapeHTML(*req.RejectReason)))
		}
	case "cancelled":
		body.WriteString("\nЗапись отменена. Вы можете оформить новую заявку в приложении.")
	case "rescheduled":
		body.WriteString("\nДата записи изменена. Подробности — в сообщении выше.")
	}
	return body.String()
}

func escapeHTML(s string) string {
	replacer := strings.NewReplacer("&", "&amp;", "<", "&lt;", ">", "&gt;")
	return replacer.Replace(s)
}

// NotifyBookingRequestCreated — новая заявка
func (b *Bot) NotifyBookingRequestCreated(clinicID int, req repository.BookingRequest) {
	title := "📋 <b>Новая заявка на запись</b>"
	b.sendStaffMessage(clinicID, staffRequestMessage(req, title))
	if req.TelegramUserID != nil {
		b.sendClientMessage(*req.TelegramUserID, clientRequestMessage(req))
	}
}

// NotifyBookingRequestUpdated — смена статуса или перенос
func (b *Bot) NotifyBookingRequestUpdated(clinicID int, req repository.BookingRequest, prevStatus string) {
	if req.Status == prevStatus {
		return
	}

	var staffTitle string
	switch req.Status {
	case "confirmed":
		staffTitle = "✅ <b>Заявка подтверждена</b>"
	case "rejected":
		staffTitle = "❌ <b>Заявка отклонена</b>"
	case "cancelled":
		staffTitle = "🚫 <b>Заявка отменена</b>"
	case "rescheduled":
		staffTitle = "📅 <b>Заявка перенесена</b>"
	default:
		staffTitle = "ℹ️ <b>Заявка обновлена</b>"
	}
	b.sendStaffMessage(clinicID, staffRequestMessage(req, staffTitle))

	if req.TelegramUserID != nil {
		b.sendClientMessage(*req.TelegramUserID, clientRequestMessage(req))
	}
}
