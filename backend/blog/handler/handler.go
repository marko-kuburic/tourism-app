package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"tourism-blog/service"
)

type ctxKey string

const userIDKey ctxKey = "user_id"

type BlogHandler struct{ svc *service.BlogService }

func New(s *service.BlogService) *BlogHandler { return &BlogHandler{svc: s} }

func (h *BlogHandler) RegisterRoutes(r *mux.Router) {
	// Preflight (OPTIONS) za iste rute
	r.HandleFunc("/blogs", h.options).Methods(http.MethodOptions)
	r.HandleFunc("/blogs/{id}", h.options).Methods(http.MethodOptions)

	// Zaštićene rute
	r.HandleFunc("/blogs", h.create).Methods(http.MethodPost)
	r.HandleFunc("/blogs", h.list).Methods(http.MethodGet)
	r.HandleFunc("/blogs/{id}", h.get).Methods(http.MethodGet)
}

func (h *BlogHandler) create(w http.ResponseWriter, r *http.Request) {
	uid, _ := r.Context().Value(userIDKey).(string)
	if strings.TrimSpace(uid) == "" {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}
	var dto service.CreateBlogDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	b, err := h.svc.Create(r.Context(), uid, dto)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusCreated, b)
}

func (h *BlogHandler) list(w http.ResponseWriter, r *http.Request) {
	var limit int64
	if q := r.URL.Query().Get("limit"); q != "" {
		if n, err := strconv.ParseInt(q, 10, 64); err == nil {
			limit = n
		}
	}
	items, err := h.svc.List(r.Context(), limit)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (h *BlogHandler) get(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	b, err := h.svc.Get(r.Context(), id)
	if err != nil {
		http.Error(w, "Not found", http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, b)
}

func (h *BlogHandler) options(w http.ResponseWriter, r *http.Request) {
	// Minimalni preflight odgovor; dopuni po potrebi za frontend
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.WriteHeader(http.StatusNoContent)
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// JWT middleware (isti secret kao stakeholders)
func JWTMiddleware(secret string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Dozvoli public health rutu (ako je pod istim subrouterom slučajno)
			if r.URL.Path == "/health" {
				next.ServeHTTP(w, r)
				return
			}

			auth := r.Header.Get("Authorization")
			if !strings.HasPrefix(auth, "Bearer ") {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			token := strings.TrimPrefix(auth, "Bearer ")
			uid, ok := parseUserID(token, secret)
			if !ok {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			ctx := context.WithValue(r.Context(), userIDKey, uid)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// parseUserID je lokalna pomoćna funkcija za validaciju JWT-a i vađenje user_id
func parseUserID(tokenStr, secret string) (string, bool) {
	t, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		// očekujemo HMAC (HS256)
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(secret), nil
	})
	if err != nil || !t.Valid {
		return "", false
	}
	claims, ok := t.Claims.(jwt.MapClaims)
	if !ok {
		return "", false
	}
	uid, _ := claims["user_id"].(string)
	if strings.TrimSpace(uid) == "" {
		return "", false
	}
	return uid, true
}
