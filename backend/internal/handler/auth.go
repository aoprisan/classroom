package handler

import (
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"

	"github.com/ao/classroom/backend/internal/auth"
	"github.com/ao/classroom/backend/internal/store"
)

type AuthHandler struct {
	store       *store.Store
	googleCfg   auth.GoogleConfig
	jwtSecret   string
	frontendURL string
}

func NewAuthHandler(s *store.Store, googleCfg auth.GoogleConfig, jwtSecret, frontendURL string) *AuthHandler {
	return &AuthHandler{
		store:       s,
		googleCfg:   googleCfg,
		jwtSecret:   jwtSecret,
		frontendURL: frontendURL,
	}
}

func (h *AuthHandler) GoogleLogin(w http.ResponseWriter, r *http.Request) {
	state := randomState()
	// In production, store state in a cookie for CSRF validation
	url := auth.GoogleAuthURL(h.googleCfg, state)
	http.Redirect(w, r, url, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) GoogleCallback(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		writeError(w, http.StatusBadRequest, "missing code")
		return
	}

	info, err := auth.ExchangeGoogleCode(r.Context(), h.googleCfg, code)
	if err != nil {
		log.Printf("google oauth error: %v", err)
		writeError(w, http.StatusInternalServerError, "oauth failed")
		return
	}

	user, err := h.store.UpsertUser(info.ID, info.Email, info.Name, info.Picture)
	if err != nil {
		log.Printf("upsert user error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to save user")
		return
	}

	token, err := auth.CreateToken(h.jwtSecret, user.ID)
	if err != nil {
		log.Printf("create token error: %v", err)
		writeError(w, http.StatusInternalServerError, "failed to create token")
		return
	}

	redirectURL := h.frontendURL + "#token=" + token
	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID := auth.UserIDFromContext(r.Context())
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.store.GetUserByID(userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "failed to fetch user")
		return
	}
	if user == nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	writeJSON(w, http.StatusOK, user)
}

func (h *AuthHandler) Logout(w http.ResponseWriter, _ *http.Request) {
	// Client-side token deletion; nothing to do server-side with stateless JWTs
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func randomState() string {
	b := make([]byte, 16)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}
