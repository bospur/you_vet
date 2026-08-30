package repository

import (
	"database/sql"
	"errors"
	"strings"
)

const (
	ChatKindWall     = "clinic_wall"
	ChatKindConsult  = "consult"
	ChatStatusOpen   = "open"
	ChatStatusClosed = "closed"

	ChatWallLimitPerDay    = 10
	ChatConsultLimitPerDay = 15
)

var (
	ErrChatForbidden  = errors.New("нет доступа к чату")
	ErrChatLimit      = errors.New("превышен лимит сообщений")
	ErrChatClosed     = errors.New("чат закрыт")
	ErrChatOpenExists = errors.New("уже есть открытый тред")
	ErrChatEmpty      = errors.New("пустое сообщение")
	ErrChatDoctor     = errors.New("врач не найден")
)

type ChatRoom struct {
	ID            int64  `json:"id"`
	ClinicID      int    `json:"clinic_id"`
	Kind          string `json:"kind"`
	CreatedBy     *int64 `json:"created_by_mobile_user_id,omitempty"`
	AssignedStaff *int64 `json:"assigned_staff_id,omitempty"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
	LastPreview   string `json:"last_preview,omitempty"`
	LastAt        string `json:"last_at,omitempty"`
	Unread        int    `json:"unread"`
	PeerName      string `json:"peer_name,omitempty"`
	DoctorID      *int   `json:"doctor_id,omitempty"`
	DoctorName    string `json:"doctor_name,omitempty"`
}

type ChatMessage struct {
	ID         int64  `json:"id"`
	RoomID     int64  `json:"room_id"`
	AuthorID   *int64 `json:"author_id,omitempty"`
	AuthorName string `json:"author_name,omitempty"`
	AuthorRole string `json:"author_role,omitempty"`
	Body       string `json:"body"`
	ImageURL   string `json:"image_url,omitempty"`
	Hidden     bool   `json:"hidden"`
	CreatedAt  string `json:"created_at"`
}

type ChatRepository struct {
	db *sql.DB
}

func NewChatRepository(db *sql.DB) *ChatRepository {
	return &ChatRepository{db: db}
}

func scanRoom(row interface{ Scan(dest ...any) error }) (*ChatRoom, error) {
	var r ChatRoom
	var doctorID sql.NullInt64
	err := row.Scan(&r.ID, &r.ClinicID, &r.Kind, &r.CreatedBy, &r.AssignedStaff, &r.Status, &r.CreatedAt, &doctorID)
	if err != nil {
		return nil, err
	}
	if doctorID.Valid {
		id := int(doctorID.Int64)
		r.DoctorID = &id
	}
	return &r, nil
}

const chatRoomSelect = `
	SELECT id, clinic_id, kind, created_by_mobile_user_id, assigned_staff_id, status, created_at::text, doctor_id
	FROM chat_rooms
`

const chatRoomReturning = `
	RETURNING id, clinic_id, kind, created_by_mobile_user_id, assigned_staff_id, status, created_at::text, doctor_id
`

func (r *ChatRepository) EnsureWall(clinicID int) (*ChatRoom, error) {
	row := r.db.QueryRow(chatRoomSelect+` WHERE clinic_id = $1 AND kind = $2`, clinicID, ChatKindWall)
	room, err := scanRoom(row)
	if err == nil {
		return room, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, err
	}
	row = r.db.QueryRow(`
		INSERT INTO chat_rooms (clinic_id, kind, status)
		VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING
	`+chatRoomReturning, clinicID, ChatKindWall, ChatStatusOpen)
	room, err = scanRoom(row)
	if errors.Is(err, sql.ErrNoRows) {
		row = r.db.QueryRow(chatRoomSelect+` WHERE clinic_id = $1 AND kind = $2`, clinicID, ChatKindWall)
		return scanRoom(row)
	}
	return room, err
}

func (r *ChatRepository) publishedDoctorName(clinicID, doctorID int) (string, error) {
	var name string
	err := r.db.QueryRow(`
		SELECT full_name FROM doctors
		WHERE id = $1 AND clinic_id = $2 AND status = 'published'
	`, doctorID, clinicID).Scan(&name)
	return name, err
}

func (r *ChatRepository) GetOrCreateConsult(clinicID int, clientID int64, doctorID *int) (*ChatRoom, bool, error) {
	if doctorID != nil {
		if _, err := r.publishedDoctorName(clinicID, *doctorID); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return nil, false, ErrChatDoctor
			}
			return nil, false, err
		}
	}

	var room *ChatRoom
	var err error
	if doctorID != nil {
		row := r.db.QueryRow(chatRoomSelect+`
			WHERE clinic_id = $1 AND kind = $2 AND created_by_mobile_user_id = $3 AND status = $4 AND doctor_id = $5
		`, clinicID, ChatKindConsult, clientID, ChatStatusOpen, *doctorID)
		room, err = scanRoom(row)
	} else {
		row := r.db.QueryRow(chatRoomSelect+`
			WHERE clinic_id = $1 AND kind = $2 AND created_by_mobile_user_id = $3 AND status = $4 AND doctor_id IS NULL
		`, clinicID, ChatKindConsult, clientID, ChatStatusOpen)
		room, err = scanRoom(row)
	}
	if err == nil {
		r.fillRoomMeta(room, clientID)
		return room, false, nil
	}
	if !errors.Is(err, sql.ErrNoRows) {
		return nil, false, err
	}

	tx, err := r.db.Begin()
	if err != nil {
		return nil, false, err
	}
	defer tx.Rollback()

	if doctorID != nil {
		var staffID sql.NullInt64
		_ = tx.QueryRow(`
			SELECT mobile_user_id FROM doctors WHERE id = $1 AND clinic_id = $2
		`, *doctorID, clinicID).Scan(&staffID)
		row := tx.QueryRow(`
			INSERT INTO chat_rooms (clinic_id, kind, created_by_mobile_user_id, status, doctor_id, assigned_staff_id)
			VALUES ($1, $2, $3, $4, $5, $6)
		`+chatRoomReturning, clinicID, ChatKindConsult, clientID, ChatStatusOpen, *doctorID, staffID)
		room, err = scanRoom(row)
	} else {
		row := tx.QueryRow(`
			INSERT INTO chat_rooms (clinic_id, kind, created_by_mobile_user_id, status)
			VALUES ($1, $2, $3, $4)
		`+chatRoomReturning, clinicID, ChatKindConsult, clientID, ChatStatusOpen)
		room, err = scanRoom(row)
	}
	if err != nil {
		return nil, false, err
	}
	if _, err := tx.Exec(`
		INSERT INTO chat_members (room_id, mobile_user_id) VALUES ($1, $2)
		ON CONFLICT DO NOTHING
	`, room.ID, clientID); err != nil {
		return nil, false, err
	}
	if err := tx.Commit(); err != nil {
		return nil, false, err
	}
	r.fillRoomMeta(room, clientID)
	return room, true, nil
}

func (r *ChatRepository) GetRoom(clinicID int, roomID int64) (*ChatRoom, error) {
	row := r.db.QueryRow(chatRoomSelect+` WHERE id = $1 AND clinic_id = $2`, roomID, clinicID)
	room, err := scanRoom(row)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return room, err
}

func (r *ChatRepository) CanAccess(room *ChatRoom, userID int64, role string) bool {
	if room == nil {
		return false
	}
	if room.Kind == ChatKindWall {
		return true
	}
	if IsMedicalStaff(role) {
		return true
	}
	return room.CreatedBy != nil && *room.CreatedBy == userID
}

func (r *ChatRepository) ListRooms(clinicID int, userID int64, role string) ([]ChatRoom, error) {
	wall, err := r.EnsureWall(clinicID)
	if err != nil {
		return nil, err
	}

	var rooms []ChatRoom
	rooms = append(rooms, *wall)

	var rows *sql.Rows
	if IsMedicalStaff(role) {
		rows, err = r.db.Query(chatRoomSelect+`
			WHERE clinic_id = $1 AND kind = $2
			ORDER BY created_at DESC
			LIMIT 100
		`, clinicID, ChatKindConsult)
	} else {
		rows, err = r.db.Query(chatRoomSelect+`
			WHERE clinic_id = $1 AND kind = $2 AND created_by_mobile_user_id = $3
			ORDER BY created_at DESC
			LIMIT 50
		`, clinicID, ChatKindConsult, userID)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		room, err := scanRoom(rows)
		if err != nil {
			return nil, err
		}
		rooms = append(rooms, *room)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	for i := range rooms {
		r.fillRoomMeta(&rooms[i], userID)
	}
	return rooms, nil
}

func (r *ChatRepository) fillRoomMeta(room *ChatRoom, userID int64) {
	var preview, lastAt, peer, imageURL sql.NullString
	_ = r.db.QueryRow(`
		SELECT m.body, m.created_at::text, COALESCE(m.image_url, '')
		FROM chat_messages m
		WHERE m.room_id = $1 AND m.hidden_at IS NULL
		ORDER BY m.id DESC
		LIMIT 1
	`, room.ID).Scan(&preview, &lastAt, &imageURL)
	if preview.Valid && strings.TrimSpace(preview.String) != "" {
		room.LastPreview = preview.String
	} else if imageURL.Valid && imageURL.String != "" {
		room.LastPreview = "Фото"
	}
	if lastAt.Valid {
		room.LastAt = lastAt.String
	}
	var unread int
	_ = r.db.QueryRow(`
		SELECT COUNT(*) FROM chat_messages m
		LEFT JOIN chat_members cm ON cm.room_id = m.room_id AND cm.mobile_user_id = $2
		WHERE m.room_id = $1 AND m.hidden_at IS NULL
		  AND (cm.last_read_at IS NULL OR m.created_at > cm.last_read_at)
		  AND COALESCE(m.author_id, 0) <> $2
	`, room.ID, userID).Scan(&unread)
	room.Unread = unread

	if room.Kind != ChatKindConsult {
		return
	}
	if room.DoctorID != nil {
		var dname sql.NullString
		_ = r.db.QueryRow(`SELECT full_name FROM doctors WHERE id = $1`, *room.DoctorID).Scan(&dname)
		if dname.Valid {
			room.DoctorName = dname.String
		}
	}
	isClientViewer := room.CreatedBy != nil && *room.CreatedBy == userID
	if isClientViewer {
		if room.DoctorName != "" {
			room.PeerName = room.DoctorName
		} else {
			room.PeerName = "Врач"
		}
		return
	}
	if room.CreatedBy != nil {
		_ = r.db.QueryRow(`
			SELECT COALESCE(NULLIF(display_name, ''), phone, email, 'Клиент')
			FROM mobile_users WHERE id = $1
		`, *room.CreatedBy).Scan(&peer)
		if peer.Valid {
			room.PeerName = peer.String
		}
	}
}

func (r *ChatRepository) MarkRead(roomID, userID int64) {
	_, _ = r.db.Exec(`
		INSERT INTO chat_members (room_id, mobile_user_id, last_read_at)
		VALUES ($1, $2, NOW())
		ON CONFLICT (room_id, mobile_user_id) DO UPDATE SET last_read_at = NOW()
	`, roomID, userID)
}

func (r *ChatRepository) ListMessages(roomID int64, afterID int64, limit int) ([]ChatMessage, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	q := `
		SELECT m.id, m.room_id, m.author_id,
		       COALESCE(NULLIF(u.display_name, ''), u.phone, u.email, 'Участник'),
		       COALESCE(u.app_role, 'client'),
		       CASE WHEN m.hidden_at IS NULL THEN m.body ELSE '' END,
		       CASE WHEN m.hidden_at IS NULL THEN COALESCE(m.image_url, '') ELSE '' END,
		       m.hidden_at IS NOT NULL,
		       m.created_at::text
		FROM chat_messages m
		LEFT JOIN mobile_users u ON u.id = m.author_id
		WHERE m.room_id = $1
	`
	args := []any{roomID}
	if afterID > 0 {
		q += ` AND m.id > $2`
		args = append(args, afterID)
		q += ` ORDER BY m.id ASC LIMIT $3`
		args = append(args, limit)
	} else {
		q += ` ORDER BY m.id DESC LIMIT $2`
		args = append(args, limit)
	}
	rows, err := r.db.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []ChatMessage
	for rows.Next() {
		var m ChatMessage
		var name, role sql.NullString
		if err := rows.Scan(&m.ID, &m.RoomID, &m.AuthorID, &name, &role, &m.Body, &m.ImageURL, &m.Hidden, &m.CreatedAt); err != nil {
			return nil, err
		}
		if name.Valid {
			m.AuthorName = name.String
		}
		if role.Valid {
			m.AuthorRole = NormalizeAppRole(role.String)
		}
		if m.Hidden {
			m.Body = ""
			m.ImageURL = ""
		}
		list = append(list, m)
	}
	if afterID <= 0 {
		for i, j := 0, len(list)-1; i < j; i, j = i+1, j-1 {
			list[i], list[j] = list[j], list[i]
		}
	}
	return list, rows.Err()
}

func (r *ChatRepository) countClientMessagesToday(clinicID int, userID int64, kind string) (int, error) {
	var n int
	err := r.db.QueryRow(`
		SELECT COUNT(*)
		FROM chat_messages m
		JOIN chat_rooms rm ON rm.id = m.room_id
		WHERE rm.clinic_id = $1 AND rm.kind = $2 AND m.author_id = $3
		  AND m.created_at >= date_trunc('day', NOW())
	`, clinicID, kind, userID).Scan(&n)
	return n, err
}

func (r *ChatRepository) PostMessage(room *ChatRoom, authorID int64, role, body, imageURL string) (*ChatMessage, error) {
	body = strings.TrimSpace(body)
	imageURL = strings.TrimSpace(imageURL)
	if len([]rune(body)) > 2000 {
		return nil, ErrChatEmpty
	}
	if body == "" && imageURL == "" {
		return nil, ErrChatEmpty
	}
	if room.Status != ChatStatusOpen {
		return nil, ErrChatClosed
	}

	if !IsStaffAppRole(role) {
		limit := ChatWallLimitPerDay
		if room.Kind == ChatKindConsult {
			limit = ChatConsultLimitPerDay
		}
		n, err := r.countClientMessagesToday(room.ClinicID, authorID, room.Kind)
		if err != nil {
			return nil, err
		}
		if n >= limit {
			return nil, ErrChatLimit
		}
	}

	row := r.db.QueryRow(`
		INSERT INTO chat_messages (room_id, author_id, body, image_url)
		VALUES ($1, $2, $3, $4)
		RETURNING id, room_id, author_id, body, image_url, created_at::text
	`, room.ID, authorID, body, imageURL)
	var m ChatMessage
	if err := row.Scan(&m.ID, &m.RoomID, &m.AuthorID, &m.Body, &m.ImageURL, &m.CreatedAt); err != nil {
		return nil, err
	}
	m.AuthorRole = NormalizeAppRole(role)
	r.MarkRead(room.ID, authorID)
	return &m, nil
}

func (r *ChatRepository) HideMessage(clinicID int, roomID, messageID int64) error {
	res, err := r.db.Exec(`
		UPDATE chat_messages m SET hidden_at = NOW()
		FROM chat_rooms rm
		WHERE m.id = $3 AND m.room_id = $2 AND rm.id = m.room_id AND rm.clinic_id = $1
		  AND m.hidden_at IS NULL
	`, clinicID, roomID, messageID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func (r *ChatRepository) CloseConsult(clinicID int, roomID int64) (*ChatRoom, error) {
	res, err := r.db.Exec(`
		UPDATE chat_rooms SET status = $3
		WHERE id = $2 AND clinic_id = $1 AND kind = $4 AND status = $5
	`, clinicID, roomID, ChatStatusClosed, ChatKindConsult, ChatStatusOpen)
	if err != nil {
		return nil, err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		room, getErr := r.GetRoom(clinicID, roomID)
		if getErr != nil {
			return nil, getErr
		}
		if room == nil || room.Kind != ChatKindConsult {
			return nil, sql.ErrNoRows
		}
		return room, nil
	}
	return r.GetRoom(clinicID, roomID)
}

func (r *ChatRepository) TelegramID(userID int64) int64 {
	var id sql.NullInt64
	_ = r.db.QueryRow(`SELECT telegram_user_id FROM mobile_users WHERE id = $1`, userID).Scan(&id)
	if id.Valid {
		return id.Int64
	}
	return 0
}

func (r *ChatRepository) DisplayName(userID int64) string {
	var name sql.NullString
	_ = r.db.QueryRow(`
		SELECT COALESCE(NULLIF(display_name, ''), phone, email, 'Пользователь')
		FROM mobile_users WHERE id = $1
	`, userID).Scan(&name)
	if name.Valid {
		return name.String
	}
	return "Пользователь"
}

func ChatLimitMessage(kind string) string {
	if kind == ChatKindConsult {
		return "Лимит сообщений врачу на сегодня исчерпан"
	}
	return "Лимит сообщений в общем чате на сегодня исчерпан"
}
