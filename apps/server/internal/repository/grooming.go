package repository

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"
)

// ErrGroomingConflict возвращается при пересечении записей по времени
var ErrGroomingConflict = errors.New("время занято")

// ErrGroomingNotWorkingDay возвращается если дата не рабочий день по шаблону
var ErrGroomingNotWorkingDay = errors.New("не рабочий день")

// ErrGroomingOutOfHours возвращается если запись выходит за рамки рабочих часов
var ErrGroomingOutOfHours = errors.New("запись за пределами рабочего времени")

// ── Модели ────────────────────────────────────────────────────────────────────

// GroomingBreed — порода + тип услуги груминга
type GroomingBreed struct {
	ID          int      `json:"id"`
	ClinicID    int      `json:"clinic_id"`
	Breed       string   `json:"breed"`
	ServiceName string   `json:"service_name"`
	Duration    int      `json:"duration"` // минуты
	PriceFrom   *float64 `json:"price_from"`
	PriceTo     *float64 `json:"price_to"`
	Description *string  `json:"description"`
}

// GroomingBreedServiceInput — один тип услуги в группе породы
type GroomingBreedServiceInput struct {
	ID          *int     `json:"id,omitempty"`
	ServiceName string   `json:"service_name"`
	Duration    int      `json:"duration"`
	PriceFrom   *float64 `json:"price_from"`
	PriceTo     *float64 `json:"price_to"`
}

// GroomingBreedGroupInput — порода с несколькими типами услуг
type GroomingBreedGroupInput struct {
	Breed         string                    `json:"breed"`
	Description   *string                   `json:"description"`
	Services      []GroomingBreedServiceInput `json:"services"`
	OriginalBreed *string                   `json:"original_breed,omitempty"`
}

// GroomingTemplateSlot — один рабочий день в шаблоне недели
type GroomingTemplateSlot struct {
	ID        int    `json:"id"`
	ClinicID  int    `json:"clinic_id"`
	DayOfWeek int    `json:"day_of_week"`
	TimeFrom  string `json:"time_from"`
	TimeTo    string `json:"time_to"`
}

// GroomingTemplateInput — данные для upsert слота шаблона
type GroomingTemplateInput struct {
	DayOfWeek int    `json:"day_of_week"`
	TimeFrom  string `json:"time_from"`
	TimeTo    string `json:"time_to"`
}

// GroomingAppointment — запись животного в расписание
type GroomingAppointment struct {
	ID         int      `json:"id"`
	ClinicID   int      `json:"clinic_id"`
	BreedID    int      `json:"breed_id"`
	Breed       string   `json:"breed"`
	ServiceName string   `json:"service_name"`
	Duration    int      `json:"duration"`
	PriceFrom   *float64 `json:"price_from"`
	PriceTo     *float64 `json:"price_to"`
	Date       string   `json:"date"`
	PetName    string   `json:"pet_name"`
	OwnerPhone string   `json:"owner_phone"`
	StartTime    string  `json:"start_time"`
	EndTime      string  `json:"end_time"`
	MobileUserID *int64  `json:"mobile_user_id,omitempty"`
	Status       string  `json:"status"`
}

// GroomingAppointmentInput — данные для создания записи
type GroomingAppointmentInput struct {
	BreedID    int    `json:"breed_id"`
	Date       string `json:"date"`
	PetName    string `json:"pet_name"`
	OwnerPhone string `json:"owner_phone"`
	StartTime    string `json:"start_time"`
	MobileUserID *int64 `json:"mobile_user_id,omitempty"`
	Status       string `json:"status,omitempty"`
}

// GroomingRepository — запросы к таблицам груминга
type GroomingRepository struct {
	db *sql.DB
}

func NewGroomingRepository(db *sql.DB) *GroomingRepository {
	return &GroomingRepository{db: db}
}

// ── Породы ────────────────────────────────────────────────────────────────────

const groomingBreedSelect = `
	SELECT id, clinic_id, breed, service_name, duration, price_from, price_to, description
	FROM grooming_breeds
`

func scanGroomingBreed(row interface{ Scan(dest ...any) error }) (*GroomingBreed, error) {
	var b GroomingBreed
	err := row.Scan(
		&b.ID, &b.ClinicID, &b.Breed, &b.ServiceName, &b.Duration,
		&b.PriceFrom, &b.PriceTo, &b.Description,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *GroomingRepository) GetAllBreeds(clinicID int) ([]GroomingBreed, error) {
	rows, err := r.db.Query(groomingBreedSelect+`
		WHERE clinic_id = $1
		ORDER BY breed, service_name, id
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var breeds []GroomingBreed
	for rows.Next() {
		b, err := scanGroomingBreed(rows)
		if err != nil {
			return nil, err
		}
		breeds = append(breeds, *b)
	}
	return breeds, rows.Err()
}

func (r *GroomingRepository) GetBreedByID(id string) (*GroomingBreed, error) {
	row := r.db.QueryRow(groomingBreedSelect+` WHERE id = $1`, id)
	b, err := scanGroomingBreed(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return b, err
}

func normalizePriceRange(from, to *float64) (*float64, *float64) {
	if from == nil && to == nil {
		return nil, nil
	}
	if from != nil && to != nil && *to < *from {
		from, to = to, from
	}
	return from, to
}

// SaveBreedGroup заменяет все услуги породы (создание или редактирование группы).
func (r *GroomingRepository) SaveBreedGroup(clinicID int, input GroomingBreedGroupInput) ([]GroomingBreed, error) {
	breed := strings.TrimSpace(input.Breed)
	if breed == "" {
		return nil, errors.New("порода обязательна")
	}
	if len(input.Services) == 0 {
		return nil, errors.New("нужен хотя бы один тип услуги")
	}

	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	deleteName := breed
	if input.OriginalBreed != nil && strings.TrimSpace(*input.OriginalBreed) != "" {
		deleteName = strings.TrimSpace(*input.OriginalBreed)
	}
	if _, err := tx.Exec(
		`DELETE FROM grooming_breeds WHERE clinic_id = $1 AND breed = $2`,
		clinicID, deleteName,
	); err != nil {
		return nil, err
	}

	var out []GroomingBreed
	desc := input.Description
	for _, svc := range input.Services {
		name := strings.TrimSpace(svc.ServiceName)
		if name == "" {
			name = "Стрижка"
		}
		if svc.Duration <= 0 {
			return nil, errors.New("продолжительность должна быть больше 0")
		}
		pf, pt := normalizePriceRange(svc.PriceFrom, svc.PriceTo)

		row := tx.QueryRow(`
			INSERT INTO grooming_breeds (clinic_id, breed, service_name, duration, price_from, price_to, description)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			RETURNING id, clinic_id, breed, service_name, duration, price_from, price_to, description
		`, clinicID, breed, name, svc.Duration, pf, pt, desc)

		b, err := scanGroomingBreed(row)
		if err != nil {
			return nil, err
		}
		out = append(out, *b)
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}
	return out, nil
}

func (r *GroomingRepository) DeleteBreedGroup(clinicID int, breedName string) error {
	breedName = strings.TrimSpace(breedName)
	if breedName == "" {
		return errors.New("порода обязательна")
	}
	_, err := r.db.Exec(
		`DELETE FROM grooming_breeds WHERE clinic_id = $1 AND breed = $2`,
		clinicID, breedName,
	)
	return err
}

func (r *GroomingRepository) DeleteBreed(clinicID int, id string) error {
	_, err := r.db.Exec(`DELETE FROM grooming_breeds WHERE id=$1 AND clinic_id=$2`, id, clinicID)
	return err
}

// ── Шаблон недели ─────────────────────────────────────────────────────────────

func (r *GroomingRepository) GetTemplate(clinicID int) ([]GroomingTemplateSlot, error) {
	rows, err := r.db.Query(`
		SELECT id, clinic_id, day_of_week, time_from::text, time_to::text
		FROM grooming_weekly_template WHERE clinic_id = $1
		ORDER BY day_of_week
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slots []GroomingTemplateSlot
	for rows.Next() {
		var s GroomingTemplateSlot
		if err := rows.Scan(&s.ID, &s.ClinicID, &s.DayOfWeek, &s.TimeFrom, &s.TimeTo); err != nil {
			return nil, err
		}
		slots = append(slots, s)
	}
	return slots, nil
}

// UpsertTemplateSlot создаёт или обновляет слот шаблона для дня недели
func (r *GroomingRepository) UpsertTemplateSlot(clinicID int, input GroomingTemplateInput) (*GroomingTemplateSlot, error) {
	var s GroomingTemplateSlot
	err := r.db.QueryRow(`
		INSERT INTO grooming_weekly_template (clinic_id, day_of_week, time_from, time_to)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (clinic_id, day_of_week) DO UPDATE
			SET time_from=$3, time_to=$4
		RETURNING id, clinic_id, day_of_week, time_from::text, time_to::text
	`, clinicID, input.DayOfWeek, input.TimeFrom, input.TimeTo).
		Scan(&s.ID, &s.ClinicID, &s.DayOfWeek, &s.TimeFrom, &s.TimeTo)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *GroomingRepository) DeleteTemplateSlot(clinicID, dayOfWeek int) error {
	_, err := r.db.Exec(
		`DELETE FROM grooming_weekly_template WHERE clinic_id=$1 AND day_of_week=$2`,
		clinicID, dayOfWeek,
	)
	return err
}

// ── Записи ────────────────────────────────────────────────────────────────────

// GetAppointmentsByMonth возвращает все записи за указанный месяц (формат "2026-04")
func (r *GroomingRepository) GetAppointmentsByMonth(clinicID int, month string) ([]GroomingAppointment, error) {
	rows, err := r.db.Query(`
		SELECT
			a.id, a.clinic_id, a.breed_id,
			b.breed, b.service_name, b.duration, b.price_from, b.price_to,
			a.date::text, a.pet_name, a.owner_phone,
			a.start_time::text, a.end_time::text,
			a.mobile_user_id, a.status
		FROM grooming_appointments a
		JOIN grooming_breeds b ON b.id = a.breed_id
		WHERE a.clinic_id = $1
		  AND TO_CHAR(a.date, 'YYYY-MM') = $2
		ORDER BY a.date, a.start_time
	`, clinicID, month)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var appointments []GroomingAppointment
	for rows.Next() {
		var a GroomingAppointment
		if err := rows.Scan(
			&a.ID, &a.ClinicID, &a.BreedID,
			&a.Breed, &a.ServiceName, &a.Duration, &a.PriceFrom, &a.PriceTo,
			&a.Date, &a.PetName, &a.OwnerPhone,
			&a.StartTime, &a.EndTime,
			&a.MobileUserID, &a.Status,
		); err != nil {
			return nil, err
		}
		appointments = append(appointments, a)
	}
	return appointments, nil
}

// CreateAppointment создаёт запись, проверяя рабочий день и пересечения
func (r *GroomingRepository) CreateAppointment(clinicID int, input GroomingAppointmentInput) (*GroomingAppointment, error) {
	// Получаем продолжительность породы
	var duration int
	err := r.db.QueryRow(
		`SELECT duration FROM grooming_breeds WHERE id=$1 AND clinic_id=$2`,
		input.BreedID, clinicID,
	).Scan(&duration)
	if err == sql.ErrNoRows {
		return nil, errors.New("порода не найдена")
	}
	if err != nil {
		return nil, err
	}

	// Проверяем что дата — рабочий день по шаблону
	// EXTRACT(DOW FROM date) → 0=Вс, 1=Пн … 6=Сб
	var timeFrom, timeTo string
	err = r.db.QueryRow(`
		SELECT time_from::text, time_to::text
		FROM grooming_weekly_template
		WHERE clinic_id=$1 AND day_of_week = EXTRACT(DOW FROM $2::date)
	`, clinicID, input.Date).Scan(&timeFrom, &timeTo)
	if err == sql.ErrNoRows {
		return nil, ErrGroomingNotWorkingDay
	}
	if err != nil {
		return nil, err
	}

	// Вычисляем end_time = start_time + duration
	// Используем PostgreSQL для простоты
	var endTime string
	err = r.db.QueryRow(
		`SELECT ($1::time + ($2 * INTERVAL '1 minute'))::time::text`,
		input.StartTime, duration,
	).Scan(&endTime)
	if err != nil {
		return nil, err
	}

	// Проверяем что запись в рамках рабочего времени
	var inHours bool
	err = r.db.QueryRow(`
		SELECT $1::time >= $2::time AND $3::time <= $4::time
	`, input.StartTime, timeFrom, endTime, timeTo).Scan(&inHours)
	if err != nil {
		return nil, err
	}
	if !inHours {
		return nil, ErrGroomingOutOfHours
	}

	// Проверяем пересечение с существующими записями
	var hasConflict bool
	err = r.db.QueryRow(`
		SELECT EXISTS (
			SELECT 1 FROM grooming_appointments
			WHERE clinic_id=$1 AND date=$2::date
			  AND status <> 'cancelled'
			  AND start_time < $3::time
			  AND end_time   > $4::time
		)
	`, clinicID, input.Date, endTime, input.StartTime).Scan(&hasConflict)
	if err != nil {
		return nil, err
	}
	if hasConflict {
		return nil, ErrGroomingConflict
	}

	status := input.Status
	if status == "" {
		status = "confirmed"
	}

	var a GroomingAppointment
	err = r.db.QueryRow(`
		INSERT INTO grooming_appointments
			(clinic_id, breed_id, date, pet_name, owner_phone, start_time, end_time, mobile_user_id, status)
		VALUES ($1, $2, $3::date, $4, $5, $6::time, $7::time, $8, $9)
		RETURNING id, clinic_id, breed_id, date::text, pet_name, owner_phone,
		          start_time::text, end_time::text, mobile_user_id, status
	`, clinicID, input.BreedID, input.Date, input.PetName, input.OwnerPhone,
		input.StartTime, endTime, input.MobileUserID, status).
		Scan(&a.ID, &a.ClinicID, &a.BreedID, &a.Date, &a.PetName, &a.OwnerPhone,
			&a.StartTime, &a.EndTime, &a.MobileUserID, &a.Status)
	if err != nil {
		return nil, err
	}

	// Дополняем breed-поля из уже известных данных
	err = r.db.QueryRow(
		`SELECT breed, service_name, duration, price_from, price_to FROM grooming_breeds WHERE id=$1`,
		input.BreedID,
	).Scan(&a.Breed, &a.ServiceName, &a.Duration, &a.PriceFrom, &a.PriceTo)
	if err != nil {
		return nil, err
	}

	return &a, nil
}

func (r *GroomingRepository) DeleteAppointment(id string, clinicID int) error {
	_, err := r.db.Exec(
		`DELETE FROM grooming_appointments WHERE id=$1 AND clinic_id=$2`,
		id, clinicID,
	)
	return err
}

// ── Публичные методы (по slug клиники) ────────────────────────────────────────

// GetAllBreedsBySlug возвращает породы/услуги для мини-приложения по slug клиники
func (r *GroomingRepository) GetAllBreedsBySlug(clinicSlug string) ([]GroomingBreed, error) {
	rows, err := r.db.Query(`
		SELECT gb.id, gb.clinic_id, gb.breed, gb.service_name, gb.duration, gb.price_from, gb.price_to, gb.description
		FROM grooming_breeds gb
		JOIN clinics c ON c.id = gb.clinic_id
		WHERE c.slug = $1
		ORDER BY gb.breed, gb.service_name, gb.id
	`, clinicSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var breeds []GroomingBreed
	for rows.Next() {
		b, err := scanGroomingBreed(rows)
		if err != nil {
			return nil, err
		}
		breeds = append(breeds, *b)
	}
	return breeds, rows.Err()
}

// GetTemplateBySlug возвращает шаблон рабочей недели по slug клиники
func (r *GroomingRepository) GetTemplateBySlug(clinicSlug string) ([]GroomingTemplateSlot, error) {
	rows, err := r.db.Query(`
		SELECT gt.id, gt.clinic_id, gt.day_of_week, gt.time_from::text, gt.time_to::text
		FROM grooming_weekly_template gt
		JOIN clinics c ON c.id = gt.clinic_id
		WHERE c.slug = $1
		ORDER BY gt.day_of_week
	`, clinicSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var slots []GroomingTemplateSlot
	for rows.Next() {
		var s GroomingTemplateSlot
		if err := rows.Scan(&s.ID, &s.ClinicID, &s.DayOfWeek, &s.TimeFrom, &s.TimeTo); err != nil {
			return nil, err
		}
		slots = append(slots, s)
	}
	return slots, nil
}

func (r *GroomingRepository) GetClinicIDBySlug(slug string) (int, error) {
	var id int
	err := r.db.QueryRow(`SELECT id FROM clinics WHERE slug = $1`, slug).Scan(&id)
	if errors.Is(err, sql.ErrNoRows) {
		return 0, sql.ErrNoRows
	}
	return id, err
}

type GroomingSlot struct {
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
	Available bool   `json:"available"`
}

type GroomingAvailability struct {
	Date        string         `json:"date"`
	TimeFrom    string         `json:"time_from"`
	TimeTo      string         `json:"time_to"`
	DurationMin int            `json:"duration_min"`
	Slots       []GroomingSlot `json:"slots"`
}

func (r *GroomingRepository) GetAvailability(clinicID int, date string, breedID int) (*GroomingAvailability, error) {
	var duration int
	err := r.db.QueryRow(
		`SELECT duration FROM grooming_breeds WHERE id=$1 AND clinic_id=$2`,
		breedID, clinicID,
	).Scan(&duration)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, errors.New("порода не найдена")
	}
	if err != nil {
		return nil, err
	}

	var timeFrom, timeTo string
	err = r.db.QueryRow(`
		SELECT time_from::text, time_to::text
		FROM grooming_weekly_template
		WHERE clinic_id=$1 AND day_of_week = EXTRACT(DOW FROM $2::date)
	`, clinicID, date).Scan(&timeFrom, &timeTo)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrGroomingNotWorkingDay
	}
	if err != nil {
		return nil, err
	}

	times := generateGroomingSlotTimes(timeFrom, timeTo, duration)
	busy, err := r.busyIntervals(clinicID, date)
	if err != nil {
		return nil, err
	}

	today := time.Now().Format("2006-01-02")
	nowMin := time.Now().Hour()*60 + time.Now().Minute()

	slots := make([]GroomingSlot, 0, len(times))
	for _, start := range times {
		end, ok := addMinutes(start, duration)
		if !ok {
			continue
		}
		available := !overlapsBusy(start, end, busy)
		if date == today {
			if startMin, ok := clockToMinutes(start); ok && startMin <= nowMin {
				available = false
			}
		}
		slots = append(slots, GroomingSlot{StartTime: start, EndTime: end, Available: available})
	}

	return &GroomingAvailability{
		Date:        date,
		TimeFrom:    trimClock(timeFrom),
		TimeTo:      trimClock(timeTo),
		DurationMin: duration,
		Slots:       slots,
	}, nil
}

type timeInterval struct{ from, to int }

func (r *GroomingRepository) busyIntervals(clinicID int, date string) ([]timeInterval, error) {
	rows, err := r.db.Query(`
		SELECT start_time::text, end_time::text
		FROM grooming_appointments
		WHERE clinic_id=$1 AND date=$2::date AND status <> 'cancelled'
	`, clinicID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []timeInterval
	for rows.Next() {
		var fromS, toS string
		if err := rows.Scan(&fromS, &toS); err != nil {
			return nil, err
		}
		from, ok1 := clockToMinutes(fromS)
		to, ok2 := clockToMinutes(toS)
		if ok1 && ok2 {
			out = append(out, timeInterval{from: from, to: to})
		}
	}
	return out, rows.Err()
}

func overlapsBusy(start, end string, busy []timeInterval) bool {
	s, ok1 := clockToMinutes(start)
	e, ok2 := clockToMinutes(end)
	if !ok1 || !ok2 {
		return true
	}
	for _, b := range busy {
		if s < b.to && e > b.from {
			return true
		}
	}
	return false
}

func generateGroomingSlotTimes(from, to string, durationMin int) []string {
	if durationMin <= 0 {
		durationMin = 30
	}
	start, ok1 := clockToMinutes(from)
	end, ok2 := clockToMinutes(to)
	if !ok1 || !ok2 || end <= start {
		return nil
	}
	var times []string
	for t := start; t+durationMin <= end; t += durationMin {
		times = append(times, formatGroomingClock(t))
	}
	return times
}

func clockToMinutes(s string) (int, bool) {
	s = trimClock(s)
	var h, m int
	if _, err := fmt.Sscanf(s, "%d:%d", &h, &m); err != nil {
		return 0, false
	}
	if h < 0 || h > 23 || m < 0 || m > 59 {
		return 0, false
	}
	return h*60 + m, true
}

func formatGroomingClock(totalMin int) string {
	h := totalMin / 60
	m := totalMin % 60
	return fmt.Sprintf("%02d:%02d", h, m)
}

func addMinutes(start string, duration int) (string, bool) {
	min, ok := clockToMinutes(start)
	if !ok {
		return "", false
	}
	return formatGroomingClock(min + duration), true
}

func trimClock(s string) string {
	if len(s) >= 5 {
		return s[:5]
	}
	return s
}

func scanGroomingAppointment(row interface{ Scan(dest ...any) error }) (*GroomingAppointment, error) {
	var a GroomingAppointment
	err := row.Scan(
		&a.ID, &a.ClinicID, &a.BreedID,
		&a.Breed, &a.ServiceName, &a.Duration, &a.PriceFrom, &a.PriceTo,
		&a.Date, &a.PetName, &a.OwnerPhone,
		&a.StartTime, &a.EndTime,
		&a.MobileUserID, &a.Status,
	)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

const groomingAppointmentSelect = `
	SELECT
		a.id, a.clinic_id, a.breed_id,
		b.breed, b.service_name, b.duration, b.price_from, b.price_to,
		a.date::text, a.pet_name, a.owner_phone,
		a.start_time::text, a.end_time::text,
		a.mobile_user_id, a.status
	FROM grooming_appointments a
	JOIN grooming_breeds b ON b.id = a.breed_id
`

func (r *GroomingRepository) GetAppointmentsByDate(clinicID int, date string) ([]GroomingAppointment, error) {
	rows, err := r.db.Query(groomingAppointmentSelect+`
		WHERE a.clinic_id = $1 AND a.date = $2::date
		ORDER BY a.start_time
	`, clinicID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []GroomingAppointment
	for rows.Next() {
		a, err := scanGroomingAppointment(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *a)
	}
	return list, rows.Err()
}

func (r *GroomingRepository) ListAppointmentsByUser(clinicID int, userID int64) ([]GroomingAppointment, error) {
	rows, err := r.db.Query(groomingAppointmentSelect+`
		WHERE a.clinic_id = $1 AND a.mobile_user_id = $2
		ORDER BY a.date DESC, a.start_time DESC
		LIMIT 100
	`, clinicID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []GroomingAppointment
	for rows.Next() {
		a, err := scanGroomingAppointment(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *a)
	}
	return list, rows.Err()
}

func (r *GroomingRepository) GetAppointmentByID(clinicID int, id string) (*GroomingAppointment, error) {
	row := r.db.QueryRow(groomingAppointmentSelect+`
		WHERE a.clinic_id = $1 AND a.id = $2
	`, clinicID, id)
	a, err := scanGroomingAppointment(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return a, err
}

func (r *GroomingRepository) UpdateAppointmentStatus(clinicID int, id, status string) (*GroomingAppointment, error) {
	switch status {
	case "pending", "confirmed", "cancelled":
	default:
		return nil, errors.New("недопустимый статус")
	}
	res, err := r.db.Exec(`
		UPDATE grooming_appointments SET status = $3
		WHERE clinic_id = $1 AND id = $2
	`, clinicID, id, status)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, sql.ErrNoRows
	}
	return r.GetAppointmentByID(clinicID, id)
}
