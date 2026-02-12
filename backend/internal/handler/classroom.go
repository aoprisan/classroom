package handler

import (
	"net/http"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/model"
	"github.com/ao/classroom/backend/internal/store"
)

type ClassroomHandler struct {
	store *store.Store
}

func NewClassroomHandler(s *store.Store) *ClassroomHandler {
	return &ClassroomHandler{store: s}
}

func (h *ClassroomHandler) List(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classrooms, err := h.store.ListClassrooms(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list classrooms")
		return
	}
	if classrooms == nil {
		classrooms = []model.Classroom{}
	}
	writeJSON(w, http.StatusOK, classrooms)
}

func (h *ClassroomHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	var req model.CreateClassroomRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TotalStudents < 4 || req.TotalStudents > 60 {
		writeError(w, http.StatusBadRequest, "totalStudents must be 4-60")
		return
	}
	if req.RowCount < 1 || req.RowCount > 6 {
		writeError(w, http.StatusBadRequest, "rowCount must be 1-6")
		return
	}
	if req.StudentsPerBench == 0 {
		req.StudentsPerBench = 2
	}
	if req.PairingMode == "" {
		req.PairingMode = "random"
	}
	if req.PairingMode != "random" && req.PairingMode != "mixed" && req.PairingMode != "same" {
		writeError(w, http.StatusBadRequest, "pairingMode must be random, mixed, or same")
		return
	}

	classroom, err := h.store.CreateClassroom(userID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create classroom")
		return
	}
	writeJSON(w, http.StatusCreated, classroom)
}

func (h *ClassroomHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	classroom, err := h.store.GetClassroom(id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get classroom")
		return
	}
	if classroom == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}
	writeJSON(w, http.StatusOK, classroom)
}

func (h *ClassroomHandler) Update(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	var req model.UpdateClassroomRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.PairingMode != nil && *req.PairingMode != "random" && *req.PairingMode != "mixed" && *req.PairingMode != "same" {
		writeError(w, http.StatusBadRequest, "pairingMode must be random, mixed, or same")
		return
	}

	classroom, err := h.store.UpdateClassroom(id, userID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update classroom")
		return
	}
	if classroom == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}
	writeJSON(w, http.StatusOK, classroom)
}

func (h *ClassroomHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	if err := h.store.DeleteClassroom(id, userID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete classroom")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ClassroomHandler) Shuffle(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	classroom, err := h.store.ShuffleClassroom(id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to shuffle")
		return
	}
	if classroom == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}
	writeJSON(w, http.StatusOK, classroom)
}

func (h *ClassroomHandler) UpdateView(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	var req model.ViewIndexRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Index < -1 {
		writeError(w, http.StatusBadRequest, "index must be >= -1")
		return
	}

	classroom, err := h.store.UpdateClassroomView(id, userID, req.Index)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update view")
		return
	}
	if classroom == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}
	writeJSON(w, http.StatusOK, classroom)
}

func (h *ClassroomHandler) Reset(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	id := r.PathValue("id")

	classroom, err := h.store.ResetClassroom(id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to reset")
		return
	}
	if classroom == nil {
		writeError(w, http.StatusNotFound, "classroom not found")
		return
	}
	writeJSON(w, http.StatusOK, classroom)
}
