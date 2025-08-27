package handler

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"stakeholders/model"
	"stakeholders/service"
	"strings"
	"errors" 


	"github.com/google/uuid" 
	"github.com/gorilla/mux"
	"gorm.io/gorm" 

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
	router.HandleFunc("/block-user/{id}", h.blockUser).Methods("POST")
	router.HandleFunc("/users", h.getAllUsers).Methods("GET")


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
	userIDToBlockStr := vars["id"]
	userIDToBlock, err := uuid.Parse(userIDToBlockStr)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid user ID format in URL")
		return
	}

	adminIDStr, _ := claims["user_id"].(string)
	adminID, _ := uuid.Parse(adminIDStr)


	if adminID == userIDToBlock {
		respondWithError(w, http.StatusBadRequest, "Administrator cannot block themselves")
		return
	}

	userToBlock, err := h.service.GetUserByID(r.Context(), userIDToBlock)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			respondWithError(w, http.StatusNotFound, "User with the given ID was not found")
		} else {
			respondWithError(w, http.StatusInternalServerError, "Error while checking user existence")
		}
		return
	}

	/*if userToBlock.Role == model.RoleAdmin {
		respondWithError(w, http.StatusForbidden, "Cannot block another administrator")
		return
	}*/

	if !userToBlock.Activated {
		respondWithError(w, http.StatusConflict, "User is already blocked")
		return
	}

	if err := h.service.BlockUser(r.Context(), userIDToBlock); err != nil {
		handleServiceError(w, err)
		return
	}

	respondWithJSON(w, http.StatusOK, map[string]string{"message": "User blocked successfully"})
}

func (h *UserHandler) getAllUsers(w http.ResponseWriter, r *http.Request) {
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
