package repository

import (
	"database/sql"
	"strings"
	"time"

	"github.com/lib/pq"
)

type DocsVisitor struct {
	ID           int64
	DisplayName  string
	PasswordHash string
	CreatedAt    time.Time
	LastSeenAt   *time.Time
}

type DocsVisitorAdmin struct {
	ID          int64
	DisplayName string
	CreatedAt   time.Time
	LastSeenAt  *time.Time
	HasPassword bool
}

type DocsPortalStats struct {
	VisitorsTotal        int `json:"visitors_total"`
	VisitorsWithPassword int `json:"visitors_with_password"`
	ActiveToday          int `json:"active_today"`
}

type DocsComment struct {
	ID          int64
	PageSlug    string
	VisitorID   int64
	Body        string
	DisplayName string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type DocsTask struct {
	ID          int64
	Title       string
	Description string
	Tags        []string
	Status      string
	Priority    string
	Position    int
	VisitorID   int64
	DisplayName string
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type DocsPortalRepository struct {
	db *sql.DB
}

func NewDocsPortalRepository(db *sql.DB) *DocsPortalRepository {
	return &DocsPortalRepository{db: db}
}

func scanDocsVisitor(scanner interface{ Scan(dest ...any) error }) (*DocsVisitor, error) {
	var v DocsVisitor
	var hash sql.NullString
	var lastSeen sql.NullTime
	err := scanner.Scan(&v.ID, &v.DisplayName, &hash, &v.CreatedAt, &lastSeen)
	if err != nil {
		return nil, err
	}
	if hash.Valid {
		v.PasswordHash = hash.String
	}
	if lastSeen.Valid {
		t := lastSeen.Time
		v.LastSeenAt = &t
	}
	return &v, nil
}

const docsVisitorCols = `id, display_name, password_hash, created_at, last_seen_at`

func (r *DocsPortalRepository) CreateVisitorWithPassword(displayName, passwordHash string) (*DocsVisitor, error) {
	name := strings.TrimSpace(displayName)
	row := r.db.QueryRow(
		`INSERT INTO docs_visitors (display_name, password_hash, last_seen_at)
		 VALUES ($1, $2, NOW())
		 RETURNING `+docsVisitorCols,
		name, passwordHash,
	)
	v, err := scanDocsVisitor(row)
	if err != nil {
		return nil, err
	}
	return v, nil
}

func (r *DocsPortalRepository) GetVisitorByName(displayName string) (*DocsVisitor, error) {
	row := r.db.QueryRow(
		`SELECT `+docsVisitorCols+` FROM docs_visitors
		 WHERE lower(display_name) = lower($1)
		 LIMIT 1`,
		strings.TrimSpace(displayName),
	)
	v, err := scanDocsVisitor(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return v, nil
}

func (r *DocsPortalRepository) SetVisitorPassword(id int64, passwordHash string) error {
	res, err := r.db.Exec(
		`UPDATE docs_visitors SET password_hash = $1 WHERE id = $2 AND (password_hash IS NULL OR password_hash = '')`,
		passwordHash, id,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *DocsPortalRepository) GetVisitor(id int64) (*DocsVisitor, error) {
	row := r.db.QueryRow(
		`SELECT `+docsVisitorCols+` FROM docs_visitors WHERE id = $1`,
		id,
	)
	v, err := scanDocsVisitor(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return v, nil
}

func (r *DocsPortalRepository) TouchLastSeen(id int64) error {
	_, err := r.db.Exec(`UPDATE docs_visitors SET last_seen_at = NOW() WHERE id = $1`, id)
	return err
}

func (r *DocsPortalRepository) ListVisitorsAdmin() ([]DocsVisitorAdmin, error) {
	rows, err := r.db.Query(
		`SELECT id, display_name, created_at, last_seen_at,
		        (password_hash IS NOT NULL AND password_hash <> '')
		 FROM docs_visitors
		 ORDER BY last_seen_at DESC NULLS LAST, id DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []DocsVisitorAdmin
	for rows.Next() {
		var v DocsVisitorAdmin
		var lastSeen sql.NullTime
		if err := rows.Scan(
			&v.ID, &v.DisplayName, &v.CreatedAt, &lastSeen, &v.HasPassword,
		); err != nil {
			return nil, err
		}
		if lastSeen.Valid {
			t := lastSeen.Time
			v.LastSeenAt = &t
		}
		items = append(items, v)
	}
	if items == nil {
		items = []DocsVisitorAdmin{}
	}
	return items, rows.Err()
}

func (r *DocsPortalRepository) GetPortalStats() (*DocsPortalStats, error) {
	var s DocsPortalStats
	err := r.db.QueryRow(
		`SELECT
		    COUNT(*),
		    COUNT(*) FILTER (WHERE password_hash IS NOT NULL AND password_hash <> ''),
		    COUNT(*) FILTER (WHERE last_seen_at >= date_trunc('day', NOW()))
		 FROM docs_visitors`,
	).Scan(&s.VisitorsTotal, &s.VisitorsWithPassword, &s.ActiveToday)
	if err != nil {
		return nil, err
	}
	return &s, nil
}

func (r *DocsPortalRepository) ListComments(pageSlug string) ([]DocsComment, error) {
	rows, err := r.db.Query(
		`SELECT c.id, c.page_slug, c.visitor_id, c.body, v.display_name, c.created_at, c.updated_at
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
		if err := rows.Scan(&c.ID, &c.PageSlug, &c.VisitorID, &c.Body, &c.DisplayName, &c.CreatedAt, &c.UpdatedAt); err != nil {
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
		 RETURNING id, page_slug, visitor_id, body, created_at, updated_at`,
		pageSlug, visitorID, strings.TrimSpace(body),
	).Scan(&c.ID, &c.PageSlug, &c.VisitorID, &c.Body, &c.CreatedAt, &c.UpdatedAt)
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

func (r *DocsPortalRepository) GetComment(id int64) (*DocsComment, error) {
	var c DocsComment
	err := r.db.QueryRow(
		`SELECT c.id, c.page_slug, c.visitor_id, c.body, v.display_name, c.created_at, c.updated_at
		 FROM docs_comments c
		 JOIN docs_visitors v ON v.id = c.visitor_id
		 WHERE c.id = $1`,
		id,
	).Scan(&c.ID, &c.PageSlug, &c.VisitorID, &c.Body, &c.DisplayName, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (r *DocsPortalRepository) UpdateComment(id, visitorID int64, body string) (*DocsComment, error) {
	res, err := r.db.Exec(
		`UPDATE docs_comments SET body = $1, updated_at = NOW()
		 WHERE id = $2 AND visitor_id = $3`,
		strings.TrimSpace(body), id, visitorID,
	)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return nil, sql.ErrNoRows
	}
	return r.GetComment(id)
}

func (r *DocsPortalRepository) DeleteComment(id, visitorID int64) error {
	res, err := r.db.Exec(
		`DELETE FROM docs_comments WHERE id = $1 AND visitor_id = $2`,
		id, visitorID,
	)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func scanTask(scanner interface{ Scan(dest ...any) error }) (*DocsTask, error) {
	var t DocsTask
	var tags pq.StringArray
	err := scanner.Scan(
		&t.ID, &t.Title, &t.Description, &tags, &t.Status, &t.Priority, &t.Position,
		&t.VisitorID, &t.DisplayName, &t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	t.Tags = []string(tags)
	if t.Tags == nil {
		t.Tags = []string{}
	}
	return &t, nil
}

func (r *DocsPortalRepository) ListTasks() ([]DocsTask, error) {
	rows, err := r.db.Query(
		`SELECT t.id, t.title, t.description, t.tags, t.status, t.priority, t.position, t.visitor_id, v.display_name, t.created_at, t.updated_at
		 FROM docs_tasks t
		 JOIN docs_visitors v ON v.id = t.visitor_id
		 ORDER BY
		   CASE t.status
		     WHEN 'analysis' THEN 0
		     WHEN 'todo' THEN 1
		     WHEN 'in_progress' THEN 2
		     WHEN 'testing' THEN 3
		     ELSE 4
		   END,
		   CASE t.priority WHEN 'high' THEN 0 WHEN 'normal' THEN 1 ELSE 2 END,
		   t.position ASC,
		   t.id ASC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []DocsTask
	for rows.Next() {
		task, err := scanTask(rows)
		if err != nil {
			return nil, err
		}
		items = append(items, *task)
	}
	return items, rows.Err()
}

func (r *DocsPortalRepository) nextTaskPosition(status string) (int, error) {
	var pos int
	err := r.db.QueryRow(
		`SELECT COALESCE(MAX(position), -1) + 1 FROM docs_tasks WHERE status = $1`,
		status,
	).Scan(&pos)
	return pos, err
}

func (r *DocsPortalRepository) CreateTask(visitorID int64, title, priority, description string, tags []string) (*DocsTask, error) {
	pos, err := r.nextTaskPosition("todo")
	if err != nil {
		return nil, err
	}
	if tags == nil {
		tags = []string{}
	}
	var t DocsTask
	var tagArr pq.StringArray
	err = r.db.QueryRow(
		`INSERT INTO docs_tasks (title, status, priority, position, visitor_id, description, tags)
		 VALUES ($1, 'todo', $2, $3, $4, $5, $6)
		 RETURNING id, title, description, tags, status, priority, position, visitor_id, created_at, updated_at`,
		strings.TrimSpace(title), priority, pos, visitorID, description, pq.Array(tags),
	).Scan(&t.ID, &t.Title, &t.Description, &tagArr, &t.Status, &t.Priority, &t.Position, &t.VisitorID, &t.CreatedAt, &t.UpdatedAt)
	if err != nil {
		return nil, err
	}
	t.Tags = []string(tagArr)
	if t.Tags == nil {
		t.Tags = []string{}
	}
	visitor, err := r.GetVisitor(visitorID)
	if err != nil {
		return nil, err
	}
	if visitor != nil {
		t.DisplayName = visitor.DisplayName
	}
	return &t, nil
}

func (r *DocsPortalRepository) GetTask(id int64) (*DocsTask, error) {
	row := r.db.QueryRow(
		`SELECT t.id, t.title, t.description, t.tags, t.status, t.priority, t.position, t.visitor_id, v.display_name, t.created_at, t.updated_at
		 FROM docs_tasks t
		 JOIN docs_visitors v ON v.id = t.visitor_id
		 WHERE t.id = $1`,
		id,
	)
	task, err := scanTask(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return task, nil
}

func (r *DocsPortalRepository) UpdateTask(id int64, title, status, priority, description *string, tags *[]string) (*DocsTask, error) {
	task, err := r.GetTask(id)
	if err != nil {
		return nil, err
	}
	if task == nil {
		return nil, nil
	}

	newTitle := task.Title
	if title != nil {
		newTitle = strings.TrimSpace(*title)
	}
	newStatus := task.Status
	if status != nil {
		newStatus = *status
	}
	newPriority := task.Priority
	if priority != nil {
		newPriority = *priority
	}
	newDescription := task.Description
	if description != nil {
		newDescription = *description
	}
	newTags := task.Tags
	if tags != nil {
		newTags = *tags
		if newTags == nil {
			newTags = []string{}
		}
	}

	newPos := task.Position
	if status != nil && *status != task.Status {
		pos, err := r.nextTaskPosition(newStatus)
		if err != nil {
			return nil, err
		}
		newPos = pos
	}

	_, err = r.db.Exec(
		`UPDATE docs_tasks
		 SET title = $1, status = $2, priority = $3, position = $4, description = $5, tags = $6, updated_at = NOW()
		 WHERE id = $7`,
		newTitle, newStatus, newPriority, newPos, newDescription, pq.Array(newTags), id,
	)
	if err != nil {
		return nil, err
	}
	return r.GetTask(id)
}

func (r *DocsPortalRepository) DeleteTask(id int64) error {
	res, err := r.db.Exec(`DELETE FROM docs_tasks WHERE id = $1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}
