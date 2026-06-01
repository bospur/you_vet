package bot

import (
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"go-server/internal/repository"

	tele "gopkg.in/telebot.v3"
)

const questionReplyPendingTTL = 15 * time.Minute

type pendingQuestionReply struct {
	ClinicID   int
	QuestionID int
	ExpiresAt  time.Time
}

func pendingReplyKey(chatID, staffUserID int64) string {
	return fmt.Sprintf("%d:%d", chatID, staffUserID)
}

func (b *Bot) setPendingQuestionReply(chatID, staffUserID int64, clinicID, questionID int) {
	if b.questionPending == nil {
		return
	}
	b.questionPendingMu.Lock()
	defer b.questionPendingMu.Unlock()
	b.questionPending[pendingReplyKey(chatID, staffUserID)] = pendingQuestionReply{
		ClinicID:   clinicID,
		QuestionID: questionID,
		ExpiresAt:  time.Now().Add(questionReplyPendingTTL),
	}
}

func (b *Bot) takePendingQuestionReply(chatID, staffUserID int64) (pendingQuestionReply, bool) {
	if b.questionPending == nil {
		return pendingQuestionReply{}, false
	}
	b.questionPendingMu.Lock()
	defer b.questionPendingMu.Unlock()
	key := pendingReplyKey(chatID, staffUserID)
	p, ok := b.questionPending[key]
	if !ok {
		return pendingQuestionReply{}, false
	}
	delete(b.questionPending, key)
	if time.Now().After(p.ExpiresAt) {
		return pendingQuestionReply{}, false
	}
	return p, true
}

func (b *Bot) staffChatID(clinicID int) (int64, bool) {
	if b.bookingRepo == nil {
		return 0, false
	}
	settings, err := b.bookingRepo.GetSettings(clinicID)
	if err != nil || settings.StaffChatID == nil {
		return 0, false
	}
	return *settings.StaffChatID, true
}

func (b *Bot) sendStaffMessageWithMarkup(clinicID int, text string, markup *tele.ReplyMarkup) (*tele.Message, error) {
	chatID, ok := b.staffChatID(clinicID)
	if !ok {
		return nil, fmt.Errorf("staff chat not linked")
	}
	recipient := &tele.Chat{ID: chatID}
	opts := []interface{}{tele.ModeHTML}
	if markup != nil {
		opts = append(opts, markup)
	}
	return b.tele.Send(recipient, text, opts...)
}

func staffQuestionMessage(q repository.ClientQuestion) string {
	clientLine := escapeHTML(q.ClientName)
	if q.ClientUsername != nil && *q.ClientUsername != "" {
		clientLine += fmt.Sprintf(" (@%s)", escapeHTML(strings.TrimPrefix(*q.ClientUsername, "@")))
	}
	return fmt.Sprintf(
		"❓ <b>Вопрос от клиента</b>\n\n"+
			"%s\n\n"+
			"<b>Клиент:</b> %s\n"+
			"<b>Telegram ID:</b> %d\n"+
			"<i>Вопрос #%d</i>",
		escapeHTML(q.Text),
		clientLine,
		q.TelegramUserID,
		q.ID,
	)
}

func clientQuestionAnswerMessage(q repository.ClientQuestion, reply string) string {
	return fmt.Sprintf(
		"💬 <b>Ответ клиники</b> на ваш вопрос:\n\n%s\n\n"+
			"<i>Если нужно уточнить — задайте новый вопрос в приложении.</i>",
		escapeHTML(reply),
	)
}

// NotifyClientQuestionCreated — новый вопрос в чат врачей.
func (b *Bot) NotifyClientQuestionCreated(clinicID int, q repository.ClientQuestion) {
	if b.questionRepo == nil {
		return
	}

	menu := &tele.ReplyMarkup{}
	menu.Inline(
		menu.Row(tele.Btn{
			Text: "✉️ Ответить",
			Data: fmt.Sprintf("qreply:%d", q.ID),
		}),
	)

	msg, err := b.sendStaffMessageWithMarkup(clinicID, staffQuestionMessage(q), menu)
	if err != nil {
		log.Printf("staff question notify: %v", err)
		return
	}
	if msg == nil {
		return
	}
	if err := b.questionRepo.SetStaffChatMessageID(clinicID, q.ID, msg.ID); err != nil {
		log.Printf("question staff message id: %v", err)
	}
}

func (b *Bot) handleQuestionReplyCallback(c tele.Context, questionIDStr string) error {
	if b.questionRepo == nil {
		return c.Respond(&tele.CallbackResponse{Text: "Сервис недоступен"})
	}

	questionID, err := strconv.Atoi(questionIDStr)
	if err != nil || questionID <= 0 {
		return c.Respond()
	}

	chat := c.Chat()
	sender := c.Sender()
	if chat == nil || sender == nil {
		return c.Respond()
	}

	staffChatID, ok := b.staffChatID(b.clinicID)
	if !ok || chat.ID != staffChatID {
		return c.Respond(&tele.CallbackResponse{Text: "Доступно только в чате врачей"})
	}

	q, err := b.questionRepo.GetByID(b.clinicID, questionID)
	if err != nil {
		log.Printf("qreply get: %v", err)
		return c.Respond(&tele.CallbackResponse{Text: "Ошибка"})
	}
	if q == nil {
		return c.Respond(&tele.CallbackResponse{Text: "Вопрос не найден"})
	}
	if q.Status != "open" {
		return c.Respond(&tele.CallbackResponse{Text: "На этот вопрос уже ответили"})
	}

	b.setPendingQuestionReply(chat.ID, sender.ID, b.clinicID, questionID)
	return c.Respond(&tele.CallbackResponse{
		Text:      "Напишите ответ одним сообщением в этот чат",
		ShowAlert: false,
	})
}

func (b *Bot) tryAnswerClientQuestion(c tele.Context, q *repository.ClientQuestion, replyText string) error {
	if q == nil || q.Status != "open" {
		return c.Send("На этот вопрос уже ответили.")
	}

	sender := c.Sender()
	if sender == nil {
		return nil
	}

	updated, err := b.questionRepo.Answer(b.clinicID, q.ID, sender.ID, replyText)
	if err != nil {
		if err == repository.ErrQuestionNotOpen {
			return c.Send("На этот вопрос уже ответили.")
		}
		log.Printf("question answer: %v", err)
		return c.Send("Не удалось сохранить ответ.")
	}

	b.sendClientMessage(updated.TelegramUserID, clientQuestionAnswerMessage(*updated, replyText))
	_ = c.Send(fmt.Sprintf("✅ Ответ на вопрос #%d отправлен клиенту в бот.", updated.ID))
	return nil
}

func (b *Bot) handleStaffQuestionText(c tele.Context) error {
	if b.questionRepo == nil {
		return nil
	}

	chat := c.Chat()
	sender := c.Sender()
	msg := c.Message()
	if chat == nil || sender == nil || msg == nil {
		return nil
	}
	if sender.IsBot {
		return nil
	}

	staffChatID, ok := b.staffChatID(b.clinicID)
	if !ok || chat.ID != staffChatID {
		return nil
	}

	text := strings.TrimSpace(msg.Text)
	if text == "" {
		return nil
	}
	if strings.HasPrefix(text, "/") {
		return nil
	}

	// Ответ через reply на сообщение бота
	if msg.ReplyTo != nil {
		replyID := msg.ReplyTo.ID
		q, err := b.questionRepo.GetOpenByStaffMessageID(b.clinicID, replyID)
		if err != nil {
			log.Printf("question by reply msg: %v", err)
			return nil
		}
		if q != nil {
			return b.tryAnswerClientQuestion(c, q, text)
		}
	}

	// Ответ после кнопки «Ответить»
	if pending, ok := b.takePendingQuestionReply(chat.ID, sender.ID); ok {
		q, err := b.questionRepo.GetByID(pending.ClinicID, pending.QuestionID)
		if err != nil {
			log.Printf("pending question get: %v", err)
			return c.Send("Не удалось найти вопрос.")
		}
		return b.tryAnswerClientQuestion(c, q, text)
	}

	return nil
}
