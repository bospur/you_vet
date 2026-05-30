package repository

import (
	"database/sql"
)

// Article — структура статьи
type Article struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
	Slug    string `json:"slug"`
	Status  string `json:"status"`
}

// ArticleInput — данные для создания/обновления содержимого статьи
type ArticleInput struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Slug    string `json:"slug"`
}

// ArticleRepository — отвечает за запросы к таблице articles
type ArticleRepository struct {
	db *sql.DB
}

// NewArticleRepository создаёт новый репозиторий
func NewArticleRepository(db *sql.DB) *ArticleRepository {
	return &ArticleRepository{db: db}
}

// Create создаёт новую статью со статусом draft
func (r *ArticleRepository) Create(clinicID int, input ArticleInput) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		INSERT INTO articles (clinic_id, title, content, slug, status)
		VALUES ($1, $2, $3, $4, 'draft')
		RETURNING id, title, content, slug, status
	`, clinicID, input.Title, input.Content, input.Slug).
		Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// Update обновляет содержимое статьи (только title, content, slug — не статус)
func (r *ArticleRepository) Update(clinicID int, id string, input ArticleInput) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		UPDATE articles SET title=$1, content=$2, slug=$3, updated_at=NOW()
		WHERE id=$4 AND clinic_id=$5
		RETURNING id, title, content, slug, status
	`, input.Title, input.Content, input.Slug, id, clinicID).
		Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status)
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
		UPDATE articles SET status=$1, updated_at=NOW()
		WHERE id=$2 AND clinic_id=$3
		RETURNING id, title, content, slug, status
	`, status, id, clinicID).
		Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status)
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

// AssignToCategory привязывает статью к категории (обе сущности — одной клиники)
func (r *ArticleRepository) AssignToCategory(clinicID int, articleID, categoryID string) error {
	_, err := r.db.Exec(`
		INSERT INTO article_categories (article_id, category_id)
		SELECT $1, $2
		WHERE EXISTS (SELECT 1 FROM articles WHERE id=$1 AND clinic_id=$3)
		  AND EXISTS (SELECT 1 FROM categories WHERE id=$2 AND clinic_id=$3)
		ON CONFLICT DO NOTHING
	`, articleID, categoryID, clinicID)
	return err
}

// RemoveFromCategory отвязывает статью от категории
func (r *ArticleRepository) RemoveFromCategory(clinicID int, articleID, categoryID string) error {
	_, err := r.db.Exec(`
		DELETE FROM article_categories ac
		USING articles a
		WHERE ac.article_id = a.id AND ac.article_id=$1 AND ac.category_id=$2 AND a.clinic_id=$3
	`, articleID, categoryID, clinicID)
	return err
}

// GetAll возвращает все статьи клиники (включая черновики — для админки)
func (r *ArticleRepository) GetAll(clinicID int) ([]Article, error) {
	rows, err := r.db.Query(`
		SELECT id, title, content, slug, status FROM articles
		WHERE clinic_id = $1
		ORDER BY title
	`, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []Article
	for rows.Next() {
		var a Article
		if err := rows.Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status); err != nil {
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
		SELECT id, title, content, slug, status FROM articles WHERE id=$1 AND clinic_id=$2
	`, id, clinicID).Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &a, nil
}

// GetCategories возвращает категории, привязанные к статье
func (r *ArticleRepository) GetCategories(clinicID int, articleID string) ([]Category, error) {
	rows, err := r.db.Query(`
		SELECT c.id, c.animal_id, c.name, c.slug, COALESCE(c.icon, ''), c.sort_order
		FROM categories c
		JOIN article_categories ac ON ac.category_id = c.id
		JOIN articles a ON a.id = ac.article_id
		WHERE ac.article_id = $1 AND a.clinic_id = $2
		ORDER BY c.name
	`, articleID, clinicID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []Category
	for rows.Next() {
		var c Category
		if err := rows.Scan(&c.ID, &c.AnimalID, &c.Name, &c.Slug, &c.Icon, &c.SortOrder); err != nil {
			return nil, err
		}
		categories = append(categories, c)
	}
	return categories, nil
}

// GetByCategory возвращает опубликованные статьи для конкретной категории (для публичного API / бота)
func (r *ArticleRepository) GetByCategory(clinicSlug, animalSlug, categorySlug string) ([]Article, error) {
	rows, err := r.db.Query(`
		SELECT a.id, a.title, a.content, a.slug, a.status
		FROM articles a
		JOIN article_categories ac ON ac.article_id = a.id
		JOIN categories c ON c.id = ac.category_id
		JOIN animals an ON an.id = c.animal_id
		JOIN clinics cl ON cl.id = an.clinic_id
		WHERE cl.slug = $1 AND an.slug = $2 AND c.slug = $3 AND a.status = 'published'
		ORDER BY a.title
	`, clinicSlug, animalSlug, categorySlug)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var articles []Article
	for rows.Next() {
		var a Article
		if err := rows.Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status); err != nil {
			return nil, err
		}
		articles = append(articles, a)
	}

	return articles, nil
}

// GetBySlug возвращает опубликованную статью по slug (для публичного API / бота)
func (r *ArticleRepository) GetBySlug(clinicSlug, slug string) (*Article, error) {
	var a Article
	err := r.db.QueryRow(`
		SELECT a.id, a.title, a.content, a.slug, a.status
		FROM articles a
		JOIN clinics c ON c.id = a.clinic_id
		WHERE c.slug = $1 AND a.slug = $2 AND a.status = 'published'
	`, clinicSlug, slug).Scan(&a.ID, &a.Title, &a.Content, &a.Slug, &a.Status)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	return &a, nil
}
