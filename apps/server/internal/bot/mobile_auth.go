package bot

import (
	"fmt"
	"log"

	"go-server/internal/phone"
	"go-server/internal/repository"

	tele "gopkg.in/telebot.v3"
)

// SendAuthCode отправляет OTP пользователю в личку.
func (b *Bot) SendAuthCode(telegramUserID int64, code string) error {
	text := fmt.Sprintf(
		"Код для входа в приложение *Ветпрактика*: `%s`\n\nНикому не сообщайте код. Действует 5 минут.",
		code,
	)
	_, err := b.tele.Send(&tele.User{ID: telegramUserID}, text, tele.ModeMarkdown)
	return err
}

func (b *Bot) promptLinkContact(c tele.Context) error {
	text := "Чтобы войти в приложение *Ветпрактика*, поделитесь номером телефона.\n\n" +
		"Нажмите кнопку ниже — Telegram отправит ваш контакт боту."

	menu := &tele.ReplyMarkup{ResizeKeyboard: true, OneTimeKeyboard: true}
	menu.Contact("📱 Поделиться номером")

	return c.Send(text, menu, tele.ModeMarkdown)
}

func (b *Bot) handleContact(c tele.Context) error {
	contact := c.Message().Contact
	if contact == nil {
		return nil
	}
	if contact.UserID != 0 && contact.UserID != c.Sender().ID {
		return c.Send("Пожалуйста, отправьте свой номер через кнопку «Поделиться номером».")
	}

	normalized := phone.Normalize(contact.PhoneNumber)
	if !phone.IsValidRF(normalized) {
		return c.Send("Не удалось распознать номер. Укажите российский мобильный +7…")
	}

	tgID := c.Sender().ID
	if contact.UserID != 0 {
		tgID = contact.UserID
	}

	if b.mobileRepo == nil {
		log.Printf("mobileRepo не настроен")
		return c.Send("Сервис временно недоступен. Попробуйте позже.")
	}

	if err := b.mobileRepo.LinkPhone(b.clinicID, normalized, tgID); err != nil {
		log.Printf("LinkPhone: %v", err)
		return c.Send("Не удалось сохранить номер. Попробуйте позже.")
	}

	if b.telegramUserRepo != nil {
		_ = b.telegramUserRepo.UpsertVisit(b.clinicSlug, repository.TelegramUserVisit{
			TelegramUserID: tgID,
			Username:       c.Sender().Username,
			FirstName:      c.Sender().FirstName,
		})
	}

	return c.Send(
		"✅ Номер привязан.\n\nВернитесь в приложение «Ветпрактика» и войдите по этому номеру.",
		mainMenuKeyboard(),
	)
}
