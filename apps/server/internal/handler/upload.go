package handler

import (
	"errors"
	"fmt"
	"io"
	"mime"
	"net/http"
	"path/filepath"
	"strings"
)

const maxImageUploadSize = 5 << 20 // 5 MB

var allowedImageMIMEs = map[string][]string{
	"image/jpeg": {".jpg", ".jpeg"},
	"image/png":  {".png"},
	"image/webp": {".webp"},
}

var (
	errImageTooLarge   = errors.New("image too large")
	errInvalidImage    = errors.New("invalid image")
	errUnsupportedMIME = errors.New("unsupported mime type")
)

func ReadAndValidateImage(file io.Reader, filename string) (data []byte, ext string, err error) {
	limited := io.LimitReader(file, maxImageUploadSize+1)
	data, err = io.ReadAll(limited)
	if err != nil {
		return nil, "", fmt.Errorf("read image: %w", err)
	}
	if len(data) > maxImageUploadSize {
		return nil, "", errImageTooLarge
	}
	if len(data) == 0 {
		return nil, "", errInvalidImage
	}

	sniff := data
	if len(sniff) > 512 {
		sniff = sniff[:512]
	}

	mimeType := http.DetectContentType(sniff)
	mimeType, _, err = mime.ParseMediaType(mimeType)
	if err != nil {
		return nil, "", errInvalidImage
	}

	allowedExts, ok := allowedImageMIMEs[mimeType]
	if !ok {
		return nil, "", errUnsupportedMIME
	}

	nameExt := strings.ToLower(filepath.Ext(filename))
	if nameExt != "" && !containsExt(allowedExts, nameExt) {
		return nil, "", errUnsupportedMIME
	}

	ext = allowedExts[0]
	if nameExt != "" && containsExt(allowedExts, nameExt) {
		ext = nameExt
	}

	return data, ext, nil
}

func containsExt(exts []string, ext string) bool {
	for _, e := range exts {
		if e == ext {
			return true
		}
	}
	return false
}

func imageUploadError(err error) (message string, status int) {
	switch {
	case errors.Is(err, errImageTooLarge):
		return "файл слишком большой (макс 5 МБ)", http.StatusBadRequest
	case errors.Is(err, errUnsupportedMIME), errors.Is(err, errInvalidImage):
		return "допустимые форматы: jpg, png, webp", http.StatusBadRequest
	default:
		return "внутренняя ошибка сервера", http.StatusInternalServerError
	}
}
