package handler

import (
	"net/http"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/model"
	"github.com/ao/classroom/backend/internal/store"
)

type ProjectHandler struct {
	store *store.Store
}

func NewProjectHandler(s *store.Store) *ProjectHandler {
	return &ProjectHandler{store: s}
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
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

	projects, err := h.store.ListProjects(classroomID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to list projects")
		return
	}
	if projects == nil {
		projects = []model.Project{}
	}
	writeJSON(w, http.StatusOK, projects)
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
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

	var req model.CreateProjectRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.TeamSize < 2 || req.TeamSize > 6 {
		writeError(w, http.StatusBadRequest, "teamSize must be 2-6")
		return
	}
	if req.TotalStudents < 4 || req.TotalStudents > 60 {
		writeError(w, http.StatusBadRequest, "totalStudents must be 4-60")
		return
	}

	project, err := h.store.CreateProject(classroomID, req)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to create project")
		return
	}
	writeJSON(w, http.StatusCreated, project)
}

func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")
	projectID := r.PathValue("pid")

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

	project, err := h.store.GetProject(projectID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to get project")
		return
	}
	if project == nil || project.ClassroomID != classroomID {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")
	projectID := r.PathValue("pid")

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

	if err := h.store.DeleteProject(projectID); err != nil {
		writeError(w, http.StatusInternalServerError, "failed to delete project")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *ProjectHandler) Shuffle(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")
	projectID := r.PathValue("pid")

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

	project, err := h.store.ShuffleProject(projectID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to shuffle")
		return
	}
	if project == nil || project.ClassroomID != classroomID {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, project)
}

func (h *ProjectHandler) UpdateView(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	classroomID := r.PathValue("id")
	projectID := r.PathValue("pid")

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

	var req model.ViewIndexRequest
	if err := readJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	project, err := h.store.UpdateProjectView(projectID, req.Index)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to update view")
		return
	}
	if project == nil || project.ClassroomID != classroomID {
		writeError(w, http.StatusNotFound, "project not found")
		return
	}
	writeJSON(w, http.StatusOK, project)
}
