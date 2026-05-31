package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

// BookingHandler — эндпоинты записи на приём (B1: услуги)
type BookingHandler struct {
	bookingRepo *repository.BookingRepository
}

func NewBookingHandler(bookingRepo *repository.BookingRepository) *BookingHandler {
	return &BookingHandler{bookingRepo: bookingRepo}
}

func validBookingCategory(c string) bool {
	switch c {
	case "uzi", "surgery", "xray":
		return true
	default:
		return false
	}
}

func validSpeciesFilter(f string) bool {
	return f == "any" || f == "cats_only"
}

func validBookingMode(m string) bool {
	return m == "instant" || m == "pending_request"
}

func validateServiceTypeInput(input *repository.BookingServiceTypeInput) string {
	if strings.TrimSpace(input.Name) == "" {
		return "название обязательно"
	}
	if !validBookingCategory(input.Category) {
		return "недопустимая категория"
	}
	if !validSpeciesFilter(input.SpeciesFilter) {
		return "недопустимый фильтр животных"
	}
	if !validBookingMode(input.BookingMode) {
		return "недопустимый режим записи"
	}
	if input.DefaultDurationMin <= 0 {
		return "длительность должна быть больше 0"
	}
	return ""
}

// GetServiceTypes — GET /api/admin/booking/service-types
func (h *BookingHandler) GetServiceTypes(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	list, err := h.bookingRepo.GetAllServiceTypes(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения услуг записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []repository.BookingServiceType{}
	}
	writeJSON(w, http.StatusOK, list)
}

// CreateServiceType — POST /api/admin/booking/service-types
func (h *BookingHandler) CreateServiceType(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	var input repository.BookingServiceTypeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if msg := validateServiceTypeInput(&input); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	svc, err := h.bookingRepo.CreateServiceType(claims.ClinicID, input)
	if err != nil {
		if strings.Contains(err.Error(), "unique") || strings.Contains(err.Error(), "duplicate") {
			http.Error(w, "услуга с таким названием уже есть", http.StatusConflict)
			return
		}
		log.Printf("ошибка создания услуги записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, svc)
}

// UpdateServiceType — PUT /api/admin/booking/service-types/{id}
func (h *BookingHandler) UpdateServiceType(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	var input repository.BookingServiceTypeInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if msg := validateServiceTypeInput(&input); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	svc, err := h.bookingRepo.UpdateServiceType(claims.ClinicID, id, input)
	if err != nil {
		log.Printf("ошибка обновления услуги записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if svc == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, svc)
}

// DeleteServiceType — DELETE /api/admin/booking/service-types/{id}
func (h *BookingHandler) DeleteServiceType(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	if err := h.bookingRepo.DeleteServiceType(claims.ClinicID, id); err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		log.Printf("ошибка удаления услуги записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func parseServiceTypeIDQuery(r *http.Request) (int, bool) {
	id, err := strconv.Atoi(r.URL.Query().Get("service_type_id"))
	if err != nil || id <= 0 {
		return 0, false
	}
	return id, true
}

// GetBookingSettings — GET /api/admin/booking/settings
func (h *BookingHandler) GetBookingSettings(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	s, err := h.bookingRepo.GetSettings(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения настроек записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// UpdateBookingSettings — PATCH /api/admin/booking/settings
func (h *BookingHandler) UpdateBookingSettings(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	var body struct {
		HorizonWeeks *int `json:"horizon_weeks"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if body.HorizonWeeks == nil || *body.HorizonWeeks < 1 || *body.HorizonWeeks > 8 {
		http.Error(w, "horizon_weeks должен быть от 1 до 8", http.StatusBadRequest)
		return
	}
	s, err := h.bookingRepo.UpdateHorizonWeeks(claims.ClinicID, *body.HorizonWeeks)
	if err != nil {
		log.Printf("ошибка обновления настроек записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// GetAvailability — GET /api/admin/booking/availability
func (h *BookingHandler) GetAvailability(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	resp, err := h.bookingRepo.GetAvailability(
		claims.ClinicID, svcID,
		r.URL.Query().Get("from"),
		r.URL.Query().Get("to"),
	)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "услуга не найдена", http.StatusNotFound)
			return
		}
		log.Printf("ошибка availability: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

// GetWeeklyRules — GET /api/admin/booking/weekly-rules
func (h *BookingHandler) GetWeeklyRules(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	list, err := h.bookingRepo.GetWeeklyRules(claims.ClinicID, svcID)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "услуга не найдена", http.StatusNotFound)
			return
		}
		log.Printf("ошибка weekly rules: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []repository.BookingWeeklyRule{}
	}
	writeJSON(w, http.StatusOK, list)
}

// UpsertWeeklyRule — PUT /api/admin/booking/weekly-rules
func (h *BookingHandler) UpsertWeeklyRule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	var input repository.BookingWeeklyRuleInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.MaxPerDay <= 0 {
		http.Error(w, "max_per_day должен быть больше 0", http.StatusBadRequest)
		return
	}
	if input.DayOfWeek < 0 || input.DayOfWeek > 6 {
		http.Error(w, "day_of_week от 0 до 6", http.StatusBadRequest)
		return
	}
	rule, err := h.bookingRepo.UpsertWeeklyRule(claims.ClinicID, svcID, input)
	if err != nil {
		log.Printf("ошибка upsert weekly: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, rule)
}

// DeleteWeeklyRule — DELETE /api/admin/booking/weekly-rules
func (h *BookingHandler) DeleteWeeklyRule(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	day, err := strconv.Atoi(r.URL.Query().Get("day_of_week"))
	if err != nil || day < 0 || day > 6 {
		http.Error(w, "day_of_week обязателен (0-6)", http.StatusBadRequest)
		return
	}
	if err := h.bookingRepo.DeleteWeeklyRule(claims.ClinicID, svcID, day); err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		log.Printf("ошибка delete weekly: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// GetWindows — GET /api/admin/booking/windows
func (h *BookingHandler) GetWindows(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	list, err := h.bookingRepo.GetWindows(claims.ClinicID, svcID)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "услуга не найдена", http.StatusNotFound)
			return
		}
		log.Printf("ошибка windows: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []repository.BookingAvailabilityWindow{}
	}
	writeJSON(w, http.StatusOK, list)
}

// CreateWindow — POST /api/admin/booking/windows
func (h *BookingHandler) CreateWindow(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	var input repository.BookingWindowInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.MaxPerDay <= 0 || input.DateFrom == "" || input.DateTo == "" {
		http.Error(w, "date_from, date_to и max_per_day обязательны", http.StatusBadRequest)
		return
	}
	wnd, err := h.bookingRepo.CreateWindow(claims.ClinicID, svcID, input)
	if err != nil {
		log.Printf("ошибка create window: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusCreated, wnd)
}

// DeleteWindow — DELETE /api/admin/booking/windows/{id}
func (h *BookingHandler) DeleteWindow(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if err := h.bookingRepo.DeleteWindow(claims.ClinicID, r.PathValue("id")); err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		log.Printf("ошибка delete window: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UpsertDayOverride — PUT /api/admin/booking/day-overrides
func (h *BookingHandler) UpsertDayOverride(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	var input repository.BookingDayOverrideInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.Date == "" {
		http.Error(w, "date обязателен", http.StatusBadRequest)
		return
	}
	o, err := h.bookingRepo.UpsertDayOverride(claims.ClinicID, svcID, input)
	if err != nil {
		log.Printf("ошибка day override: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, o)
}

// DeleteDayOverride — DELETE /api/admin/booking/day-overrides
func (h *BookingHandler) DeleteDayOverride(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	date := r.URL.Query().Get("date")
	if date == "" {
		http.Error(w, "date обязателен", http.StatusBadRequest)
		return
	}
	if err := h.bookingRepo.DeleteDayOverride(claims.ClinicID, svcID, date); err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		log.Printf("ошибка delete override: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// UpsertDayStaff — PUT /api/admin/booking/day-staff
func (h *BookingHandler) UpsertDayStaff(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	var input repository.BookingDayStaffInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if input.Date == "" {
		http.Error(w, "date обязателен", http.StatusBadRequest)
		return
	}
	s, err := h.bookingRepo.UpsertDayStaff(claims.ClinicID, svcID, input)
	if err != nil {
		log.Printf("ошибка day staff: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, s)
}
