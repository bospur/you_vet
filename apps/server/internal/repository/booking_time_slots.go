package repository

import (
	"database/sql"
	"fmt"
	"strconv"
)

func parseClock(s string) (hour, min int, ok bool) {
	if len(s) >= 5 {
		s = s[:5]
	}
	var h, m int
	_, err := fmt.Sscanf(s, "%d:%d", &h, &m)
	if err != nil {
		return 0, 0, false
	}
	return h, m, true
}

func formatClock(hour, min int) string {
	return fmt.Sprintf("%02d:%02d", hour, min)
}

func generateSlotTimes(from, to string, durationMin int) []string {
	if durationMin < 1 {
		durationMin = 30
	}
	h1, m1, ok1 := parseClock(from)
	h2, m2, ok2 := parseClock(to)
	if !ok1 || !ok2 {
		return nil
	}
	start := h1*60 + m1
	end := h2*60 + m2
	if end <= start {
		return nil
	}
	var slots []string
	for t := start; t+durationMin <= end; t += durationMin {
		slots = append(slots, formatClock(t/60, t%60))
	}
	return slots
}

func normalizeSlotKey(t string) string {
	if len(t) >= 5 {
		return t[:5]
	}
	return t
}

func (r *BookingRepository) loadBookedSlotCounts(
	clinicID, serviceTypeID int,
	fromStr, toStr string,
) (map[string]map[string]int, error) {
	svc, err := r.GetServiceTypeByID(clinicID, strconv.Itoa(serviceTypeID))
	if err != nil || svc == nil {
		return nil, err
	}
	target := bookingTargetFromService(svc)

	result := make(map[string]map[string]int)
	var rows *sql.Rows

	if target.capacityGroup != nil {
		rows, err = r.db.Query(`
			SELECT br.requested_date::text, COALESCE(br.slot_time::text, ''), COUNT(*)
			FROM booking_requests br
			JOIN booking_service_types st ON st.id = br.service_type_id
			WHERE br.clinic_id = $1
			  AND br.requested_date >= $2::date AND br.requested_date <= $3::date
			  AND br.status IN ('pending', 'confirmed')
			  AND st.capacity_group = $4
			GROUP BY br.requested_date, br.slot_time
		`, clinicID, fromStr, toStr, *target.capacityGroup)
	} else {
		rows, err = r.db.Query(`
			SELECT requested_date::text, COALESCE(slot_time::text, ''), COUNT(*)
			FROM booking_requests
			WHERE clinic_id = $1
			  AND service_type_id = $2
			  AND requested_date >= $3::date AND requested_date <= $4::date
			  AND status IN ('pending', 'confirmed')
			GROUP BY requested_date, slot_time
		`, clinicID, *target.serviceTypeID, fromStr, toStr)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var date, slotTime string
		var n int
		if err := rows.Scan(&date, &slotTime, &n); err != nil {
			return nil, err
		}
		if result[date] == nil {
			result[date] = make(map[string]int)
		}
		result[date][normalizeSlotKey(slotTime)] = n
	}
	return result, rows.Err()
}

func buildTimeSlotsForDay(sched daySchedule, durationMin int, booked map[string]int) []BookingTimeSlot {
	if sched.slotMode != "fixed_times" || sched.intakeFrom == nil || sched.intakeTo == nil {
		return nil
	}
	times := generateSlotTimes(*sched.intakeFrom, *sched.intakeTo, durationMin)
	out := make([]BookingTimeSlot, 0, len(times))
	for _, t := range times {
		b := booked[t]
		max := 1
		rem := max - b
		if rem < 0 {
			rem = 0
		}
		out = append(out, BookingTimeSlot{
			Time:        t,
			BookedSlots: b,
			MaxSlots:    max,
			Remaining:   rem,
		})
	}
	return out
}
