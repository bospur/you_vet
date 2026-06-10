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
	VkUserID       sql.NullInt64
	DisplayName    sql.NullString
	LinkedAt       sql.NullTime
}

type MobileAuthRepository struct {
	db *sql.DB
}

func NewMobileAuthRepository(db *sql.DB) *MobileAuthRepository {
	return &MobileAuthRepository{db: db}
}

func scanMobileUser(row interface{ Scan(dest ...any) error }) (*MobileUser, error) {
	var u MobileUser
	var phone sql.NullString
	err := row.Scan(
		&u.ID, &u.ClinicID, &phone, &u.TelegramUserID,
		&u.VkUserID, &u.DisplayName, &u.LinkedAt,
	)
	if err != nil {
		return nil, err
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	return &u, nil
}

const mobileUserSelect = `
	SELECT id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, linked_at
	FROM mobile_users
`

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

// UpsertVKUser создаёт или обновляет пользователя по VK ID.
func (r *MobileAuthRepository) UpsertVKUser(clinicID int, vkUserID int64, displayName, phone string) (*MobileUser, error) {
	if vkUserID == 0 {
		return nil, errors.New("vk_user_id required")
	}
	row := r.db.QueryRow(`
		INSERT INTO mobile_users (clinic_id, vk_user_id, display_name, phone, linked_at)
		VALUES ($1, $2, NULLIF($3, ''), NULLIF($4, ''), NOW())
		ON CONFLICT (clinic_id, vk_user_id)
		DO UPDATE SET
			display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), mobile_users.display_name),
			phone = COALESCE(NULLIF(EXCLUDED.phone, ''), mobile_users.phone),
			linked_at = NOW()
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, linked_at
	`, clinicID, vkUserID, displayName, phone)
	return scanMobileUser(row)
}

// GetByPhone возвращает mobile user или nil.
func (r *MobileAuthRepository) GetByPhone(clinicID int, phone string) (*MobileUser, error) {
	row := r.db.QueryRow(mobileUserSelect+` WHERE clinic_id = $1 AND phone = $2`, clinicID, phone)
	u, err := scanMobileUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

// GetByID возвращает mobile user по id.
func (r *MobileAuthRepository) GetByID(id int64) (*MobileUser, error) {
	row := r.db.QueryRow(mobileUserSelect+` WHERE id = $1`, id)
	u, err := scanMobileUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
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
