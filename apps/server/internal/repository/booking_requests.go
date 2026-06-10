package repository

import (
	"database/sql"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"
)

var (
	ErrBookingCapacityFull    = errors.New("нет свободных мест")
	ErrBookingAntispam        = errors.New("превышен лимит заявок") // legacy
	ErrBookingInvalidDate     = errors.New("дата недоступна для записи")
	ErrBookingInvalidStatus   = errors.New("недопустимый переход статуса")
	ErrBookingServiceInactive = errors.New("услуга недоступна")
)

// BookingRequest — заявка на запись
type BookingRequest struct {
	ID               int             `json:"id"`
	ClinicID         int             `json:"clinic_id"`
	ServiceTypeID    int             `json:"service_type_id"`
	ServiceName      string          `json:"service_name,omitempty"`
	RequestedDate    string          `json:"requested_date"`
	SlotTime         *string         `json:"slot_time"`
	ClientName       string          `json:"client_name"`
	ClientPhone      string          `json:"client_phone"`
	PetName          string          `json:"pet_name"`
	PetSpecies       *string         `json:"pet_species"`
	PetAgeYears      *int            `json:"pet_age_years"`
	TelegramUserID   *int64          `json:"telegram_user_id"`
	MobileUserID     *int64          `json:"mobile_user_id,omitempty"`
	Status           string          `json:"status"`
	StaffNote        *string         `json:"staff_note"`
	RejectReason     *string         `json:"reject_reason"`
	HandledByUserID  *int            `json:"handled_by_user_id"`
	RulesAck         json.RawMessage `json:"rules_ack"`
	CreatedAt        string          `json:"created_at"`
	UpdatedAt        string          `json:"updated_at"`
}

// BookingRequestInput — создание заявки
type BookingRequestInput struct {
	ServiceTypeID  int             `json:"service_type_id"`
	RequestedDate  string          `json:"requested_date"`
	SlotTime       *string         `json:"slot_time"`
	ClientName     string          `json:"client_name"`
	ClientPhone    string          `json:"client_phone"`
	PetName        string          `json:"pet_name"`
	PetSpecies     *string         `json:"pet_species"`
	PetAgeYears    *int            `json:"pet_age_years"`
	TelegramUserID *int64          `json:"telegram_user_id"`
	MobileUserID   *int64          `json:"mobile_user_id"`
	RulesAck       json.RawMessage `json:"rules_ack"`
}

// BookingRequestPatch — обновление заявки менеджером
type BookingRequestPatch struct {
	Status        *string `json:"status"`
	StaffNote     *string `json:"staff_note"`
	RejectReason  *string `json:"reject_reason"`
	RequestedDate *string `json:"requested_date"`
	SlotTime      *string `json:"slot_time"`
}

// BookingRequestFilters — фильтры списка
type BookingRequestFilters struct {
	Status         string
	ServiceTypeID  int
	From           string
	To             string
	TelegramUserID *int64
	MobileUserID   *int64
}

func scanBookingRequest(row interface{ Scan(dest ...any) error }) (*BookingRequest, error) {
	var req BookingRequest
	var slotTime sql.NullString
	var petSpecies sql.NullString
	var petAge sql.NullInt64
	var tgID sql.NullInt64
	var mobileID sql.NullInt64
	var staffNote, rejectReason sql.NullString
	var handledBy sql.NullInt64
	var rules []byte
	var createdAt, updatedAt time.Time

	err := row.Scan(
		&req.ID, &req.ClinicID, &req.ServiceTypeID, &req.ServiceName,
		&req.RequestedDate, &slotTime,
		&req.ClientName, &req.ClientPhone, &req.PetName, &petSpecies, &petAge,
		&tgID, &mobileID, &req.Status, &staffNote, &rejectReason, &handledBy, &rules,
		&createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}
	req.SlotTime = nullTimeStr(slotTime)
	if petSpecies.Valid {
		req.PetSpecies = &petSpecies.String
	}
	if petAge.Valid {
		v := int(petAge.Int64)
		req.PetAgeYears = &v
	}
	if tgID.Valid {
		req.TelegramUserID = &tgID.Int64
	}
	if mobileID.Valid {
		req.MobileUserID = &mobileID.Int64
	}
	if staffNote.Valid {
		req.StaffNote = &staffNote.String
	}
	if rejectReason.Valid {
		req.RejectReason = &rejectReason.String
	}
	if handledBy.Valid {
		v := int(handledBy.Int64)
		req.HandledByUserID = &v
	}
	if len(rules) == 0 {
		req.RulesAck = json.RawMessage("[]")
	} else {
		req.RulesAck = json.RawMessage(rules)
	}
	req.CreatedAt = createdAt.Format(time.RFC3339)
	req.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &req, nil
}

const bookingRequestSelect = `
	SELECT br.id, br.clinic_id, br.service_type_id, st.name,
	       br.requested_date::text, br.slot_time::text,
	       br.client_name, br.client_phone, br.pet_name, br.pet_species, br.pet_age_years,
	       br.telegram_user_id, br.mobile_user_id, br.status, br.staff_note, br.reject_reason,
	       br.handled_by_user_id, br.rules_ack,
	       br.created_at, br.updated_at
	FROM booking_requests br
	JOIN booking_service_types st ON st.id = br.service_type_id
`

func (r *BookingRepository) GetClinicIDBySlug(slug string) (int, error) {
	var id int
	err := r.db.QueryRow(`SELECT id FROM clinics WHERE slug = $1`, slug).Scan(&id)
	if err == sql.ErrNoRows {
		return 0, ErrBookingNotFound
	}
	return id, err
}

func (r *BookingRepository) countActiveBookingsForDate(
	tx *sql.Tx,
	clinicID int,
	svc *BookingServiceType,
	date string,
	excludeRequestID int,
) (int, error) {
	target := bookingTargetFromService(svc)
	var count int
	var err error

	if target.capacityGroup != nil {
		err = tx.QueryRow(`
			SELECT COUNT(*)
			FROM booking_requests br
			JOIN booking_service_types st ON st.id = br.service_type_id
			WHERE br.clinic_id = $1
			  AND br.requested_date = $2::date
			  AND br.status IN ('pending', 'confirmed')
			  AND st.capacity_group = $3
			  AND ($4 = 0 OR br.id <> $4)
		`, clinicID, date, *target.capacityGroup, excludeRequestID).Scan(&count)
	} else {
		err = tx.QueryRow(`
			SELECT COUNT(*)
			FROM booking_requests br
			WHERE br.clinic_id = $1
			  AND br.service_type_id = $2
			  AND br.requested_date = $3::date
			  AND br.status IN ('pending', 'confirmed')
			  AND ($4 = 0 OR br.id <> $4)
		`, clinicID, *target.serviceTypeID, date, excludeRequestID).Scan(&count)
	}
	return count, err
}

func (r *BookingRepository) countActiveBookingsForSlot(
	tx *sql.Tx,
	clinicID int,
	svc *BookingServiceType,
	date, slotTime string,
	excludeRequestID int,
) (int, error) {
	target := bookingTargetFromService(svc)
	slotTime = normalizeSlotKey(slotTime)
	var count int
	var err error

	if target.capacityGroup != nil {
		err = tx.QueryRow(`
			SELECT COUNT(*)
			FROM booking_requests br
			JOIN booking_service_types st ON st.id = br.service_type_id
			WHERE br.clinic_id = $1
			  AND br.requested_date = $2::date
			  AND br.status IN ('pending', 'confirmed')
			  AND st.capacity_group = $3
			  AND COALESCE(br.slot_time::text, '') LIKE $4 || '%'
			  AND ($5 = 0 OR br.id <> $5)
		`, clinicID, date, *target.capacityGroup, slotTime, excludeRequestID).Scan(&count)
	} else {
		err = tx.QueryRow(`
			SELECT COUNT(*)
			FROM booking_requests br
			WHERE br.clinic_id = $1
			  AND br.service_type_id = $2
			  AND br.requested_date = $3::date
			  AND br.status IN ('pending', 'confirmed')
			  AND COALESCE(br.slot_time::text, '') LIKE $4 || '%'
			  AND ($5 = 0 OR br.id <> $5)
		`, clinicID, *target.serviceTypeID, date, slotTime, excludeRequestID).Scan(&count)
	}
	return count, err
}

func (r *BookingRepository) loadBookedCounts(
	clinicID, serviceTypeID int,
	from, to time.Time,
) (map[string]int, error) {
	svc, err := r.GetServiceTypeByID(clinicID, strconv.Itoa(serviceTypeID))
	if err != nil || svc == nil {
		return nil, err
	}
	target := bookingTargetFromService(svc)

	counts := make(map[string]int)
	var rows *sql.Rows

	if target.capacityGroup != nil {
		rows, err = r.db.Query(`
			SELECT br.requested_date::text, COUNT(*)
			FROM booking_requests br
			JOIN booking_service_types st ON st.id = br.service_type_id
			WHERE br.clinic_id = $1
			  AND br.requested_date >= $2::date AND br.requested_date <= $3::date
			  AND br.status IN ('pending', 'confirmed')
			  AND st.capacity_group = $4
			GROUP BY br.requested_date
		`, clinicID, from.Format("2006-01-02"), to.Format("2006-01-02"), *target.capacityGroup)
	} else {
		rows, err = r.db.Query(`
			SELECT requested_date::text, COUNT(*)
			FROM booking_requests
			WHERE clinic_id = $1
			  AND service_type_id = $2
			  AND requested_date >= $3::date AND requested_date <= $4::date
			  AND status IN ('pending', 'confirmed')
			GROUP BY requested_date
		`, clinicID, *target.serviceTypeID, from.Format("2006-01-02"), to.Format("2006-01-02"))
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var date string
		var n int
		if err := rows.Scan(&date, &n); err != nil {
			return nil, err
		}
		counts[date] = n
	}
	return counts, rows.Err()
}

func (r *BookingRepository) checkAntispam(
	tx *sql.Tx,
	clinicID, serviceTypeID int,
	date string,
	telegramUserID *int64,
	clientPhone string,
	petName string,
	slotTime *string,
	rules json.RawMessage,
	scheduleStyle string,
) error {
	maxPerService, maxPerDay := resolveBookingLimits(rules, scheduleStyle)
	petKey := normalizePetName(petName)
	phone := strings.TrimSpace(clientPhone)

	checkIdentity := func(tgID *int64, ph string) error {
		if petKey != "" {
			var dupPet int
			var err error
			if tgID != nil {
				err = tx.QueryRow(`
					SELECT COUNT(*)
					FROM booking_requests
					WHERE clinic_id = $1 AND service_type_id = $2 AND requested_date = $3::date
					  AND telegram_user_id = $4 AND status IN ('pending', 'confirmed')
					  AND LOWER(TRIM(pet_name)) = $5
				`, clinicID, serviceTypeID, date, *tgID, petKey).Scan(&dupPet)
			} else if ph != "" {
				err = tx.QueryRow(`
					SELECT COUNT(*)
					FROM booking_requests
					WHERE clinic_id = $1 AND service_type_id = $2 AND requested_date = $3::date
					  AND client_phone = $4 AND status IN ('pending', 'confirmed')
					  AND LOWER(TRIM(pet_name)) = $5
				`, clinicID, serviceTypeID, date, ph, petKey).Scan(&dupPet)
			}
			if err != nil {
				return err
			}
			if dupPet > 0 {
				return ErrBookingDuplicatePet
			}
		}

		if scheduleStyle == "time_slots" && slotTime != nil && strings.TrimSpace(*slotTime) != "" {
			slotKey := normalizeSlotKey(*slotTime)
			var dupSlot int
			var err error
			if tgID != nil {
				err = tx.QueryRow(`
					SELECT COUNT(*)
					FROM booking_requests
					WHERE clinic_id = $1 AND service_type_id = $2 AND requested_date = $3::date
					  AND telegram_user_id = $4 AND status IN ('pending', 'confirmed')
					  AND slot_time IS NOT NULL AND LEFT(slot_time::text, 5) = $5
				`, clinicID, serviceTypeID, date, *tgID, slotKey).Scan(&dupSlot)
			} else if ph != "" {
				err = tx.QueryRow(`
					SELECT COUNT(*)
					FROM booking_requests
					WHERE clinic_id = $1 AND service_type_id = $2 AND requested_date = $3::date
					  AND client_phone = $4 AND status IN ('pending', 'confirmed')
					  AND slot_time IS NOT NULL AND LEFT(slot_time::text, 5) = $5
				`, clinicID, serviceTypeID, date, ph, slotKey).Scan(&dupSlot)
			}
			if err != nil {
				return err
			}
			if dupSlot > 0 {
				return ErrBookingDuplicateSlot
			}
		}

		var perService int
		var err error
		if tgID != nil {
			err = tx.QueryRow(`
				SELECT COUNT(*)
				FROM booking_requests
				WHERE clinic_id = $1 AND service_type_id = $2 AND requested_date = $3::date
				  AND telegram_user_id = $4 AND status IN ('pending', 'confirmed')
			`, clinicID, serviceTypeID, date, *tgID).Scan(&perService)
		} else if ph != "" {
			err = tx.QueryRow(`
				SELECT COUNT(*)
				FROM booking_requests
				WHERE clinic_id = $1 AND service_type_id = $2 AND requested_date = $3::date
				  AND client_phone = $4 AND status IN ('pending', 'confirmed')
			`, clinicID, serviceTypeID, date, ph).Scan(&perService)
		}
		if err != nil {
			return err
		}
		if perService >= maxPerService {
			return ErrBookingLimitPerService
		}

		var perDay int
		if tgID != nil {
			err = tx.QueryRow(`
				SELECT COUNT(*)
				FROM booking_requests
				WHERE clinic_id = $1 AND requested_date = $2::date
				  AND telegram_user_id = $3 AND status IN ('pending', 'confirmed')
			`, clinicID, date, *tgID).Scan(&perDay)
		} else if ph != "" {
			err = tx.QueryRow(`
				SELECT COUNT(*)
				FROM booking_requests
				WHERE clinic_id = $1 AND requested_date = $2::date
				  AND client_phone = $3 AND status IN ('pending', 'confirmed')
			`, clinicID, date, ph).Scan(&perDay)
		}
		if err != nil {
			return err
		}
		if perDay >= maxPerDay {
			return ErrBookingLimitPerDay
		}
		return nil
	}

	if telegramUserID != nil {
		return checkIdentity(telegramUserID, "")
	}
	if phone != "" {
		return checkIdentity(nil, phone)
	}
	return nil
}

func (r *BookingRepository) validateRequestDate(
	clinicID, serviceTypeID int,
	dateStr string,
	excludeRequestID int,
) (*BookingServiceType, daySchedule, error) {
	svc, _, err := r.resolveTarget(clinicID, serviceTypeID)
	if err != nil {
		return nil, daySchedule{}, err
	}
	if !svc.IsActive {
		return nil, daySchedule{}, ErrBookingServiceInactive
	}

	d, err := time.Parse("2006-01-02", dateStr)
	if err != nil {
		return nil, daySchedule{}, ErrBookingInvalidDate
	}

	settings, err := r.GetSettings(clinicID)
	if err != nil {
		return nil, daySchedule{}, err
	}

	today := time.Now().Truncate(24 * time.Hour)
	maxTo := today.AddDate(0, 0, settings.HorizonWeeks*7-1)
	if d.Before(today) || d.After(maxTo) {
		return nil, daySchedule{}, ErrBookingInvalidDate
	}

	weekly, windows, overrides, _, err := r.loadScheduleData(clinicID, serviceTypeID, d, d)
	if err != nil {
		return nil, daySchedule{}, err
	}

	dateKey := d.Format("2006-01-02")
	var ov *BookingDayOverride
	if o, ok := overrides[dateKey]; ok {
		ov = &o
	}
	sched, open := resolveDaySchedule(d, weekly, windows, ov)
	if !open {
		return nil, daySchedule{}, ErrBookingInvalidDate
	}
	applyTimeSlotsScheduleStyle(svc.ScheduleStyle, &sched)

	tx, err := r.db.Begin()
	if err != nil {
		return nil, daySchedule{}, err
	}
	defer tx.Rollback()

	booked, err := r.countActiveBookingsForDate(tx, clinicID, svc, dateKey, excludeRequestID)
	if err != nil {
		return nil, daySchedule{}, err
	}
	if sched.slotMode != "fixed_times" && booked >= sched.max {
		return nil, daySchedule{}, ErrBookingCapacityFull
	}
	if err := tx.Rollback(); err != nil {
		return nil, daySchedule{}, err
	}

	return svc, sched, nil
}

func (r *BookingRepository) CreateRequest(clinicID int, input BookingRequestInput) (*BookingRequest, error) {
	if input.ServiceTypeID <= 0 || input.RequestedDate == "" {
		return nil, ErrBookingInvalidDate
	}
	if strings.TrimSpace(input.ClientName) == "" || strings.TrimSpace(input.PetName) == "" {
		return nil, errors.New("имя клиента и кличка обязательны")
	}

	svc, sched, err := r.validateRequestDate(clinicID, input.ServiceTypeID, input.RequestedDate, 0)
	if err != nil {
		return nil, err
	}

	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	var slotTimeArg *string
	slotMode := sched.slotMode
	if svc.ScheduleStyle == "time_slots" {
		slotMode = "fixed_times"
	}
	if slotMode == "fixed_times" {
		if input.SlotTime == nil || strings.TrimSpace(*input.SlotTime) == "" {
			return nil, errors.New("укажите время приёма")
		}
		normalized := normalizeSlotKey(*input.SlotTime)
		slotCount, err := r.countActiveBookingsForSlot(tx, clinicID, svc, input.RequestedDate, normalized, 0)
		if err != nil {
			return nil, err
		}
		if slotCount >= 1 {
			return nil, ErrBookingCapacityFull
		}
		slotTimeArg = &normalized
	} else {
		booked, err := r.countActiveBookingsForDate(tx, clinicID, svc, input.RequestedDate, 0)
		if err != nil {
			return nil, err
		}
		if booked >= sched.max {
			return nil, ErrBookingCapacityFull
		}
	}

	if err := r.checkAntispam(tx, clinicID, input.ServiceTypeID, input.RequestedDate,
		input.TelegramUserID, input.ClientPhone, input.PetName, slotTimeArg,
		svc.Rules, svc.ScheduleStyle); err != nil {
		return nil, err
	}

	status := "pending"
	if svc.BookingMode == "instant" {
		status = "confirmed"
	}

	phone := strings.TrimSpace(input.ClientPhone)
	row := tx.QueryRow(`
		INSERT INTO booking_requests (
			clinic_id, service_type_id, requested_date, slot_time,
			client_name, client_phone, pet_name, pet_species, pet_age_years,
			telegram_user_id, mobile_user_id, status, rules_ack
		) VALUES ($1, $2, $3::date, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
		RETURNING id, clinic_id, service_type_id,
		          requested_date::text, slot_time::text,
		          client_name, client_phone, pet_name, pet_species, pet_age_years,
		          telegram_user_id, mobile_user_id, status, staff_note, reject_reason,
		          handled_by_user_id, rules_ack, created_at, updated_at
	`, clinicID, input.ServiceTypeID, input.RequestedDate, slotTimeArg,
		strings.TrimSpace(input.ClientName), phone, strings.TrimSpace(input.PetName),
		input.PetSpecies, input.PetAgeYears, input.TelegramUserID, input.MobileUserID, status,
		normalizeRules(input.RulesAck))

	var req BookingRequest
	var slotTime sql.NullString
	var petSpecies sql.NullString
	var petAge sql.NullInt64
	var tgID sql.NullInt64
	var mobileID sql.NullInt64
	var staffNote, rejectReason sql.NullString
	var handledBy sql.NullInt64
	var rules []byte
	var createdAt, updatedAt time.Time

	err = row.Scan(
		&req.ID, &req.ClinicID, &req.ServiceTypeID,
		&req.RequestedDate, &slotTime,
		&req.ClientName, &req.ClientPhone, &req.PetName, &petSpecies, &petAge,
		&tgID, &mobileID, &req.Status, &staffNote, &rejectReason, &handledBy, &rules,
		&createdAt, &updatedAt,
	)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	req.ServiceName = svc.Name
	req.SlotTime = nullTimeStr(slotTime)
	if petSpecies.Valid {
		req.PetSpecies = &petSpecies.String
	}
	if petAge.Valid {
		v := int(petAge.Int64)
		req.PetAgeYears = &v
	}
	if tgID.Valid {
		req.TelegramUserID = &tgID.Int64
	}
	if mobileID.Valid {
		req.MobileUserID = &mobileID.Int64
	}
	if len(rules) == 0 {
		req.RulesAck = json.RawMessage("[]")
	} else {
		req.RulesAck = json.RawMessage(rules)
	}
	req.CreatedAt = createdAt.Format(time.RFC3339)
	req.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &req, nil
}

func mustParseDate(s string) time.Time {
	t, _ := time.Parse("2006-01-02", s)
	return t
}

func (r *BookingRepository) ListRequests(clinicID int, f BookingRequestFilters) ([]BookingRequest, error) {
	q := bookingRequestSelect + ` WHERE br.clinic_id = $1`
	args := []any{clinicID}
	n := 2

	if f.Status != "" {
		q += ` AND br.status = $` + strconv.Itoa(n)
		args = append(args, f.Status)
		n++
	}
	if f.ServiceTypeID > 0 {
		q += ` AND br.service_type_id = $` + strconv.Itoa(n)
		args = append(args, f.ServiceTypeID)
		n++
	}
	if f.From != "" {
		q += ` AND br.requested_date >= $` + strconv.Itoa(n) + `::date`
		args = append(args, f.From)
		n++
	}
	if f.To != "" {
		q += ` AND br.requested_date <= $` + strconv.Itoa(n) + `::date`
		args = append(args, f.To)
		n++
	}
	if f.TelegramUserID != nil {
		q += ` AND br.telegram_user_id = $` + strconv.Itoa(n)
		args = append(args, *f.TelegramUserID)
		n++
	}
	if f.MobileUserID != nil {
		q += ` AND br.mobile_user_id = $` + strconv.Itoa(n)
		args = append(args, *f.MobileUserID)
		n++
	}
	q += ` ORDER BY br.requested_date DESC, br.created_at DESC LIMIT 500`

	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []BookingRequest
	for rows.Next() {
		req, err := scanBookingRequest(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, *req)
	}
	return list, rows.Err()
}

func (r *BookingRepository) GetRequestByID(clinicID int, id string) (*BookingRequest, error) {
	row := r.db.QueryRow(bookingRequestSelect+` WHERE br.id = $1 AND br.clinic_id = $2`, id, clinicID)
	req, err := scanBookingRequest(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return req, err
}

// CancelRequestByMobileUser — отмена заявки пользователем mobile app (VK и др.).
func (r *BookingRepository) CancelRequestByMobileUser(clinicID int, id string, mobileUserID int64) (*BookingRequest, error) {
	existing, err := r.GetRequestByID(clinicID, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBookingNotFound
	}
	if existing.MobileUserID == nil || *existing.MobileUserID != mobileUserID {
		return nil, ErrBookingNotFound
	}
	if existing.Status != "pending" && existing.Status != "confirmed" {
		return nil, ErrBookingInvalidStatus
	}
	cancelled := "cancelled"
	return r.UpdateRequest(clinicID, 0, id, BookingRequestPatch{Status: &cancelled})
}

// CancelRequestByTelegramUser — отмена клиентом своей заявки (pending или confirmed).
func (r *BookingRepository) CancelRequestByTelegramUser(clinicID int, id string, telegramUserID int64) (*BookingRequest, error) {
	existing, err := r.GetRequestByID(clinicID, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBookingNotFound
	}
	if existing.TelegramUserID == nil || *existing.TelegramUserID != telegramUserID {
		return nil, ErrBookingNotFound
	}
	if existing.Status != "pending" && existing.Status != "confirmed" {
		return nil, ErrBookingInvalidStatus
	}
	cancelled := "cancelled"
	return r.UpdateRequest(clinicID, 0, id, BookingRequestPatch{Status: &cancelled})
}

func validStatusTransition(from, to string) bool {
	switch from {
	case "pending":
		return to == "confirmed" || to == "rejected" || to == "cancelled" || to == "rescheduled"
	case "confirmed":
		return to == "cancelled" || to == "rescheduled"
	default:
		return false
	}
}

func (r *BookingRepository) UpdateRequest(clinicID, userID int, id string, patch BookingRequestPatch) (*BookingRequest, error) {
	existing, err := r.GetRequestByID(clinicID, id)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ErrBookingNotFound
	}

	newStatus := existing.Status
	if patch.Status != nil {
		newStatus = *patch.Status
		if !validStatusTransition(existing.Status, newStatus) {
			return nil, ErrBookingInvalidStatus
		}
	}

	newDate := existing.RequestedDate
	if patch.RequestedDate != nil {
		newDate = *patch.RequestedDate
	}

	if newDate != existing.RequestedDate {
		if _, _, err := r.validateRequestDate(clinicID, existing.ServiceTypeID, newDate, existing.ID); err != nil {
			return nil, err
		}
		if newStatus == existing.Status && existing.Status == "confirmed" {
			newStatus = "rescheduled"
		}
	}

	if patch.Status != nil && *patch.Status == "rejected" && (patch.RejectReason == nil || strings.TrimSpace(*patch.RejectReason) == "") {
		reason := "Отклонено клиникой"
		patch.RejectReason = &reason
	}
	if patch.Status != nil && *patch.Status == "confirmed" && patch.StaffNote != nil && strings.TrimSpace(*patch.StaffNote) == "" {
		patch.StaffNote = nil
	}

	row := r.db.QueryRow(`
		UPDATE booking_requests SET
			status = $3,
			staff_note = COALESCE($4, staff_note),
			reject_reason = COALESCE($5, reject_reason),
			requested_date = $6::date,
			slot_time = COALESCE($7, slot_time),
			handled_by_user_id = CASE WHEN $8 > 0 THEN $8 ELSE handled_by_user_id END,
			updated_at = NOW()
		WHERE id = $1 AND clinic_id = $2
		RETURNING id, clinic_id, service_type_id,
		          requested_date::text, slot_time::text,
		          client_name, client_phone, pet_name, pet_species, pet_age_years,
		          telegram_user_id, mobile_user_id, status, staff_note, reject_reason,
		          handled_by_user_id, rules_ack, created_at, updated_at
	`, id, clinicID, newStatus, patch.StaffNote, patch.RejectReason, newDate, patch.SlotTime, userID)

	var req BookingRequest
	var slotTime sql.NullString
	var petSpecies sql.NullString
	var petAge sql.NullInt64
	var tgID sql.NullInt64
	var mobileID sql.NullInt64
	var staffNote, rejectReason sql.NullString
	var handledBy sql.NullInt64
	var rules []byte
	var createdAt, updatedAt time.Time

	err = row.Scan(
		&req.ID, &req.ClinicID, &req.ServiceTypeID,
		&req.RequestedDate, &slotTime,
		&req.ClientName, &req.ClientPhone, &req.PetName, &petSpecies, &petAge,
		&tgID, &mobileID, &req.Status, &staffNote, &rejectReason, &handledBy, &rules,
		&createdAt, &updatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, ErrBookingNotFound
	}
	if err != nil {
		return nil, err
	}

	svc, _ := r.GetServiceTypeByID(clinicID, strconv.Itoa(req.ServiceTypeID))
	if svc != nil {
		req.ServiceName = svc.Name
	}
	req.SlotTime = nullTimeStr(slotTime)
	if petSpecies.Valid {
		req.PetSpecies = &petSpecies.String
	}
	if petAge.Valid {
		v := int(petAge.Int64)
		req.PetAgeYears = &v
	}
	if tgID.Valid {
		req.TelegramUserID = &tgID.Int64
	}
	if mobileID.Valid {
		req.MobileUserID = &mobileID.Int64
	}
	if staffNote.Valid {
		req.StaffNote = &staffNote.String
	}
	if rejectReason.Valid {
		req.RejectReason = &rejectReason.String
	}
	if handledBy.Valid {
		v := int(handledBy.Int64)
		req.HandledByUserID = &v
	}
	if len(rules) == 0 {
		req.RulesAck = json.RawMessage("[]")
	} else {
		req.RulesAck = json.RawMessage(rules)
	}
	req.CreatedAt = createdAt.Format(time.RFC3339)
	req.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &req, nil
}
