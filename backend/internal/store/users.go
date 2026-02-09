package store

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/ao/classroom/backend/internal/model"
)

func (s *Store) UpsertUser(googleID, email, name, avatarURL string) (*model.User, error) {
	id := generateID()
	now := time.Now().UTC().Format(time.DateTime)

	_, err := s.db.Exec(`
		INSERT INTO users (id, google_id, email, name, avatar_url, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(google_id) DO UPDATE SET
			email = excluded.email,
			name = excluded.name,
			avatar_url = excluded.avatar_url,
			updated_at = excluded.updated_at
	`, id, googleID, email, name, avatarURL, now, now)
	if err != nil {
		return nil, fmt.Errorf("upsert user: %w", err)
	}

	return s.GetUserByGoogleID(googleID)
}

func (s *Store) GetUserByGoogleID(googleID string) (*model.User, error) {
	var u model.User
	var createdAt, updatedAt string
	err := s.db.QueryRow(`
		SELECT id, google_id, email, name, avatar_url, created_at, updated_at
		FROM users WHERE google_id = ?
	`, googleID).Scan(&u.ID, &u.GoogleID, &u.Email, &u.Name, &u.AvatarURL, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by google_id: %w", err)
	}
	u.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	u.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &u, nil
}

func (s *Store) GetUserByID(id string) (*model.User, error) {
	var u model.User
	var createdAt, updatedAt string
	err := s.db.QueryRow(`
		SELECT id, google_id, email, name, avatar_url, created_at, updated_at
		FROM users WHERE id = ?
	`, id).Scan(&u.ID, &u.GoogleID, &u.Email, &u.Name, &u.AvatarURL, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	u.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	u.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &u, nil
}
