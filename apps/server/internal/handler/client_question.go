package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

// ClientQuestionHandler — вопросы клиентов из Mini App.
type ClientQuestionHandler struct {
	questionRepo *repository.ClientQuestionRepository
	notifier     QuestionNotifier
}

func NewClientQuestionHandler(
	questionRepo *repository.ClientQuestionRepository,
	notifier QuestionNotifier,
) *ClientQuestionHandler {
	return &ClientQuestionHandler{questionRepo: questionRepo, notifier: notifier}
}

type createQuestionBody struct {
	Text string `json:"text"`
}

type publicQuestionResponse struct {
	ID        int    `json:"id"`
	CreatedAt string `json:"created_at"`
}

// CreatePublicQuestion — POST /api/clinics/{clinicSlug}/questions
func (h *ClientQuestionHandler) CreatePublicQuestion(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}

	visit, ok := middleware.ParseInitDataUser(middleware.InitDataFromRequest(r))
	if !ok {
		http.Error(w, "требуется авторизация Telegram", http.StatusUnauthorized)
		return
	}

	var body createQuestionBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	q, err := h.questionRepo.Create(
		clinicID,
		visit.TelegramUserID,
		visit.FirstName,
		visit.Username,
		body.Text,
	)
	if err != nil {
		if questionError(w, err) {
			return
		}
		log.Printf("ошибка создания вопроса: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if h.notifier != nil {
		go h.notifier.NotifyClientQuestionCreated(clinicID, *q)
	}

	writeJSON(w, http.StatusCreated, publicQuestionResponse{
		ID:        q.ID,
		CreatedAt: q.CreatedAt,
	})
}

func questionError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, repository.ErrQuestionTooShort):
		http.Error(w, "Введите не менее 10 символов", http.StatusBadRequest)
	case errors.Is(err, repository.ErrQuestionTooLong):
		http.Error(w, "Слишком длинный текст (максимум 2000 символов)", http.StatusBadRequest)
	case errors.Is(err, repository.ErrQuestionDailyLimit):
		http.Error(w, "Сегодня можно задать не больше 5 вопросов. Попробуйте завтра.", http.StatusTooManyRequests)
	default:
		return false
	}
	return true
}

func (h *ClientQuestionHandler) clinicIDFromSlug(w http.ResponseWriter, r *http.Request) (int, bool) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "clinic slug обязателен", http.StatusBadRequest)
		return 0, false
	}
	clinicID, err := h.questionRepo.GetClinicIDBySlug(clinicSlug)
	if err != nil {
		if errors.Is(err, repository.ErrQuestionNotFound) {
			http.Error(w, "клиника не найдена", http.StatusNotFound)
			return 0, false
		}
		log.Printf("ошибка clinic slug: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return 0, false
	}
	return clinicID, true
}
