package repository

import "strconv"

// SeedWeeklyFromService создаёт шаблон Пн–Сб, если правил ещё нет (при создании услуги).
func (r *BookingRepository) SeedWeeklyFromService(clinicID, serviceTypeID, maxPerDay int) error {
	if maxPerDay < 1 {
		return nil
	}
	existing, err := r.GetWeeklyRules(clinicID, serviceTypeID)
	if err != nil {
		return err
	}
	if len(existing) > 0 {
		return nil
	}
	svc, err := r.GetServiceTypeByID(clinicID, strconv.Itoa(serviceTypeID))
	if err != nil || svc == nil {
		return err
	}

	slotMode := "day_capacity"
	if svc.ScheduleStyle == "time_slots" {
		slotMode = "fixed_times"
	}

	intakeFrom := "09:00"
	intakeTo := "18:00"
	pickupAfter := "17:00"
	dropoffFrom := "12:00"
	dropoffTo := "13:00"

	for _, dow := range []int{1, 2, 3, 4, 5, 6} {
		input := BookingWeeklyRuleInput{
			DayOfWeek: dow,
			MaxPerDay: maxPerDay,
			SlotMode:  slotMode,
		}
		switch svc.ScheduleStyle {
		case "dropoff":
			input.IntakeFrom = &dropoffFrom
			input.IntakeTo = &dropoffTo
			input.PickupAfter = &pickupAfter
		case "time_slots":
			input.IntakeFrom = &intakeFrom
			input.IntakeTo = &intakeTo
		default:
			input.IntakeFrom = nil
			input.IntakeTo = nil
			input.PickupAfter = nil
		}
		if _, err := r.UpsertWeeklyRule(clinicID, serviceTypeID, input); err != nil {
			return err
		}
	}
	return nil
}
