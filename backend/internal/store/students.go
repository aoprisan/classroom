package store

import (
	"database/sql"
	"fmt"

	"github.com/ao/classroom/backend/internal/model"
)

func (s *Store) ListStudents(classroomID string) ([]model.Student, error) {
	rows, err := s.db.Query(`
		SELECT id, classroom_id, student_num, last_name, first_name, height_cm, gender
		FROM students WHERE classroom_id = ? ORDER BY student_num
	`, classroomID)
	if err != nil {
		return nil, fmt.Errorf("list students: %w", err)
	}
	defer rows.Close()

	var students []model.Student
	for rows.Next() {
		var st model.Student
		if err := rows.Scan(&st.ID, &st.ClassroomID, &st.StudentNum, &st.LastName, &st.FirstName, &st.HeightCm, &st.Gender); err != nil {
			return nil, fmt.Errorf("scan student: %w", err)
		}
		students = append(students, st)
	}
	return students, rows.Err()
}

func (s *Store) BulkReplaceStudents(classroomID string, students []model.UpdateStudentRequest) error {
	tx, err := s.db.Begin()
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`DELETE FROM students WHERE classroom_id = ?`, classroomID); err != nil {
		return fmt.Errorf("delete students: %w", err)
	}

	stmt, err := tx.Prepare(`
		INSERT INTO students (id, classroom_id, student_num, last_name, first_name, height_cm, gender)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("prepare: %w", err)
	}
	defer stmt.Close()

	for i, st := range students {
		if _, err := stmt.Exec(generateID(), classroomID, i+1, st.LastName, st.FirstName, st.HeightCm, st.Gender); err != nil {
			return fmt.Errorf("insert student %d: %w", i+1, err)
		}
	}

	return tx.Commit()
}

func (s *Store) UpdateStudent(classroomID string, studentNum int, req model.UpdateStudentRequest) (*model.Student, error) {
	// Check if student exists
	var id string
	err := s.db.QueryRow(`SELECT id FROM students WHERE classroom_id = ? AND student_num = ?`, classroomID, studentNum).Scan(&id)
	if err == sql.ErrNoRows {
		// Create
		id = generateID()
		_, err = s.db.Exec(`
			INSERT INTO students (id, classroom_id, student_num, last_name, first_name, height_cm, gender)
			VALUES (?, ?, ?, ?, ?, ?, ?)
		`, id, classroomID, studentNum, req.LastName, req.FirstName, req.HeightCm, req.Gender)
	} else if err == nil {
		// Update
		_, err = s.db.Exec(`
			UPDATE students SET last_name = ?, first_name = ?, height_cm = ?, gender = ?
			WHERE id = ?
		`, req.LastName, req.FirstName, req.HeightCm, req.Gender, id)
	}
	if err != nil {
		return nil, fmt.Errorf("upsert student: %w", err)
	}

	var st model.Student
	err = s.db.QueryRow(`
		SELECT id, classroom_id, student_num, last_name, first_name, height_cm, gender
		FROM students WHERE id = ?
	`, id).Scan(&st.ID, &st.ClassroomID, &st.StudentNum, &st.LastName, &st.FirstName, &st.HeightCm, &st.Gender)
	if err != nil {
		return nil, fmt.Errorf("get student: %w", err)
	}
	return &st, nil
}
