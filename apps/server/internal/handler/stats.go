package handler

import (
	"log"
	"net/http"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

type StatsHandler struct {
	telegramRepo *repository.TelegramUserRepository
}

func NewStatsHandler(telegramRepo *repository.TelegramUserRepository) *StatsHandler {
	return &StatsHandler{telegramRepo: telegramRepo}
}

// GetSummary обрабатывает GET /api/admin/stats/summary
func (h *StatsHandler) GetSummary(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	summary, err := h.telegramRepo.GetStatsSummary(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения статистики: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

// ListUsers обрабатывает GET /api/admin/stats/users
func (h *StatsHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	users, err := h.telegramRepo.ListByClinicID(claims.ClinicID, 500)
	if err != nil {
		log.Printf("ошибка получения списка telegram_users: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if users == nil {
		users = []repository.TelegramUserListItem{}
	}

	writeJSON(w, http.StatusOK, users)
}
