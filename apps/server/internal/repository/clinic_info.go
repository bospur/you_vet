package repository

import (
	"database/sql"
	"time"
)

type ClinicInfo struct {
	ID          int       `json:"id"`
	ClinicID    int       `json:"clinic_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Phone       string    `json:"phone"`
	Address     string    `json:"address"`
	Email       string    `json:"email"`
	Website     string    `json:"website"`
	LogoURL     string    `json:"logo_url"`
	BannerURL   string    `json:"banner_url"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ClinicInfoInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	Phone       string `json:"phone"`
	Address     string `json:"address"`
	Email       string `json:"email"`
	Website     string `json:"website"`
}

type ClinicInfoRepository struct {
	db *sql.DB
}

func NewClinicInfoRepository(db *sql.DB) *ClinicInfoRepository {
	return &ClinicInfoRepository{db: db}
}

// GetByClinicID возвращает info клиники. Если записи нет — возвращает пустую структуру (не ошибку).
func (r *ClinicInfoRepository) GetByClinicID(clinicID int) (*ClinicInfo, error) {
	row := r.db.QueryRow(`
		SELECT id, clinic_id, name, description, phone, address, email, website, logo_url, banner_url, updated_at
		FROM clinic_info
		WHERE clinic_id = $1
	`, clinicID)

	var ci ClinicInfo
	err := row.Scan(
		&ci.ID, &ci.ClinicID,
		&ci.Name, &ci.Description,
		&ci.Phone, &ci.Address, &ci.Email, &ci.Website,
		&ci.LogoURL, &ci.BannerURL, &ci.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return &ClinicInfo{ClinicID: clinicID}, nil
	}
	if err != nil {
		return nil, err
	}
	return &ci, nil
}

// GetByClinicSlug возвращает info по slug клиники (для публичного API).
func (r *ClinicInfoRepository) GetByClinicSlug(slug string) (*ClinicInfo, error) {
	row := r.db.QueryRow(`
		SELECT ci.id, ci.clinic_id, ci.name, ci.description, ci.phone, ci.address,
		       ci.email, ci.website, ci.logo_url, ci.banner_url, ci.updated_at
		FROM clinic_info ci
		JOIN clinics c ON c.id = ci.clinic_id
		WHERE c.slug = $1
	`, slug)

	var ci ClinicInfo
	err := row.Scan(
		&ci.ID, &ci.ClinicID,
		&ci.Name, &ci.Description,
		&ci.Phone, &ci.Address, &ci.Email, &ci.Website,
		&ci.LogoURL, &ci.BannerURL, &ci.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return &ClinicInfo{}, nil
	}
	if err != nil {
		return nil, err
	}
	return &ci, nil
}

// Upsert создаёт или обновляет текстовые поля clinic_info.
func (r *ClinicInfoRepository) Upsert(clinicID int, input ClinicInfoInput) (*ClinicInfo, error) {
	row := r.db.QueryRow(`
		INSERT INTO clinic_info (clinic_id, name, description, phone, address, email, website, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
		ON CONFLICT (clinic_id) DO UPDATE SET
			name        = EXCLUDED.name,
			description = EXCLUDED.description,
			phone       = EXCLUDED.phone,
			address     = EXCLUDED.address,
			email       = EXCLUDED.email,
			website     = EXCLUDED.website,
			updated_at  = NOW()
		RETURNING id, clinic_id, name, description, phone, address, email, website, logo_url, banner_url, updated_at
	`, clinicID, input.Name, input.Description, input.Phone, input.Address, input.Email, input.Website)

	var ci ClinicInfo
	if err := row.Scan(
		&ci.ID, &ci.ClinicID,
		&ci.Name, &ci.Description,
		&ci.Phone, &ci.Address, &ci.Email, &ci.Website,
		&ci.LogoURL, &ci.BannerURL, &ci.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &ci, nil
}

// UpdateLogoURL обновляет только logo_url.
func (r *ClinicInfoRepository) UpdateLogoURL(clinicID int, url string) (*ClinicInfo, error) {
	return r.updateImageURL(clinicID, "logo_url", url)
}

// UpdateBannerURL обновляет только banner_url.
func (r *ClinicInfoRepository) UpdateBannerURL(clinicID int, url string) (*ClinicInfo, error) {
	return r.updateImageURL(clinicID, "banner_url", url)
}

func (r *ClinicInfoRepository) updateImageURL(clinicID int, field, url string) (*ClinicInfo, error) {
	// Убеждаемся что строка существует перед обновлением
	_, err := r.db.Exec(`
		INSERT INTO clinic_info (clinic_id) VALUES ($1)
		ON CONFLICT (clinic_id) DO NOTHING
	`, clinicID)
	if err != nil {
		return nil, err
	}

	query := `
		UPDATE clinic_info SET ` + field + ` = $1, updated_at = NOW()
		WHERE clinic_id = $2
		RETURNING id, clinic_id, name, description, phone, address, email, website, logo_url, banner_url, updated_at
	`
	row := r.db.QueryRow(query, url, clinicID)

	var ci ClinicInfo
	if err := row.Scan(
		&ci.ID, &ci.ClinicID,
		&ci.Name, &ci.Description,
		&ci.Phone, &ci.Address, &ci.Email, &ci.Website,
		&ci.LogoURL, &ci.BannerURL, &ci.UpdatedAt,
	); err != nil {
		return nil, err
	}
	return &ci, nil
}
