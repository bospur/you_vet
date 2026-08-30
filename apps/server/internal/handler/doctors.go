package handler

import (
	"crypto/rand"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go-server/internal/middleware"
	"go-server/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

// DoctorHandler содержит зависимости для эндпоинтов врачей
type DoctorHandler struct {
	doctorRepo *repository.DoctorRepository
	mobileRepo *repository.MobileAuthRepository
	uploadsDir string
}

func NewDoctorHandler(doctorRepo *repository.DoctorRepository, mobileRepo *repository.MobileAuthRepository, uploadsDir string) *DoctorHandler {
	return &DoctorHandler{doctorRepo: doctorRepo, mobileRepo: mobileRepo, uploadsDir: uploadsDir}
}

// ── Врачи (admin) ─────────────────────────────────────────────────────────────

// GetDoctors обрабатывает GET /api/admin/doctors
func (h *DoctorHandler) GetDoctors(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	doctors, err := h.doctorRepo.GetAll(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения врачей: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if doctors == nil {
		doctors = []repository.Doctor{}
	}
	writeJSON(w, http.StatusOK, doctors)
}

// GetDoctor обрабатывает GET /api/admin/doctors/{id}
func (h *DoctorHandler) GetDoctor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	doctor, err := h.doctorRepo.GetByIDForClinic(claims.ClinicID, id)
	if err != nil {
		log.Printf("ошибка получения врача: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if doctor == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, doctor)
}

// CreateDoctor обрабатывает POST /api/admin/doctors
func (h *DoctorHandler) CreateDoctor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.DoctorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(input.FullName) == "" {
		http.Error(w, "ФИО обязательно", http.StatusBadRequest)
		return
	}

	doctor, err := h.doctorRepo.Create(claims.ClinicID, input)
	if err != nil {
		log.Printf("ошибка создания врача: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, doctor)
}

// UpdateDoctor обрабатывает PUT /api/admin/doctors/{id}
func (h *DoctorHandler) UpdateDoctor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	var input repository.DoctorInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	doctor, err := h.doctorRepo.Update(claims.ClinicID, id, input)
	if err != nil {
		log.Printf("ошибка обновления врача: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if doctor == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, doctor)
}

type doctorPWAAccountBody struct {
	Reset bool `json:"reset"`
}

type doctorPWAAccountResp struct {
	Login        string `json:"login"`
	Password     string `json:"password,omitempty"`
	LoginURL     string `json:"login_url"`
	MobileUserID int64  `json:"mobile_user_id"`
	Created      bool   `json:"created"`
	Reset        bool   `json:"reset"`
}

const staffPWALoginPath = "/auth/staff"

// ProvisionDoctorPWA — POST /api/admin/doctors/{id}/pwa-account
func (h *DoctorHandler) ProvisionDoctorPWA(w http.ResponseWriter, r *http.Request) {
	if h.mobileRepo == nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")
	doctor, err := h.doctorRepo.GetByIDForClinic(claims.ClinicID, id)
	if err != nil {
		log.Printf("pwa account get doctor: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if doctor == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	var body doctorPWAAccountBody
	_ = json.NewDecoder(r.Body).Decode(&body)

	if doctor.HasPWAAccount && doctor.MobileUserID != nil && !body.Reset {
		writeJSON(w, http.StatusOK, doctorPWAAccountResp{
			Login:        doctor.PWALogin,
			LoginURL:     staffPWALoginPath,
			MobileUserID: *doctor.MobileUserID,
		})
		return
	}

	plain, err := generateStaffPassword(10)
	if err != nil {
		log.Printf("pwa account password: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if doctor.MobileUserID != nil && body.Reset {
		if err := h.mobileRepo.SetStaffPassword(claims.ClinicID, *doctor.MobileUserID, string(hash)); err != nil {
			log.Printf("pwa account reset: %v", err)
			http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, doctorPWAAccountResp{
			Login:        doctor.PWALogin,
			Password:     plain,
			LoginURL:     staffPWALoginPath,
			MobileUserID: *doctor.MobileUserID,
			Reset:        true,
		})
		return
	}

	base := repository.SuggestStaffLogin(doctor.FullName, doctor.ID)
	login, err := h.mobileRepo.AllocateStaffLogin(claims.ClinicID, base)
	if err != nil {
		log.Printf("pwa account login: %v", err)
		http.Error(w, "не удалось подобрать логин", http.StatusConflict)
		return
	}
	user, err := h.mobileRepo.CreateStaffAccount(claims.ClinicID, doctor.FullName, login, string(hash), repository.AppRoleDoctor)
	if err != nil {
		log.Printf("pwa account create: %v", err)
		http.Error(w, "не удалось создать аккаунт", http.StatusInternalServerError)
		return
	}
	if err := h.doctorRepo.SetMobileUserID(claims.ClinicID, doctor.ID, user.ID); err != nil {
		log.Printf("pwa account link: %v", err)
		http.Error(w, "аккаунт создан, но не привязан к карточке", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, doctorPWAAccountResp{
		Login:        login,
		Password:     plain,
		LoginURL:     staffPWALoginPath,
		MobileUserID: user.ID,
		Created:      true,
	})
}

func generateStaffPassword(n int) (string, error) {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
	out := make([]byte, n)
	max := big.NewInt(int64(len(alphabet)))
	for i := range out {
		v, err := rand.Int(rand.Reader, max)
		if err != nil {
			return "", err
		}
		out[i] = alphabet[v.Int64()]
	}
	return string(out), nil
}

// UpdateDoctorStatus обрабатывает PATCH /api/admin/doctors/{id}/status (только admin)
func (h *DoctorHandler) UpdateDoctorStatus(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	id := r.PathValue("id")
	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if body.Status != "draft" && body.Status != "published" {
		http.Error(w, "недопустимый статус", http.StatusBadRequest)
		return
	}

	doctor, err := h.doctorRepo.UpdateStatus(claims.ClinicID, id, body.Status)
	if err != nil {
		log.Printf("ошибка обновления статуса врача: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if doctor == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, doctor)
}

// UploadDoctorPhoto обрабатывает POST /api/admin/doctors/{id}/photo
func (h *DoctorHandler) UploadDoctorPhoto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	if err := r.ParseMultipartForm(5 << 20); err != nil { // 5 MB
		http.Error(w, "файл слишком большой (макс 5 МБ)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		http.Error(w, "файл не найден в запросе", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, ext, err := ReadAndValidateImage(file, header.Filename)
	if err != nil {
		msg, status := imageUploadError(err)
		http.Error(w, msg, status)
		return
	}

	filename := fmt.Sprintf("doctor_%s_%d%s", id, time.Now().UnixMilli(), ext)
	dstPath := filepath.Join(h.uploadsDir, filename)

	if err := os.WriteFile(dstPath, data, 0644); err != nil {
		log.Printf("ошибка записи файла: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	photoURL := "/uploads/" + filename
	if err := h.doctorRepo.UpdatePhoto(claims.ClinicID, id, photoURL); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		log.Printf("ошибка обновления photo_url: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]string{"photo_url": photoURL})
}

// DeleteDoctor обрабатывает DELETE /api/admin/doctors/{id}
func (h *DoctorHandler) DeleteDoctor(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	if err := h.doctorRepo.Delete(claims.ClinicID, id); err != nil {
		log.Printf("ошибка удаления врача: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Расписание (admin) ────────────────────────────────────────────────────────

// GetDoctorSchedule обрабатывает GET /api/admin/doctors/{id}/schedule
func (h *DoctorHandler) GetDoctorSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	slots, err := h.doctorRepo.GetScheduleForClinic(claims.ClinicID, id)
	if err != nil {
		log.Printf("ошибка получения расписания: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if slots == nil {
		slots = []repository.DoctorSchedule{}
	}
	writeJSON(w, http.StatusOK, slots)
}

// AddScheduleSlot обрабатывает POST /api/admin/doctors/{id}/schedule
func (h *DoctorHandler) AddScheduleSlot(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	var body struct {
		DayOfWeek int    `json:"day_of_week"`
		TimeFrom  string `json:"time_from"`
		TimeTo    string `json:"time_to"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	slot, err := h.doctorRepo.AddScheduleSlotForClinic(claims.ClinicID, id, body.DayOfWeek, body.TimeFrom, body.TimeTo)
	if err != nil {
		log.Printf("ошибка добавления слота: %v", err)
		http.Error(w, "слот уже существует или неверные данные", http.StatusConflict)
		return
	}
	if slot == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusCreated, slot)
}

// DeleteScheduleSlot обрабатывает DELETE /api/admin/doctors/{id}/schedule/{slotId}
func (h *DoctorHandler) DeleteScheduleSlot(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	slotID := r.PathValue("slotId")

	if err := h.doctorRepo.DeleteScheduleSlot(claims.ClinicID, slotID); err != nil {
		log.Printf("ошибка удаления слота: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Исключения (admin) ────────────────────────────────────────────────────────

// GetExceptions обрабатывает GET /api/admin/doctors/{id}/schedule/exceptions
func (h *DoctorHandler) GetExceptions(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	exceptions, err := h.doctorRepo.GetExceptionsForClinic(claims.ClinicID, id)
	if err != nil {
		log.Printf("ошибка получения исключений: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if exceptions == nil {
		exceptions = []repository.DoctorScheduleException{}
	}
	writeJSON(w, http.StatusOK, exceptions)
}

// UpsertException обрабатывает PUT /api/admin/doctors/{id}/schedule/exceptions
func (h *DoctorHandler) UpsertException(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	var body struct {
		Date     string  `json:"date"`
		IsDayOff bool    `json:"is_day_off"`
		TimeFrom *string `json:"time_from"`
		TimeTo   *string `json:"time_to"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	exception, err := h.doctorRepo.UpsertExceptionForClinic(claims.ClinicID, id, body.Date, body.IsDayOff, body.TimeFrom, body.TimeTo)
	if err != nil {
		log.Printf("ошибка сохранения исключения: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if exception == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, exception)
}

// DeleteException обрабатывает DELETE /api/admin/doctors/{id}/schedule/exceptions/{exceptionId}
func (h *DoctorHandler) DeleteException(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	exceptionID := r.PathValue("exceptionId")

	if err := h.doctorRepo.DeleteException(claims.ClinicID, exceptionID); err != nil {
		log.Printf("ошибка удаления исключения: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Настройки клиники (admin) ─────────────────────────────────────────────────

// GetSettings обрабатывает GET /api/admin/settings
func (h *DoctorHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	settings, err := h.doctorRepo.GetSettings(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения настроек: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

// UpdateSettings обрабатывает PATCH /api/admin/settings (только admin)
func (h *DoctorHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	var body struct {
		ScheduleDisplayWeeks int `json:"schedule_display_weeks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if body.ScheduleDisplayWeeks < 1 || body.ScheduleDisplayWeeks > 5 {
		http.Error(w, "допустимые значения: 1–5", http.StatusBadRequest)
		return
	}

	settings, err := h.doctorRepo.UpsertSettings(claims.ClinicID, body.ScheduleDisplayWeeks)
	if err != nil {
		log.Printf("ошибка обновления настроек: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, settings)
}

// GetAdminSchedule — GET /api/admin/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
func (h *DoctorHandler) GetAdminSchedule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	fromStr := r.URL.Query().Get("from")
	toStr := r.URL.Query().Get("to")
	if fromStr == "" || toStr == "" {
		http.Error(w, "from и to обязательны", http.StatusBadRequest)
		return
	}
	from, err := time.Parse("2006-01-02", fromStr)
	if err != nil {
		http.Error(w, "неверный формат from", http.StatusBadRequest)
		return
	}
	to, err := time.Parse("2006-01-02", toStr)
	if err != nil {
		http.Error(w, "неверный формат to", http.StatusBadRequest)
		return
	}
	if to.Before(from) {
		http.Error(w, "to не может быть раньше from", http.StatusBadRequest)
		return
	}
	if to.Sub(from) > 31*24*time.Hour {
		http.Error(w, "максимальный период — 31 день", http.StatusBadRequest)
		return
	}

	entries, err := h.doctorRepo.GetScheduleForPeriod(claims.ClinicID, from, to)
	if err != nil {
		log.Printf("ошибка расписания admin: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []repository.ScheduleEntry{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"from":    fromStr,
		"to":      toStr,
		"entries": entries,
	})
}

// ── Публичный API (для бота) ──────────────────────────────────────────────────

// GetPublicDoctors обрабатывает GET /api/clinics/{clinicSlug}/doctors
func (h *DoctorHandler) GetPublicDoctors(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")

	// Получаем clinicID по slug через doctorRepo (нужен вспомогательный метод)
	// Пока используем прямой запрос через репо
	doctors, err := h.doctorRepo.GetPublishedByClinicSlug(clinicSlug)
	if err != nil {
		log.Printf("ошибка получения врачей: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if doctors == nil {
		doctors = []repository.Doctor{}
	}
	writeJSON(w, http.StatusOK, doctors)
}

// GetPublicSchedule обрабатывает GET /api/clinics/{clinicSlug}/schedule
func (h *DoctorHandler) GetPublicSchedule(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")

	entries, settings, err := h.doctorRepo.GetScheduleByClinicSlug(clinicSlug)
	if err != nil {
		log.Printf("ошибка получения расписания: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if entries == nil {
		entries = []repository.ScheduleEntry{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"entries":  entries,
		"settings": settings,
	})
}
