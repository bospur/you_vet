package repository

import (
	"database/sql"
	"time"
)

type TelegramUserRepository struct {
	db *sql.DB
}

func NewTelegramUserRepository(db *sql.DB) *TelegramUserRepository {
	return &TelegramUserRepository{db: db}
}

type TelegramUserVisit struct {
	TelegramUserID int64
	Username       string
	FirstName      string
}

// UpsertVisit обновляет last_seen или создаёт запись о визите Mini App.
func (r *TelegramUserRepository) UpsertVisit(clinicSlug string, visit TelegramUserVisit) error {
	if visit.TelegramUserID == 0 {
		return nil
	}

	var username, firstName sql.NullString
	if visit.Username != "" {
		username = sql.NullString{String: visit.Username, Valid: true}
	}
	if visit.FirstName != "" {
		firstName = sql.NullString{String: visit.FirstName, Valid: true}
	}

	_, err := r.db.Exec(`
		INSERT INTO telegram_users (clinic_id, telegram_user_id, username, first_name, first_seen, last_seen)
		SELECT c.id, $2, $3, $4, NOW(), NOW()
		FROM clinics c
		WHERE c.slug = $1
		ON CONFLICT (clinic_id, telegram_user_id)
		DO UPDATE SET
			last_seen = NOW(),
			username = COALESCE(EXCLUDED.username, telegram_users.username),
			first_name = COALESCE(EXCLUDED.first_name, telegram_users.first_name)
	`, clinicSlug, visit.TelegramUserID, username, firstName)
	return err
}

type StatsSummary struct {
	Today     int `json:"today"`
	Last7Days int `json:"last_7_days"`
	Last30Days int `json:"last_30_days"`
	Total     int `json:"total"`
}

func (r *TelegramUserRepository) GetStatsSummary(clinicID int) (*StatsSummary, error) {
	now := time.Now()
	startToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var s StatsSummary
	err := r.db.QueryRow(`
		SELECT
			COUNT(*) FILTER (WHERE last_seen >= $2),
			COUNT(*) FILTER (WHERE last_seen >= $3),
			COUNT(*) FILTER (WHERE last_seen >= $4),
			COUNT(*)
		FROM telegram_users
		WHERE clinic_id = $1
	`, clinicID, startToday, now.AddDate(0, 0, -7), now.AddDate(0, 0, -30)).Scan(
		&s.Today, &s.Last7Days, &s.Last30Days, &s.Total,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// TelegramUserListItem — строка для таблицы в admin.
type TelegramUserListItem struct {
	TelegramUserID int64     `json:"telegram_user_id"`
	FirstName      string    `json:"first_name"`
	Username       string    `json:"username"`
	FirstSeen      time.Time `json:"first_seen"`
	LastSeen       time.Time `json:"last_seen"`
}

// ListByClinicID возвращает посетителей Mini App, новые активности сверху.
func (r *TelegramUserRepository) ListByClinicID(clinicID int, limit int) ([]TelegramUserListItem, error) {
	if limit <= 0 {
		limit = 500
	}

	rows, err := r.db.Query(`
		SELECT telegram_user_id, first_name, username, first_seen, last_seen
		FROM telegram_users
		WHERE clinic_id = $1
		ORDER BY last_seen DESC
		LIMIT $2
	`, clinicID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []TelegramUserListItem
	for rows.Next() {
		var u TelegramUserListItem
		var firstName, username sql.NullString
		if err := rows.Scan(&u.TelegramUserID, &firstName, &username, &u.FirstSeen, &u.LastSeen); err != nil {
			return nil, err
		}
		if firstName.Valid {
			u.FirstName = firstName.String
		}
		if username.Valid {
			u.Username = username.String
		}
		users = append(users, u)
	}
	return users, nil
}
