ALTER TABLE docs_visitors
    ADD COLUMN IF NOT EXISTS last_path VARCHAR(200) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS visit_count INTEGER NOT NULL DEFAULT 0;

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
