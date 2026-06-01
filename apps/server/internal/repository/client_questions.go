package repository

import (
	"database/sql"
	"errors"
	"strings"
	"time"
)

var (
	ErrQuestionNotFound      = errors.New("вопрос не найден")
	ErrQuestionNotOpen       = errors.New("на вопрос уже ответили")
	ErrQuestionTooShort      = errors.New("слишком короткий текст")
	ErrQuestionTooLong       = errors.New("слишком длинный текст")
	ErrQuestionDailyLimit    = errors.New("превышен лимит вопросов на день")
)

const (
	QuestionMinLen     = 10
	QuestionMaxLen     = 2000
	QuestionDailyLimit = 5
)

// ClientQuestion — вопрос клиента из Mini App.
type ClientQuestion struct {
	ID                 int     `json:"id"`
	ClinicID           int     `json:"clinic_id"`
	TelegramUserID     int64   `json:"telegram_user_id"`
	ClientName         string  `json:"client_name"`
	ClientUsername     *string `json:"client_username,omitempty"`
	Text               string  `json:"text"`
	Status             string  `json:"status"`
	StaffReply         *string `json:"staff_reply,omitempty"`
	StaffTelegramID    *int64  `json:"staff_telegram_id,omitempty"`
	StaffChatMessageID *int    `json:"staff_chat_message_id,omitempty"`
	CreatedAt          string  `json:"created_at"`
	AnsweredAt         *string `json:"answered_at,omitempty"`
}

type ClientQuestionRepository struct {
	db *sql.DB
}

func NewClientQuestionRepository(db *sql.DB) *ClientQuestionRepository {
	return &ClientQuestionRepository{db: db}
}

func (r *ClientQuestionRepository) GetClinicIDBySlug(slug string) (int, error) {
	var id int
	err := r.db.QueryRow(`SELECT id FROM clinics WHERE slug = $1`, slug).Scan(&id)
	if err == sql.ErrNoRows {
		return 0, ErrQuestionNotFound
	}
	return id, err
}

func scanClientQuestion(row interface{ Scan(dest ...any) error }) (*ClientQuestion, error) {
	var q ClientQuestion
	var username sql.NullString
	var staffReply sql.NullString
	var staffTg sql.NullInt64
	var staffMsg sql.NullInt64
	var answeredAt sql.NullTime
	var createdAt time.Time

	err := row.Scan(
		&q.ID, &q.ClinicID, &q.TelegramUserID, &q.ClientName, &username,
		&q.Text, &q.Status, &staffReply, &staffTg, &staffMsg,
		&createdAt, &answeredAt,
	)
	if err != nil {
		return nil, err
	}
	if username.Valid {
		q.ClientUsername = &username.String
	}
	if staffReply.Valid {
		q.StaffReply = &staffReply.String
	}
	if staffTg.Valid {
		q.StaffTelegramID = &staffTg.Int64
	}
	if staffMsg.Valid {
		v := int(staffMsg.Int64)
		q.StaffChatMessageID = &v
	}
	q.CreatedAt = createdAt.Format(time.RFC3339)
	if answeredAt.Valid {
		s := answeredAt.Time.Format(time.RFC3339)
		q.AnsweredAt = &s
	}
	return &q, nil
}

const clientQuestionSelect = `
	SELECT id, clinic_id, telegram_user_id, client_name, client_username,
	       text, status, staff_reply, staff_telegram_id, staff_chat_message_id,
	       created_at, answered_at
	FROM client_questions
`

func (r *ClientQuestionRepository) countToday(clinicID int, telegramUserID int64) (int, error) {
	var n int
	err := r.db.QueryRow(`
		SELECT COUNT(*) FROM client_questions
		WHERE clinic_id = $1 AND telegram_user_id = $2
		  AND created_at >= CURRENT_DATE
	`, clinicID, telegramUserID).Scan(&n)
	return n, err
}

// Create — новый вопрос клиента.
func (r *ClientQuestionRepository) Create(
	clinicID int,
	telegramUserID int64,
	clientName, clientUsername, text string,
) (*ClientQuestion, error) {
	text = strings.TrimSpace(text)
	if len([]rune(text)) < QuestionMinLen {
		return nil, ErrQuestionTooShort
	}
	if len([]rune(text)) > QuestionMaxLen {
		return nil, ErrQuestionTooLong
	}

	count, err := r.countToday(clinicID, telegramUserID)
	if err != nil {
		return nil, err
	}
	if count >= QuestionDailyLimit {
		return nil, ErrQuestionDailyLimit
	}

	name := strings.TrimSpace(clientName)
	if name == "" {
		name = "Клиент"
	}
	var usernamePtr *string
	if u := strings.TrimSpace(clientUsername); u != "" {
		usernamePtr = &u
	}

	row := r.db.QueryRow(`
		INSERT INTO client_questions (
			clinic_id, telegram_user_id, client_name, client_username, text
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id, clinic_id, telegram_user_id, client_name, client_username,
		          text, status, staff_reply, staff_telegram_id, staff_chat_message_id,
		          created_at, answered_at
	`, clinicID, telegramUserID, name, usernamePtr, text)

	return scanClientQuestion(row)
}

func (r *ClientQuestionRepository) GetByID(clinicID, id int) (*ClientQuestion, error) {
	row := r.db.QueryRow(clientQuestionSelect+` WHERE id = $1 AND clinic_id = $2`, id, clinicID)
	q, err := scanClientQuestion(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return q, err
}

func (r *ClientQuestionRepository) SetStaffChatMessageID(clinicID, questionID, messageID int) error {
	res, err := r.db.Exec(`
		UPDATE client_questions SET staff_chat_message_id = $3
		WHERE id = $1 AND clinic_id = $2 AND status = 'open'
	`, questionID, clinicID, messageID)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return ErrQuestionNotFound
	}
	return nil
}

func (r *ClientQuestionRepository) GetOpenByStaffMessageID(clinicID, messageID int) (*ClientQuestion, error) {
	row := r.db.QueryRow(clientQuestionSelect+`
		WHERE clinic_id = $1 AND staff_chat_message_id = $2 AND status = 'open'
	`, clinicID, messageID)
	q, err := scanClientQuestion(row)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return q, err
}

// Answer — сохранить ответ врача и закрыть вопрос.
func (r *ClientQuestionRepository) Answer(
	clinicID, questionID int,
	staffTelegramID int64,
	replyText string,
) (*ClientQuestion, error) {
	replyText = strings.TrimSpace(replyText)
	if replyText == "" {
		return nil, ErrQuestionTooShort
	}
	if len([]rune(replyText)) > QuestionMaxLen {
		return nil, ErrQuestionTooLong
	}

	row := r.db.QueryRow(`
		UPDATE client_questions SET
			status = 'answered',
			staff_reply = $3,
			staff_telegram_id = $4,
			answered_at = NOW()
		WHERE id = $1 AND clinic_id = $2 AND status = 'open'
		RETURNING id, clinic_id, telegram_user_id, client_name, client_username,
		          text, status, staff_reply, staff_telegram_id, staff_chat_message_id,
		          created_at, answered_at
	`, questionID, clinicID, replyText, staffTelegramID)

	q, err := scanClientQuestion(row)
	if err == sql.ErrNoRows {
		return nil, ErrQuestionNotOpen
	}
	return q, err
}
