package handler

import "go-server/internal/repository"

// QuestionNotifier — уведомления о вопросах клиентов (бот Telegram).
type QuestionNotifier interface {
	NotifyClientQuestionCreated(clinicID int, q repository.ClientQuestion)
}
