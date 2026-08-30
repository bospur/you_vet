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

type ChatNotifier interface {
	NotifyChatMessage(clinicID int, kind, preview, authorName string, clientTelegramID int64, fromStaff bool)
}

type ChatHandler struct {
	chatRepo *repository.ChatRepository
	notifier ChatNotifier
}

func NewChatHandler(chatRepo *repository.ChatRepository, notifier ChatNotifier) *ChatHandler {
	return &ChatHandler{chatRepo: chatRepo, notifier: notifier}
}

func chatClaims(w http.ResponseWriter, r *http.Request) *middleware.MobileClaims {
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil || claims.MobileUserID <= 0 {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return nil
	}
	return claims
}

// ListRooms — GET /api/mobile/v1/chats
func (h *ChatHandler) ListRooms(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	rooms, err := h.chatRepo.ListRooms(claims.ClinicID, claims.MobileUserID, claims.AppRole)
	if err != nil {
		log.Printf("chat list: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, rooms)
}

// OpenConsult — POST /api/mobile/v1/chats/consult
func (h *ChatHandler) OpenConsult(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	if repository.IsStaffAppRole(claims.AppRole) {
		http.Error(w, "тред создаёт клиент", http.StatusForbidden)
		return
	}
	room, created, err := h.chatRepo.GetOrCreateConsult(claims.ClinicID, claims.MobileUserID)
	if err != nil {
		log.Printf("chat consult: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if created {
		writeJSON(w, http.StatusCreated, room)
		return
	}
	writeJSON(w, http.StatusOK, room)
}

// ListMessages — GET /api/mobile/v1/chats/{id}/messages
func (h *ChatHandler) ListMessages(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	roomID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || roomID <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}
	room, err := h.chatRepo.GetRoom(claims.ClinicID, roomID)
	if err != nil {
		log.Printf("chat get room: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if room == nil || !h.chatRepo.CanAccess(room, claims.MobileUserID, claims.AppRole) {
		http.Error(w, "чат не найден", http.StatusNotFound)
		return
	}
	var afterID int64
	if v := r.URL.Query().Get("after_id"); v != "" {
		afterID, _ = strconv.ParseInt(v, 10, 64)
	}
	msgs, err := h.chatRepo.ListMessages(room.ID, afterID, 50)
	if err != nil {
		log.Printf("chat messages: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if msgs == nil {
		msgs = []repository.ChatMessage{}
	}
	h.chatRepo.MarkRead(room.ID, claims.MobileUserID)
	writeJSON(w, http.StatusOK, msgs)
}

type chatPostBody struct {
	Body string `json:"body"`
}

func (h *ChatHandler) postToRoom(w http.ResponseWriter, r *http.Request, room *repository.ChatRoom, claims *middleware.MobileClaims) {
	var body chatPostBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	msg, err := h.chatRepo.PostMessage(room, claims.MobileUserID, claims.AppRole, body.Body)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrChatEmpty):
			http.Error(w, "сообщение слишком короткое или длинное", http.StatusBadRequest)
		case errors.Is(err, repository.ErrChatLimit):
			http.Error(w, repository.ChatLimitMessage(room.Kind), http.StatusTooManyRequests)
		case errors.Is(err, repository.ErrChatClosed):
			http.Error(w, "чат закрыт", http.StatusBadRequest)
		default:
			log.Printf("chat post: %v", err)
			http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		}
		return
	}
	msg.AuthorName = h.chatRepo.DisplayName(claims.MobileUserID)
	if h.notifier != nil && room.Kind == repository.ChatKindConsult {
		fromStaff := repository.IsStaffAppRole(claims.AppRole)
		var clientTg int64
		if room.CreatedBy != nil {
			clientTg = h.chatRepo.TelegramID(*room.CreatedBy)
		}
		preview := strings.TrimSpace(msg.Body)
		if len([]rune(preview)) > 200 {
			preview = string([]rune(preview)[:200]) + "…"
		}
		go h.notifier.NotifyChatMessage(claims.ClinicID, room.Kind, preview, msg.AuthorName, clientTg, fromStaff)
	}
	writeJSON(w, http.StatusCreated, msg)
}

// PostWall — POST /api/mobile/v1/chats/wall/messages
func (h *ChatHandler) PostWall(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	room, err := h.chatRepo.EnsureWall(claims.ClinicID)
	if err != nil {
		log.Printf("chat wall: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	h.postToRoom(w, r, room, claims)
}

// PostMessage — POST /api/mobile/v1/chats/{id}/messages
func (h *ChatHandler) PostMessage(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	roomID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil || roomID <= 0 {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}
	room, err := h.chatRepo.GetRoom(claims.ClinicID, roomID)
	if err != nil {
		log.Printf("chat get room: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if room == nil || !h.chatRepo.CanAccess(room, claims.MobileUserID, claims.AppRole) {
		http.Error(w, "чат не найден", http.StatusNotFound)
		return
	}
	h.postToRoom(w, r, room, claims)
}

// HideMessage — POST /api/mobile/v1/chats/{id}/messages/{mid}/hide
func (h *ChatHandler) HideMessage(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	if !repository.IsStaffAppRole(claims.AppRole) {
		http.Error(w, "недостаточно прав", http.StatusForbidden)
		return
	}
	roomID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}
	mid, err := strconv.ParseInt(r.PathValue("mid"), 10, 64)
	if err != nil {
		http.Error(w, "неверный id сообщения", http.StatusBadRequest)
		return
	}
	if err := h.chatRepo.HideMessage(claims.ClinicID, roomID, mid); err != nil {
		http.Error(w, "сообщение не найдено", http.StatusNotFound)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

type chatPatchBody struct {
	Status string `json:"status"`
}

// PatchRoom — PATCH /api/mobile/v1/chats/{id}
func (h *ChatHandler) PatchRoom(w http.ResponseWriter, r *http.Request) {
	claims := chatClaims(w, r)
	if claims == nil {
		return
	}
	if !repository.IsMedicalStaff(claims.AppRole) {
		http.Error(w, "недостаточно прав", http.StatusForbidden)
		return
	}
	roomID, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.Error(w, "неверный id", http.StatusBadRequest)
		return
	}
	var body chatPatchBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	if body.Status != repository.ChatStatusClosed {
		http.Error(w, "можно только закрыть тред", http.StatusBadRequest)
		return
	}
	room, err := h.chatRepo.CloseConsult(claims.ClinicID, roomID)
	if err != nil || room == nil {
		http.Error(w, "чат не найден", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, room)
}
