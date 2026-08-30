-- Общий чат клиники и треды «написать врачу»

CREATE TABLE chat_rooms (
    id                       BIGSERIAL PRIMARY KEY,
    clinic_id                INT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    kind                     VARCHAR(20) NOT NULL CHECK (kind IN ('clinic_wall', 'consult')),
    created_by_mobile_user_id BIGINT REFERENCES mobile_users(id) ON DELETE SET NULL,
    assigned_staff_id        BIGINT REFERENCES mobile_users(id) ON DELETE SET NULL,
    status                   VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX chat_rooms_one_wall
    ON chat_rooms (clinic_id)
    WHERE kind = 'clinic_wall';

CREATE UNIQUE INDEX chat_one_open_consult
    ON chat_rooms (clinic_id, created_by_mobile_user_id)
    WHERE kind = 'consult' AND status = 'open';

CREATE INDEX idx_chat_rooms_clinic_kind
    ON chat_rooms (clinic_id, kind, status);

CREATE TABLE chat_members (
    room_id        BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    mobile_user_id BIGINT NOT NULL REFERENCES mobile_users(id) ON DELETE CASCADE,
    last_read_at   TIMESTAMPTZ,
    PRIMARY KEY (room_id, mobile_user_id)
);

CREATE TABLE chat_messages (
    id         BIGSERIAL PRIMARY KEY,
    room_id    BIGINT NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    author_id  BIGINT REFERENCES mobile_users(id) ON DELETE SET NULL,
    body       TEXT NOT NULL,
    hidden_at  TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room_created
    ON chat_messages (room_id, created_at, id);
