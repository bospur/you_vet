package handler

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
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
