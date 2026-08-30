package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

// GroomingHandler содержит зависимости для эндпоинтов грумера
type GroomingHandler struct {
	groomingRepo *repository.GroomingRepository
}

func NewGroomingHandler(groomingRepo *repository.GroomingRepository) *GroomingHandler {
	return &GroomingHandler{groomingRepo: groomingRepo}
}

// ── Породы ────────────────────────────────────────────────────────────────────

// GetBreeds обрабатывает GET /api/admin/grooming/breeds
func (h *GroomingHandler) GetBreeds(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	breeds, err := h.groomingRepo.GetAllBreeds(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения пород груминга: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if breeds == nil {
		breeds = []repository.GroomingBreed{}
	}
	writeJSON(w, http.StatusOK, breeds)
}

// SaveBreedGroup — PUT /api/admin/grooming/breed-groups (порода + типы услуг)
func (h *GroomingHandler) SaveBreedGroup(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.GroomingBreedGroupInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	breeds, err := h.groomingRepo.SaveBreedGroup(claims.ClinicID, input)
	if err != nil {
		if strings.Contains(err.Error(), "обязательн") || strings.Contains(err.Error(), "хотя бы") ||
			strings.Contains(err.Error(), "продолжительность") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		log.Printf("ошибка сохранения породы: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, breeds)
}

// DeleteBreedGroup — DELETE /api/admin/grooming/breed-groups?name=...
func (h *GroomingHandler) DeleteBreedGroup(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	name := strings.TrimSpace(r.URL.Query().Get("name"))
	if name == "" {
		http.Error(w, "параметр name обязателен", http.StatusBadRequest)
		return
	}

	if err := h.groomingRepo.DeleteBreedGroup(claims.ClinicID, name); err != nil {
		log.Printf("ошибка удаления породы: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Шаблон недели ─────────────────────────────────────────────────────────────

// GetTemplate обрабатывает GET /api/admin/grooming/template
func (h *GroomingHandler) GetTemplate(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	slots, err := h.groomingRepo.GetTemplate(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения шаблона недели: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if slots == nil {
		slots = []repository.GroomingTemplateSlot{}
	}
	writeJSON(w, http.StatusOK, slots)
}

// UpsertTemplateSlot обрабатывает PUT /api/admin/grooming/template
func (h *GroomingHandler) UpsertTemplateSlot(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.GroomingTemplateInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.DayOfWeek < 0 || input.DayOfWeek > 6 {
		http.Error(w, "day_of_week должен быть от 0 до 6", http.StatusBadRequest)
		return
	}
	if input.TimeFrom == "" || input.TimeTo == "" {
		http.Error(w, "time_from и time_to обязательны", http.StatusBadRequest)
		return
	}

	slot, err := h.groomingRepo.UpsertTemplateSlot(claims.ClinicID, input)
	if err != nil {
		log.Printf("ошибка сохранения слота шаблона: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, slot)
}

// DeleteTemplateSlot обрабатывает DELETE /api/admin/grooming/template/{dayOfWeek}
func (h *GroomingHandler) DeleteTemplateSlot(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var body struct {
		DayOfWeek int `json:"day_of_week"`
	}
	// day_of_week берём из path
	dayStr := r.PathValue("dayOfWeek")
	var day int
	if _, err := parseID(dayStr, &day); err != nil {
		http.Error(w, "неверный day_of_week", http.StatusBadRequest)
		return
	}
	_ = body

	if err := h.groomingRepo.DeleteTemplateSlot(claims.ClinicID, day); err != nil {
		log.Printf("ошибка удаления слота шаблона: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ── Записи ────────────────────────────────────────────────────────────────────

// GetAppointments обрабатывает GET /api/admin/grooming/appointments?month=2026-04
func (h *GroomingHandler) GetAppointments(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	month := r.URL.Query().Get("month")
	if month == "" {
		http.Error(w, "параметр month обязателен (формат: 2026-04)", http.StatusBadRequest)
		return
	}

	appointments, err := h.groomingRepo.GetAppointmentsByMonth(claims.ClinicID, month)
	if err != nil {
		log.Printf("ошибка получения записей: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if appointments == nil {
		appointments = []repository.GroomingAppointment{}
	}
	writeJSON(w, http.StatusOK, appointments)
}

// CreateAppointment обрабатывает POST /api/admin/grooming/appointments
func (h *GroomingHandler) CreateAppointment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.GroomingAppointmentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.BreedID <= 0 {
		http.Error(w, "breed_id обязателен", http.StatusBadRequest)
		return
	}
	if input.Date == "" {
		http.Error(w, "date обязательна", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(input.PetName) == "" {
		http.Error(w, "кличка обязательна", http.StatusBadRequest)
		return
	}
	if input.StartTime == "" {
		http.Error(w, "start_time обязателен", http.StatusBadRequest)
		return
	}

	appointment, err := h.groomingRepo.CreateAppointment(claims.ClinicID, input)
	if err != nil {
		if errors.Is(err, repository.ErrGroomingNotWorkingDay) {
			http.Error(w, "не рабочий день", http.StatusBadRequest)
			return
		}
		if errors.Is(err, repository.ErrGroomingOutOfHours) {
			http.Error(w, "запись за пределами рабочего времени", http.StatusBadRequest)
			return
		}
		if errors.Is(err, repository.ErrGroomingConflict) {
			http.Error(w, "время занято другой записью", http.StatusConflict)
			return
		}
		log.Printf("ошибка создания записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, appointment)
}

// DeleteAppointment обрабатывает DELETE /api/admin/grooming/appointments/{id}
func (h *GroomingHandler) DeleteAppointment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	if err := h.groomingRepo.DeleteAppointment(id, claims.ClinicID); err != nil {
		log.Printf("ошибка удаления записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// parseID парсит строку в int
func parseID(s string, out *int) (bool, error) {
	var n int
	_, err := scanInt(s, &n)
	if err != nil {
		return false, err
	}
	*out = n
	return true, nil
}

func scanInt(s string, out *int) (int, error) {
	n := 0
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			return 0, errors.New("не число")
		}
		n = n*10 + int(ch-'0')
	}
	*out = n
	return n, nil
}

// ── Публичные эндпоинты (без авторизации, по slug клиники) ───────────────────

// GetPublicBreeds обрабатывает GET /api/clinics/{clinicSlug}/grooming/breeds
func (h *GroomingHandler) GetPublicBreeds(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	breeds, err := h.groomingRepo.GetAllBreedsBySlug(clinicSlug)
	if err != nil {
		log.Printf("ошибка получения пород груминга (public): %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if breeds == nil {
		breeds = []repository.GroomingBreed{}
	}
	writeJSON(w, http.StatusOK, breeds)
}

// GetPublicSchedule обрабатывает GET /api/clinics/{clinicSlug}/grooming/schedule
func (h *GroomingHandler) GetPublicSchedule(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	slots, err := h.groomingRepo.GetTemplateBySlug(clinicSlug)
	if err != nil {
		log.Printf("ошибка получения шаблона груминга (public): %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if slots == nil {
		slots = []repository.GroomingTemplateSlot{}
	}
	writeJSON(w, http.StatusOK, slots)
}

func (h *GroomingHandler) clinicIDFromSlug(w http.ResponseWriter, r *http.Request) (int, bool) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "clinic slug обязателен", http.StatusBadRequest)
		return 0, false
	}
	clinicID, err := h.groomingRepo.GetClinicIDBySlug(clinicSlug)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "клиника не найдена", http.StatusNotFound)
			return 0, false
		}
		log.Printf("grooming clinic slug: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return 0, false
	}
	return clinicID, true
}

func writeGroomingCreateError(w http.ResponseWriter, err error) bool {
	switch {
	case errors.Is(err, repository.ErrGroomingNotWorkingDay):
		http.Error(w, "не рабочий день", http.StatusBadRequest)
	case errors.Is(err, repository.ErrGroomingOutOfHours):
		http.Error(w, "запись за пределами рабочего времени", http.StatusBadRequest)
	case errors.Is(err, repository.ErrGroomingConflict):
		http.Error(w, "время занято другой записью", http.StatusConflict)
	case err != nil && strings.Contains(err.Error(), "порода не найдена"):
		http.Error(w, "услуга не найдена", http.StatusNotFound)
	default:
		return false
	}
	return true
}

// GetPublicAvailability — GET .../grooming/availability?date=&breed_id=
func (h *GroomingHandler) GetPublicAvailability(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	date := strings.TrimSpace(r.URL.Query().Get("date"))
	if date == "" {
		http.Error(w, "date обязательна", http.StatusBadRequest)
		return
	}
	breedID, err := strconv.Atoi(r.URL.Query().Get("breed_id"))
	if err != nil || breedID <= 0 {
		http.Error(w, "breed_id обязателен", http.StatusBadRequest)
		return
	}
	avail, err := h.groomingRepo.GetAvailability(clinicID, date, breedID)
	if err != nil {
		if writeGroomingCreateError(w, err) {
			return
		}
		log.Printf("grooming availability: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, avail)
}

// CreatePublicAppointment — POST .../grooming/appointments
func (h *GroomingHandler) CreatePublicAppointment(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil || claims.MobileUserID <= 0 {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	var input repository.GroomingAppointmentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.BreedID <= 0 || input.Date == "" || input.StartTime == "" || strings.TrimSpace(input.PetName) == "" {
		http.Error(w, "breed_id, date, start_time и кличка обязательны", http.StatusBadRequest)
		return
	}
	mid := claims.MobileUserID
	input.MobileUserID = &mid
	input.Status = "pending"
	if input.OwnerPhone == "" {
		input.OwnerPhone = claims.Phone
	}

	appointment, err := h.groomingRepo.CreateAppointment(clinicID, input)
	if err != nil {
		if writeGroomingCreateError(w, err) {
			return
		}
		log.Printf("grooming public create: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, appointment)
}

// ListMyAppointments — GET .../grooming/appointments (свои)
func (h *GroomingHandler) ListMyAppointments(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil || claims.MobileUserID <= 0 {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}
	list, err := h.groomingRepo.ListAppointmentsByUser(clinicID, claims.MobileUserID)
	if err != nil {
		log.Printf("grooming my list: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []repository.GroomingAppointment{}
	}
	writeJSON(w, http.StatusOK, list)
}

// ListStaffAppointments — GET /api/mobile/v1/staff/grooming/appointments?date=
func (h *GroomingHandler) ListStaffAppointments(w http.ResponseWriter, r *http.Request) {
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}
	if !repository.IsGroomingStaff(claims.AppRole) {
		http.Error(w, "недостаточно прав", http.StatusForbidden)
		return
	}
	date := strings.TrimSpace(r.URL.Query().Get("date"))
	if date == "" {
		date = time.Now().Format("2006-01-02")
	}
	list, err := h.groomingRepo.GetAppointmentsByDate(claims.ClinicID, date)
	if err != nil {
		log.Printf("grooming staff list: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []repository.GroomingAppointment{}
	}
	writeJSON(w, http.StatusOK, list)
}

type patchGroomingStatusBody struct {
	Status string `json:"status"`
}

// PatchStaffAppointment — PATCH /api/mobile/v1/staff/grooming/appointments/{id}
func (h *GroomingHandler) PatchStaffAppointment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}
	if !repository.IsGroomingStaff(claims.AppRole) {
		http.Error(w, "недостаточно прав", http.StatusForbidden)
		return
	}
	id := r.PathValue("id")
	var body patchGroomingStatusBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	appt, err := h.groomingRepo.UpdateAppointmentStatus(claims.ClinicID, id, body.Status)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		if strings.Contains(err.Error(), "недопустимый") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		log.Printf("grooming staff patch: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, appt)
}
