package repository

import (
	"encoding/json"
	"errors"
	"strings"
)

const defaultMaxActivePerUserPerDay = 5

var (
	ErrBookingDuplicatePet      = errors.New("duplicate_pet")
	ErrBookingDuplicateSlot     = errors.New("duplicate_slot")
	ErrBookingLimitPerService   = errors.New("limit_per_service")
	ErrBookingLimitPerDay       = errors.New("limit_per_day")
)

func defaultMaxPerServiceDate(scheduleStyle string) int {
	if scheduleStyle == "time_slots" {
		return 1
	}
	return 2
}

func resolveBookingLimits(rules json.RawMessage, scheduleStyle string) (perServiceDate, perDay int) {
	perServiceDate = defaultMaxPerServiceDate(scheduleStyle)
	perDay = defaultMaxActivePerUserPerDay
	if len(rules) == 0 || !json.Valid(rules) {
		return
	}
	var parsed struct {
		Limits *struct {
			MaxActivePerUserPerDate *int `json:"max_active_per_user_per_date"`
			MaxActivePerUserPerDay  *int `json:"max_active_per_user_per_day"`
		} `json:"limits"`
	}
	if json.Unmarshal(rules, &parsed) != nil || parsed.Limits == nil {
		return
	}
	if parsed.Limits.MaxActivePerUserPerDate != nil && *parsed.Limits.MaxActivePerUserPerDate > 0 {
		perServiceDate = *parsed.Limits.MaxActivePerUserPerDate
	}
	if parsed.Limits.MaxActivePerUserPerDay != nil && *parsed.Limits.MaxActivePerUserPerDay > 0 {
		perDay = *parsed.Limits.MaxActivePerUserPerDay
	}
	return
}

func normalizePetName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}
