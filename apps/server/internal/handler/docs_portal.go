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
	"github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

const docsAccessTokenTTL = middleware.DocsAccessTTL
const docsRefreshTokenTTL = middleware.DocsRefreshTTL

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
	Password    string `json:"password"`
}

type docsLoginBody struct {
	DisplayName string `json:"display_name"`
	Password    string `json:"password"`
}

type docsCommentBody struct {
	PageSlug string `json:"page_slug"`
	Body     string `json:"body"`
}

type docsCommentPatchBody struct {
	Body string `json:"body"`
}

type docsTaskBody struct {
	Title       string   `json:"title"`
	Priority    string   `json:"priority"`
	Description string   `json:"description"`
	Tags        []string `json:"tags"`
}

type docsTaskPatchBody struct {
	Title       *string   `json:"title"`
	Status      *string   `json:"status"`
	Priority    *string   `json:"priority"`
	Description *string   `json:"description"`
	Tags        *[]string `json:"tags"`
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

var allowedTaskTags = map[string]struct{}{
	"management":  {},
	"development": {},
	"customer":    {},
}

const maxTaskDescriptionRunes = 4000
const docsPasswordMin = 8
const docsPasswordMax = 72

func validateDocsDisplayName(raw string) (string, error) {
	name := strings.TrimSpace(raw)
	n := utf8.RuneCountInString(name)
	if n < 2 || n > 40 {
		return "", errors.New("имя: от 2 до 40 символов")
	}
	return name, nil
}

func validateDocsPassword(pw string) error {
	n := utf8.RuneCountInString(pw)
	if n < docsPasswordMin || n > docsPasswordMax {
		return errors.New("пароль: от 8 до 72 символов")
	}
	return nil
}

func visitorHasPassword(v *repository.DocsVisitor) bool {
	return v != nil && strings.TrimSpace(v.PasswordHash) != ""
}

func visitorJSON(v *repository.DocsVisitor) map[string]any {
	return map[string]any{
		"id":           v.ID,
		"display_name": v.DisplayName,
		"created_at":   v.CreatedAt.UTC().Format(time.RFC3339),
	}
}

func isUniqueViolation(err error) bool {
	var pqErr *pq.Error
	return errors.As(err, &pqErr) && pqErr.Code == "23505"
}

func (h *DocsPortalHandler) requireAccount(w http.ResponseWriter, r *http.Request) *repository.DocsVisitor {
	claims := middleware.DocsClaimsFromContext(r)
	if claims == nil {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return nil
	}
	visitor, err := h.repo.GetVisitor(claims.VisitorID)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return nil
	}
	if !visitorHasPassword(visitor) {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return nil
	}
	return visitor
}

func (h *DocsPortalHandler) writeSession(w http.ResponseWriter, status int, visitor *repository.DocsVisitor) {
	access, refresh, err := h.issueDocsTokenPair(visitor.ID, visitor.DisplayName)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	middleware.SetDocsAuthCookies(w, access, refresh)
	_ = h.repo.TouchLastSeen(visitor.ID)
	writeJSON(w, status, map[string]any{
		"visitor": visitorJSON(visitor),
	})
}

func (h *DocsPortalHandler) Logout(w http.ResponseWriter, r *http.Request) {
	middleware.ClearDocsAuthCookies(w)
	w.WriteHeader(http.StatusNoContent)
}

func (h *DocsPortalHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	raw := middleware.DocsRefreshTokenFromRequest(r)
	if raw == "" {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	token, err := jwt.Parse(raw, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(h.secret), nil
	})
	if err != nil || !token.Valid {
		middleware.ClearDocsAuthCookies(w)
		http.Error(w, "недействительный токен", http.StatusUnauthorized)
		return
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		middleware.ClearDocsAuthCookies(w)
		http.Error(w, "недействительный токен", http.StatusUnauthorized)
		return
	}
	if typ, _ := mapClaims["typ"].(string); typ != "docs_refresh" {
		middleware.ClearDocsAuthCookies(w)
		http.Error(w, "недействительный токен", http.StatusUnauthorized)
		return
	}

	visitorID, ok := middleware.VisitorIDFromMapClaims(mapClaims)
	if !ok {
		middleware.ClearDocsAuthCookies(w)
		http.Error(w, "недействительный токен", http.StatusUnauthorized)
		return
	}

	visitor, err := h.repo.GetVisitor(visitorID)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if !visitorHasPassword(visitor) {
		middleware.ClearDocsAuthCookies(w)
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	h.writeSession(w, http.StatusOK, visitor)
}

func (h *DocsPortalHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req docsRegisterBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	name, err := validateDocsDisplayName(req.DisplayName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	if err := validateDocsPassword(req.Password); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	existing, err := h.repo.GetVisitorByName(name)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if existing != nil {
		if visitorHasPassword(existing) {
			http.Error(w, "это имя уже занято", http.StatusConflict)
			return
		}
		if err := h.repo.SetVisitorPassword(existing.ID, string(hash)); err != nil {
			http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
			return
		}
		existing.PasswordHash = string(hash)
		h.writeSession(w, http.StatusCreated, existing)
		return
	}

	visitor, err := h.repo.CreateVisitorWithPassword(name, string(hash))
	if err != nil {
		if isUniqueViolation(err) {
			http.Error(w, "это имя уже занято", http.StatusConflict)
			return
		}
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	h.writeSession(w, http.StatusCreated, visitor)
}

func (h *DocsPortalHandler) Login(w http.ResponseWriter, r *http.Request) {
	var req docsLoginBody
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	name, err := validateDocsDisplayName(req.DisplayName)
	if err != nil {
		http.Error(w, "неверное имя или пароль", http.StatusUnauthorized)
		return
	}

	visitor, err := h.repo.GetVisitorByName(name)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if !visitorHasPassword(visitor) {
		http.Error(w, "неверное имя или пароль", http.StatusUnauthorized)
		return
	}
	if bcrypt.CompareHashAndPassword([]byte(visitor.PasswordHash), []byte(req.Password)) != nil {
		http.Error(w, "неверное имя или пароль", http.StatusUnauthorized)
		return
	}

	h.writeSession(w, http.StatusOK, visitor)
}

func (h *DocsPortalHandler) Me(w http.ResponseWriter, r *http.Request) {
	visitor := h.requireAccount(w, r)
	if visitor == nil {
		return
	}
	_ = h.repo.TouchLastSeen(visitor.ID)
	writeJSON(w, http.StatusOK, map[string]any{"visitor": visitorJSON(visitor)})
}

func adminVisitorJSON(v repository.DocsVisitorAdmin) map[string]any {
	out := map[string]any{
		"id":           v.ID,
		"display_name": v.DisplayName,
		"created_at":   v.CreatedAt.UTC().Format(time.RFC3339),
		"has_password": v.HasPassword,
	}
	if v.LastSeenAt != nil {
		out["last_seen_at"] = v.LastSeenAt.UTC().Format(time.RFC3339)
	} else {
		out["last_seen_at"] = nil
	}
	return out
}

func (h *DocsPortalHandler) AdminStats(w http.ResponseWriter, r *http.Request) {
	stats, err := h.repo.GetPortalStats()
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, stats)
}

func (h *DocsPortalHandler) AdminListVisitors(w http.ResponseWriter, r *http.Request) {
	items, err := h.repo.ListVisitorsAdmin()
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	out := make([]map[string]any, 0, len(items))
	for _, v := range items {
		out = append(out, adminVisitorJSON(v))
	}
	writeJSON(w, http.StatusOK, map[string]any{"visitors": out})
}

func (h *DocsPortalHandler) ListComments(w http.ResponseWriter, r *http.Request) {
	if h.requireAccount(w, r) == nil {
		return
	}

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
	visitor := h.requireAccount(w, r)
	if visitor == nil {
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

	comment, err := h.repo.CreateComment(slug, visitor.ID, body)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"comment": commentToJSON(*comment),
	})
}

func (h *DocsPortalHandler) UpdateComment(w http.ResponseWriter, r *http.Request) {
	visitor := h.requireAccount(w, r)
	if visitor == nil {
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

	comment, err := h.repo.UpdateComment(id, visitor.ID, body)
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

func (h *DocsPortalHandler) DeleteComment(w http.ResponseWriter, r *http.Request) {
	visitor := h.requireAccount(w, r)
	if visitor == nil {
		return
	}

	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}

	if err := h.repo.DeleteComment(id, visitor.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			http.Error(w, "не найдено или нет прав", http.StatusForbidden)
			return
		}
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *DocsPortalHandler) ListTasks(w http.ResponseWriter, r *http.Request) {
	if h.requireAccount(w, r) == nil {
		return
	}

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
	visitor := h.requireAccount(w, r)
	if visitor == nil {
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

	description := strings.TrimSpace(req.Description)
	if utf8.RuneCountInString(description) > maxTaskDescriptionRunes {
		http.Error(w, "описание: до 4000 символов", http.StatusBadRequest)
		return
	}

	tags, err := normalizeTaskTags(req.Tags)
	if err != nil {
		http.Error(w, "неверный тег", http.StatusBadRequest)
		return
	}

	task, err := h.repo.CreateTask(visitor.ID, title, priority, description, tags)
	if err != nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"task": taskToJSON(*task)})
}

func (h *DocsPortalHandler) UpdateTask(w http.ResponseWriter, r *http.Request) {
	if h.requireAccount(w, r) == nil {
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

	if req.Title == nil && req.Status == nil && req.Priority == nil && req.Description == nil && req.Tags == nil {
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

	if req.Description != nil {
		description := strings.TrimSpace(*req.Description)
		if utf8.RuneCountInString(description) > maxTaskDescriptionRunes {
			http.Error(w, "описание: до 4000 символов", http.StatusBadRequest)
			return
		}
		req.Description = &description
	}

	var tags *[]string
	if req.Tags != nil {
		normalized, err := normalizeTaskTags(*req.Tags)
		if err != nil {
			http.Error(w, "неверный тег", http.StatusBadRequest)
			return
		}
		tags = &normalized
	}

	task, err := h.repo.UpdateTask(id, req.Title, req.Status, req.Priority, req.Description, tags)
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
	if h.requireAccount(w, r) == nil {
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
	tags := t.Tags
	if tags == nil {
		tags = []string{}
	}
	return map[string]any{
		"id":           t.ID,
		"title":        t.Title,
		"description":  t.Description,
		"tags":         tags,
		"status":       t.Status,
		"priority":     t.Priority,
		"position":     t.Position,
		"display_name": t.DisplayName,
		"created_at":   t.CreatedAt.UTC().Format(time.RFC3339),
		"updated_at":   t.UpdatedAt.UTC().Format(time.RFC3339),
	}
}

func normalizeTaskTags(in []string) ([]string, error) {
	seen := make(map[string]struct{}, len(in))
	out := make([]string, 0, len(in))
	for _, raw := range in {
		tag := strings.TrimSpace(raw)
		if tag == "" {
			continue
		}
		if _, ok := allowedTaskTags[tag]; !ok {
			return nil, errors.New("invalid tag")
		}
		if _, dup := seen[tag]; dup {
			continue
		}
		seen[tag] = struct{}{}
		out = append(out, tag)
	}
	return out, nil
}

func (h *DocsPortalHandler) issueDocsTokenPair(visitorID int64, displayName string) (access, refresh string, err error) {
	now := time.Now()
	accessTok := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":  visitorID,
		"typ":  "docs_access",
		"name": displayName,
		"iat":  now.Unix(),
		"exp":  now.Add(docsAccessTokenTTL).Unix(),
	})
	access, err = accessTok.SignedString([]byte(h.secret))
	if err != nil {
		return "", "", err
	}
	refreshTok := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub": visitorID,
		"typ": "docs_refresh",
		"iat": now.Unix(),
		"exp": now.Add(docsRefreshTokenTTL).Unix(),
	})
	refresh, err = refreshTok.SignedString([]byte(h.secret))
	if err != nil {
		return "", "", err
	}
	return access, refresh, nil
}

func isAllowedDocSlug(slug string) bool {
	_, ok := allowedDocSlugs[slug]
	return ok
}
