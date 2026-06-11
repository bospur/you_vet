DROP INDEX IF EXISTS idx_docs_tasks_priority;

ALTER TABLE docs_comments DROP COLUMN IF EXISTS updated_at;
ALTER TABLE docs_tasks DROP COLUMN IF EXISTS priority;
