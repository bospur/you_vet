package handler

import (
	"encoding/json"
	"net/http"
	"strings"
	"time"
	"unicode/utf8"

	"go-server/internal/middleware"
	"go-server/internal/repository"

	"github.com/golang-jwt/jwt/v5"
)

const docsTokenTTL = 365 * 24 * time.Hour

var allowedDocSlugs = map[string]struct{}{
	"project-for-devs":      {},
	"roadmap":               {},
	"rustore-app":           {},
	"mobile":                {},
	"booking-for-clinic":    {},
	"phase-5-appointments":  {},
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
		out = append(out, map[string]any{
			"id":           c.ID,
			"page_slug":    c.PageSlug,
			"body":         c.Body,
			"display_name": c.DisplayName,
			"created_at":   c.CreatedAt.UTC().Format(time.RFC3339),
		})
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
		"comment": map[string]any{
			"id":           comment.ID,
			"page_slug":    comment.PageSlug,
			"body":         comment.Body,
			"display_name": comment.DisplayName,
			"created_at":   comment.CreatedAt.UTC().Format(time.RFC3339),
		},
	})
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
