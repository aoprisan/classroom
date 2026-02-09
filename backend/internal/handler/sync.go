package handler

import (
	"net/http"
	"strconv"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/model"
	"github.com/ao/classroom/backend/internal/store"
)

type SyncHandler struct {
	store *store.Store
}

func NewSyncHandler(s *store.Store) *SyncHandler {
	return &SyncHandler{store: s}
}

func (h *SyncHandler) Import(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())

	var req model.ImportRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	// Create classroom from imported config
	classroom, err := h.store.CreateClassroom(userID, model.CreateClassroomRequest{
		Name:             "Imported Classroom",
		TotalStudents:    req.Config.TotalStudents,
		RowCount:         req.Config.RowCount,
		StudentsPerBench: req.Config.StudentsPerBench,
	})
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create classroom")
		return
	}

	// Import students
	var students []model.UpdateStudentRequest
	for i := 1; i <= req.Config.TotalStudents; i++ {
		key := strconv.Itoa(i)
		if s, ok := req.Students[key]; ok {
			students = append(students, model.UpdateStudentRequest{
				LastName:  s.LastName,
				FirstName: s.FirstName,
				HeightCm:  s.HeightCm,
				Gender:    s.Gender,
			})
		} else {
			students = append(students, model.UpdateStudentRequest{})
		}
	}

	if len(students) > 0 {
		if err := h.store.BulkReplaceStudents(classroom.ID, students); err != nil {
			writeError(w, http.StatusInternalServerError, "failed to import students")
			return
		}
	}

	// Import projects
	for _, p := range req.Projects {
		_, err := h.store.CreateProject(classroom.ID, model.CreateProjectRequest{
			CourseName:    p.CourseName,
			ProjectName:   p.ProjectName,
			TeamSize:      p.TeamSize,
			TotalStudents: p.TotalStudents,
		})
		if err != nil {
			writeError(w, http.StatusInternalServerError, "failed to import project")
			return
		}
	}

	writeJSON(w, http.StatusCreated, classroom)
}
