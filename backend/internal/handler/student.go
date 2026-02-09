package handler

import (
	"net/http"
	"strconv"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/model"
	"github.com/ao/classroom/backend/internal/store"
)

type StudentHandler struct {
	store *store.Store
}

func NewStudentHandler(s *store.Store) *StudentHandler {
	return &StudentHandler{store: s}
}

func (h *StudentHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")

	// Verify ownership
	c, err := h.store.GetClassroom(classroomID, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get classroom")
		return
	}
	if c == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}

	students, err := h.store.ListStudents(classroomID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list students")
		return
	}
	if students == nil {
		students = []model.Student{}
	}
	writeJSON(w, http.StatusOK, students)
}

func (h *StudentHandler) BulkReplace(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")

	// Verify ownership
	c, err := h.store.GetClassroom(classroomID, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get classroom")
		return
	}
	if c == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}

	var req model.BulkStudentsRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if err := h.store.BulkReplaceStudents(classroomID, req.Students); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to save students")
		return
	}

	students, err := h.store.ListStudents(classroomID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list students")
		return
	}
	writeJSON(w, http.StatusOK, students)
}

func (h *StudentHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")
	numStr := r.PathValue("num")

	num, err := strconv.Atoi(numStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid student number")
		return
	}

	// Verify ownership
	c, err := h.store.GetClassroom(classroomID, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get classroom")
		return
	}
	if c == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}

	var req model.UpdateStudentRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	student, err := h.store.UpdateStudent(classroomID, num, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update student")
		return
	}
	writeJSON(w, http.StatusOK, student)
}
