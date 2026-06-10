package handler

import (
	"database/sql"
	"errors"
	"log"
	"net/http"
	"strconv"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

type StatsHandler struct {
	telegramRepo *repository.TelegramUserRepository
	mobileRepo   *repository.MobileAuthRepository
}

func NewStatsHandler(
	telegramRepo *repository.TelegramUserRepository,
	mobileRepo *repository.MobileAuthRepository,
) *StatsHandler {
	return &StatsHandler{telegramRepo: telegramRepo, mobileRepo: mobileRepo}
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

// GetMobileSummary — GET /api/admin/stats/mobile/summary
func (h *StatsHandler) GetMobileSummary(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	summary, err := h.mobileRepo.GetStatsSummary(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка mobile stats: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, summary)
}

// ListMobileUsers — GET /api/admin/stats/mobile/users
func (h *StatsHandler) ListMobileUsers(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	users, err := h.mobileRepo.ListByClinicID(claims.ClinicID, 500)
	if err != nil {
		log.Printf("ошибка списка mobile_users: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if users == nil {
		users = []repository.MobileUserListItem{}
	}

	writeJSON(w, http.StatusOK, users)
}

// DeleteMobileUser — DELETE /api/admin/stats/mobile/users/{id}
func (h *StatsHandler) DeleteMobileUser(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}

	if err := h.mobileRepo.DeleteByClinic(claims.ClinicID, id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "пользователь не найден", http.StatusNotFound)
			return
		}
		log.Printf("ошибка удаления mobile_user %d: %v", id, err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
