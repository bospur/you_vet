UPDATE docs_tasks SET status = 'todo' WHERE status = 'analysis';
UPDATE docs_tasks SET status = 'in_progress' WHERE status = 'testing';

ALTER TABLE docs_tasks DROP CONSTRAINT IF EXISTS docs_tasks_status_check;

ALTER TABLE docs_tasks
    ADD CONSTRAINT docs_tasks_status_check
    CHECK (status IN ('todo', 'in_progress', 'done'));
