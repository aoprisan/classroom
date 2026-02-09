package server

import (
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/handler"
	"github.com/ao/classroom/backend/internal/store"
)

type Config struct {
	Port               string
	DatabasePath       string
	GoogleClientID     string
	GoogleClientSecret string
	JWTSecret          string
	FrontendOrigin     string
	FrontendFS         fs.FS // embedded frontend dist
}

func New(cfg Config) (*http.Server, error) {
	s, err := store.New(cfg.DatabasePath)
	if err != nil {
		return nil, err
	}

	googleCfg := auth.GoogleConfig{
		ClientID:     cfg.GoogleClientID,
		ClientSecret: cfg.GoogleClientSecret,
		RedirectURL:  cfg.FrontendOrigin + "/classroom/api/auth/google/callback",
	}

	authHandler := handler.NewAuthHandler(s, googleCfg, cfg.JWTSecret, cfg.FrontendOrigin+"/classroom/")
	classroomHandler := handler.NewClassroomHandler(s)
	studentHandler := handler.NewStudentHandler(s)
	projectHandler := handler.NewProjectHandler(s)
	syncHandler := handler.NewSyncHandler(s)

	mux := http.NewServeMux()

	// API routes (under /classroom/api/)
	prefix := "/classroom/api"

	// Auth
	mux.HandleFunc("GET "+prefix+"/auth/google", authHandler.GoogleLogin)
	mux.HandleFunc("GET "+prefix+"/auth/google/callback", authHandler.GoogleCallback)
	mux.HandleFunc("GET "+prefix+"/auth/me", authHandler.Me)
	mux.HandleFunc("POST "+prefix+"/auth/logout", authHandler.Logout)

	// Classrooms
	mux.HandleFunc("GET "+prefix+"/classrooms", classroomHandler.List)
	mux.HandleFunc("POST "+prefix+"/classrooms", classroomHandler.Create)
	mux.HandleFunc("GET "+prefix+"/classrooms/{id}", classroomHandler.Get)
	mux.HandleFunc("PUT "+prefix+"/classrooms/{id}", classroomHandler.Update)
	mux.HandleFunc("DELETE "+prefix+"/classrooms/{id}", classroomHandler.Delete)
	mux.HandleFunc("PATCH "+prefix+"/classrooms/{id}/shuffle", classroomHandler.Shuffle)
	mux.HandleFunc("PATCH "+prefix+"/classrooms/{id}/view", classroomHandler.UpdateView)
	mux.HandleFunc("PATCH "+prefix+"/classrooms/{id}/reset", classroomHandler.Reset)

	// Students
	mux.HandleFunc("GET "+prefix+"/classrooms/{id}/students", studentHandler.List)
	mux.HandleFunc("PUT "+prefix+"/classrooms/{id}/students", studentHandler.BulkReplace)
	mux.HandleFunc("PUT "+prefix+"/classrooms/{id}/students/{num}", studentHandler.Update)

	// Projects
	mux.HandleFunc("GET "+prefix+"/classrooms/{id}/projects", projectHandler.List)
	mux.HandleFunc("POST "+prefix+"/classrooms/{id}/projects", projectHandler.Create)
	mux.HandleFunc("GET "+prefix+"/classrooms/{id}/projects/{pid}", projectHandler.Get)
	mux.HandleFunc("DELETE "+prefix+"/classrooms/{id}/projects/{pid}", projectHandler.Delete)
	mux.HandleFunc("PATCH "+prefix+"/classrooms/{id}/projects/{pid}/shuffle", projectHandler.Shuffle)
	mux.HandleFunc("PATCH "+prefix+"/classrooms/{id}/projects/{pid}/view", projectHandler.UpdateView)

	// Import
	mux.HandleFunc("POST "+prefix+"/sync/import", syncHandler.Import)

	// Serve embedded frontend at /classroom/
	if cfg.FrontendFS != nil {
		fileServer := http.FileServer(http.FS(cfg.FrontendFS))
		mux.HandleFunc("/classroom/", func(w http.ResponseWriter, r *http.Request) {
			// Don't serve API routes as static files
			if strings.HasPrefix(r.URL.Path, prefix) {
				http.NotFound(w, r)
				return
			}
			// Strip /classroom/ prefix for the file server
			path := strings.TrimPrefix(r.URL.Path, "/classroom/")
			// Try to serve the file; if not found, serve index.html (SPA fallback)
			if path != "" && path != "/" {
				// Check if file exists
				if f, err := cfg.FrontendFS.Open(path); err == nil {
					f.Close()
					http.StripPrefix("/classroom/", fileServer).ServeHTTP(w, r)
					return
				}
			}
			// SPA fallback: serve index.html
			r.URL.Path = "/classroom/index.html"
			http.StripPrefix("/classroom/", fileServer).ServeHTTP(w, r)
		})
	}

	// Redirect root to /classroom/
	mux.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.Redirect(w, r, "/classroom/", http.StatusTemporaryRedirect)
			return
		}
		http.NotFound(w, r)
	})

	// Build middleware chain
	var h http.Handler = mux
	h = auth.Middleware(cfg.JWTSecret)(h)
	h = corsMiddleware(cfg.FrontendOrigin)(h)
	h = requestLogger(h)

	return &http.Server{
		Addr:    ":" + cfg.Port,
		Handler: h,
	}, nil
}

func corsMiddleware(origin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
			w.Header().Set("Access-Control-Max-Age", "86400")

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusNoContent)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func requestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}
