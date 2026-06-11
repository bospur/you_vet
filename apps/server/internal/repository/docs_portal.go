package repository

import (
	"database/sql"
	"strings"
	"time"
)

type DocsVisitor struct {
	ID          int64
	DisplayName string
	CreatedAt   time.Time
}

type DocsComment struct {
	ID          int64
	PageSlug    string
	VisitorID   int64
	Body        string
	DisplayName string
	CreatedAt   time.Time
}

type DocsPortalRepository struct {
	db *sql.DB
}

func NewDocsPortalRepository(db *sql.DB) *DocsPortalRepository {
	return &DocsPortalRepository{db: db}
}

func (r *DocsPortalRepository) CreateVisitor(displayName string) (*DocsVisitor, error) {
	name := strings.TrimSpace(displayName)
	var v DocsVisitor
	err := r.db.QueryRow(
		`INSERT INTO docs_visitors (display_name) VALUES ($1)
		 RETURNING id, display_name, created_at`,
		name,
	).Scan(&v.ID, &v.DisplayName, &v.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *DocsPortalRepository) GetVisitor(id int64) (*DocsVisitor, error) {
	var v DocsVisitor
	err := r.db.QueryRow(
		`SELECT id, display_name, created_at FROM docs_visitors WHERE id = $1`,
		id,
	).Scan(&v.ID, &v.DisplayName, &v.CreatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &v, nil
}

func (r *DocsPortalRepository) ListComments(pageSlug string) ([]DocsComment, error) {
	rows, err := r.db.Query(
		`SELECT c.id, c.page_slug, c.visitor_id, c.body, v.display_name, c.created_at
		 FROM docs_comments c
		 JOIN docs_visitors v ON v.id = c.visitor_id
		 WHERE c.page_slug = $1
		 ORDER BY c.created_at ASC`,
		pageSlug,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []DocsComment
	for rows.Next() {
		var c DocsComment
		if err := rows.Scan(&c.ID, &c.PageSlug, &c.VisitorID, &c.Body, &c.DisplayName, &c.CreatedAt); err != nil {
			return nil, err
		}
		items = append(items, c)
	}
	return items, rows.Err()
}

func (r *DocsPortalRepository) CreateComment(pageSlug string, visitorID int64, body string) (*DocsComment, error) {
	var c DocsComment
	err := r.db.QueryRow(
		`INSERT INTO docs_comments (page_slug, visitor_id, body)
		 VALUES ($1, $2, $3)
		 RETURNING id, page_slug, visitor_id, body, created_at`,
		pageSlug, visitorID, strings.TrimSpace(body),
	).Scan(&c.ID, &c.PageSlug, &c.VisitorID, &c.Body, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	visitor, err := r.GetVisitor(visitorID)
	if err != nil {
		return nil, err
	}
	if visitor != nil {
		c.DisplayName = visitor.DisplayName
	}
	return &c, nil
}
