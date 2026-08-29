package handler

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

type mobileProfileResponse struct {
	ID             int64   `json:"id"`
	DisplayName    string  `json:"display_name"`
	Phone          string  `json:"phone"`
	Email          string  `json:"email,omitempty"`
	PhotoURL       string  `json:"photo_url"`
	TelegramUserID *int64  `json:"telegram_user_id,omitempty"`
	VkUserID       *int64  `json:"vk_user_id,omitempty"`
	LinkedAt       *string `json:"linked_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
}

func mobileUserToProfile(u *repository.MobileUser) mobileProfileResponse {
	p := mobileProfileResponse{
		ID:        u.ID,
		Phone:     u.Phone,
		Email:     u.Email,
		PhotoURL:  u.PhotoURL,
		CreatedAt: u.CreatedAt.Format(time.RFC3339),
	}
	if u.DisplayName.Valid {
		p.DisplayName = u.DisplayName.String
	}
	if u.TelegramUserID.Valid {
		v := u.TelegramUserID.Int64
		p.TelegramUserID = &v
	}
	if u.VkUserID.Valid {
		v := u.VkUserID.Int64
		p.VkUserID = &v
	}
	if u.LinkedAt.Valid {
		s := u.LinkedAt.Time.Format(time.RFC3339)
		p.LinkedAt = &s
	}
	return p
}

// GetProfile — GET /api/mobile/v1/profile
func (h *MobileAuthHandler) GetProfile(w http.ResponseWriter, r *http.Request) {
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil || claims.MobileUserID <= 0 {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	user, err := h.repo.GetByID(claims.MobileUserID)
	if err != nil {
		log.Printf("mobile profile get: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	if user == nil {
		http.Error(w, "сессия недействительна", http.StatusUnauthorized)
		return
	}

	writeJSON(w, http.StatusOK, mobileUserToProfile(user))
}

type updateProfileBody struct {
	DisplayName string `json:"display_name"`
}

// UpdateProfile — PATCH /api/mobile/v1/profile
func (h *MobileAuthHandler) UpdateProfile(w http.ResponseWriter, r *http.Request) {
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil || claims.MobileUserID <= 0 {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	var body updateProfileBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	name := strings.TrimSpace(body.DisplayName)
	if len([]rune(name)) < 1 || len([]rune(name)) > 100 {
		http.Error(w, "Имя: от 1 до 100 символов", http.StatusBadRequest)
		return
	}

	if err := h.repo.UpdateDisplayName(claims.MobileUserID, name); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "сессия недействительна", http.StatusUnauthorized)
			return
		}
		log.Printf("mobile profile update: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	user, err := h.repo.GetByID(claims.MobileUserID)
	if err != nil || user == nil {
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	tokens, err := h.issueTokenPair(user)
	if err != nil {
		log.Printf("mobile profile reissue tokens: %v", err)
		writeJSON(w, http.StatusOK, mobileUserToProfile(user))
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"profile": mobileUserToProfile(user),
		"tokens":  tokens,
	})
}

// UploadProfilePhoto — POST /api/mobile/v1/profile/photo
func (h *MobileAuthHandler) UploadProfilePhoto(w http.ResponseWriter, r *http.Request) {
	claims := middleware.MobileClaimsFromContext(r)
	if claims == nil || claims.MobileUserID <= 0 {
		http.Error(w, "требуется авторизация", http.StatusUnauthorized)
		return
	}

	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "файл слишком большой (макс 5 МБ)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("photo")
	if err != nil {
		http.Error(w, "файл не найден в запросе", http.StatusBadRequest)
		return
	}
	defer file.Close()

	data, ext, err := ReadAndValidateImage(file, header.Filename)
	if err != nil {
		msg, status := imageUploadError(err)
		http.Error(w, msg, status)
		return
	}

	filename := fmt.Sprintf("mobile_%d_%d%s", claims.MobileUserID, time.Now().UnixMilli(), ext)
	dstPath := filepath.Join(h.uploadsDir, filename)

	if err := os.WriteFile(dstPath, data, 0644); err != nil {
		log.Printf("mobile profile photo write: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	photoURL := "/uploads/" + filename
	if err := h.repo.UpdatePhotoURL(claims.MobileUserID, photoURL); err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "сессия недействительна", http.StatusUnauthorized)
			return
		}
		log.Printf("mobile profile photo db: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	user, err := h.repo.GetByID(claims.MobileUserID)
	if err != nil || user == nil {
		writeJSON(w, http.StatusOK, map[string]string{"photo_url": photoURL})
		return
	}

	writeJSON(w, http.StatusOK, mobileUserToProfile(user))
}
