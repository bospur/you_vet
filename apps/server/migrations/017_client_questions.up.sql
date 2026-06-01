-- Вопросы клиентов из Mini App → чат врачей

CREATE TABLE client_questions (
    id                      SERIAL PRIMARY KEY,
    clinic_id               INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    telegram_user_id        BIGINT          NOT NULL,
    client_name             VARCHAR(255)    NOT NULL DEFAULT '',
    client_username         VARCHAR(255),
    text                    TEXT            NOT NULL,
    status                  VARCHAR(20)     NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'answered')),
    staff_reply             TEXT,
    staff_telegram_id       BIGINT,
    staff_chat_message_id   INT,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    answered_at             TIMESTAMPTZ
);

CREATE INDEX idx_client_questions_clinic_status
    ON client_questions (clinic_id, status, created_at DESC);

CREATE INDEX idx_client_questions_telegram_day
    ON client_questions (clinic_id, telegram_user_id, created_at DESC);

CREATE UNIQUE INDEX idx_client_questions_staff_message
    ON client_questions (staff_chat_message_id)
    WHERE staff_chat_message_id IS NOT NULL;
