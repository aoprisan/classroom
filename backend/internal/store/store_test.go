package store

import (
	"os"
	"testing"

	"github.com/ao/classroom/backend/internal/model"
)

func newTestStore(t *testing.T) *Store {
	t.Helper()
	tmpFile, err := os.CreateTemp("", "classroom-test-*.db")
	if err != nil {
		t.Fatalf("create temp file: %v", err)
	}
	tmpFile.Close()
	t.Cleanup(func() { os.Remove(tmpFile.Name()) })

	s, err := New(tmpFile.Name())
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestMigrations(t *testing.T) {
	s := newTestStore(t)
	// Running migrations again should be idempotent
	if err := s.migrate(); err != nil {
		t.Fatalf("re-running migrations: %v", err)
	}
}

func TestUserUpsert(t *testing.T) {
	s := newTestStore(t)

	user, err := s.UpsertUser("google-1", "test@example.com", "Test User", "https://example.com/avatar.png")
	if err != nil {
		t.Fatalf("upsert user: %v", err)
	}
	if user == nil {
		t.Fatal("user is nil")
	}
	if user.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", user.Email)
	}

	// Upsert same google ID should update
	user2, err := s.UpsertUser("google-1", "new@example.com", "Updated Name", "")
	if err != nil {
		t.Fatalf("upsert user 2: %v", err)
	}
	if user2.ID != user.ID {
		t.Errorf("expected same ID %s, got %s", user.ID, user2.ID)
	}
	if user2.Email != "new@example.com" {
		t.Errorf("expected email new@example.com, got %s", user2.Email)
	}
}

func TestClassroomCRUD(t *testing.T) {
	s := newTestStore(t)

	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")
	userID := user.ID

	// Create
	c, err := s.CreateClassroom(userID, model.CreateClassroomRequest{
		Name: "Test Class", TotalStudents: 28, RowCount: 3, StudentsPerBench: 2,
	})
	if err != nil {
		t.Fatalf("create classroom: %v", err)
	}
	if c.Name != "Test Class" {
		t.Errorf("expected name 'Test Class', got %q", c.Name)
	}
	if c.TotalStudents != 28 {
		t.Errorf("expected 28 students, got %d", c.TotalStudents)
	}

	// List
	classrooms, err := s.ListClassrooms(userID)
	if err != nil {
		t.Fatalf("list classrooms: %v", err)
	}
	if len(classrooms) != 1 {
		t.Fatalf("expected 1 classroom, got %d", len(classrooms))
	}

	// Get
	c2, err := s.GetClassroom(c.ID, userID)
	if err != nil {
		t.Fatalf("get classroom: %v", err)
	}
	if c2.ID != c.ID {
		t.Errorf("expected ID %s, got %s", c.ID, c2.ID)
	}

	// Update
	newName := "Updated Class"
	c3, err := s.UpdateClassroom(c.ID, userID, model.UpdateClassroomRequest{Name: &newName})
	if err != nil {
		t.Fatalf("update classroom: %v", err)
	}
	if c3.Name != "Updated Class" {
		t.Errorf("expected name 'Updated Class', got %q", c3.Name)
	}
	// Config change resets progress
	if c3.CurrentViewIndex != -1 {
		t.Errorf("expected currentViewIndex -1, got %d", c3.CurrentViewIndex)
	}

	// Delete
	if err := s.DeleteClassroom(c.ID, userID); err != nil {
		t.Fatalf("delete classroom: %v", err)
	}
	c4, err := s.GetClassroom(c.ID, userID)
	if err != nil {
		t.Fatalf("get after delete: %v", err)
	}
	if c4 != nil {
		t.Error("expected nil after delete")
	}
}

func TestClassroomShuffle(t *testing.T) {
	s := newTestStore(t)
	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")

	c, _ := s.CreateClassroom(user.ID, model.CreateClassroomRequest{
		TotalStudents: 6, RowCount: 2, StudentsPerBench: 2,
	})

	// Shuffle once
	c1, err := s.ShuffleClassroom(c.ID, user.ID)
	if err != nil {
		t.Fatalf("shuffle: %v", err)
	}
	if len(c1.CompletedRoundIndices) != 1 {
		t.Errorf("expected 1 completed, got %d", len(c1.CompletedRoundIndices))
	}
	if c1.CurrentViewIndex != 0 {
		t.Errorf("expected view 0, got %d", c1.CurrentViewIndex)
	}

	// Shuffle again
	c2, err := s.ShuffleClassroom(c.ID, user.ID)
	if err != nil {
		t.Fatalf("shuffle 2: %v", err)
	}
	if len(c2.CompletedRoundIndices) != 2 {
		t.Errorf("expected 2 completed, got %d", len(c2.CompletedRoundIndices))
	}
	if c2.CurrentViewIndex != 1 {
		t.Errorf("expected view 1, got %d", c2.CurrentViewIndex)
	}
}

func TestClassroomReset(t *testing.T) {
	s := newTestStore(t)
	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")
	c, _ := s.CreateClassroom(user.ID, model.CreateClassroomRequest{
		TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
	})

	s.ShuffleClassroom(c.ID, user.ID)
	s.ShuffleClassroom(c.ID, user.ID)

	c2, err := s.ResetClassroom(c.ID, user.ID)
	if err != nil {
		t.Fatalf("reset: %v", err)
	}
	if len(c2.CompletedRoundIndices) != 0 {
		t.Errorf("expected empty completed, got %d", len(c2.CompletedRoundIndices))
	}
	if c2.CurrentViewIndex != -1 {
		t.Errorf("expected view -1, got %d", c2.CurrentViewIndex)
	}
}

func TestClassroomOwnership(t *testing.T) {
	s := newTestStore(t)
	user1, _ := s.UpsertUser("g1", "u1@x.com", "User1", "")
	user2, _ := s.UpsertUser("g2", "u2@x.com", "User2", "")

	c, _ := s.CreateClassroom(user1.ID, model.CreateClassroomRequest{
		TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
	})

	// User2 cannot access user1's classroom
	c2, err := s.GetClassroom(c.ID, user2.ID)
	if err != nil {
		t.Fatalf("get as user2: %v", err)
	}
	if c2 != nil {
		t.Error("user2 should not access user1's classroom")
	}
}

func TestStudentCRUD(t *testing.T) {
	s := newTestStore(t)
	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")
	c, _ := s.CreateClassroom(user.ID, model.CreateClassroomRequest{
		TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
	})

	// Bulk replace
	height := 155
	students := []model.UpdateStudentRequest{
		{LastName: "Martin", FirstName: "Emma", HeightCm: &height, Gender: "F"},
		{LastName: "Dubois", FirstName: "Lucas", HeightCm: nil, Gender: "M"},
		{LastName: "Thomas", FirstName: "Léa", HeightCm: &height, Gender: "F"},
		{LastName: "Robert", FirstName: "Hugo", HeightCm: nil, Gender: "M"},
	}
	err := s.BulkReplaceStudents(c.ID, students)
	if err != nil {
		t.Fatalf("bulk replace: %v", err)
	}

	// List
	list, err := s.ListStudents(c.ID)
	if err != nil {
		t.Fatalf("list students: %v", err)
	}
	if len(list) != 4 {
		t.Fatalf("expected 4 students, got %d", len(list))
	}
	if list[0].FirstName != "Emma" {
		t.Errorf("expected first student Emma, got %q", list[0].FirstName)
	}
	if list[0].StudentNum != 1 {
		t.Errorf("expected student_num 1, got %d", list[0].StudentNum)
	}

	// Update single
	newHeight := 160
	st, err := s.UpdateStudent(c.ID, 2, model.UpdateStudentRequest{
		LastName: "Dubois", FirstName: "Lucas", HeightCm: &newHeight, Gender: "M",
	})
	if err != nil {
		t.Fatalf("update student: %v", err)
	}
	if st.HeightCm == nil || *st.HeightCm != 160 {
		t.Errorf("expected height 160, got %v", st.HeightCm)
	}
}

func TestStudentBulkReplaceIsAtomic(t *testing.T) {
	s := newTestStore(t)
	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")
	c, _ := s.CreateClassroom(user.ID, model.CreateClassroomRequest{
		TotalStudents: 2, RowCount: 1, StudentsPerBench: 2,
	})

	// Initial bulk
	h := 150
	s.BulkReplaceStudents(c.ID, []model.UpdateStudentRequest{
		{FirstName: "A", HeightCm: &h, Gender: "M"},
		{FirstName: "B", HeightCm: &h, Gender: "F"},
	})

	// Replace with different data
	s.BulkReplaceStudents(c.ID, []model.UpdateStudentRequest{
		{FirstName: "X", HeightCm: &h, Gender: "M"},
	})

	list, _ := s.ListStudents(c.ID)
	if len(list) != 1 {
		t.Fatalf("expected 1 student after replace, got %d", len(list))
	}
	if list[0].FirstName != "X" {
		t.Errorf("expected X, got %q", list[0].FirstName)
	}
}

func TestProjectCRUD(t *testing.T) {
	s := newTestStore(t)
	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")
	c, _ := s.CreateClassroom(user.ID, model.CreateClassroomRequest{
		TotalStudents: 12, RowCount: 2, StudentsPerBench: 2,
	})

	// Create project
	p, err := s.CreateProject(c.ID, model.CreateProjectRequest{
		CourseName: "Math", ProjectName: "Algebra", TeamSize: 3, TotalStudents: 12,
	})
	if err != nil {
		t.Fatalf("create project: %v", err)
	}
	if p.CourseName != "Math" {
		t.Errorf("expected course 'Math', got %q", p.CourseName)
	}

	// List
	projects, err := s.ListProjects(c.ID)
	if err != nil {
		t.Fatalf("list projects: %v", err)
	}
	if len(projects) != 1 {
		t.Fatalf("expected 1 project, got %d", len(projects))
	}

	// Shuffle
	p2, err := s.ShuffleProject(p.ID)
	if err != nil {
		t.Fatalf("shuffle project: %v", err)
	}
	if len(p2.CompletedRoundIndices) != 1 {
		t.Errorf("expected 1 completed, got %d", len(p2.CompletedRoundIndices))
	}

	// Delete
	if err := s.DeleteProject(p.ID); err != nil {
		t.Fatalf("delete project: %v", err)
	}
	p3, _ := s.GetProject(p.ID)
	if p3 != nil {
		t.Error("expected nil after delete")
	}
}

func TestCascadeDeleteClassroomStudents(t *testing.T) {
	s := newTestStore(t)
	user, _ := s.UpsertUser("g1", "u@x.com", "User", "")
	c, _ := s.CreateClassroom(user.ID, model.CreateClassroomRequest{
		TotalStudents: 2, RowCount: 1, StudentsPerBench: 2,
	})

	h := 150
	s.BulkReplaceStudents(c.ID, []model.UpdateStudentRequest{
		{FirstName: "A", HeightCm: &h, Gender: "M"},
	})
	s.CreateProject(c.ID, model.CreateProjectRequest{
		CourseName: "Science", ProjectName: "Lab", TeamSize: 2, TotalStudents: 2,
	})

	// Delete classroom should cascade to students and projects
	s.DeleteClassroom(c.ID, user.ID)

	students, _ := s.ListStudents(c.ID)
	if len(students) != 0 {
		t.Errorf("expected 0 students after cascade, got %d", len(students))
	}
	projects, _ := s.ListProjects(c.ID)
	if len(projects) != 0 {
		t.Errorf("expected 0 projects after cascade, got %d", len(projects))
	}
}
