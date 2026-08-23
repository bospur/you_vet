DROP INDEX IF EXISTS idx_docs_visits_created;
DROP INDEX IF EXISTS idx_docs_visits_visitor_created;
DROP TABLE IF EXISTS docs_visits;

DROP INDEX IF EXISTS idx_docs_visitors_name_lower;

ALTER TABLE docs_visitors
    DROP COLUMN IF EXISTS visit_count,
    DROP COLUMN IF EXISTS last_path,
    DROP COLUMN IF EXISTS last_seen_at,
    DROP COLUMN IF EXISTS password_hash;
