package repository

import (
	"database/sql"
	"errors"
	"time"
)

var ErrMobileUserNotLinked = errors.New("phone not linked to telegram")

type MobileUser struct {
	ID             int64
	ClinicID       int
	Phone          string
	TelegramUserID sql.NullInt64
	LinkedAt       sql.NullTime
}

type MobileAuthRepository struct {
	db *sql.DB
}

func NewMobileAuthRepository(db *sql.DB) *MobileAuthRepository {
	return &MobileAuthRepository{db: db}
}

// LinkPhone привязывает телефон к telegram_user_id (бот: contact).
func (r *MobileAuthRepository) LinkPhone(clinicID int, phone string, telegramUserID int64) error {
	if phone == "" || telegramUserID == 0 {
		return errors.New("phone and telegram_user_id required")
	}
	_, err := r.db.Exec(`
		INSERT INTO mobile_users (clinic_id, phone, telegram_user_id, linked_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (clinic_id, phone)
		DO UPDATE SET
			telegram_user_id = EXCLUDED.telegram_user_id,
			linked_at = NOW()
	`, clinicID, phone, telegramUserID)
	return err
}

// GetByPhone возвращает mobile user или nil.
func (r *MobileAuthRepository) GetByPhone(clinicID int, phone string) (*MobileUser, error) {
	var u MobileUser
	err := r.db.QueryRow(`
		SELECT id, clinic_id, phone, telegram_user_id, linked_at
		FROM mobile_users
		WHERE clinic_id = $1 AND phone = $2
	`, clinicID, phone).Scan(&u.ID, &u.ClinicID, &u.Phone, &u.TelegramUserID, &u.LinkedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetByID возвращает mobile user по id.
func (r *MobileAuthRepository) GetByID(id int64) (*MobileUser, error) {
	var u MobileUser
	err := r.db.QueryRow(`
		SELECT id, clinic_id, phone, telegram_user_id, linked_at
		FROM mobile_users
		WHERE id = $1
	`, id).Scan(&u.ID, &u.ClinicID, &u.Phone, &u.TelegramUserID, &u.LinkedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// SaveAuthCode сохраняет хеш OTP.
func (r *MobileAuthRepository) SaveAuthCode(clinicID int, phone, codeHash string, expiresAt time.Time) error {
	_, err := r.db.Exec(`
		INSERT INTO auth_codes (clinic_id, phone, code_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`, clinicID, phone, codeHash, expiresAt)
	return err
}

// CountRecentAuthRequests считает запросы кода за окно (антиспам).
func (r *MobileAuthRepository) CountRecentAuthRequests(clinicID int, phone string, since time.Time) (int, error) {
	var n int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM auth_codes
		WHERE clinic_id = $1 AND phone = $2 AND created_at >= $3
	`, clinicID, phone, since).Scan(&n)
	return n, err
}

// LatestValidCodeHash возвращает последний неистёкший хеш для телефона.
func (r *MobileAuthRepository) LatestValidCodeHash(clinicID int, phone string, now time.Time) (string, error) {
	var hash string
	err := r.db.QueryRow(`
		SELECT code_hash FROM auth_codes
		WHERE clinic_id = $1 AND phone = $2 AND expires_at > $3
		ORDER BY created_at DESC
		LIMIT 1
	`, clinicID, phone, now).Scan(&hash)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	return hash, err
}

// PurgeExpiredCodes удаляет старые коды (best-effort).
func (r *MobileAuthRepository) PurgeExpiredCodes(before time.Time) {
	_, _ = r.db.Exec(`DELETE FROM auth_codes WHERE expires_at < $1`, before)
}
