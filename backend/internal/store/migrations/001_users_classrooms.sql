CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    google_id   TEXT UNIQUE NOT NULL,
    email       TEXT NOT NULL,
    name        TEXT NOT NULL DEFAULT '',
    avatar_url  TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classrooms (
    id                      TEXT PRIMARY KEY,
    user_id                 TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                    TEXT NOT NULL DEFAULT 'My Classroom',
    total_students          INTEGER NOT NULL DEFAULT 28,
    row_count               INTEGER NOT NULL DEFAULT 3,
    students_per_bench      INTEGER NOT NULL DEFAULT 2,
    completed_round_indices TEXT NOT NULL DEFAULT '[]',
    current_view_index      INTEGER NOT NULL DEFAULT -1,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS students (
    id           TEXT PRIMARY KEY,
    classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    student_num  INTEGER NOT NULL,
    last_name    TEXT NOT NULL DEFAULT '',
    first_name   TEXT NOT NULL DEFAULT '',
    height_cm    INTEGER,
    gender       TEXT NOT NULL DEFAULT '' CHECK(gender IN ('M', 'F', '')),
    UNIQUE(classroom_id, student_num)
);
