package repository

import (
	"database/sql"
)

// Animal — структура данных животного
type Animal struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
}

// AnimalInput — данные для создания/обновления животного
type AnimalInput struct {
	Name      string `json:"name"`
	Slug      string `json:"slug"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
}

// AnimalRepository — запросы к таблице animals
type AnimalRepository struct {
	db *sql.DB
}

// NewAnimalRepository создаёт новый репозиторий
func NewAnimalRepository(db *sql.DB) *AnimalRepository {
	return &AnimalRepository{db: db}
}

// GetAllByClinic возвращает животных конкретной клиники
func (r *AnimalRepository) GetAllByClinic(clinicSlug string) ([]Animal, error) {
	rows, err := r.db.Query(`
		SELECT a.id, a.name, a.slug, COALESCE(a.icon, ''), a.sort_order
		FROM animals a
		JOIN clinics c ON c.id = a.clinic_id
		WHERE c.slug = $1
		ORDER BY a.sort_order, a.name
	`, clinicSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		if err := rows.Scan(&a.ID, &a.Name, &a.Slug, &a.Icon, &a.SortOrder); err != nil {
			return nil, err
		}
		animals = append(animals, a)
	}

	return animals, nil
}

// GetAllByClinicID — для админки
func (r *AnimalRepository) GetAllByClinicID(clinicID int) ([]Animal, error) {
	rows, err := r.db.Query(`
		SELECT id, name, slug, COALESCE(icon, ''), sort_order
		FROM animals WHERE clinic_id = $1
		ORDER BY sort_order, name
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var animals []Animal
	for rows.Next() {
		var a Animal
		if err := rows.Scan(&a.ID, &a.Name, &a.Slug, &a.Icon, &a.SortOrder); err != nil {
			return nil, err
		}
		animals = append(animals, a)
	}
	return animals, nil
}

// Create создаёт новое животное
func (r *AnimalRepository) Create(clinicID int, input AnimalInput) (*Animal, error) {
	var a Animal
	err := r.db.QueryRow(`
		INSERT INTO animals (clinic_id, name, slug, icon, sort_order)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, name, slug, COALESCE(icon, ''), sort_order
	`, clinicID, input.Name, input.Slug, input.Icon, input.SortOrder).
		Scan(&a.ID, &a.Name, &a.Slug, &a.Icon, &a.SortOrder)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// Update обновляет животное по id в рамках клиники
func (r *AnimalRepository) Update(clinicID int, id string, input AnimalInput) (*Animal, error) {
	var a Animal
	err := r.db.QueryRow(`
		UPDATE animals SET name=$1, slug=$2, icon=$3, sort_order=$4, updated_at=NOW()
		WHERE id=$5 AND clinic_id=$6
		RETURNING id, name, slug, COALESCE(icon, ''), sort_order
	`, input.Name, input.Slug, input.Icon, input.SortOrder, id, clinicID).
		Scan(&a.ID, &a.Name, &a.Slug, &a.Icon, &a.SortOrder)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// Delete удаляет животное по id в рамках клиники
func (r *AnimalRepository) Delete(clinicID int, id string) error {
	_, err := r.db.Exec(`DELETE FROM animals WHERE id=$1 AND clinic_id=$2`, id, clinicID)
	return err
}
