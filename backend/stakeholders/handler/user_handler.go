package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"stakeholders/model"
	"stakeholders/service"
	"strings"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) RegisterRoutes(router *mux.Router) {
	// javni endpointi
	router.HandleFunc("/register", h.register).Methods("POST")
	router.HandleFunc("/login", h.login).Methods("POST")
}

// 🔒 pozovi ovo na subrouter-u koji već ima JWT middleware (vidi dole uputstvo)
func (h *UserHandler) RegisterProtectedRoutes(router *mux.Router) {
	router.HandleFunc("/me", h.getMe).Methods("GET")
	router.HandleFunc("/me", h.updateMe).Methods("PUT")
}

type registerRequest struct {
	Username       string `json:"username"`
	Password       string `json:"password"`
	Email          string `json:"email"`
	Role           string `json:"role"`
	ProfilePicture string `json:"profile_picture"`
	Biography      string `json:"biography"`
	Motto          string `json:"motto"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type loginResponse struct {
	User  *model.User `json:"user"`
	Token string      `json:"token"`
}

func (h *UserHandler) register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	user, err := h.service.Register(r.Context(), &service.RegisterRequest{
		Username:       req.Username,
		Password:       req.Password,
		Email:          req.Email,
		Role:           model.Role(req.Role),
		ProfilePicture: req.ProfilePicture,
		Biography:      req.Biography,
		Motto:          req.Motto,
	})
	if err != nil {
		handleServiceError(w, err)
		return
	}
	respondWithJSON(w, http.StatusCreated, user)
}

func (h *UserHandler) login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	user, token, err := h.service.Login(r.Context(), &service.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		handleServiceError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, loginResponse{User: user, Token: token})
}

// ✅ NEW: GET /me
func (h *UserHandler) getMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := userIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	dto, err := h.service.GetMe(r.Context(), userID)
	if err != nil {
		handleServiceError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, dto)
}

// ✅ NEW: PUT /me
func (h *UserHandler) updateMe(w http.ResponseWriter, r *http.Request) {
	userID, ok := userIDFromCtx(r.Context())
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var req service.UpdateMeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request format", http.StatusBadRequest)
		return
	}
	dto, err := h.service.UpdateMe(r.Context(), userID, &req)
	if err != nil {
		// validacione greške iz servisa (npr. nevalidan URL, motto > 255) vrati kao 400
		if strings.Contains(err.Error(), "valid") || strings.Contains(err.Error(), "max length") {
			respondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		handleServiceError(w, err)
		return
	}
	respondWithJSON(w, http.StatusOK, dto)
}

func handleServiceError(w http.ResponseWriter, err error) {
	switch {
	case strings.Contains(err.Error(), "invalid role"):
		respondWithError(w, http.StatusBadRequest, err.Error())
	case strings.Contains(err.Error(), "username already taken"): // ✅ dodato u odnosu na repo poruku
		respondWithError(w, http.StatusConflict, err.Error())
	case strings.Contains(err.Error(), "username already exists"):
		respondWithError(w, http.StatusConflict, err.Error())
	case strings.Contains(err.Error(), "email already registered"):
		respondWithError(w, http.StatusConflict, err.Error())
	case strings.Contains(err.Error(), "password must be"):
		respondWithError(w, http.StatusBadRequest, err.Error())
	case strings.Contains(err.Error(), "invalid credentials"):
		respondWithError(w, http.StatusUnauthorized, err.Error())
	default:
		log.Printf("Internal server error: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Internal server error")
	}
}

func respondWithError(w http.ResponseWriter, code int, message string) {
	respondWithJSON(w, code, map[string]string{"error": message})
}

func respondWithJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}

// helper: vadi user_id (string UUID) iz konteksta koji je setovao tvoj JWT middleware u main.go
func userIDFromCtx(ctx context.Context) (uuid.UUID, bool) {
	raw, _ := ctx.Value("user_id").(string)
	id, err := uuid.Parse(raw)
	return id, err == nil
}
