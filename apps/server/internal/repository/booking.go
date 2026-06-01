package repository

import (
	"database/sql"
	"encoding/json"
	"errors"
)

// ErrBookingNotFound — услуга не найдена или чужая клиника
var ErrBookingNotFound = errors.New("не найдено")

// BookingServiceType — услуга, на которую открыта запись
type BookingServiceType struct {
	ID                 int             `json:"id"`
	ClinicID           int             `json:"clinic_id"`
	Name               string          `json:"name"`
	Category           string          `json:"category"`
	SpeciesFilter      string          `json:"species_filter"`
	CapacityGroup      *string         `json:"capacity_group"`
	DefaultDurationMin int             `json:"default_duration_min"`
	BookingMode        string          `json:"booking_mode"`
	ScheduleStyle      string          `json:"schedule_style"`
	InstructionsClient *string         `json:"instructions_client"`
	Rules              json.RawMessage `json:"rules"`
	IsActive           bool            `json:"is_active"`
	SortOrder          int             `json:"sort_order"`
}

// BookingServiceTypeInput — создание/обновление услуги
type BookingServiceTypeInput struct {
	Name               string          `json:"name"`
	Category           string          `json:"category"`
	SpeciesFilter      string          `json:"species_filter"`
	CapacityGroup      *string         `json:"capacity_group"`
	DefaultDurationMin int             `json:"default_duration_min"`
	BookingMode        string          `json:"booking_mode"`
	ScheduleStyle      string          `json:"schedule_style"`
	SeedMaxPerDay      *int            `json:"seed_max_per_day"`
	InstructionsClient *string         `json:"instructions_client"`
	Rules              json.RawMessage `json:"rules"`
	IsActive           bool            `json:"is_active"`
	SortOrder          int             `json:"sort_order"`
}

// BookingRepository — запись на приём (B1: услуги)
type BookingRepository struct {
	db *sql.DB
}

func NewBookingRepository(db *sql.DB) *BookingRepository {
	return &BookingRepository{db: db}
}

func scanBookingServiceType(row interface {
	Scan(dest ...any) error
}) (*BookingServiceType, error) {
	var s BookingServiceType
	var rules []byte
	err := row.Scan(
		&s.ID, &s.ClinicID, &s.Name, &s.Category, &s.SpeciesFilter, &s.CapacityGroup,
		&s.DefaultDurationMin, &s.BookingMode, &s.ScheduleStyle, &s.InstructionsClient,
		&rules, &s.IsActive, &s.SortOrder,
	)
	if err != nil {
		return nil, err
	}
	if len(rules) == 0 {
		s.Rules = json.RawMessage("[]")
	} else {
		s.Rules = json.RawMessage(rules)
	}
	return &s, nil
}

const bookingServiceSelect = `
	SELECT id, clinic_id, name, category, species_filter, capacity_group,
	       default_duration_min, booking_mode, schedule_style, instructions_client, rules,
	       is_active, sort_order
	FROM booking_service_types
`

func (r *BookingRepository) GetActiveServiceTypes(clinicID int) ([]BookingServiceType, error) {
	rows, err := r.db.Query(bookingServiceSelect+`
		WHERE clinic_id = $1 AND is_active = TRUE
		ORDER BY sort_order, id
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []BookingServiceType
	for rows.Next() {
		s, err := scanBookingServiceType(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *s)
	}
	return list, rows.Err()
}

func (r *BookingRepository) GetAllServiceTypes(clinicID int) ([]BookingServiceType, error) {
	rows, err := r.db.Query(bookingServiceSelect+`
		WHERE clinic_id = $1
		ORDER BY sort_order, id
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []BookingServiceType
	for rows.Next() {
		s, err := scanBookingServiceType(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *s)
	}
	return list, rows.Err()
}

func (r *BookingRepository) GetServiceTypeByID(clinicID int, id string) (*BookingServiceType, error) {
	row := r.db.QueryRow(bookingServiceSelect+` WHERE id = $1 AND clinic_id = $2`, id, clinicID)
	s, err := scanBookingServiceType(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func normalizeRules(rules json.RawMessage) json.RawMessage {
	if len(rules) == 0 {
		return json.RawMessage("[]")
	}
	if !json.Valid(rules) {
		return json.RawMessage("[]")
	}
	return rules
}

func normalizeScheduleStyle(style, category string) string {
	switch style {
	case "day_capacity", "dropoff", "time_slots":
		return style
	}
	if category == "surgery" {
		return "dropoff"
	}
	return "day_capacity"
}

func (r *BookingRepository) CreateServiceType(clinicID int, input BookingServiceTypeInput) (*BookingServiceType, error) {
	style := normalizeScheduleStyle(input.ScheduleStyle, input.Category)
	row := r.db.QueryRow(`
		INSERT INTO booking_service_types (
			clinic_id, name, category, species_filter, capacity_group,
			default_duration_min, booking_mode, schedule_style, instructions_client, rules,
			is_active, sort_order
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, clinic_id, name, category, species_filter, capacity_group,
		          default_duration_min, booking_mode, schedule_style, instructions_client, rules,
		          is_active, sort_order
	`, clinicID, input.Name, input.Category, input.SpeciesFilter, input.CapacityGroup,
		input.DefaultDurationMin, input.BookingMode, style, input.InstructionsClient,
		normalizeRules(input.Rules), input.IsActive, input.SortOrder)
	svc, err := scanBookingServiceType(row)
	if err != nil {
		return nil, err
	}
	if input.SeedMaxPerDay != nil && *input.SeedMaxPerDay > 0 {
		if err := r.SeedWeeklyFromService(clinicID, svc.ID, *input.SeedMaxPerDay); err != nil {
			return svc, err
		}
	}
	return svc, nil
}

func (r *BookingRepository) UpdateServiceType(clinicID int, id string, input BookingServiceTypeInput) (*BookingServiceType, error) {
	style := normalizeScheduleStyle(input.ScheduleStyle, input.Category)
	row := r.db.QueryRow(`
		UPDATE booking_service_types SET
			name = $3,
			category = $4,
			species_filter = $5,
			capacity_group = $6,
			default_duration_min = $7,
			booking_mode = $8,
			schedule_style = $9,
			instructions_client = $10,
			rules = $11,
			is_active = $12,
			sort_order = $13,
			updated_at = NOW()
		WHERE id = $1 AND clinic_id = $2
		RETURNING id, clinic_id, name, category, species_filter, capacity_group,
		          default_duration_min, booking_mode, schedule_style, instructions_client, rules,
		          is_active, sort_order
	`, id, clinicID, input.Name, input.Category, input.SpeciesFilter, input.CapacityGroup,
		input.DefaultDurationMin, input.BookingMode, style, input.InstructionsClient,
		normalizeRules(input.Rules), input.IsActive, input.SortOrder)
	s, err := scanBookingServiceType(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return s, err
}

func (r *BookingRepository) DeleteServiceType(clinicID int, id string) error {
	res, err := r.db.Exec(
		`DELETE FROM booking_service_types WHERE id = $1 AND clinic_id = $2`,
		id, clinicID,
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
