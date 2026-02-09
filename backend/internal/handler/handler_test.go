package handler

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/model"
	"github.com/ao/classroom/backend/internal/store"
)

type testEnv struct {
	store     *store.Store
	classroom *ClassroomHandler
	student   *StudentHandler
	project   *ProjectHandler
	sync      *SyncHandler
	userID    string
}

func newTestEnv(t *testing.T) *testEnv {
	t.Helper()
	tmpFile, err := os.CreateTemp("", "handler-test-*.db")
	if err != nil {
		t.Fatalf("create temp file: %v", err)
	}
	tmpFile.Close()
	t.Cleanup(func() { os.Remove(tmpFile.Name()) })

	s, err := store.New(tmpFile.Name())
	if err != nil {
		t.Fatalf("new store: %v", err)
	}
	t.Cleanup(func() { s.Close() })

	user, err := s.UpsertUser("google-test", "test@example.com", "Test", "")
	if err != nil {
		t.Fatalf("upsert user: %v", err)
	}

	return &testEnv{
		store:     s,
		classroom: NewClassroomHandler(s),
		student:   NewStudentHandler(s),
		project:   NewProjectHandler(s),
		sync:      NewSyncHandler(s),
		userID:    user.ID,
	}
}

func (e *testEnv) authRequest(method, path string, body any) *http.Request {
	var bodyReader io.Reader
	if body != nil {
		data, _ := json.Marshal(body)
		bodyReader = bytes.NewReader(data)
	}
	req := httptest.NewRequest(method, path, bodyReader)
	req.Header.Set("Content-Type", "application/json")
	ctx := auth.WithUserID(req.Context(), e.userID)
	return req.WithContext(ctx)
}

func TestClassroomHandlerCreate(t *testing.T) {
	env := newTestEnv(t)

	req := env.authRequest("POST", "/api/classrooms", model.CreateClassroomRequest{
		Name: "Test", TotalStudents: 28, RowCount: 3, StudentsPerBench: 2,
	})
	w := httptest.NewRecorder()
	env.classroom.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var c model.Classroom
	json.NewDecoder(w.Body).Decode(&c)
	if c.Name != "Test" {
		t.Errorf("expected name 'Test', got %q", c.Name)
	}
	if c.TotalStudents != 28 {
		t.Errorf("expected 28 students, got %d", c.TotalStudents)
	}
}

func TestClassroomHandlerCreateValidation(t *testing.T) {
	env := newTestEnv(t)

	tests := []struct {
		name string
		req  model.CreateClassroomRequest
	}{
		{"too few students", model.CreateClassroomRequest{TotalStudents: 2, RowCount: 1, StudentsPerBench: 2}},
		{"too many students", model.CreateClassroomRequest{TotalStudents: 100, RowCount: 1, StudentsPerBench: 2}},
		{"too few rows", model.CreateClassroomRequest{TotalStudents: 10, RowCount: 0, StudentsPerBench: 2}},
		{"too many rows", model.CreateClassroomRequest{TotalStudents: 10, RowCount: 10, StudentsPerBench: 2}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := env.authRequest("POST", "/api/classrooms", tt.req)
			w := httptest.NewRecorder()
			env.classroom.Create(w, req)
			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
			}
		})
	}
}

func TestClassroomHandlerList(t *testing.T) {
	env := newTestEnv(t)

	// Create two classrooms
	env.store.CreateClassroom(env.userID, model.CreateClassroomRequest{
		Name: "A", TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
	})
	env.store.CreateClassroom(env.userID, model.CreateClassroomRequest{
		Name: "B", TotalStudents: 6, RowCount: 2, StudentsPerBench: 2,
	})

	req := env.authRequest("GET", "/api/classrooms", nil)
	w := httptest.NewRecorder()
	env.classroom.List(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}

	var classrooms []model.Classroom
	json.NewDecoder(w.Body).Decode(&classrooms)
	if len(classrooms) != 2 {
		t.Errorf("expected 2 classrooms, got %d", len(classrooms))
	}
}

func TestClassroomHandlerViewValidation(t *testing.T) {
	env := newTestEnv(t)

	c, _ := env.store.CreateClassroom(env.userID, model.CreateClassroomRequest{
		TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
	})

	req := env.authRequest("PATCH", "/api/classrooms/"+c.ID+"/view", model.ViewIndexRequest{Index: -2})
	req.SetPathValue("id", c.ID)
	w := httptest.NewRecorder()
	env.classroom.UpdateView(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for index -2, got %d: %s", w.Code, w.Body.String())
	}
}

func TestStudentHandlerBulkReplace(t *testing.T) {
	env := newTestEnv(t)
	c, _ := env.store.CreateClassroom(env.userID, model.CreateClassroomRequest{
		TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
	})

	h := 155
	req := env.authRequest("PUT", "/api/classrooms/"+c.ID+"/students", model.BulkStudentsRequest{
		Students: []model.UpdateStudentRequest{
			{LastName: "Martin", FirstName: "Emma", HeightCm: &h, Gender: "F"},
			{LastName: "Dubois", FirstName: "Lucas", HeightCm: nil, Gender: "M"},
		},
	})
	req.SetPathValue("id", c.ID)
	w := httptest.NewRecorder()
	env.student.BulkReplace(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", w.Code, w.Body.String())
	}

	var students []model.Student
	json.NewDecoder(w.Body).Decode(&students)
	if len(students) != 2 {
		t.Errorf("expected 2 students, got %d", len(students))
	}
}

func TestProjectHandlerCreateValidation(t *testing.T) {
	env := newTestEnv(t)
	c, _ := env.store.CreateClassroom(env.userID, model.CreateClassroomRequest{
		TotalStudents: 12, RowCount: 2, StudentsPerBench: 2,
	})

	tests := []struct {
		name string
		req  model.CreateProjectRequest
	}{
		{"team too small", model.CreateProjectRequest{CourseName: "X", ProjectName: "Y", TeamSize: 1, TotalStudents: 12}},
		{"team too large", model.CreateProjectRequest{CourseName: "X", ProjectName: "Y", TeamSize: 10, TotalStudents: 12}},
		{"students too few", model.CreateProjectRequest{CourseName: "X", ProjectName: "Y", TeamSize: 3, TotalStudents: 2}},
		{"students too many", model.CreateProjectRequest{CourseName: "X", ProjectName: "Y", TeamSize: 3, TotalStudents: 100}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := env.authRequest("POST", "/api/classrooms/"+c.ID+"/projects", tt.req)
			req.SetPathValue("id", c.ID)
			w := httptest.NewRecorder()
			env.project.Create(w, req)
			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400, got %d: %s", w.Code, w.Body.String())
			}
		})
	}
}

func TestProjectHandlerCreateSuccess(t *testing.T) {
	env := newTestEnv(t)
	c, _ := env.store.CreateClassroom(env.userID, model.CreateClassroomRequest{
		TotalStudents: 12, RowCount: 2, StudentsPerBench: 2,
	})

	req := env.authRequest("POST", "/api/classrooms/"+c.ID+"/projects", model.CreateProjectRequest{
		CourseName: "Math", ProjectName: "Algebra", TeamSize: 3, TotalStudents: 12,
	})
	req.SetPathValue("id", c.ID)
	w := httptest.NewRecorder()
	env.project.Create(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var p model.Project
	json.NewDecoder(w.Body).Decode(&p)
	if p.CourseName != "Math" {
		t.Errorf("expected 'Math', got %q", p.CourseName)
	}
}

func TestSyncImport(t *testing.T) {
	env := newTestEnv(t)

	h := 150
	importReq := model.ImportRequest{
		Config: model.ImportClassroomConfig{
			TotalStudents: 4, RowCount: 1, StudentsPerBench: 2,
			CompletedRoundIndices: []int{0, 1}, CurrentViewIndex: 1,
		},
		Students: map[string]model.ImportStudent{
			"1": {FirstName: "Emma", LastName: "Martin", HeightCm: &h, Gender: "F"},
			"2": {FirstName: "Lucas", LastName: "Dubois", HeightCm: nil, Gender: "M"},
		},
		Projects: []model.ImportProject{
			{CourseName: "Math", ProjectName: "Algebra", TeamSize: 2, TotalStudents: 4},
		},
	}

	req := env.authRequest("POST", "/api/sync/import", importReq)
	w := httptest.NewRecorder()
	env.sync.Import(w, req)

	if w.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", w.Code, w.Body.String())
	}

	var c model.Classroom
	json.NewDecoder(w.Body).Decode(&c)
	if c.TotalStudents != 4 {
		t.Errorf("expected 4 students, got %d", c.TotalStudents)
	}

	// Verify students were imported
	students, _ := env.store.ListStudents(c.ID)
	if len(students) != 4 {
		t.Errorf("expected 4 students imported, got %d", len(students))
	}

	// Verify project was imported
	projects, _ := env.store.ListProjects(c.ID)
	if len(projects) != 1 {
		t.Errorf("expected 1 project imported, got %d", len(projects))
	}
}

func TestUnauthorizedAccess(t *testing.T) {
	env := newTestEnv(t)

	// Request without auth context
	req := httptest.NewRequest("GET", "/api/classrooms", nil)
	w := httptest.NewRecorder()
	env.classroom.List(w, req)

	// Should return empty list (no user ID → no classrooms found)
	if w.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", w.Code)
	}
	var classrooms []model.Classroom
	json.NewDecoder(w.Body).Decode(&classrooms)
	if len(classrooms) != 0 {
		t.Errorf("expected 0 classrooms without auth, got %d", len(classrooms))
	}
}
