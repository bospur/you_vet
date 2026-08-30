package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"go-server/internal/middleware"
	"go-server/internal/phone"
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

type patchMobileRoleBody struct {
	AppRole string `json:"app_role"`
}

// PatchMobileUserRole — PATCH /api/admin/stats/mobile/users/{id}/role
func (h *StatsHandler) PatchMobileUserRole(w http.ResponseWriter, r *http.Request) {
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

	var body patchMobileRoleBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if !repository.IsValidAppRole(body.AppRole) {
		http.Error(w, "недопустимая роль", http.StatusBadRequest)
		return
	}

	user, err := h.mobileRepo.UpdateAppRole(claims.ClinicID, id, body.AppRole)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "пользователь не найден", http.StatusNotFound)
			return
		}
		log.Printf("ошибка смены роли mobile_user %d: %v", id, err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, repository.MobileUserListItem{
		ID:          user.ID,
		DisplayName: user.DisplayName.String,
		Phone:       user.Phone,
		Email:       user.Email,
		PhotoURL:    user.PhotoURL,
		AppRole:     user.AppRole,
		CreatedAt:   user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

type inviteMobileStaffBody struct {
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	AppRole     string `json:"app_role"`
}

// InviteMobileStaff — POST /api/admin/stats/mobile/staff
func (h *StatsHandler) InviteMobileStaff(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	var body inviteMobileStaffBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if !repository.IsValidAppRole(body.AppRole) || body.AppRole == repository.AppRoleClient {
		http.Error(w, "укажите роль врача, грумера или главврача", http.StatusBadRequest)
		return
	}

	phoneNorm := strings.TrimSpace(body.Phone)
	if phoneNorm != "" {
		phoneNorm = phone.Normalize(phoneNorm)
		if !phone.IsValidRF(phoneNorm) {
			http.Error(w, "укажите номер в формате +79XXXXXXXXX", http.StatusBadRequest)
			return
		}
	}
	email := strings.ToLower(strings.TrimSpace(body.Email))
	if phoneNorm == "" && email == "" {
		http.Error(w, "нужен телефон или email", http.StatusBadRequest)
		return
	}

	user, err := h.mobileRepo.UpsertStaff(claims.ClinicID, phoneNorm, email, strings.TrimSpace(body.DisplayName), body.AppRole)
	if err != nil {
		log.Printf("ошибка приглашения персонала PWA: %v", err)
		http.Error(w, "не удалось сохранить сотрудника", http.StatusInternalServerError)
		return
	}
	item := repository.MobileUserListItem{
		ID:          user.ID,
		Phone:       user.Phone,
		Email:       user.Email,
		PhotoURL:    user.PhotoURL,
		AppRole:     user.AppRole,
		CreatedAt:   user.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if user.DisplayName.Valid {
		item.DisplayName = user.DisplayName.String
	}
	writeJSON(w, http.StatusCreated, item)
}
