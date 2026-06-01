package repository

import "strings"

// applyTimeSlotsScheduleStyle — услуга с выбором времени всегда использует fixed_times + окно приёма.
func applyTimeSlotsScheduleStyle(style string, sched *daySchedule) {
	if style != "time_slots" || sched == nil {
		return
	}
	sched.slotMode = "fixed_times"
	defaultFrom := "09:00"
	defaultTo := "18:00"
	if sched.intakeFrom == nil || strings.TrimSpace(*sched.intakeFrom) == "" {
		sched.intakeFrom = &defaultFrom
	}
	if sched.intakeTo == nil || strings.TrimSpace(*sched.intakeTo) == "" {
		sched.intakeTo = &defaultTo
	}
}
