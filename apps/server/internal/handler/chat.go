package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

type ChatNotifier interface {
	NotifyChatMessage(clinicID int, kind, preview, authorName string, clientTelegramID int64, fromStaff bool)
}

type ChatHandler struct {
	chatRepo   *repository.ChatRepository
	notifier   ChatNotifier
	uploadsDir string
}

func NewChatHandler(chatRepo *repository.ChatRepository, notifier ChatNotifier, uploadsDir string) *ChatHandler {
	return &ChatHandler{chatRepo: chatRepo, notifier: notifier, uploadsDir: uploadsDir}
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
	var body struct {
		DoctorID *int `json:"doctor_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}
	room, created, err := h.chatRepo.GetOrCreateConsult(claims.ClinicID, claims.MobileUserID, body.DoctorID)
	if err != nil {
		if errors.Is(err, repository.ErrChatDoctor) {
			http.Error(w, "врач не найден", http.StatusNotFound)
			return
		}
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
	text, imageURL, ok := h.readChatPost(w, r, claims.MobileUserID)
	if !ok {
		return
	}
	msg, err := h.chatRepo.PostMessage(room, claims.MobileUserID, claims.AppRole, text, imageURL)
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
		if preview == "" && msg.ImageURL != "" {
			preview = "Фото"
		} else if msg.ImageURL != "" {
			preview = "Фото: " + preview
		}
		if len([]rune(preview)) > 200 {
			preview = string([]rune(preview)[:200]) + "…"
		}
		go h.notifier.NotifyChatMessage(claims.ClinicID, room.Kind, preview, msg.AuthorName, clientTg, fromStaff)
	}
	writeJSON(w, http.StatusCreated, msg)
}

func (h *ChatHandler) readChatPost(w http.ResponseWriter, r *http.Request, userID int64) (body, imageURL string, ok bool) {
	ct := r.Header.Get("Content-Type")
	if strings.HasPrefix(ct, "multipart/form-data") {
		if err := r.ParseMultipartForm(5 << 20); err != nil {
			http.Error(w, "файл слишком большой (макс 5 МБ)", http.StatusBadRequest)
			return "", "", false
		}
		body = r.FormValue("body")
		file, header, err := r.FormFile("photo")
		if err != nil {
			if errors.Is(err, http.ErrMissingFile) {
				return body, "", true
			}
			http.Error(w, "не удалось прочитать файл", http.StatusBadRequest)
			return "", "", false
		}
		defer file.Close()
		data, ext, err := ReadAndValidateImage(file, header.Filename)
		if err != nil {
			msg, status := imageUploadError(err)
			http.Error(w, msg, status)
			return "", "", false
		}
		if h.uploadsDir == "" {
			http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
			return "", "", false
		}
		filename := fmt.Sprintf("chat_%d_%d%s", userID, time.Now().UnixMilli(), ext)
		if err := os.WriteFile(filepath.Join(h.uploadsDir, filename), data, 0644); err != nil {
			log.Printf("chat photo write: %v", err)
			http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
			return "", "", false
		}
		return body, "/uploads/" + filename, true
	}

	var payload chatPostBody
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil && !errors.Is(err, io.EOF) {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return "", "", false
	}
	return payload.Body, "", true
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
