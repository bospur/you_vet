package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"

	"go-server/internal/middleware"
	"go-server/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

const docsTokenTTL = 365 * 24 * time.Hour

// Должен совпадать со slug в apps/docs/src/pages.ts (кроме канбана /board).
var allowedDocSlugs = map[string]struct{}{
	"project-for-devs":     {},
	"roadmap":              {},
	"rustore-app":          {},
	"mobile":               {},
	"booking-for-clinic":   {},
	"phase-5-appointments": {},
	"sales":                {},
}

type DocsPortalHandler struct {
	repo   *repository.DocsPortalRepository
	secret string
}

func NewDocsPortalHandler(repo *repository.DocsPortalRepository, secret string) *DocsPortalHandler {
	return &DocsPortalHandler{repo: repo, secret: secret}
}

type docsRegisterBody struct {
	DisplayName string `json:"display_name"`
}

type docsCommentBody struct {
	PageSlug string `json:"page_slug"`
	Body     string `json:"body"`
}

type docsCommentPatchBody struct {
	Body string `json:"body"`
}

type docsTaskBody struct {
	Title    string `json:"title"`
	Priority string `json:"priority"`
}

type docsTaskPatchBody struct {
	Title    *string `json:"title"`
	Status   *string `json:"status"`
	Priority *string `json:"priority"`
}

var allowedTaskStatuses = map[string]struct{}{
	"analysis":    {},
	"todo":        {},
	"in_progress": {},
	"testing":     {},
	"done":        {},
}

var allowedTaskPriorities = map[string]struct{}{
	"low":    {},
	"normal": {},
	"high":   {},
}

func (h *DocsPortalHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req docsRegisterBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(req.DisplayName)
	if utf8.RuneCountInString(name) < 2 || utf8.RuneCountInString(name) > 40 {
		http.Error(w, "имя: от 2 до 40 символов", http.StatusBadRequest)
		return
	}

	visitor, err := h.repo.CreateVisitor(name)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	token, err := h.signToken(visitor.ID, visitor.DisplayName)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"token": token,
		"visitor": map[string]any{
			"id":           visitor.ID,
			"display_name": visitor.DisplayName,
		},
	})
}

func (h *DocsPortalHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	slug := strings.TrimSpace(r.URL.Query().Get("page"))
	if !isAllowedDocSlug(slug) {
		http.Error(w, "неизвестная страница", http.StatusBadRequest)
		return
	}

	items, err := h.repo.ListComments(slug)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	out := make([]map[string]any, 0, len(items))
	for _, c := range items {
		out = append(out, commentToJSON(c))
	}

	writeJSON(w, http.StatusOK, map[string]any{"comments": out})
}

func (h *DocsPortalHandler) CreateComment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.DocsClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	var req docsCommentBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	slug := strings.TrimSpace(req.PageSlug)
	if !isAllowedDocSlug(slug) {
		http.Error(w, "неизвестная страница", http.StatusBadRequest)
		return
	}

	body := strings.TrimSpace(req.Body)
	if utf8.RuneCountInString(body) < 1 || utf8.RuneCountInString(body) > 2000 {
		http.Error(w, "комментарий: от 1 до 2000 символов", http.StatusBadRequest)
		return
	}

	comment, err := h.repo.CreateComment(slug, claims.VisitorID, body)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"comment": commentToJSON(*comment),
	})
}

func (h *DocsPortalHandler) UpdateComment(w http.ResponseWriter, r *http.Request) {
	claims := middleware.DocsClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}

	var req docsCommentPatchBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	body := strings.TrimSpace(req.Body)
	if utf8.RuneCountInString(body) < 1 || utf8.RuneCountInString(body) > 2000 {
		http.Error(w, "комментарий: от 1 до 2000 символов", http.StatusBadRequest)
		return
	}

	comment, err := h.repo.UpdateComment(id, claims.VisitorID, body)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "не найдено или нет прав", http.StatusForbidden)
			return
		}
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"comment": commentToJSON(*comment),
	})
}

func (h *DocsPortalHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListTasks()
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	out := make([]map[string]any, 0, len(items))
	for _, t := range items {
		out = append(out, taskToJSON(t))
	}
	writeJSON(w, http.StatusOK, map[string]any{"tasks": out})
}

func (h *DocsPortalHandler) CreateTask(w http.ResponseWriter, r *http.Request) {
	claims := middleware.DocsClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	var req docsTaskBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	title := strings.TrimSpace(req.Title)
	if utf8.RuneCountInString(title) < 1 || utf8.RuneCountInString(title) > 200 {
		http.Error(w, "задача: от 1 до 200 символов", http.StatusBadRequest)
		return
	}

	priority := strings.TrimSpace(req.Priority)
	if priority == "" {
		priority = "normal"
	}
	if _, ok := allowedTaskPriorities[priority]; !ok {
		http.Error(w, "неверный приоритет", http.StatusBadRequest)
		return
	}

	task, err := h.repo.CreateTask(claims.VisitorID, title, priority)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"task": taskToJSON(*task)})
}

func (h *DocsPortalHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	claims := middleware.DocsClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}

	var req docsTaskPatchBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	if req.Title == nil && req.Status == nil && req.Priority == nil {
		http.Error(w, "нет полей для обновления", http.StatusBadRequest)
		return
	}

	if req.Title != nil {
		title := strings.TrimSpace(*req.Title)
		if utf8.RuneCountInString(title) < 1 || utf8.RuneCountInString(title) > 200 {
			http.Error(w, "задача: от 1 до 200 символов", http.StatusBadRequest)
			return
		}
		req.Title = &title
	}

	if req.Status != nil {
		if _, ok := allowedTaskStatuses[*req.Status]; !ok {
			http.Error(w, "неверный статус", http.StatusBadRequest)
			return
		}
	}

	if req.Priority != nil {
		if _, ok := allowedTaskPriorities[*req.Priority]; !ok {
			http.Error(w, "неверный приоритет", http.StatusBadRequest)
			return
		}
	}

	task, err := h.repo.UpdateTask(id, req.Title, req.Status, req.Priority)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if task == nil {
		http.Error(w, "не найдено", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"task": taskToJSON(*task)})
}

func (h *DocsPortalHandler) DeleteTask(w http.ResponseWriter, r *http.Request) {
	claims := middleware.DocsClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}

	if err := h.repo.DeleteTask(id); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "не найдено", http.StatusNotFound)
			return
		}
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func commentToJSON(c repository.DocsComment) map[string]any {
	return map[string]any{
		"id":           c.ID,
		"page_slug":    c.PageSlug,
		"visitor_id":   c.VisitorID,
		"body":         c.Body,
		"display_name": c.DisplayName,
		"created_at":   c.CreatedAt.UTC().Format(time.RFC3339),
		"updated_at":   c.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func taskToJSON(t repository.DocsTask) map[string]any {
	return map[string]any{
		"id":           t.ID,
		"title":        t.Title,
		"status":       t.Status,
		"priority":     t.Priority,
		"position":     t.Position,
		"display_name": t.DisplayName,
		"created_at":   t.CreatedAt.UTC().Format(time.RFC3339),
		"updated_at":   t.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func (h *DocsPortalHandler) signToken(visitorID int64, displayName string) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  visitorID,
		"typ":  "docs",
		"name": displayName,
		"exp":  time.Now().Add(docsTokenTTL).Unix(),
	})
	return token.SignedString([]byte(h.secret))
}

func isAllowedDocSlug(slug string) bool {
	_, ok := allowedDocSlugs[slug]
	return ok
}
