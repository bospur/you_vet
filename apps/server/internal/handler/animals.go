package handler

import (
	"net/http"

	"go-server/internal/repository"
)

// AnimalHandler содержит зависимости для HTTP хендлеров животных
type AnimalHandler struct {
	repo *repository.AnimalRepository
}

// NewAnimalHandler создаёт новый хендлер
func NewAnimalHandler(repo *repository.AnimalRepository) *AnimalHandler {
	return &AnimalHandler{repo: repo}
}

// GetAnimals обрабатывает GET /api/clinics/{clinicSlug}/animals
func (h *AnimalHandler) GetAnimals(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	animals, err := h.repo.GetAllByClinic(clinicSlug)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if animals == nil {
		animals = []repository.Animal{}
	}

	writeJSON(w, http.StatusOK, animals)
}
