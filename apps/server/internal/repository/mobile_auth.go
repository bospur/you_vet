package repository

import (
	"database/sql"
	"errors"
	"strings"
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
	PhotoURL       string
	LinkedAt       sql.NullTime
	CreatedAt      time.Time
}

type MobileUserListItem struct {
	ID             int64   `json:"id"`
	DisplayName    string  `json:"display_name"`
	Phone          string  `json:"phone"`
	TelegramUserID *int64  `json:"telegram_user_id,omitempty"`
	VkUserID       *int64  `json:"vk_user_id,omitempty"`
	PhotoURL       string  `json:"photo_url"`
	LinkedAt       *string `json:"linked_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
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
		&u.VkUserID, &u.DisplayName, &u.PhotoURL, &u.LinkedAt, &u.CreatedAt,
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
	SELECT id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, photo_url, linked_at, created_at
	FROM mobile_users
`

func mobileUserToListItem(u *MobileUser) MobileUserListItem {
	item := MobileUserListItem{
		ID:        u.ID,
		Phone:     u.Phone,
		PhotoURL:  u.PhotoURL,
		CreatedAt: u.CreatedAt.Format(time.RFC3339),
	}
	if u.DisplayName.Valid {
		item.DisplayName = u.DisplayName.String
	}
	if u.TelegramUserID.Valid {
		v := u.TelegramUserID.Int64
		item.TelegramUserID = &v
	}
	if u.VkUserID.Valid {
		v := u.VkUserID.Int64
		item.VkUserID = &v
	}
	if u.LinkedAt.Valid {
		s := u.LinkedAt.Time.Format(time.RFC3339)
		item.LinkedAt = &s
	}
	return item
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
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, photo_url, linked_at, created_at
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

// UpdateDisplayName обновляет отображаемое имя.
func (r *MobileAuthRepository) UpdateDisplayName(userID int64, name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return errors.New("display_name required")
	}
	res, err := r.db.Exec(`
		UPDATE mobile_users SET display_name = $2 WHERE id = $1
	`, userID, name)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// UpdatePhotoURL сохраняет URL фото профиля.
func (r *MobileAuthRepository) UpdatePhotoURL(userID int64, url string) error {
	res, err := r.db.Exec(`
		UPDATE mobile_users SET photo_url = $2 WHERE id = $1
	`, userID, url)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// GetStatsSummary — регистрации mobile по COALESCE(linked_at, created_at).
func (r *MobileAuthRepository) GetStatsSummary(clinicID int) (*StatsSummary, error) {
	now := time.Now()
	startToday := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	var s StatsSummary
	err := r.db.QueryRow(`
		SELECT
			COUNT(*) FILTER (WHERE COALESCE(linked_at, created_at) >= $2),
			COUNT(*) FILTER (WHERE COALESCE(linked_at, created_at) >= $3),
			COUNT(*) FILTER (WHERE COALESCE(linked_at, created_at) >= $4),
			COUNT(*)
		FROM mobile_users
		WHERE clinic_id = $1
	`, clinicID, startToday, now.AddDate(0, 0, -7), now.AddDate(0, 0, -30)).Scan(
		&s.Today, &s.Last7Days, &s.Last30Days, &s.Total,
	)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

// ListByClinicID — список для admin.
func (r *MobileAuthRepository) ListByClinicID(clinicID int, limit int) ([]MobileUserListItem, error) {
	if limit <= 0 || limit > 1000 {
		limit = 500
	}
	rows, err := r.db.Query(mobileUserSelect+`
		WHERE clinic_id = $1
		ORDER BY COALESCE(linked_at, created_at) DESC
		LIMIT $2
	`, clinicID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []MobileUserListItem
	for rows.Next() {
		u, err := scanMobileUser(rows)
		if err != nil {
			return nil, err
		}
		list = append(list, mobileUserToListItem(u))
	}
	return list, rows.Err()
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
