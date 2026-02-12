package model

import "time"

type User struct {
	ID        string    `json:"id"`
	GoogleID  string    `json:"googleId"`
	Email     string    `json:"email"`
	Name      string    `json:"name"`
	AvatarURL string    `json:"avatarUrl"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type Classroom struct {
	ID                    string    `json:"id"`
	UserID                string    `json:"userId"`
	Name                  string    `json:"name"`
	TotalStudents         int       `json:"totalStudents"`
	RowCount              int       `json:"rowCount"`
	StudentsPerBench      int       `json:"studentsPerBench"`
	PairingMode           string    `json:"pairingMode"`
	CompletedRoundIndices []int     `json:"completedRoundIndices"`
	CurrentViewIndex      int       `json:"currentViewIndex"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

type Student struct {
	ID          string `json:"id"`
	ClassroomID string `json:"classroomId"`
	StudentNum  int    `json:"studentNum"`
	LastName    string `json:"lastName"`
	FirstName   string `json:"firstName"`
	HeightCm    *int   `json:"heightCm"`
	Gender      string `json:"gender"`
}

type Project struct {
	ID                    string    `json:"id"`
	ClassroomID           string    `json:"classroomId"`
	CourseName            string    `json:"courseName"`
	ProjectName           string    `json:"projectName"`
	TeamSize              int       `json:"teamSize"`
	TotalStudents         int       `json:"totalStudents"`
	CompletedRoundIndices []int     `json:"completedRoundIndices"`
	CurrentViewIndex      int       `json:"currentViewIndex"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// Request/response types

type CreateClassroomRequest struct {
	Name             string `json:"name"`
	TotalStudents    int    `json:"totalStudents"`
	RowCount         int    `json:"rowCount"`
	StudentsPerBench int    `json:"studentsPerBench"`
	PairingMode      string `json:"pairingMode"`
}

type UpdateClassroomRequest struct {
	Name             *string `json:"name,omitempty"`
	TotalStudents    *int    `json:"totalStudents,omitempty"`
	RowCount         *int    `json:"rowCount,omitempty"`
	StudentsPerBench *int    `json:"studentsPerBench,omitempty"`
	PairingMode      *string `json:"pairingMode,omitempty"`
}

type UpdateStudentRequest struct {
	LastName  string `json:"lastName"`
	FirstName string `json:"firstName"`
	HeightCm  *int   `json:"heightCm"`
	Gender    string `json:"gender"`
}

type BulkStudentsRequest struct {
	Students []UpdateStudentRequest `json:"students"`
}

type CreateProjectRequest struct {
	CourseName    string `json:"courseName"`
	ProjectName   string `json:"projectName"`
	TeamSize      int    `json:"teamSize"`
	TotalStudents int    `json:"totalStudents"`
}

type ViewIndexRequest struct {
	Index int `json:"index"`
}

type ImportRequest struct {
	Config   ImportClassroomConfig   `json:"config"`
	Students map[string]ImportStudent `json:"students"`
	Projects []ImportProject         `json:"projects,omitempty"`
}

type ImportClassroomConfig struct {
	TotalStudents         int    `json:"totalStudents"`
	RowCount              int    `json:"rowCount"`
	StudentsPerBench      int    `json:"studentsPerBench"`
	PairingMode           string `json:"pairingMode"`
	CompletedRoundIndices []int  `json:"completedRoundIndices"`
	CurrentViewIndex      int    `json:"currentViewIndex"`
}

type ImportStudent struct {
	LastName  string `json:"lastName"`
	FirstName string `json:"firstName"`
	HeightCm  *int   `json:"heightCm"`
	Gender    string `json:"gender"`
}

type ImportProject struct {
	CourseName            string `json:"courseName"`
	ProjectName           string `json:"projectName"`
	TeamSize              int    `json:"teamSize"`
	TotalStudents         int    `json:"totalStudents"`
	CompletedRoundIndices []int  `json:"completedRoundIndices"`
	CurrentViewIndex      int    `json:"currentViewIndex"`
}
