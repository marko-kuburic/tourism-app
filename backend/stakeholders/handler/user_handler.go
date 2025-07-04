package handler

import (
	"encoding/json"
	"log"
	"net/http"
	"stakeholders/model"
	"stakeholders/service"
	"strings"

	"github.com/gorilla/mux"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

func (h *UserHandler) RegisterRoutes(router *mux.Router) {
	router.HandleFunc("/register", h.register).Methods("POST")
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

func handleServiceError(w http.ResponseWriter, err error) {
	switch {
	case strings.Contains(err.Error(), "invalid role"):
		respondWithError(w, http.StatusBadRequest, err.Error())
	case strings.Contains(err.Error(), "username already exists"):
		respondWithError(w, http.StatusConflict, err.Error())
	case strings.Contains(err.Error(), "email already registered"):
		respondWithError(w, http.StatusConflict, err.Error())
	case strings.Contains(err.Error(), "password must be"):
		respondWithError(w, http.StatusBadRequest, err.Error())
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
	json.NewEncoder(w).Encode(data)
}
