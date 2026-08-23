-- Полноценные аккаунты портала + журнал заходов.
-- Дубли имён (если были) разводим, затем уникальный индекс.

UPDATE docs_visitors d
SET display_name = left(d.display_name, 30) || ' #' || d.id::text
WHERE d.id NOT IN (
    SELECT MIN(id) FROM docs_visitors GROUP BY lower(display_name)
);

ALTER TABLE docs_visitors
    ADD COLUMN IF NOT EXISTS password_hash TEXT,
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS last_path VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS idx_docs_visitors_name_lower
    ON docs_visitors (lower(display_name));

CREATE TABLE IF NOT EXISTS docs_visits (
    id BIGSERIAL PRIMARY KEY,
    visitor_id BIGINT NOT NULL REFERENCES docs_visitors(id) ON DELETE CASCADE,
    path VARCHAR(200) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_visits_visitor_created
    ON docs_visits (visitor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_docs_visits_created
    ON docs_visits (created_at DESC);
