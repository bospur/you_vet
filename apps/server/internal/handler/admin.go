package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"go-server/internal/middleware"
	"go-server/internal/repository"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// AdminHandler содержит зависимости для административных эндпоинтов
type AdminHandler struct {
	animalRepo  *repository.AnimalRepository
	articleRepo *repository.ArticleRepository
	userRepo    *repository.UserRepository
	jwtSecret   string
}

// NewAdminHandler создаёт новый хендлер
func NewAdminHandler(
	animalRepo *repository.AnimalRepository,
	articleRepo *repository.ArticleRepository,
	userRepo *repository.UserRepository,
	jwtSecret string,
) *AdminHandler {
	return &AdminHandler{
		animalRepo:  animalRepo,
		articleRepo: articleRepo,
		userRepo:    userRepo,
		jwtSecret:   jwtSecret,
	}
}

// ── Авторизация ──────────────────────────────────────────────────────────────

type loginRequest struct {
	Login      string `json:"login"`
	Password   string `json:"password"`
	RememberMe bool   `json:"remember_me"`
}

type loginResponse struct {
	User struct {
		ID       int    `json:"id"`
		ClinicID int    `json:"clinic_id"`
		Role     string `json:"role"`
	} `json:"user"`
}

// Login обрабатывает POST /api/admin/login
func (h *AdminHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	user, err := h.userRepo.GetByLogin(req.Login)
	if err != nil {
		log.Printf("ошибка получения пользователя: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	if user == nil || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		http.Error(w, "неверный логин или пароль", http.StatusUnauthorized)
		return
	}

	tokenTTL := middleware.AdminTokenTTL(req.RememberMe)
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":   user.ID,
		"clinic_id": user.ClinicID,
		"role":      user.Role,
		"exp":       time.Now().Add(tokenTTL).Unix(),
	})

	tokenString, err := token.SignedString([]byte(h.jwtSecret))
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	middleware.SetAdminAuthCookie(w, tokenString, req.RememberMe)

	resp := loginResponse{}
	resp.User.ID = user.ID
	resp.User.ClinicID = user.ClinicID
	resp.User.Role = user.Role
	writeJSON(w, http.StatusOK, resp)
}

// Logout обрабатывает POST /api/admin/logout
func (h *AdminHandler) Logout(w http.ResponseWriter, r *http.Request) {
	middleware.ClearAdminAuthCookie(w)
	w.WriteHeader(http.StatusNoContent)
}

// Me обрабатывает GET /api/admin/me
func (h *AdminHandler) Me(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	writeJSON(w, http.StatusOK, map[string]any{
		"id":        claims.UserID,
		"clinic_id": claims.ClinicID,
		"role":      claims.Role,
	})
}

// ── Animals CRUD ─────────────────────────────────────────────────────────────

// GetAdminAnimals обрабатывает GET /api/admin/animals
func (h *AdminHandler) GetAdminAnimals(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	animals, err := h.animalRepo.GetAllByClinicID(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения животных: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if animals == nil {
		animals = []repository.Animal{}
	}
	writeJSON(w, http.StatusOK, animals)
}

// CreateAnimal обрабатывает POST /api/admin/animals
func (h *AdminHandler) CreateAnimal(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.AnimalInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	animal, err := h.animalRepo.Create(claims.ClinicID, input)
	if err != nil {
		log.Printf("ошибка создания животного: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, animal)
}

// UpdateAnimal обрабатывает PUT /api/admin/animals/{id}
func (h *AdminHandler) UpdateAnimal(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	var input repository.AnimalInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	animal, err := h.animalRepo.Update(claims.ClinicID, id, input)
	if err != nil {
		log.Printf("ошибка обновления животного: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if animal == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, animal)
}

// DeleteAnimal обрабатывает DELETE /api/admin/animals/{id}
func (h *AdminHandler) DeleteAnimal(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	if err := h.animalRepo.Delete(claims.ClinicID, id); err != nil {
		log.Printf("ошибка удаления животного: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ── Articles CRUD ─────────────────────────────────────────────────────────────

func (h *AdminHandler) validateArticleInput(clinicID int, input repository.ArticleInput) string {
	if input.Title == "" {
		return "заголовок обязателен"
	}
	if input.AnimalID <= 0 {
		return "выберите животное"
	}
	ok, err := h.articleRepo.AnimalBelongsToClinic(clinicID, input.AnimalID)
	if err != nil || !ok {
		return "животное не найдено"
	}
	return ""
}


// GetAdminArticles обрабатывает GET /api/admin/articles
func (h *AdminHandler) GetAdminArticles(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	articles, err := h.articleRepo.GetAll(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения статей: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if articles == nil {
		articles = []repository.Article{}
	}
	writeJSON(w, http.StatusOK, articles)
}

// GetAdminArticle обрабатывает GET /api/admin/articles/{id}
func (h *AdminHandler) GetAdminArticle(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	article, err := h.articleRepo.GetByID(claims.ClinicID, id)
	if err != nil {
		log.Printf("ошибка получения статьи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if article == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

// CreateArticle обрабатывает POST /api/admin/articles
func (h *AdminHandler) CreateArticle(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.ArticleInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if msg := h.validateArticleInput(claims.ClinicID, input); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	article, err := h.articleRepo.Create(claims.ClinicID, input)
	if err != nil {
		log.Printf("ошибка создания статьи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, article)
}

// UpdateArticle обрабатывает PUT /api/admin/articles/{id}
// Editor не может редактировать опубликованные статьи
func (h *AdminHandler) UpdateArticle(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	claims := middleware.ClaimsFromContext(r)
	if claims.Role == "editor" {
		status, err := h.articleRepo.GetStatus(claims.ClinicID, id)
		if err != nil {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		if status == "published" {
			http.Error(w, "нельзя редактировать опубликованную статью", http.StatusForbidden)
			return
		}
	}

	var input repository.ArticleInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if msg := h.validateArticleInput(claims.ClinicID, input); msg != "" {
		http.Error(w, msg, http.StatusBadRequest)
		return
	}

	article, err := h.articleRepo.Update(claims.ClinicID, id, input)
	if err != nil {
		log.Printf("ошибка обновления статьи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if article == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

// UpdateArticleStatus обрабатывает PATCH /api/admin/articles/{id}/status
// Только admin может менять статус
func (h *AdminHandler) UpdateArticleStatus(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

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

	article, err := h.articleRepo.UpdateStatus(claims.ClinicID, id, body.Status)
	if err != nil {
		log.Printf("ошибка обновления статуса статьи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if article == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, article)
}

// UpdateArticleFeatured обрабатывает PATCH /api/admin/articles/{id}/featured
func (h *AdminHandler) UpdateArticleFeatured(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	var body struct {
		Featured bool `json:"featured"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	status, err := h.articleRepo.GetStatus(claims.ClinicID, id)
	if err != nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}
	if body.Featured && status != "published" {
		http.Error(w, "на главную можно добавить только опубликованную статью", http.StatusBadRequest)
		return
	}

	if body.Featured {
		count, err := h.articleRepo.CountFeatured(claims.ClinicID, id)
		if err != nil {
			http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
			return
		}
		if count >= repository.MaxFeaturedArticles {
			http.Error(w, "на главной не более 3 статей", http.StatusBadRequest)
			return
		}
	}

	article, err := h.articleRepo.UpdateFeatured(claims.ClinicID, id, body.Featured)
	if err != nil {
		log.Printf("ошибка обновления featured: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if article == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	existing, err := h.articleRepo.GetByID(claims.ClinicID, id)
	if err != nil || existing == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, existing)
}

// DeleteArticle обрабатывает DELETE /api/admin/articles/{id}
// Editor может удалять только черновики
func (h *AdminHandler) DeleteArticle(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	claims := middleware.ClaimsFromContext(r)
	if claims.Role == "editor" {
		status, err := h.articleRepo.GetStatus(claims.ClinicID, id)
		if err != nil {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		if status == "published" {
			http.Error(w, "нельзя удалить опубликованную статью", http.StatusForbidden)
			return
		}
	}

	if err := h.articleRepo.Delete(claims.ClinicID, id); err != nil {
		log.Printf("ошибка удаления статьи: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// ── Users CRUD (только admin) ─────────────────────────────────────────────────

// GetAdminUsers обрабатывает GET /api/admin/users
func (h *AdminHandler) GetAdminUsers(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	users, err := h.userRepo.GetAll(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения пользователей: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if users == nil {
		users = []repository.User{}
	}
	writeJSON(w, http.StatusOK, users)
}

// CreateAdminUser обрабатывает POST /api/admin/users
func (h *AdminHandler) CreateAdminUser(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	var body struct {
		Login    string `json:"login"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if body.Login == "" || body.Password == "" {
		http.Error(w, "логин и пароль обязательны", http.StatusBadRequest)
		return
	}
	if body.Role != "admin" && body.Role != "editor" && body.Role != "groomer" && body.Role != "manager" {
		http.Error(w, "недопустимая роль", http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(body.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	user, err := h.userRepo.Create(claims.ClinicID, body.Login, string(hash), body.Role)
	if err != nil {
		log.Printf("ошибка создания пользователя: %v", err)
		http.Error(w, "пользователь с таким логином уже существует", http.StatusConflict)
		return
	}

	writeJSON(w, http.StatusCreated, user)
}

// DeleteAdminUser обрабатывает DELETE /api/admin/users/{id}
func (h *AdminHandler) DeleteAdminUser(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	if claims.Role != "admin" {
		http.Error(w, "доступ запрещён", http.StatusForbidden)
		return
	}

	id := r.PathValue("id")
	if id == "" {
		http.Error(w, "неверный запрос", http.StatusBadRequest)
		return
	}

	if err := h.userRepo.Delete(claims.ClinicID, id); err != nil {
		log.Printf("ошибка удаления пользователя: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
