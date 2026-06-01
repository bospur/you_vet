package repository

import (
	"database/sql"
	"errors"
	"strconv"
	"time"

	"github.com/lib/pq"
)

// BookingSettings — настройки записи на клинику
type BookingSettings struct {
	ClinicID     int    `json:"clinic_id"`
	HorizonWeeks int    `json:"horizon_weeks"`
	StaffChatID  *int64 `json:"staff_chat_id"`
}

// BookingWeeklyRule — шаблон дня недели
type BookingWeeklyRule struct {
	ID            int     `json:"id"`
	ClinicID      int     `json:"clinic_id"`
	ServiceTypeID *int    `json:"service_type_id"`
	CapacityGroup *string `json:"capacity_group"`
	DayOfWeek     int     `json:"day_of_week"`
	IntakeFrom    *string `json:"intake_from"`
	IntakeTo      *string `json:"intake_to"`
	PickupAfter   *string `json:"pickup_after"`
	MaxPerDay     int     `json:"max_per_day"`
	SlotMode      string  `json:"slot_mode"`
	ValidFrom     *string `json:"valid_from"`
	ValidTo       *string `json:"valid_to"`
}

// BookingWeeklyRuleInput — upsert шаблона
type BookingWeeklyRuleInput struct {
	DayOfWeek   int     `json:"day_of_week"`
	IntakeFrom  *string `json:"intake_from"`
	IntakeTo    *string `json:"intake_to"`
	PickupAfter *string `json:"pickup_after"`
	MaxPerDay   int     `json:"max_per_day"`
	SlotMode    string  `json:"slot_mode"`
	ValidFrom   *string `json:"valid_from"`
	ValidTo     *string `json:"valid_to"`
}

// BookingAvailabilityWindow — разовое окно
type BookingAvailabilityWindow struct {
	ID            int     `json:"id"`
	ClinicID      int     `json:"clinic_id"`
	ServiceTypeID *int    `json:"service_type_id"`
	CapacityGroup *string `json:"capacity_group"`
	DateFrom      string  `json:"date_from"`
	DateTo        string  `json:"date_to"`
	DaysOfWeek    []int   `json:"days_of_week"`
	MaxPerDay     int     `json:"max_per_day"`
	IntakeFrom    *string `json:"intake_from"`
	IntakeTo      *string `json:"intake_to"`
	PickupAfter   *string `json:"pickup_after"`
}

// BookingWindowInput — создание/обновление окна
type BookingWindowInput struct {
	DateFrom    string  `json:"date_from"`
	DateTo      string  `json:"date_to"`
	DaysOfWeek  []int   `json:"days_of_week"`
	MaxPerDay   int     `json:"max_per_day"`
	IntakeFrom  *string `json:"intake_from"`
	IntakeTo    *string `json:"intake_to"`
	PickupAfter *string `json:"pickup_after"`
}

// BookingDayOverride — ручная правка дня
type BookingDayOverride struct {
	ID            int     `json:"id"`
	ClinicID      int     `json:"clinic_id"`
	ServiceTypeID *int    `json:"service_type_id"`
	CapacityGroup *string `json:"capacity_group"`
	Date          string  `json:"date"`
	MaxPerDay     *int    `json:"max_per_day"`
	IsClosed      bool    `json:"is_closed"`
}

// BookingDayOverrideInput — upsert override
type BookingDayOverrideInput struct {
	Date      string `json:"date"`
	MaxPerDay *int   `json:"max_per_day"`
	IsClosed  bool   `json:"is_closed"`
}

// BookingDayStaff — врач дня
type BookingDayStaff struct {
	ID            int     `json:"id"`
	ClinicID      int     `json:"clinic_id"`
	ServiceTypeID int     `json:"service_type_id"`
	Date          string  `json:"date"`
	DoctorID      *int    `json:"doctor_id"`
	DoctorName    *string `json:"doctor_name,omitempty"`
}

// BookingDayStaffInput — назначение врача
type BookingDayStaffInput struct {
	Date     string `json:"date"`
	DoctorID *int   `json:"doctor_id"`
}

// BookingAvailabilityDay — ёмкость на дату
type BookingAvailabilityDay struct {
	Date        string             `json:"date"`
	IsOpen      bool               `json:"is_open"`
	MaxSlots    int                `json:"max_slots"`
	BookedSlots int                `json:"booked_slots"`
	Remaining   int                `json:"remaining"`
	IntakeFrom  *string            `json:"intake_from"`
	IntakeTo    *string            `json:"intake_to"`
	PickupAfter *string            `json:"pickup_after"`
	SlotMode    string             `json:"slot_mode"`
	TimeSlots   []BookingTimeSlot  `json:"time_slots,omitempty"`
	Source      string             `json:"source"`
	DoctorID    *int               `json:"doctor_id"`
	DoctorName  *string            `json:"doctor_name"`
}

// BookingTimeSlot — слот времени (fixed_times)
type BookingTimeSlot struct {
	Time        string `json:"time"`
	BookedSlots int    `json:"booked_slots"`
	MaxSlots    int    `json:"max_slots"`
	Remaining   int    `json:"remaining"`
}

// BookingAvailabilityResponse — GET availability
type BookingAvailabilityResponse struct {
	ServiceTypeID int                      `json:"service_type_id"`
	CapacityGroup *string                  `json:"capacity_group"`
	HorizonWeeks  int                      `json:"horizon_weeks"`
	From          string                   `json:"from"`
	To            string                   `json:"to"`
	Days          []BookingAvailabilityDay `json:"days"`
}

type bookingTarget struct {
	serviceTypeID *int
	capacityGroup *string
}

type daySchedule struct {
	max         int
	intakeFrom  *string
	intakeTo    *string
	pickupAfter *string
	slotMode    string
	source      string
}

func bookingTargetFromService(s *BookingServiceType) bookingTarget {
	if s.CapacityGroup != nil && *s.CapacityGroup != "" {
		g := *s.CapacityGroup
		return bookingTarget{capacityGroup: &g}
	}
	id := s.ID
	return bookingTarget{serviceTypeID: &id}
}

func nullTimeStr(n sql.NullString) *string {
	if !n.Valid {
		return nil
	}
	s := n.String
	if len(s) >= 5 {
		s = s[:5]
	}
	return &s
}

func nullDateStr(n sql.NullString) *string {
	if !n.Valid {
		return nil
	}
	return &n.String
}

func (r *BookingRepository) resolveTarget(clinicID, serviceTypeID int) (*BookingServiceType, bookingTarget, error) {
	svc, err := r.GetServiceTypeByID(clinicID, strconv.Itoa(serviceTypeID))
	if err != nil {
		return nil, bookingTarget{}, err
	}
	if svc == nil {
		return nil, bookingTarget{}, ErrBookingNotFound
	}
	return svc, bookingTargetFromService(svc), nil
}

func (r *BookingRepository) GetSettings(clinicID int) (*BookingSettings, error) {
	var s BookingSettings
	var chatID sql.NullInt64
	err := r.db.QueryRow(`
		SELECT clinic_id, horizon_weeks, staff_chat_id
		FROM booking_settings WHERE clinic_id = $1
	`, clinicID).Scan(&s.ClinicID, &s.HorizonWeeks, &chatID)
	if err == sql.ErrNoRows {
		return &BookingSettings{ClinicID: clinicID, HorizonWeeks: 2}, nil
	}
	if err != nil {
		return nil, err
	}
	if chatID.Valid {
		s.StaffChatID = &chatID.Int64
	}
	return &s, nil
}

func (r *BookingRepository) UpdateHorizonWeeks(clinicID, weeks int) (*BookingSettings, error) {
	_, err := r.db.Exec(`
		INSERT INTO booking_settings (clinic_id, horizon_weeks)
		VALUES ($1, $2)
		ON CONFLICT (clinic_id) DO UPDATE SET horizon_weeks = $2, updated_at = NOW()
	`, clinicID, weeks)
	if err != nil {
		return nil, err
	}
	return r.GetSettings(clinicID)
}

func (r *BookingRepository) UpdateStaffChatID(clinicID int, chatID *int64) (*BookingSettings, error) {
	_, err := r.db.Exec(`
		INSERT INTO booking_settings (clinic_id, staff_chat_id)
		VALUES ($1, $2)
		ON CONFLICT (clinic_id) DO UPDATE SET staff_chat_id = $2, updated_at = NOW()
	`, clinicID, chatID)
	if err != nil {
		return nil, err
	}
	return r.GetSettings(clinicID)
}

func scanWeeklyRule(row interface{ Scan(dest ...any) error }) (*BookingWeeklyRule, error) {
	var rule BookingWeeklyRule
	var svcID sql.NullInt64
	var group sql.NullString
	var intakeFrom, intakeTo, pickup, validFrom, validTo sql.NullString
	err := row.Scan(
		&rule.ID, &rule.ClinicID, &svcID, &group, &rule.DayOfWeek,
		&intakeFrom, &intakeTo, &pickup, &rule.MaxPerDay, &rule.SlotMode,
		&validFrom, &validTo,
	)
	if err != nil {
		return nil, err
	}
	if svcID.Valid {
		v := int(svcID.Int64)
		rule.ServiceTypeID = &v
	}
	if group.Valid {
		rule.CapacityGroup = &group.String
	}
	rule.IntakeFrom = nullTimeStr(intakeFrom)
	rule.IntakeTo = nullTimeStr(intakeTo)
	rule.PickupAfter = nullTimeStr(pickup)
	rule.ValidFrom = nullDateStr(validFrom)
	rule.ValidTo = nullDateStr(validTo)
	return &rule, nil
}

func (r *BookingRepository) GetWeeklyRules(clinicID, serviceTypeID int) ([]BookingWeeklyRule, error) {
	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, err
	}
	var rows *sql.Rows
	if t.serviceTypeID != nil {
		rows, err = r.db.Query(`
			SELECT id, clinic_id, service_type_id, capacity_group, day_of_week,
			       intake_from::text, intake_to::text, pickup_after::text,
			       max_per_day, slot_mode, valid_from::text, valid_to::text
			FROM booking_weekly_rules
			WHERE clinic_id = $1 AND service_type_id = $2
			ORDER BY day_of_week
		`, clinicID, *t.serviceTypeID)
	} else {
		rows, err = r.db.Query(`
			SELECT id, clinic_id, service_type_id, capacity_group, day_of_week,
			       intake_from::text, intake_to::text, pickup_after::text,
			       max_per_day, slot_mode, valid_from::text, valid_to::text
			FROM booking_weekly_rules
			WHERE clinic_id = $1 AND capacity_group = $2
			ORDER BY day_of_week
		`, clinicID, *t.capacityGroup)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []BookingWeeklyRule
	for rows.Next() {
		rule, err := scanWeeklyRule(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *rule)
	}
	return list, rows.Err()
}

func (r *BookingRepository) UpsertWeeklyRule(clinicID, serviceTypeID int, input BookingWeeklyRuleInput) (*BookingWeeklyRule, error) {
	svc, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, err
	}
	_ = svc
	slotMode := input.SlotMode
	if slotMode == "" {
		slotMode = "day_capacity"
	}

	var row *sql.Row
	if t.serviceTypeID != nil {
		row = r.db.QueryRow(`
			INSERT INTO booking_weekly_rules (
				clinic_id, service_type_id, day_of_week,
				intake_from, intake_to, pickup_after, max_per_day, slot_mode, valid_from, valid_to
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (clinic_id, service_type_id, day_of_week)
			WHERE service_type_id IS NOT NULL
			DO UPDATE SET
				intake_from = EXCLUDED.intake_from,
				intake_to = EXCLUDED.intake_to,
				pickup_after = EXCLUDED.pickup_after,
				max_per_day = EXCLUDED.max_per_day,
				slot_mode = EXCLUDED.slot_mode,
				valid_from = EXCLUDED.valid_from,
				valid_to = EXCLUDED.valid_to,
				updated_at = NOW()
			RETURNING id, clinic_id, service_type_id, capacity_group, day_of_week,
			          intake_from::text, intake_to::text, pickup_after::text,
			          max_per_day, slot_mode, valid_from::text, valid_to::text
		`, clinicID, *t.serviceTypeID, input.DayOfWeek,
			input.IntakeFrom, input.IntakeTo, input.PickupAfter, input.MaxPerDay, slotMode,
			input.ValidFrom, input.ValidTo)
	} else {
		row = r.db.QueryRow(`
			INSERT INTO booking_weekly_rules (
				clinic_id, capacity_group, day_of_week,
				intake_from, intake_to, pickup_after, max_per_day, slot_mode, valid_from, valid_to
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (clinic_id, capacity_group, day_of_week)
			WHERE capacity_group IS NOT NULL
			DO UPDATE SET
				intake_from = EXCLUDED.intake_from,
				intake_to = EXCLUDED.intake_to,
				pickup_after = EXCLUDED.pickup_after,
				max_per_day = EXCLUDED.max_per_day,
				slot_mode = EXCLUDED.slot_mode,
				valid_from = EXCLUDED.valid_from,
				valid_to = EXCLUDED.valid_to,
				updated_at = NOW()
			RETURNING id, clinic_id, service_type_id, capacity_group, day_of_week,
			          intake_from::text, intake_to::text, pickup_after::text,
			          max_per_day, slot_mode, valid_from::text, valid_to::text
		`, clinicID, *t.capacityGroup, input.DayOfWeek,
			input.IntakeFrom, input.IntakeTo, input.PickupAfter, input.MaxPerDay, slotMode,
			input.ValidFrom, input.ValidTo)
	}
	return scanWeeklyRule(row)
}

func (r *BookingRepository) DeleteWeeklyRule(clinicID, serviceTypeID, dayOfWeek int) error {
	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return err
	}
	var res sql.Result
	if t.serviceTypeID != nil {
		res, err = r.db.Exec(`
			DELETE FROM booking_weekly_rules
			WHERE clinic_id = $1 AND service_type_id = $2 AND day_of_week = $3
		`, clinicID, *t.serviceTypeID, dayOfWeek)
	} else {
		res, err = r.db.Exec(`
			DELETE FROM booking_weekly_rules
			WHERE clinic_id = $1 AND capacity_group = $2 AND day_of_week = $3
		`, clinicID, *t.capacityGroup, dayOfWeek)
	}
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrBookingNotFound
	}
	return nil
}

func scanWindow(row interface{ Scan(dest ...any) error }) (*BookingAvailabilityWindow, error) {
	var w BookingAvailabilityWindow
	var svcID sql.NullInt64
	var group sql.NullString
	var days pq.Int64Array
	var intakeFrom, intakeTo, pickup sql.NullString
	err := row.Scan(
		&w.ID, &w.ClinicID, &svcID, &group,
		&w.DateFrom, &w.DateTo, &days, &w.MaxPerDay,
		&intakeFrom, &intakeTo, &pickup,
	)
	if err != nil {
		return nil, err
	}
	if svcID.Valid {
		v := int(svcID.Int64)
		w.ServiceTypeID = &v
	}
	if group.Valid {
		w.CapacityGroup = &group.String
	}
	for _, d := range days {
		w.DaysOfWeek = append(w.DaysOfWeek, int(d))
	}
	w.IntakeFrom = nullTimeStr(intakeFrom)
	w.IntakeTo = nullTimeStr(intakeTo)
	w.PickupAfter = nullTimeStr(pickup)
	return &w, nil
}

func (r *BookingRepository) GetWindows(clinicID, serviceTypeID int) ([]BookingAvailabilityWindow, error) {
	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, err
	}
	var rows *sql.Rows
	if t.serviceTypeID != nil {
		rows, err = r.db.Query(`
			SELECT id, clinic_id, service_type_id, capacity_group,
			       date_from::text, date_to::text, days_of_week, max_per_day,
			       intake_from::text, intake_to::text, pickup_after::text
			FROM booking_availability_windows
			WHERE clinic_id = $1 AND service_type_id = $2
			ORDER BY date_from DESC
		`, clinicID, *t.serviceTypeID)
	} else {
		rows, err = r.db.Query(`
			SELECT id, clinic_id, service_type_id, capacity_group,
			       date_from::text, date_to::text, days_of_week, max_per_day,
			       intake_from::text, intake_to::text, pickup_after::text
			FROM booking_availability_windows
			WHERE clinic_id = $1 AND capacity_group = $2
			ORDER BY date_from DESC
		`, clinicID, *t.capacityGroup)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []BookingAvailabilityWindow
	for rows.Next() {
		w, err := scanWindow(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *w)
	}
	return list, rows.Err()
}

func (r *BookingRepository) CreateWindow(clinicID, serviceTypeID int, input BookingWindowInput) (*BookingAvailabilityWindow, error) {
	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, err
	}
	dow := pq.Array(input.DaysOfWeek)
	var row *sql.Row
	if t.serviceTypeID != nil {
		row = r.db.QueryRow(`
			INSERT INTO booking_availability_windows (
				clinic_id, service_type_id, date_from, date_to, days_of_week,
				max_per_day, intake_from, intake_to, pickup_after
			) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9)
			RETURNING id, clinic_id, service_type_id, capacity_group,
			          date_from::text, date_to::text, days_of_week, max_per_day,
			          intake_from::text, intake_to::text, pickup_after::text
		`, clinicID, *t.serviceTypeID, input.DateFrom, input.DateTo, dow,
			input.MaxPerDay, input.IntakeFrom, input.IntakeTo, input.PickupAfter)
	} else {
		row = r.db.QueryRow(`
			INSERT INTO booking_availability_windows (
				clinic_id, capacity_group, date_from, date_to, days_of_week,
				max_per_day, intake_from, intake_to, pickup_after
			) VALUES ($1, $2, $3::date, $4::date, $5, $6, $7, $8, $9)
			RETURNING id, clinic_id, service_type_id, capacity_group,
			          date_from::text, date_to::text, days_of_week, max_per_day,
			          intake_from::text, intake_to::text, pickup_after::text
		`, clinicID, *t.capacityGroup, input.DateFrom, input.DateTo, dow,
			input.MaxPerDay, input.IntakeFrom, input.IntakeTo, input.PickupAfter)
	}
	return scanWindow(row)
}

func (r *BookingRepository) DeleteWindow(clinicID int, windowID string) error {
	res, err := r.db.Exec(
		`DELETE FROM booking_availability_windows WHERE id = $1 AND clinic_id = $2`,
		windowID, clinicID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrBookingNotFound
	}
	return nil
}

func (r *BookingRepository) UpsertDayOverride(clinicID, serviceTypeID int, input BookingDayOverrideInput) (*BookingDayOverride, error) {
	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, err
	}
	var row *sql.Row
	if t.serviceTypeID != nil {
		row = r.db.QueryRow(`
			INSERT INTO booking_day_overrides (clinic_id, service_type_id, date, max_per_day, is_closed)
			VALUES ($1, $2, $3::date, $4, $5)
			ON CONFLICT (clinic_id, service_type_id, date) WHERE service_type_id IS NOT NULL
			DO UPDATE SET max_per_day = EXCLUDED.max_per_day, is_closed = EXCLUDED.is_closed, updated_at = NOW()
			RETURNING id, clinic_id, service_type_id, capacity_group, date::text, max_per_day, is_closed
		`, clinicID, *t.serviceTypeID, input.Date, input.MaxPerDay, input.IsClosed)
	} else {
		row = r.db.QueryRow(`
			INSERT INTO booking_day_overrides (clinic_id, capacity_group, date, max_per_day, is_closed)
			VALUES ($1, $2, $3::date, $4, $5)
			ON CONFLICT (clinic_id, capacity_group, date) WHERE capacity_group IS NOT NULL
			DO UPDATE SET max_per_day = EXCLUDED.max_per_day, is_closed = EXCLUDED.is_closed, updated_at = NOW()
			RETURNING id, clinic_id, service_type_id, capacity_group, date::text, max_per_day, is_closed
		`, clinicID, *t.capacityGroup, input.Date, input.MaxPerDay, input.IsClosed)
	}
	var o BookingDayOverride
	var svcID sql.NullInt64
	var group sql.NullString
	var max sql.NullInt64
	err = row.Scan(&o.ID, &o.ClinicID, &svcID, &group, &o.Date, &max, &o.IsClosed)
	if err != nil {
		return nil, err
	}
	if svcID.Valid {
		v := int(svcID.Int64)
		o.ServiceTypeID = &v
	}
	if group.Valid {
		o.CapacityGroup = &group.String
	}
	if max.Valid {
		v := int(max.Int64)
		o.MaxPerDay = &v
	}
	return &o, nil
}

func (r *BookingRepository) DeleteDayOverride(clinicID, serviceTypeID int, date string) error {
	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return err
	}
	var res sql.Result
	if t.serviceTypeID != nil {
		res, err = r.db.Exec(
			`DELETE FROM booking_day_overrides WHERE clinic_id = $1 AND service_type_id = $2 AND date = $3::date`,
			clinicID, *t.serviceTypeID, date,
		)
	} else {
		res, err = r.db.Exec(
			`DELETE FROM booking_day_overrides WHERE clinic_id = $1 AND capacity_group = $2 AND date = $3::date`,
			clinicID, *t.capacityGroup, date,
		)
	}
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrBookingNotFound
	}
	return nil
}

func (r *BookingRepository) UpsertDayStaff(clinicID, serviceTypeID int, input BookingDayStaffInput) (*BookingDayStaff, error) {
	var s BookingDayStaff
	var doctorName sql.NullString
	err := r.db.QueryRow(`
		INSERT INTO booking_day_staff (clinic_id, service_type_id, date, doctor_id)
		VALUES ($1, $2, $3::date, $4)
		ON CONFLICT (clinic_id, service_type_id, date)
		DO UPDATE SET doctor_id = EXCLUDED.doctor_id
		RETURNING id, clinic_id, service_type_id, date::text, doctor_id
	`, clinicID, serviceTypeID, input.Date, input.DoctorID).
		Scan(&s.ID, &s.ClinicID, &s.ServiceTypeID, &s.Date, &s.DoctorID)
	if err != nil {
		return nil, err
	}
	if s.DoctorID != nil {
		_ = r.db.QueryRow(
			`SELECT name FROM doctors WHERE id = $1 AND clinic_id = $2`,
			*s.DoctorID, clinicID,
		).Scan(&doctorName)
		if doctorName.Valid {
			s.DoctorName = &doctorName.String
		}
	}
	return &s, nil
}

func dateValidForRule(d time.Time, validFrom, validTo *string) bool {
	if validFrom != nil && *validFrom != "" {
		f, err := time.Parse("2006-01-02", *validFrom)
		if err == nil && d.Before(f) {
			return false
		}
	}
	if validTo != nil && *validTo != "" {
		t, err := time.Parse("2006-01-02", *validTo)
		if err == nil && d.After(t) {
			return false
		}
	}
	return true
}

func windowMatchesDay(w BookingAvailabilityWindow, d time.Time) bool {
	from, err1 := time.Parse("2006-01-02", w.DateFrom)
	to, err2 := time.Parse("2006-01-02", w.DateTo)
	if err1 != nil || err2 != nil {
		return false
	}
	if d.Before(from) || d.After(to) {
		return false
	}
	if len(w.DaysOfWeek) == 0 {
		return true
	}
	dow := pgDOW(d)
	for _, x := range w.DaysOfWeek {
		if x == dow {
			return true
		}
	}
	return false
}

func pgDOW(t time.Time) int {
	return int(t.Weekday())
}

func (r *BookingRepository) loadScheduleData(clinicID, serviceTypeID int, from, to time.Time) (
	[]BookingWeeklyRule,
	[]BookingAvailabilityWindow,
	map[string]BookingDayOverride,
	map[string]BookingDayStaff,
	error,
) {
	weekly, err := r.GetWeeklyRules(clinicID, serviceTypeID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	windows, err := r.GetWindows(clinicID, serviceTypeID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	_, t, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	var overrideRows *sql.Rows
	if t.serviceTypeID != nil {
		overrideRows, err = r.db.Query(`
			SELECT id, clinic_id, service_type_id, capacity_group, date::text, max_per_day, is_closed
			FROM booking_day_overrides
			WHERE clinic_id = $1 AND service_type_id = $2 AND date >= $3::date AND date <= $4::date
		`, clinicID, *t.serviceTypeID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	} else {
		overrideRows, err = r.db.Query(`
			SELECT id, clinic_id, service_type_id, capacity_group, date::text, max_per_day, is_closed
			FROM booking_day_overrides
			WHERE clinic_id = $1 AND capacity_group = $2 AND date >= $3::date AND date <= $4::date
		`, clinicID, *t.capacityGroup, from.Format("2006-01-02"), to.Format("2006-01-02"))
	}
	if err != nil {
		return nil, nil, nil, nil, err
	}
	defer overrideRows.Close()

	overrides := make(map[string]BookingDayOverride)
	for overrideRows.Next() {
		var o BookingDayOverride
		var svcID sql.NullInt64
		var group sql.NullString
		var max sql.NullInt64
		if err := overrideRows.Scan(&o.ID, &o.ClinicID, &svcID, &group, &o.Date, &max, &o.IsClosed); err != nil {
			return nil, nil, nil, nil, err
		}
		if max.Valid {
			v := int(max.Int64)
			o.MaxPerDay = &v
		}
		overrides[o.Date] = o
	}

	staffRows, err := r.db.Query(`
		SELECT bs.id, bs.clinic_id, bs.service_type_id, bs.date::text, bs.doctor_id, d.full_name
		FROM booking_day_staff bs
		LEFT JOIN doctors d ON d.id = bs.doctor_id
		WHERE bs.clinic_id = $1 AND bs.service_type_id = $2 AND bs.date >= $3::date AND bs.date <= $4::date
	`, clinicID, serviceTypeID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		return nil, nil, nil, nil, err
	}
	defer staffRows.Close()

	staffMap := make(map[string]BookingDayStaff)
	for staffRows.Next() {
		var s BookingDayStaff
		var docName sql.NullString
		if err := staffRows.Scan(&s.ID, &s.ClinicID, &s.ServiceTypeID, &s.Date, &s.DoctorID, &docName); err != nil {
			return nil, nil, nil, nil, err
		}
		if docName.Valid {
			s.DoctorName = &docName.String
		}
		staffMap[s.Date] = s
	}

	return weekly, windows, overrides, staffMap, nil
}

func resolveDaySchedule(
	d time.Time,
	weekly []BookingWeeklyRule,
	windows []BookingAvailabilityWindow,
	override *BookingDayOverride,
) (daySchedule, bool) {
	if override != nil {
		if override.IsClosed {
			return daySchedule{}, false
		}
		if override.MaxPerDay != nil {
			return daySchedule{max: *override.MaxPerDay, source: "override"}, true
		}
	}

	dow := pgDOW(d)
	for _, w := range windows {
		if windowMatchesDay(w, d) {
		return daySchedule{
			max:         w.MaxPerDay,
			intakeFrom:  w.IntakeFrom,
			intakeTo:    w.IntakeTo,
			pickupAfter: w.PickupAfter,
			slotMode:    "day_capacity",
			source:      "window",
		}, true
		}
	}

	for _, rule := range weekly {
		if rule.DayOfWeek != dow {
			continue
		}
		if !dateValidForRule(d, rule.ValidFrom, rule.ValidTo) {
			continue
		}
		return daySchedule{
			max:         rule.MaxPerDay,
			intakeFrom:  rule.IntakeFrom,
			intakeTo:    rule.IntakeTo,
			pickupAfter: rule.PickupAfter,
			slotMode:    rule.SlotMode,
			source:      "weekly",
		}, true
	}

	return daySchedule{}, false
}

// GetAvailability — ёмкость по дням с учётом активных заявок (pending + confirmed)
func (r *BookingRepository) GetAvailability(clinicID, serviceTypeID int, fromStr, toStr string) (*BookingAvailabilityResponse, error) {
	svc, _, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, err
	}

	settings, err := r.GetSettings(clinicID)
	if err != nil {
		return nil, err
	}

	today := time.Now().Truncate(24 * time.Hour)
	from := today
	to := today.AddDate(0, 0, settings.HorizonWeeks*7-1)

	if fromStr != "" {
		if f, err := time.Parse("2006-01-02", fromStr); err == nil {
			from = f
		}
	}
	if toStr != "" {
		if t, err := time.Parse("2006-01-02", toStr); err == nil {
			to = t
		}
	}

	maxTo := today.AddDate(0, 0, settings.HorizonWeeks*7-1)
	if to.After(maxTo) {
		to = maxTo
	}
	if from.Before(today) {
		from = today
	}

	weekly, windows, overrides, staffMap, err := r.loadScheduleData(clinicID, serviceTypeID, from, to)
	if err != nil {
		return nil, err
	}

	bookedCounts, err := r.loadBookedCounts(clinicID, serviceTypeID, from, to)
	if err != nil {
		return nil, err
	}

	slotBooked, err := r.loadBookedSlotCounts(clinicID, serviceTypeID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	if err != nil {
		return nil, err
	}

	var days []BookingAvailabilityDay
	for d := from; !d.After(to); d = d.AddDate(0, 0, 1) {
		dateKey := d.Format("2006-01-02")
		var ov *BookingDayOverride
		if o, ok := overrides[dateKey]; ok {
			ov = &o
		}
		sched, open := resolveDaySchedule(d, weekly, windows, ov)
		if open {
			applyTimeSlotsScheduleStyle(svc.ScheduleStyle, &sched)
		}
		booked := bookedCounts[dateKey]
		slotMode := sched.slotMode
		if slotMode == "" {
			slotMode = "day_capacity"
		}
		day := BookingAvailabilityDay{
			Date:        dateKey,
			IsOpen:      open,
			BookedSlots: booked,
			Source:      "closed",
			SlotMode:    slotMode,
		}
		if open {
			day.IntakeFrom = sched.intakeFrom
			day.IntakeTo = sched.intakeTo
			day.PickupAfter = sched.pickupAfter
			day.Source = sched.source
			if ov != nil && ov.MaxPerDay != nil && !ov.IsClosed {
				day.Source = "override"
			}

			if svc.ScheduleStyle == "day_capacity" {
				day.IntakeFrom = nil
				day.IntakeTo = nil
				day.PickupAfter = nil
			}

			if slotMode == "fixed_times" {
				day.TimeSlots = buildTimeSlotsForDay(sched, svc.DefaultDurationMin, slotBooked[dateKey])
				openSlots := 0
				for _, s := range day.TimeSlots {
					if s.Remaining > 0 {
						openSlots++
					}
				}
				day.MaxSlots = len(day.TimeSlots)
				day.Remaining = openSlots
				day.BookedSlots = booked
			} else {
				day.MaxSlots = sched.max
				day.Remaining = sched.max - booked
				if day.Remaining < 0 {
					day.Remaining = 0
				}
			}
		}
		if st, ok := staffMap[dateKey]; ok {
			day.DoctorID = st.DoctorID
			day.DoctorName = st.DoctorName
		}
		days = append(days, day)
	}

	return &BookingAvailabilityResponse{
		ServiceTypeID: serviceTypeID,
		CapacityGroup: svc.CapacityGroup,
		HorizonWeeks:  settings.HorizonWeeks,
		From:          from.Format("2006-01-02"),
		To:            to.Format("2006-01-02"),
		Days:          days,
	}, nil
}

// ErrBookingConflict — конфликт уникальности
var ErrBookingConflict = errors.New("конфликт данных")
