package repository

import (
	"database/sql"

	"go-server/internal/slug"
)

// Article — структура статьи
type Article struct {
	ID         int    `json:"id"`
	AnimalID   int    `json:"animal_id"`
	AnimalName string `json:"animal_name,omitempty"`
	Title      string `json:"title"`
	Content    string `json:"content"`
	Slug       string `json:"slug"`
	Status     string `json:"status"`
	Featured   bool   `json:"featured"`
}

// ArticleListItem — статья в списке (без content)
type ArticleListItem struct {
	ID    int    `json:"id"`
	Title string `json:"title"`
	Slug  string `json:"slug"`
}

// FeaturedArticle — статья для блока на главной
type FeaturedArticle struct {
	ID         int    `json:"id"`
	Title      string `json:"title"`
	Slug       string `json:"slug"`
	AnimalName string `json:"animal_name"`
}

// ArticleInput — данные для создания/обновления статьи
type ArticleInput struct {
	Title    string `json:"title"`
	Content  string `json:"content"`
	AnimalID int    `json:"animal_id"`
}

// ArticleRepository — отвечает за запросы к таблице articles
type ArticleRepository struct {
	db *sql.DB
}

// NewArticleRepository создаёт новый репозиторий
func NewArticleRepository(db *sql.DB) *ArticleRepository {
	return &ArticleRepository{db: db}
}

func (r *ArticleRepository) slugExists(clinicID int, s string, excludeID string) bool {
	var id int
	err := r.db.QueryRow(`
		SELECT id FROM articles WHERE clinic_id = $1 AND slug = $2 AND ($3 = '' OR id::text != $3)
	`, clinicID, s, excludeID).Scan(&id)
	return err == nil
}

func (r *ArticleRepository) resolveSlug(clinicID int, title, excludeID string) string {
	base := slug.FromTitle(title)
	return slug.UniqueSuffix(base, func(s string) bool {
		return r.slugExists(clinicID, s, excludeID)
	})
}

// Create создаёт новую статью со статусом draft
func (r *ArticleRepository) Create(clinicID int, input ArticleInput) (*Article, error) {
	s := r.resolveSlug(clinicID, input.Title, "")
	var a Article
	err := r.db.QueryRow(`
		INSERT INTO articles (clinic_id, animal_id, title, content, slug, status)
		VALUES ($1, $2, $3, $4, $5, 'draft')
		RETURNING id, animal_id, title, content, slug, status, featured
	`, clinicID, input.AnimalID, input.Title, input.Content, s).
		Scan(&a.ID, &a.AnimalID, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// Update обновляет статью (slug пересчитывается из заголовка)
func (r *ArticleRepository) Update(clinicID int, id string, input ArticleInput) (*Article, error) {
	s := r.resolveSlug(clinicID, input.Title, id)
	var a Article
	err := r.db.QueryRow(`
		UPDATE articles SET title=$1, content=$2, slug=$3, animal_id=$4, updated_at=NOW()
		WHERE id=$5 AND clinic_id=$6
		RETURNING id, animal_id, title, content, slug, status, featured
	`, input.Title, input.Content, s, input.AnimalID, id, clinicID).
		Scan(&a.ID, &a.AnimalID, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// UpdateStatus меняет статус статьи
func (r *ArticleRepository) UpdateStatus(clinicID int, id, status string) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		UPDATE articles SET status=$1, featured = CASE WHEN $1 = 'draft' THEN false ELSE featured END, updated_at=NOW()
		WHERE id=$2 AND clinic_id=$3
		RETURNING id, animal_id, title, content, slug, status, featured
	`, status, id, clinicID).
		Scan(&a.ID, &a.AnimalID, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// GetStatus возвращает текущий статус статьи
func (r *ArticleRepository) GetStatus(clinicID int, id string) (string, error) {
	var status string
	err := r.db.QueryRow(`SELECT status FROM articles WHERE id=$1 AND clinic_id=$2`, id, clinicID).Scan(&status)
	if err != nil {
		return "", err
	}
	return status, nil
}

// Delete удаляет статью по id в рамках клиники
func (r *ArticleRepository) Delete(clinicID int, id string) error {
	_, err := r.db.Exec(`DELETE FROM articles WHERE id=$1 AND clinic_id=$2`, id, clinicID)
	return err
}

// GetAll возвращает все статьи клиники (для админки)
func (r *ArticleRepository) GetAll(clinicID int) ([]Article, error) {
	rows, err := r.db.Query(`
		SELECT a.id, a.animal_id, an.name, a.title, a.content, a.slug, a.status, a.featured
		FROM articles a
		JOIN animals an ON an.id = a.animal_id
		WHERE a.clinic_id = $1
		ORDER BY an.sort_order, an.name, a.title
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []Article
	for rows.Next() {
		var a Article
		if err := rows.Scan(&a.ID, &a.AnimalID, &a.AnimalName, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured); err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}
	return articles, nil
}

// GetByID возвращает статью по id в рамках клиники
func (r *ArticleRepository) GetByID(clinicID int, id string) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		SELECT a.id, a.animal_id, an.name, a.title, a.content, a.slug, a.status, a.featured
		FROM articles a
		JOIN animals an ON an.id = a.animal_id
		WHERE a.id=$1 AND a.clinic_id=$2
	`, id, clinicID).
		Scan(&a.ID, &a.AnimalID, &a.AnimalName, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// GetPublishedByAnimal возвращает опубликованные статьи животного (публичный API / бот)
func (r *ArticleRepository) GetPublishedByAnimal(clinicSlug, animalSlug string) ([]ArticleListItem, error) {
	rows, err := r.db.Query(`
		SELECT a.id, a.title, a.slug
		FROM articles a
		JOIN animals an ON an.id = a.animal_id
		JOIN clinics cl ON cl.id = an.clinic_id
		WHERE cl.slug = $1 AND an.slug = $2 AND a.status = 'published'
		ORDER BY a.title
	`, clinicSlug, animalSlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []ArticleListItem
	for rows.Next() {
		var a ArticleListItem
		if err := rows.Scan(&a.ID, &a.Title, &a.Slug); err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}
	return articles, nil
}

// GetBySlug возвращает опубликованную статью по slug
func (r *ArticleRepository) GetBySlug(clinicSlug, slug string) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		SELECT a.id, a.animal_id, an.name, a.title, a.content, a.slug, a.status, a.featured
		FROM articles a
		JOIN animals an ON an.id = a.animal_id
		JOIN clinics c ON c.id = a.clinic_id
		WHERE c.slug = $1 AND a.slug = $2 AND a.status = 'published'
	`, clinicSlug, slug).
		Scan(&a.ID, &a.AnimalID, &a.AnimalName, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// AnimalBelongsToClinic проверяет, что животное принадлежит клинике
func (r *ArticleRepository) AnimalBelongsToClinic(clinicID, animalID int) (bool, error) {
	var ok bool
	err := r.db.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM animals WHERE id = $1 AND clinic_id = $2)
	`, animalID, clinicID).Scan(&ok)
	return ok, err
}

const MaxFeaturedArticles = 3

// CountFeatured возвращает число статей на главной (кроме excludeID)
func (r *ArticleRepository) CountFeatured(clinicID int, excludeID string) (int, error) {
	var count int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM articles
		WHERE clinic_id = $1 AND featured = true AND ($2 = '' OR id::text != $2)
	`, clinicID, excludeID).Scan(&count)
	return count, err
}

// UpdateFeatured включает/выключает показ статьи на главной
func (r *ArticleRepository) UpdateFeatured(clinicID int, id string, featured bool) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		UPDATE articles SET featured = $1, updated_at = NOW()
		WHERE id = $2 AND clinic_id = $3
		RETURNING id, animal_id, title, content, slug, status, featured
	`, featured, id, clinicID).
		Scan(&a.ID, &a.AnimalID, &a.Title, &a.Content, &a.Slug, &a.Status, &a.Featured)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// GetFeaturedPublished возвращает опубликованные статьи для блока на главной
func (r *ArticleRepository) GetFeaturedPublished(clinicSlug string, limit int) ([]FeaturedArticle, error) {
	rows, err := r.db.Query(`
		SELECT a.id, a.title, a.slug, an.name
		FROM articles a
		JOIN animals an ON an.id = a.animal_id
		JOIN clinics cl ON cl.id = a.clinic_id
		WHERE cl.slug = $1 AND a.status = 'published' AND a.featured = true
		ORDER BY a.updated_at DESC
		LIMIT $2
	`, clinicSlug, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []FeaturedArticle
	for rows.Next() {
		var a FeaturedArticle
		if err := rows.Scan(&a.ID, &a.Title, &a.Slug, &a.AnimalName); err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}
	return articles, nil
}
