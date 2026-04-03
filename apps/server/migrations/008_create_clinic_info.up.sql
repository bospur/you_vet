CREATE TABLE clinic_info (
    id          SERIAL PRIMARY KEY,
    clinic_id   INT         NOT NULL UNIQUE REFERENCES clinics(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL DEFAULT '',
    description TEXT        NOT NULL DEFAULT '',
    phone       TEXT        NOT NULL DEFAULT '',
    address     TEXT        NOT NULL DEFAULT '',
    email       TEXT        NOT NULL DEFAULT '',
    website     TEXT        NOT NULL DEFAULT '',
    logo_url    TEXT        NOT NULL DEFAULT '',
    banner_url  TEXT        NOT NULL DEFAULT '',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
