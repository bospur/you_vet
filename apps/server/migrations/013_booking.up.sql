-- Фаза 5 B1: справочник услуг записи и настройки клиники

CREATE TABLE booking_settings (
    clinic_id       INT         PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
    horizon_weeks   INT         NOT NULL DEFAULT 2 CHECK (horizon_weeks BETWEEN 1 AND 8),
    staff_chat_id   BIGINT,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE booking_service_types (
    id                  SERIAL PRIMARY KEY,
    clinic_id           INT             NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
    name                VARCHAR(255)    NOT NULL,
    category            VARCHAR(20)     NOT NULL CHECK (category IN ('uzi', 'surgery', 'xray')),
    species_filter      VARCHAR(20)     NOT NULL DEFAULT 'any'
                        CHECK (species_filter IN ('any', 'cats_only')),
    capacity_group      VARCHAR(50),
    default_duration_min INT            NOT NULL DEFAULT 30 CHECK (default_duration_min > 0),
    booking_mode        VARCHAR(20)     NOT NULL DEFAULT 'pending_request'
                        CHECK (booking_mode IN ('instant', 'pending_request')),
    instructions_client TEXT,
    rules               JSONB           NOT NULL DEFAULT '[]'::jsonb,
    is_active           BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order          INT             NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (clinic_id, name)
);

CREATE INDEX idx_booking_service_types_clinic ON booking_service_types (clinic_id, is_active, sort_order);

-- Настройки для существующих клиник
INSERT INTO booking_settings (clinic_id)
SELECT id FROM clinics
ON CONFLICT (clinic_id) DO NOTHING;

-- Стартовый каталог услуг для каждой клиники
INSERT INTO booking_service_types (
    clinic_id, name, category, species_filter, capacity_group,
    default_duration_min, booking_mode, sort_order
)
SELECT
    c.id,
    v.name,
    v.category,
    v.species_filter,
    v.capacity_group,
    v.default_duration_min,
    v.booking_mode,
    v.sort_order
FROM clinics c
CROSS JOIN (
    VALUES
        ('УЗИ сердца',              'uzi',     'any',       NULL,          30, 'pending_request', 10),
        ('УЗИ брюшной полости',     'uzi',     'any',       NULL,          30, 'pending_request', 20),
        ('УЗИ мочевого пузыря',     'uzi',     'any',       NULL,          30, 'pending_request', 30),
        ('Кастрация кота',          'surgery', 'cats_only', 'cat_surgery', 60, 'pending_request', 40),
        ('Стерилизация кошки',      'surgery', 'cats_only', 'cat_surgery', 90, 'pending_request', 50),
        ('Рентген',                 'xray',    'any',       NULL,          20, 'pending_request', 60)
) AS v(name, category, species_filter, capacity_group, default_duration_min, booking_mode, sort_order)
ON CONFLICT (clinic_id, name) DO NOTHING;
