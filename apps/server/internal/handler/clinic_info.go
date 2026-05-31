package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"go-server/internal/middleware"
	"go-server/internal/repository"
)

type ClinicInfoHandler struct {
	repo       *repository.ClinicInfoRepository
	uploadsDir string
}

func NewClinicInfoHandler(repo *repository.ClinicInfoRepository, uploadsDir string) *ClinicInfoHandler {
	return &ClinicInfoHandler{repo: repo, uploadsDir: uploadsDir}
}

// GetPublicClinicInfo обрабатывает GET /api/clinics/{clinicSlug}/clinic-info
func (h *ClinicInfoHandler) GetPublicClinicInfo(w http.ResponseWriter, r *http.Request) {
	clinicSlug := r.PathValue("clinicSlug")

	info, err := h.repo.GetByClinicSlug(clinicSlug)
	if err != nil {
		log.Printf("ошибка получения info клиники: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, info)
}

// GetClinicInfo обрабатывает GET /api/admin/clinic-info
func (h *ClinicInfoHandler) GetClinicInfo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	info, err := h.repo.GetByClinicID(claims.ClinicID)
	if err != nil {
		log.Printf("ошибка получения info клиники: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, info)
}

// UpdateClinicInfo обрабатывает PUT /api/admin/clinic-info
func (h *ClinicInfoHandler) UpdateClinicInfo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)

	var input repository.ClinicInfoInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "неверный формат запроса", http.StatusBadRequest)
		return
	}

	info, err := h.repo.Upsert(claims.ClinicID, input)
	if err != nil {
		log.Printf("ошибка обновления info клиники: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, info)
}

// UploadLogo обрабатывает POST /api/admin/clinic-info/logo
func (h *ClinicInfoHandler) UploadLogo(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	h.uploadImage(w, r, claims.ClinicID, "logo", h.repo.UpdateLogoURL)
}

// UploadBanner обрабатывает POST /api/admin/clinic-info/banner
func (h *ClinicInfoHandler) UploadBanner(w http.ResponseWriter, r *http.Request) {
	claims := middleware.ClaimsFromContext(r)
	h.uploadImage(w, r, claims.ClinicID, "banner", h.repo.UpdateBannerURL)
}

func (h *ClinicInfoHandler) uploadImage(
	w http.ResponseWriter,
	r *http.Request,
	clinicID int,
	kind string,
	updateFn func(int, string) (*repository.ClinicInfo, error),
) {
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		http.Error(w, "файл слишком большой (макс 5 МБ)", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("image")
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

	filename := fmt.Sprintf("clinic_%d_%s_%d%s", clinicID, kind, time.Now().UnixMilli(), ext)
	dstPath := filepath.Join(h.uploadsDir, filename)

	if err := os.WriteFile(dstPath, data, 0644); err != nil {
		log.Printf("ошибка записи файла: %v", err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	imageURL := "/uploads/" + filename
	info, err := updateFn(clinicID, imageURL)
	if err != nil {
		log.Printf("ошибка обновления url %s: %v", kind, err)
		http.Error(w, "внутренняя ошибка сервера", http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, info)
}
