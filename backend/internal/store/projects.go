package store

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"github.com/ao/classroom/backend/internal/model"
)

func (s *Store) ListProjects(classroomID string) ([]model.Project, error) {
	rows, err := s.db.Query(`
		SELECT id, classroom_id, course_name, project_name, team_size, total_students, completed_round_indices, current_view_index, created_at, updated_at
		FROM projects WHERE classroom_id = ? ORDER BY created_at DESC
	`, classroomID)
	if err != nil {
		return nil, fmt.Errorf("list projects: %w", err)
	}
	defer rows.Close()

	var projects []model.Project
	for rows.Next() {
		p, err := scanProject(rows)
		if err != nil {
			return nil, err
		}
		projects = append(projects, *p)
	}
	return projects, rows.Err()
}

func (s *Store) CreateProject(classroomID string, req model.CreateProjectRequest) (*model.Project, error) {
	id := generateID()
	now := time.Now().UTC().Format(time.DateTime)
	indices, _ := json.Marshal([]int{})

	_, err := s.db.Exec(`
		INSERT INTO projects (id, classroom_id, course_name, project_name, team_size, total_students, completed_round_indices, current_view_index, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, id, classroomID, req.CourseName, req.ProjectName, req.TeamSize, req.TotalStudents, string(indices), -1, now, now)
	if err != nil {
		return nil, fmt.Errorf("create project: %w", err)
	}

	return s.GetProject(id)
}

func (s *Store) GetProject(id string) (*model.Project, error) {
	row := s.db.QueryRow(`
		SELECT id, classroom_id, course_name, project_name, team_size, total_students, completed_round_indices, current_view_index, created_at, updated_at
		FROM projects WHERE id = ?
	`, id)
	return scanProjectRow(row)
}

func (s *Store) DeleteProject(id string) error {
	_, err := s.db.Exec(`DELETE FROM projects WHERE id = ?`, id)
	return err
}

func (s *Store) ShuffleProject(id string) (*model.Project, error) {
	p, err := s.GetProject(id)
	if err != nil || p == nil {
		return p, err
	}

	nextIndex := len(p.CompletedRoundIndices)
	p.CompletedRoundIndices = append(p.CompletedRoundIndices, nextIndex)
	p.CurrentViewIndex = nextIndex

	indices, _ := json.Marshal(p.CompletedRoundIndices)
	now := time.Now().UTC().Format(time.DateTime)

	_, err = s.db.Exec(`
		UPDATE projects SET completed_round_indices = ?, current_view_index = ?, updated_at = ?
		WHERE id = ?
	`, string(indices), p.CurrentViewIndex, now, id)
	if err != nil {
		return nil, fmt.Errorf("shuffle project: %w", err)
	}

	return s.GetProject(id)
}

func (s *Store) UpdateProjectView(id string, index int) (*model.Project, error) {
	now := time.Now().UTC().Format(time.DateTime)
	_, err := s.db.Exec(`
		UPDATE projects SET current_view_index = ?, updated_at = ?
		WHERE id = ?
	`, index, now, id)
	if err != nil {
		return nil, fmt.Errorf("update project view: %w", err)
	}
	return s.GetProject(id)
}

func scanProject(rows *sql.Rows) (*model.Project, error) {
	return scanProjectFromScanner(rows)
}

func scanProjectRow(row *sql.Row) (*model.Project, error) {
	return scanProjectFromScanner(row)
}

func scanProjectFromScanner(s scanner) (*model.Project, error) {
	var p model.Project
	var indicesJSON, createdAt, updatedAt string

	err := s.Scan(&p.ID, &p.ClassroomID, &p.CourseName, &p.ProjectName, &p.TeamSize, &p.TotalStudents,
		&indicesJSON, &p.CurrentViewIndex, &createdAt, &updatedAt)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("scan project: %w", err)
	}

	_ = json.Unmarshal([]byte(indicesJSON), &p.CompletedRoundIndices)
	if p.CompletedRoundIndices == nil {
		p.CompletedRoundIndices = []int{}
	}
	p.CreatedAt, _ = time.Parse(time.DateTime, createdAt)
	p.UpdatedAt, _ = time.Parse(time.DateTime, updatedAt)
	return &p, nil
}
