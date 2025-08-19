package handler

import (
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
	router.HandleFunc("/register", h.register).Methods("POST")
	router.HandleFunc("/login", h.login).Methods("POST")
	router.HandleFunc("/block-user/{id}", h.blockUser).Methods("POST")
	router.HandleFunc("/users", h.GetAllUsers).Methods("GET")


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

func (h *UserHandler) blockUser(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		respondWithError(w, http.StatusUnauthorized, "Missing authorization token")
		return
	}

	tokenString = strings.TrimPrefix(tokenString, "Bearer ")
	claims, err := h.service.ParseToken(tokenString)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid token")
		return
	}

	role, ok := claims["role"].(string)
	if !ok || role != string(model.RoleAdmin) {
		respondWithError(w, http.StatusForbidden, "Only admins can block users")
		return
	}

	vars := mux.Vars(r)
	userIDStr := vars["id"]
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	if err := h.service.BlockUser(r.Context(), userID); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "User blocked successfully"})
}

func (h *UserHandler) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		respondWithError(w, http.StatusUnauthorized, "Missing authorization token")
		return
	}

	tokenString = strings.TrimPrefix(tokenString, "Bearer ")


	claims, err := h.service.ParseToken(tokenString)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Invalid or expired token")
		return
	}

	role, ok := claims["role"].(string)
	if !ok || role != string(model.RoleAdmin) {
		respondWithError(w, http.StatusForbidden, "Forbidden: Administrator access required")
		return
	}

	users, err := h.service.GetAll(r.Context())
	if err != nil {
		log.Printf("Error fetching all users: %v", err)
		respondWithError(w, http.StatusInternalServerError, "Internal server error")
		return
	}

	respondWithJSON(w, http.StatusOK, users)
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
	json.NewEncoder(w).Encode(data)
}