-- Compatible with the table created by the original unversioned application.
-- Once published, never edit this migration: add a new numbered migration.
CREATE TABLE IF NOT EXISTS apartments (
    id TEXT PRIMARY KEY NOT NULL,
    data TEXT NOT NULL
);
