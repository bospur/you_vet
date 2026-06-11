ALTER TABLE docs_tasks
    ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'normal'
        CHECK (priority IN ('low', 'normal', 'high'));

ALTER TABLE docs_comments
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX idx_docs_tasks_priority ON docs_tasks(status, priority, position);
