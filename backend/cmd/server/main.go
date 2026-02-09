package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/ao/classroom/backend/internal/server"
)

//go:embed dist
var distFS embed.FS

func main() {
	port := envOr("PORT", "8080")
	dbPath := envOr("DATABASE_PATH", "classroom.db")
	jwtSecret := envOr("JWT_SECRET", "dev-secret-change-in-production")
	frontendOrigin := envOr("FRONTEND_ORIGIN", "http://localhost:5173")
	googleClientID := os.Getenv("GOOGLE_CLIENT_ID")
	googleClientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	// Try to use embedded frontend; if dist/ doesn't exist, serve without it
	var frontendFS fs.FS
	if entries, err := fs.ReadDir(distFS, "dist"); err == nil && len(entries) > 0 {
		sub, _ := fs.Sub(distFS, "dist")
		frontendFS = sub
	}

	cfg := server.Config{
		Port:               port,
		DatabasePath:       dbPath,
		GoogleClientID:     googleClientID,
		GoogleClientSecret: googleClientSecret,
		JWTSecret:          jwtSecret,
		FrontendOrigin:     frontendOrigin,
		FrontendFS:         frontendFS,
	}

	srv, err := server.New(cfg)
	if err != nil {
		log.Fatalf("failed to create server: %v", err)
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("server listening on :%s", port)
		if err := srv.ListenAndServe(); err != nil {
			log.Printf("server error: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("shutting down...")

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		log.Fatalf("shutdown error: %v", err)
	}
	log.Println("server stopped")
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
