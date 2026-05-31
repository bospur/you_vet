package handler_test

import (
	"bytes"
	"testing"

	"go-server/internal/handler"
)

func TestReadAndValidateImage_JPEG(t *testing.T) {
	data := []byte{0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 'J', 'F', 'I', 'F', 0x00}
	got, ext, err := handler.ReadAndValidateImage(bytes.NewReader(data), "photo.jpg")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ext != ".jpg" {
		t.Fatalf("expected .jpg, got %s", ext)
	}
	if len(got) != len(data) {
		t.Fatalf("expected %d bytes, got %d", len(data), len(got))
	}
}

func TestReadAndValidateImage_RejectsExecutable(t *testing.T) {
	data := []byte("#!/bin/bash\necho hi")
	_, _, err := handler.ReadAndValidateImage(bytes.NewReader(data), "photo.jpg")
	if err == nil {
		t.Fatal("expected error for non-image content")
	}
}

func TestReadAndValidateImage_RejectsTooLarge(t *testing.T) {
	data := make([]byte, 5<<20+1)
	data[0] = 0xFF
	data[1] = 0xD8
	data[2] = 0xFF
	_, _, err := handler.ReadAndValidateImage(bytes.NewReader(data), "photo.jpg")
	if err == nil {
		t.Fatal("expected error for oversized file")
	}
}

func TestReadAndValidateImage_RejectsMismatchedExtension(t *testing.T) {
	png := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	_, _, err := handler.ReadAndValidateImage(bytes.NewReader(png), "photo.exe")
	if err == nil {
		t.Fatal("expected error for mismatched extension")
	}
}

func TestReadAndValidateImage_Empty(t *testing.T) {
	_, _, err := handler.ReadAndValidateImage(bytes.NewReader(nil), "photo.jpg")
	if err == nil {
		t.Fatal("expected error for empty file")
	}
}
