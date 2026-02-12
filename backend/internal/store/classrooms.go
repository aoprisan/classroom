package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ao/classroom/backend/internal/model"
)

func (s *Store) CreateClassroom(userID string, req model.CreateClassroomRequest) (*model.Classroom, error) {
	id := generateID()
	now := time.Now().UTC().Format(time.DateTime)
	indices, _ := json.Marshal([]int{})

	name := req.Name
	if name == "" {
		name = "My Classroom"
	}

	pairingMode := req.PairingMode
	if pairingMode == "" {
		pairingMode = "random"
	}

	_, err := s.db.Exec(`
		INSERT INTO classrooms (id, user_id, name, total_students, row_count, students_per_bench, pairing_mode, completed_round_indices, current_view_index, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, userID, name, req.TotalStudents, req.RowCount, req.StudentsPerBench, pairingMode, string(indices), -1, now, now)
	if err != nil {
		return nil, fmt.Errorf("create classroom: %w", err)
	}

	return s.GetClassroom(id, userID)
}

func (s *Store) ListClassrooms(userID string) ([]model.Classroom, error) {
	rows, err := s.db.Query(`
		SELECT id, user_id, name, total_students, row_count, students_per_bench, pairing_mode, completed_round_indices, current_view_index, created_at, updated_at
		FROM classrooms WHERE user_id = ? ORDER BY created_at DESC
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("list classrooms: %w", err)
	}
	defer rows.Close()

	var classrooms []model.Classroom
	for rows.Next() {
		c, err := scanClassroom(rows)
		if err != nil {
			return nil, err
		}
		classrooms = append(classrooms, *c)
	}
	return classrooms, rows.Err()
}

func (s *Store) GetClassroom(id, userID string) (*model.Classroom, error) {
	row := s.db.QueryRow(`
		SELECT id, user_id, name, total_students, row_count, students_per_bench, pairing_mode, completed_round_indices, current_view_index, created_at, updated_at
		FROM classrooms WHERE id = ? AND user_id = ?
	`, id, userID)
	return scanClassroomRow(row)
}

func (s *Store) UpdateClassroom(id, userID string, req model.UpdateClassroomRequest) (*model.Classroom, error) {
	c, err := s.GetClassroom(id, userID)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, nil
	}

	if req.Name != nil {
		c.Name = *req.Name
	}
	if req.TotalStudents != nil {
		c.TotalStudents = *req.TotalStudents
	}
	if req.RowCount != nil {
		c.RowCount = *req.RowCount
	}
	if req.StudentsPerBench != nil {
		c.StudentsPerBench = *req.StudentsPerBench
	}
	if req.PairingMode != nil {
		c.PairingMode = *req.PairingMode
	}

	// Reset progress when config changes
	indices, _ := json.Marshal([]int{})
	now := time.Now().UTC().Format(time.DateTime)

	_, err = s.db.Exec(`
		UPDATE classrooms SET name = ?, total_students = ?, row_count = ?, students_per_bench = ?, pairing_mode = ?,
		completed_round_indices = ?, current_view_index = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`, c.Name, c.TotalStudents, c.RowCount, c.StudentsPerBench, c.PairingMode, string(indices), -1, now, id, userID)
	if err != nil {
		return nil, fmt.Errorf("update classroom: %w", err)
	}

	return s.GetClassroom(id, userID)
}

func (s *Store) DeleteClassroom(id, userID string) error {
	_, err := s.db.Exec(`DELETE FROM classrooms WHERE id = ? AND user_id = ?`, id, userID)
	return err
}

func (s *Store) ShuffleClassroom(id, userID string) (*model.Classroom, error) {
	c, err := s.GetClassroom(id, userID)
	if err != nil || c == nil {
		return c, err
	}

	nextIndex := len(c.CompletedRoundIndices)
	c.CompletedRoundIndices = append(c.CompletedRoundIndices, nextIndex)
	c.CurrentViewIndex = nextIndex

	indices, _ := json.Marshal(c.CompletedRoundIndices)
	now := time.Now().UTC().Format(time.DateTime)

	_, err = s.db.Exec(`
		UPDATE classrooms SET completed_round_indices = ?, current_view_index = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`, string(indices), c.CurrentViewIndex, now, id, userID)
	if err != nil {
		return nil, fmt.Errorf("shuffle classroom: %w", err)
	}

	return s.GetClassroom(id, userID)
}

func (s *Store) UpdateClassroomView(id, userID string, index int) (*model.Classroom, error) {
	now := time.Now().UTC().Format(time.DateTime)
	_, err := s.db.Exec(`
		UPDATE classrooms SET current_view_index = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`, index, now, id, userID)
	if err != nil {
		return nil, fmt.Errorf("update view: %w", err)
	}
	return s.GetClassroom(id, userID)
}

func (s *Store) ResetClassroom(id, userID string) (*model.Classroom, error) {
	indices, _ := json.Marshal([]int{})
	now := time.Now().UTC().Format(time.DateTime)

	_, err := s.db.Exec(`
		UPDATE classrooms SET completed_round_indices = ?, current_view_index = ?, updated_at = ?
		WHERE id = ? AND user_id = ?
	`, string(indices), -1, now, id, userID)
	if err != nil {
		return nil, fmt.Errorf("reset classroom: %w", err)
	}
	return s.GetClassroom(id, userID)
}

type scanner interface {
	Scan(dest ...any) error
}

func scanClassroomFromScanner(s scanner) (*model.Classroom, error) {
	var c model.Classroom
	var indicesJSON, createdAt, updatedAt string

	err := s.Scan(&c.ID, &c.UserID, &c.Name, &c.TotalStudents, &c.RowCount, &c.StudentsPerBench,
		&c.PairingMode, &indicesJSON, &c.CurrentViewIndex, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("scan classroom: %w", err)
	}

	_ = json.Unmarshal([]byte(indicesJSON), &c.CompletedRoundIndices)
	if c.CompletedRoundIndices == nil {
		c.CompletedRoundIndices = []int{}
	}
	c.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	c.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &c, nil
}

func scanClassroom(rows *sql.Rows) (*model.Classroom, error) {
	return scanClassroomFromScanner(rows)
}

func scanClassroomRow(row *sql.Row) (*model.Classroom, error) {
	return scanClassroomFromScanner(row)
}
