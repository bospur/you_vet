package repository

import (
	"database/sql"
	"errors"
	"strconv"
	"strings"
	"time"
)

var ErrMobileUserNotLinked = errors.New("phone not linked to telegram")

type MobileUser struct {
	ID             int64
	ClinicID       int
	Phone          string
	Email          string
	TelegramUserID sql.NullInt64
	VkUserID       sql.NullInt64
	DisplayName    sql.NullString
	PhotoURL       string
	LinkedAt       sql.NullTime
	CreatedAt      time.Time
	AppRole        string
}

type MobileUserListItem struct {
	ID             int64   `json:"id"`
	DisplayName    string  `json:"display_name"`
	Phone          string  `json:"phone"`
	Email          string  `json:"email,omitempty"`
	TelegramUserID *int64  `json:"telegram_user_id,omitempty"`
	VkUserID       *int64  `json:"vk_user_id,omitempty"`
	PhotoURL       string  `json:"photo_url"`
	LinkedAt       *string `json:"linked_at,omitempty"`
	CreatedAt      string  `json:"created_at"`
	AppRole        string  `json:"app_role"`
}

type MobileAuthRepository struct {
	db *sql.DB
}

func NewMobileAuthRepository(db *sql.DB) *MobileAuthRepository {
	return &MobileAuthRepository{db: db}
}

func scanMobileUser(row interface{ Scan(dest ...any) error }) (*MobileUser, error) {
	var u MobileUser
	var phone, email sql.NullString
	err := row.Scan(
		&u.ID, &u.ClinicID, &phone, &u.TelegramUserID,
		&u.VkUserID, &u.DisplayName, &email, &u.PhotoURL, &u.LinkedAt, &u.CreatedAt, &u.AppRole,
	)
	if err != nil {
		return nil, err
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	if email.Valid {
		u.Email = email.String
	}
	u.AppRole = NormalizeAppRole(u.AppRole)
	return &u, nil
}

const mobileUserSelect = `
	SELECT id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role
	FROM mobile_users
`

func mobileUserToListItem(u *MobileUser) MobileUserListItem {
	item := MobileUserListItem{
		ID:        u.ID,
		Phone:     u.Phone,
		Email:     u.Email,
		PhotoURL:  u.PhotoURL,
		CreatedAt: u.CreatedAt.Format(time.RFC3339),
		AppRole:   NormalizeAppRole(u.AppRole),
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
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role
	`, clinicID, vkUserID, displayName, phone)
	return scanMobileUser(row)
}

// GetByEmail возвращает mobile user или nil.
func (r *MobileAuthRepository) GetByEmail(clinicID int, email string) (*MobileUser, error) {
	row := r.db.QueryRow(mobileUserSelect+` WHERE clinic_id = $1 AND email = $2`, clinicID, email)
	u, err := scanMobileUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return u, err
}

// UpsertEmailUser создаёт пользователя по email (вход без Telegram).
func (r *MobileAuthRepository) UpsertEmailUser(clinicID int, email, displayName string) (*MobileUser, error) {
	if email == "" {
		return nil, errors.New("email required")
	}
	row := r.db.QueryRow(`
		INSERT INTO mobile_users (clinic_id, email, display_name, linked_at)
		VALUES ($1, $2, NULLIF($3, ''), NOW())
		ON CONFLICT (clinic_id, email)
		DO UPDATE SET
			display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), mobile_users.display_name),
			linked_at = COALESCE(mobile_users.linked_at, NOW())
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role
	`, clinicID, email, displayName)
	return scanMobileUser(row)
}

// UpsertPhoneUser создаёт пользователя по телефону (WhatsApp, без Telegram).
func (r *MobileAuthRepository) UpsertPhoneUser(clinicID int, phone string) (*MobileUser, error) {
	if phone == "" {
		return nil, errors.New("phone required")
	}
	row := r.db.QueryRow(`
		INSERT INTO mobile_users (clinic_id, phone, linked_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (clinic_id, phone)
		DO UPDATE SET linked_at = COALESCE(mobile_users.linked_at, NOW())
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role
	`, clinicID, phone)
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

// DeleteByClinic удаляет mobile-пользователя клиники (заявки сохраняются, mobile_user_id обнуляется).
func (r *MobileAuthRepository) DeleteByClinic(clinicID int, userID int64) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`
		UPDATE booking_requests SET mobile_user_id = NULL
		WHERE clinic_id = $1 AND mobile_user_id = $2
	`, clinicID, userID); err != nil {
		return err
	}
	if _, err := tx.Exec(`
		UPDATE grooming_appointments SET mobile_user_id = NULL
		WHERE clinic_id = $1 AND mobile_user_id = $2
	`, clinicID, userID); err != nil {
		return err
	}
	if _, err := tx.Exec(`
		UPDATE doctors SET mobile_user_id = NULL
		WHERE clinic_id = $1 AND mobile_user_id = $2
	`, clinicID, userID); err != nil {
		return err
	}

	res, err := tx.Exec(`DELETE FROM mobile_users WHERE id = $1 AND clinic_id = $2`, userID, clinicID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return tx.Commit()
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

// UpdateAppRole меняет роль PWA.
func (r *MobileAuthRepository) UpdateAppRole(clinicID int, userID int64, role string) (*MobileUser, error) {
	role = NormalizeAppRole(role)
	if !IsValidAppRole(role) {
		return nil, errors.New("недопустимая роль")
	}
	row := r.db.QueryRow(mobileUserSelect+`
		WHERE id = $1 AND clinic_id = $2
	`, userID, clinicID)
	existing, err := scanMobileUser(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, sql.ErrNoRows
	}
	if err != nil {
		return nil, err
	}
	_, err = r.db.Exec(`UPDATE mobile_users SET app_role = $3 WHERE id = $1 AND clinic_id = $2`, userID, clinicID, role)
	if err != nil {
		return nil, err
	}
	existing.AppRole = role
	return existing, nil
}

// UpsertStaff создаёт или обновляет mobile-пользователя с ролью персонала.
func (r *MobileAuthRepository) UpsertStaff(clinicID int, phone, email, displayName, role string) (*MobileUser, error) {
	role = NormalizeAppRole(role)
	if !IsStaffAppRole(role) && role != AppRoleClient {
		return nil, errors.New("недопустимая роль")
	}
	if phone == "" && email == "" {
		return nil, errors.New("нужен телефон или email")
	}

	var existing *MobileUser
	var err error
	if phone != "" {
		existing, err = r.GetByPhone(clinicID, phone)
	}
	if err != nil {
		return nil, err
	}
	if existing == nil && email != "" {
		existing, err = r.GetByEmail(clinicID, email)
		if err != nil {
			return nil, err
		}
	}
	if existing != nil {
		_, err = r.db.Exec(`
			UPDATE mobile_users SET
				app_role = $3,
				display_name = COALESCE(NULLIF($4, ''), display_name),
				phone = COALESCE(NULLIF($5, ''), phone),
				email = COALESCE(NULLIF($6, ''), email)
			WHERE id = $1 AND clinic_id = $2
		`, existing.ID, clinicID, role, displayName, phone, email)
		if err != nil {
			return nil, err
		}
		return r.GetByID(existing.ID)
	}

	row := r.db.QueryRow(`
		INSERT INTO mobile_users (clinic_id, phone, email, display_name, app_role, linked_at)
		VALUES ($1, NULLIF($2, ''), NULLIF($3, ''), NULLIF($4, ''), $5, NOW())
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role
	`, clinicID, phone, email, displayName, role)
	return scanMobileUser(row)
}

// SaveAuthCode сохраняет хеш OTP. login — телефон или email; phone заполняется для telegram/whatsapp.
func (r *MobileAuthRepository) SaveAuthCode(clinicID int, channel, login, phone, codeHash string, expiresAt time.Time) error {
	var phoneArg any
	if phone != "" {
		phoneArg = phone
	}
	_, err := r.db.Exec(`
		INSERT INTO auth_codes (clinic_id, phone, channel, login, code_hash, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, clinicID, phoneArg, channel, login, codeHash, expiresAt)
	return err
}

// CountRecentAuthRequests считает запросы кода за окно (антиспам).
func (r *MobileAuthRepository) CountRecentAuthRequests(clinicID int, channel, login string, since time.Time) (int, error) {
	var n int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM auth_codes
		WHERE clinic_id = $1 AND channel = $2 AND login = $3 AND created_at >= $4
	`, clinicID, channel, login, since).Scan(&n)
	return n, err
}

// LatestValidCodeHash возвращает последний неистёкший хеш для канала и логина.
func (r *MobileAuthRepository) LatestValidCodeHash(clinicID int, channel, login string, now time.Time) (string, error) {
	var hash string
	err := r.db.QueryRow(`
		SELECT code_hash FROM auth_codes
		WHERE clinic_id = $1 AND channel = $2 AND login = $3 AND expires_at > $4
		ORDER BY created_at DESC
		LIMIT 1
	`, clinicID, channel, login, now).Scan(&hash)
	if errors.Is(err, sql.ErrNoRows) {
		return "", nil
	}
	return hash, err
}

// PurgeExpiredCodes удаляет старые коды (best-effort).
func (r *MobileAuthRepository) PurgeExpiredCodes(before time.Time) {
	_, _ = r.db.Exec(`DELETE FROM auth_codes WHERE expires_at < $1`, before)
}

func (r *MobileAuthRepository) staffLoginTaken(clinicID int, login string, excludeUserID int64) (bool, error) {
	var n int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM mobile_users
		WHERE clinic_id = $1 AND lower(staff_login) = lower($2) AND id <> $3
	`, clinicID, login, excludeUserID).Scan(&n)
	return n > 0, err
}

func (r *MobileAuthRepository) AllocateStaffLogin(clinicID int, base string) (string, error) {
	login := base
	for n := 2; n < 80; n++ {
		taken, err := r.staffLoginTaken(clinicID, login, 0)
		if err != nil {
			return "", err
		}
		if !taken {
			return login, nil
		}
		login = base + strconv.Itoa(n)
	}
	return "", errors.New("не удалось подобрать логин")
}

func (r *MobileAuthRepository) CreateStaffAccount(clinicID int, displayName, login, passwordHash, role string) (*MobileUser, error) {
	role = NormalizeAppRole(role)
	if !IsStaffAppRole(role) {
		return nil, errors.New("недопустимая роль")
	}
	row := r.db.QueryRow(`
		INSERT INTO mobile_users (clinic_id, display_name, app_role, staff_login, password_hash, linked_at)
		VALUES ($1, NULLIF($2, ''), $3, $4, $5, NOW())
		RETURNING id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role
	`, clinicID, displayName, role, login, passwordHash)
	return scanMobileUser(row)
}

func (r *MobileAuthRepository) SetStaffPassword(clinicID int, userID int64, passwordHash string) error {
	res, err := r.db.Exec(`
		UPDATE mobile_users SET password_hash = $3
		WHERE id = $1 AND clinic_id = $2
	`, userID, clinicID, passwordHash)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *MobileAuthRepository) GetStaffByLogin(clinicID int, login string) (*MobileUser, string, error) {
	login = strings.TrimSpace(login)
	if login == "" {
		return nil, "", sql.ErrNoRows
	}
	var hash sql.NullString
	row := r.db.QueryRow(`
		SELECT id, clinic_id, phone, telegram_user_id, vk_user_id, display_name, email, photo_url, linked_at, created_at, app_role, password_hash
		FROM mobile_users
		WHERE clinic_id = $1 AND lower(staff_login) = lower($2)
	`, clinicID, login)
	var u MobileUser
	var phone, email sql.NullString
	err := row.Scan(
		&u.ID, &u.ClinicID, &phone, &u.TelegramUserID,
		&u.VkUserID, &u.DisplayName, &email, &u.PhotoURL, &u.LinkedAt, &u.CreatedAt, &u.AppRole, &hash,
	)
	if err != nil {
		return nil, "", err
	}
	if phone.Valid {
		u.Phone = phone.String
	}
	if email.Valid {
		u.Email = email.String
	}
	u.AppRole = NormalizeAppRole(u.AppRole)
	if !IsStaffAppRole(u.AppRole) || !hash.Valid || hash.String == "" {
		return nil, "", sql.ErrNoRows
	}
	return &u, hash.String, nil
}
