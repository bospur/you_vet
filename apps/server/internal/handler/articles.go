package handler

import (
	"net/http"

	"go-server/internal/repository"
)

// ArticleHandler содержит зависимости для HTTP хендлеров статей
type ArticleHandler struct {
	repo *repository.ArticleRepository
}

// NewArticleHandler создаёт новый хендлер
func NewArticleHandler(repo *repository.ArticleRepository) *ArticleHandler {
	return &ArticleHandler{repo: repo}
}

// GetArticles обрабатывает GET /api/clinics/{clinicSlug}/animals/{animalSlug}/articles
func (h *ArticleHandler) GetArticles(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")
	animalSlug := r.PathValue("animalSlug")
	if clinicSlug == "" || animalSlug == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	articles, err := h.repo.GetPublishedByAnimal(clinicSlug, animalSlug)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if articles == nil {
		articles = []repository.ArticleListItem{}
	}

	writeJSON(w, http.StatusOK, articles)
}

// GetArticle обрабатывает GET /api/clinics/{clinicSlug}/articles/{slug}
func (h *ArticleHandler) GetArticle(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")
	slug := r.PathValue("slug")
	if clinicSlug == "" || slug == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	article, err := h.repo.GetBySlug(clinicSlug, slug)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if article == nil {
		http.Error(w, "статья не найдена", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

// GetFeaturedArticles обрабатывает GET /api/clinics/{clinicSlug}/articles/featured
func (h *ArticleHandler) GetFeaturedArticles(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")
	if clinicSlug == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	articles, err := h.repo.GetFeaturedPublished(clinicSlug, repository.MaxFeaturedArticles)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if articles == nil {
		articles = []repository.FeaturedArticle{}
	}

	writeJSON(w, http.StatusOK, articles)
}
