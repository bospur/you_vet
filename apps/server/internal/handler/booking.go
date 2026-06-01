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
	notifier    BookingNotifier
}

func NewBookingHandler(bookingRepo *repository.BookingRepository, notifier BookingNotifier) *BookingHandler {
	return &BookingHandler{bookingRepo: bookingRepo, notifier: notifier}
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

func validScheduleStyle(s string) bool {
	switch s {
	case "day_capacity", "dropoff", "time_slots", "":
		return true
	default:
		return false
	}
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
	if !validScheduleStyle(input.ScheduleStyle) {
		return "недопустимый стиль расписания"
	}
	if input.DefaultDurationMin <= 0 {
		return "длительность должна быть больше 0"
	}
	if input.SeedMaxPerDay != nil && *input.SeedMaxPerDay < 1 {
		return "мест в день должно быть больше 0"
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
		HorizonWeeks *int   `json:"horizon_weeks"`
		StaffChatID  *int64 `json:"staff_chat_id"`
		ClearStaffChat *bool `json:"clear_staff_chat"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if body.HorizonWeeks == nil && body.StaffChatID == nil && (body.ClearStaffChat == nil || !*body.ClearStaffChat) {
		http.Error(w, "нет полей для обновления", http.StatusBadRequest)
		return
	}

	var s *repository.BookingSettings
	var err error

	if body.HorizonWeeks != nil {
		if *body.HorizonWeeks < 1 || *body.HorizonWeeks > 8 {
			http.Error(w, "horizon_weeks должен быть от 1 до 8", http.StatusBadRequest)
			return
		}
		s, err = h.bookingRepo.UpdateHorizonWeeks(claims.ClinicID, *body.HorizonWeeks)
	}
	if body.ClearStaffChat != nil && *body.ClearStaffChat {
		s, err = h.bookingRepo.UpdateStaffChatID(claims.ClinicID, nil)
	}
	if body.StaffChatID != nil {
		s, err = h.bookingRepo.UpdateStaffChatID(claims.ClinicID, body.StaffChatID)
	}
	if s == nil && err == nil {
		s, err = h.bookingRepo.GetSettings(claims.ClinicID)
	}
	if err != nil {
		log.Printf("ошибка обновления настроек записи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// LinkStaffChat — POST /api/admin/booking/settings/link-chat
func (h *BookingHandler) LinkStaffChat(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	var body struct {
		ChatID *int64 `json:"chat_id"`
	}
	if r.Body != nil && r.ContentLength != 0 {
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "неверный формат запроса", http.StatusBadRequest)
			return
		}
	}

	if body.ChatID == nil {
		writeJSON(w, http.StatusOK, map[string]string{
			"instruction": "Добавьте бота в групповой чат или канал и отправьте там команду /link_staff",
		})
		return
	}

	s, err := h.bookingRepo.UpdateStaffChatID(claims.ClinicID, body.ChatID)
	if err != nil {
		log.Printf("ошибка привязки чата: %v", err)
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

func bookingRequestError(w http.ResponseWriter, err error) bool {
	if err == nil {
		return false
	}
	switch {
	case errors.Is(err, repository.ErrBookingNotFound):
		http.Error(w, "не найдено", http.StatusNotFound)
	case errors.Is(err, repository.ErrBookingCapacityFull):
		http.Error(w, "нет свободных мест на эту дату", http.StatusConflict)
	case errors.Is(err, repository.ErrBookingDuplicatePet):
		http.Error(w, "На эту услугу в этот день уже есть запись с такой кличкой", http.StatusConflict)
	case errors.Is(err, repository.ErrBookingDuplicateSlot):
		http.Error(w, "Вы уже записаны на это время", http.StatusConflict)
	case errors.Is(err, repository.ErrBookingLimitPerService):
		http.Error(w, "Достигнут лимит заявок на эту услугу в этот день. Запишите другого питомца с другой кличкой или отмените лишнюю заявку", http.StatusTooManyRequests)
	case errors.Is(err, repository.ErrBookingLimitPerDay):
		http.Error(w, "Достигнут лимит заявок на этот день", http.StatusTooManyRequests)
	case errors.Is(err, repository.ErrBookingAntispam):
		http.Error(w, "превышен лимит заявок", http.StatusTooManyRequests)
	case errors.Is(err, repository.ErrBookingInvalidDate):
		http.Error(w, "дата недоступна для записи", http.StatusBadRequest)
	case errors.Is(err, repository.ErrBookingInvalidStatus):
		http.Error(w, "эту заявку нельзя отменить", http.StatusBadRequest)
	case errors.Is(err, repository.ErrBookingServiceInactive):
		http.Error(w, "услуга недоступна", http.StatusBadRequest)
	default:
		return false
	}
	return true
}

// GetRequests — GET /api/admin/booking/requests
func (h *BookingHandler) GetRequests(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	f := repository.BookingRequestFilters{
		Status: r.URL.Query().Get("status"),
		From:   r.URL.Query().Get("from"),
		To:     r.URL.Query().Get("to"),
	}
	if v := r.URL.Query().Get("service_type_id"); v != "" {
		if id, err := strconv.Atoi(v); err == nil {
			f.ServiceTypeID = id
		}
	}

	list, err := h.bookingRepo.ListRequests(claims.ClinicID, f)
	if err != nil {
		log.Printf("ошибка списка заявок: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if list == nil {
		list = []repository.BookingRequest{}
	}
	writeJSON(w, http.StatusOK, list)
}

// CreateRequest — POST /api/admin/booking/requests
func (h *BookingHandler) CreateRequest(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	var input repository.BookingRequestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(input.ClientName) == "" || strings.TrimSpace(input.PetName) == "" {
		http.Error(w, "имя клиента и кличка обязательны", http.StatusBadRequest)
		return
	}
	if input.ServiceTypeID <= 0 || input.RequestedDate == "" {
		http.Error(w, "service_type_id и requested_date обязательны", http.StatusBadRequest)
		return
	}

	req, err := h.bookingRepo.CreateRequest(claims.ClinicID, input)
	if err != nil {
		if bookingRequestError(w, err) {
			return
		}
		log.Printf("ошибка создания заявки: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if h.notifier != nil {
		go h.notifier.NotifyBookingRequestCreated(claims.ClinicID, *req)
	}
	writeJSON(w, http.StatusCreated, req)
}

// UpdateRequest — PATCH /api/admin/booking/requests/{id}
func (h *BookingHandler) UpdateRequest(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")

	var patch repository.BookingRequestPatch
	if err := json.NewDecoder(r.Body).Decode(&patch); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if patch.Status == nil && patch.RequestedDate == nil && patch.StaffNote == nil {
		http.Error(w, "нет полей для обновления", http.StatusBadRequest)
		return
	}
	if patch.Status != nil {
		switch *patch.Status {
		case "confirmed", "rejected", "cancelled", "rescheduled":
		default:
			http.Error(w, "недопустимый статус", http.StatusBadRequest)
			return
		}
	}

	existing, err := h.bookingRepo.GetRequestByID(claims.ClinicID, id)
	if err != nil {
		log.Printf("ошибка чтения заявки: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if existing == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	req, err := h.bookingRepo.UpdateRequest(claims.ClinicID, claims.UserID, id, patch)
	if err != nil {
		if bookingRequestError(w, err) {
			return
		}
		log.Printf("ошибка обновления заявки: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if h.notifier != nil {
		prevStatus := existing.Status
		go h.notifier.NotifyBookingRequestUpdated(claims.ClinicID, *req, prevStatus)
	}
	writeJSON(w, http.StatusOK, req)
}

// PublicBookingServiceType — услуга для Mini App (без служебных полей)
type PublicBookingServiceType struct {
	ID                 int             `json:"id"`
	Name               string          `json:"name"`
	Category           string          `json:"category"`
	SpeciesFilter      string          `json:"species_filter"`
	DefaultDurationMin int             `json:"default_duration_min"`
	BookingMode        string          `json:"booking_mode"`
	ScheduleStyle      string          `json:"schedule_style"`
	InstructionsClient *string         `json:"instructions_client"`
	Rules              json.RawMessage `json:"rules"`
	SortOrder          int             `json:"sort_order"`
}

// PublicBookingRequest — заявка клиента в Mini App
type PublicBookingRequest struct {
	ID            int     `json:"id"`
	ServiceTypeID int     `json:"service_type_id"`
	ServiceName   string  `json:"service_name"`
	RequestedDate string  `json:"requested_date"`
	SlotTime      *string `json:"slot_time"`
	PetName       string  `json:"pet_name"`
	Status        string  `json:"status"`
	RejectReason  *string `json:"reject_reason"`
	CreatedAt     string  `json:"created_at"`
}

func (h *BookingHandler) clinicIDFromSlug(w http.ResponseWriter, r *http.Request) (int, bool) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "clinic slug обязателен", http.StatusBadRequest)
		return 0, false
	}
	clinicID, err := h.bookingRepo.GetClinicIDBySlug(clinicSlug)
	if err != nil {
		if errors.Is(err, repository.ErrBookingNotFound) {
			http.Error(w, "клиника не найдена", http.StatusNotFound)
			return 0, false
		}
		log.Printf("ошибка clinic slug: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return 0, false
	}
	return clinicID, true
}

func toPublicServiceType(s repository.BookingServiceType) PublicBookingServiceType {
	return PublicBookingServiceType{
		ID:                 s.ID,
		Name:               s.Name,
		Category:           s.Category,
		SpeciesFilter:      s.SpeciesFilter,
		DefaultDurationMin: s.DefaultDurationMin,
		BookingMode:        s.BookingMode,
		ScheduleStyle:      s.ScheduleStyle,
		InstructionsClient: s.InstructionsClient,
		Rules:              s.Rules,
		SortOrder:          s.SortOrder,
	}
}

func toPublicRequest(req repository.BookingRequest) PublicBookingRequest {
	return PublicBookingRequest{
		ID:            req.ID,
		ServiceTypeID: req.ServiceTypeID,
		ServiceName:   req.ServiceName,
		RequestedDate: req.RequestedDate,
		SlotTime:      req.SlotTime,
		PetName:       req.PetName,
		Status:        req.Status,
		RejectReason:  req.RejectReason,
		CreatedAt:     req.CreatedAt,
	}
}

// GetPublicServiceTypes — GET /api/clinics/{clinicSlug}/booking/service-types
func (h *BookingHandler) GetPublicServiceTypes(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	list, err := h.bookingRepo.GetActiveServiceTypes(clinicID)
	if err != nil {
		log.Printf("ошибка публичных услуг: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	out := make([]PublicBookingServiceType, 0, len(list))
	for _, s := range list {
		out = append(out, toPublicServiceType(s))
	}
	writeJSON(w, http.StatusOK, out)
}

// GetPublicAvailability — GET /api/clinics/{clinicSlug}/booking/availability
func (h *BookingHandler) GetPublicAvailability(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	svcID, ok := parseServiceTypeIDQuery(r)
	if !ok {
		http.Error(w, "service_type_id обязателен", http.StatusBadRequest)
		return
	}
	svc, err := h.bookingRepo.GetServiceTypeByID(clinicID, strconv.Itoa(svcID))
	if err != nil {
		log.Printf("ошибка услуги: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if svc == nil || !svc.IsActive {
		http.Error(w, "услуга не найдена", http.StatusNotFound)
		return
	}
	resp, err := h.bookingRepo.GetAvailability(
		clinicID, svcID,
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

// ListPublicRequests — GET /api/clinics/{clinicSlug}/booking/requests
func (h *BookingHandler) ListPublicRequests(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	visit, ok := middleware.ParseInitDataUser(middleware.InitDataFromRequest(r))
	if !ok {
		http.Error(w, "требуется авторизация Telegram", http.StatusUnauthorized)
		return
	}
	tgID := visit.TelegramUserID
	list, err := h.bookingRepo.ListRequests(clinicID, repository.BookingRequestFilters{
		TelegramUserID: &tgID,
	})
	if err != nil {
		log.Printf("ошибка списка заявок клиента: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	out := make([]PublicBookingRequest, 0, len(list))
	for _, req := range list {
		out = append(out, toPublicRequest(req))
	}
	writeJSON(w, http.StatusOK, out)
}

// CreatePublicRequest — POST /api/clinics/{clinicSlug}/booking/requests
func (h *BookingHandler) CreatePublicRequest(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}

	var input repository.BookingRequestInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if strings.TrimSpace(input.ClientName) == "" || strings.TrimSpace(input.PetName) == "" {
		http.Error(w, "имя клиента и кличка обязательны", http.StatusBadRequest)
		return
	}
	if input.ServiceTypeID <= 0 || input.RequestedDate == "" {
		http.Error(w, "service_type_id и requested_date обязательны", http.StatusBadRequest)
		return
	}

	if visit, ok := middleware.ParseInitDataUser(middleware.InitDataFromRequest(r)); ok {
		input.TelegramUserID = &visit.TelegramUserID
	}

	req, err := h.bookingRepo.CreateRequest(clinicID, input)
	if err != nil {
		if bookingRequestError(w, err) {
			return
		}
		log.Printf("ошибка публичной заявки: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if h.notifier != nil {
		go h.notifier.NotifyBookingRequestCreated(clinicID, *req)
	}
	writeJSON(w, http.StatusCreated, toPublicRequest(*req))
}

// CancelPublicRequest — PATCH /api/clinics/{clinicSlug}/booking/requests/{id} (клиент отменяет свою заявку)
func (h *BookingHandler) CancelPublicRequest(w http.ResponseWriter, r *http.Request) {
	clinicID, ok := h.clinicIDFromSlug(w, r)
	if !ok {
		return
	}
	visit, ok := middleware.ParseInitDataUser(middleware.InitDataFromRequest(r))
	if !ok {
		http.Error(w, "требуется авторизация Telegram", http.StatusUnauthorized)
		return
	}
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "id обязателен", http.StatusBadRequest)
		return
	}

	existing, err := h.bookingRepo.GetRequestByID(clinicID, id)
	if err != nil {
		log.Printf("ошибка чтения заявки: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if existing == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	prevStatus := existing.Status

	req, err := h.bookingRepo.CancelRequestByTelegramUser(clinicID, id, visit.TelegramUserID)
	if err != nil {
		if bookingRequestError(w, err) {
			return
		}
		log.Printf("ошибка отмены заявки клиентом: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if h.notifier != nil {
		go h.notifier.NotifyBookingRequestUpdated(clinicID, *req, prevStatus)
	}
	writeJSON(w, http.StatusOK, toPublicRequest(*req))
}
