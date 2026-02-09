CREATE TABLE IF NOT EXISTS projects (
    id                      TEXT PRIMARY KEY,
    classroom_id            TEXT NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
    course_name             TEXT NOT NULL,
    project_name            TEXT NOT NULL,
    team_size               INTEGER NOT NULL DEFAULT 3,
    total_students          INTEGER NOT NULL,
    completed_round_indices TEXT NOT NULL DEFAULT '[]',
    current_view_index      INTEGER NOT NULL DEFAULT -1,
    created_at              TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at              TEXT NOT NULL DEFAULT (datetime('now'))
);
