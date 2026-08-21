ALTER TABLE docs_tasks DROP CONSTRAINT IF EXISTS docs_tasks_status_check;

ALTER TABLE docs_tasks
    ADD CONSTRAINT docs_tasks_status_check
    CHECK (status IN ('analysis', 'todo', 'in_progress', 'testing', 'done'));
