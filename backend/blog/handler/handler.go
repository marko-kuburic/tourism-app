package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"os"

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
	r.HandleFunc("/blogs/{id}/comments", h.options).Methods(http.MethodOptions)
	r.HandleFunc("/blogs/{id}/comments/{cid}", h.options).Methods(http.MethodOptions)
	r.HandleFunc("/blogs/{id}/like", h.options).Methods(http.MethodOptions)

	// Zaštićene rute
	r.HandleFunc("/blogs", h.create).Methods(http.MethodPost)
	r.HandleFunc("/blogs", h.list).Methods(http.MethodGet)
	r.HandleFunc("/blogs/{id}", h.get).Methods(http.MethodGet)
	r.HandleFunc("/blogs/{id}/comments", h.listComments).Methods(http.MethodGet)


	// Protected write (JWT)
	r.HandleFunc("/blogs", h.withAuth(h.create)).Methods(http.MethodPost)
	r.HandleFunc("/blogs/feed", h.withAuth(h.feed)).Methods(http.MethodGet)
	r.HandleFunc("/blogs/{id}/comments", h.withAuth(h.addComment)).Methods(http.MethodPost)
	r.HandleFunc("/blogs/{id}/comments/{cid}", h.withAuth(h.updateComment)).Methods(http.MethodPatch)
	r.HandleFunc("/blogs/{id}/comments/{cid}", h.withAuth(h.deleteComment)).Methods(http.MethodDelete)
	r.HandleFunc("/blogs/{id}/like", h.withAuth(h.like)).Methods(http.MethodPost)
	r.HandleFunc("/blogs/{id}/like", h.withAuth(h.unlike)).Methods(http.MethodDelete)
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


func (h *BlogHandler) withAuth(next func(http.ResponseWriter, *http.Request)) http.HandlerFunc {
return func(w http.ResponseWriter, r *http.Request) {
uid, ok := currentUserID(r)
if !ok {
http.Error(w, "missing/invalid token", http.StatusUnauthorized)
return
}
ctx := context.WithValue(r.Context(), userIDKey, uid)
next(w, r.WithContext(ctx))
}
}

func currentUserID(r *http.Request) (string, bool) {
auth := r.Header.Get("Authorization")
parts := strings.SplitN(auth, " ", 2)
if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
return "", false
}
token := parts[1]
t, err := jwt.Parse(token, func(t *jwt.Token) (interface{}, error) {
// HMAC only
return []byte(getEnv("JWT_SECRET", "")), nil
})
if err != nil || !t.Valid { return "", false }
claims, ok := t.Claims.(jwt.MapClaims)
if !ok { return "", false }
uid, _ := claims["user_id"].(string)
if strings.TrimSpace(uid) == "" { return "", false }
return uid, true
}


func getEnv(k, def string) string {
if v := strings.TrimSpace(os.Getenv(k)); v != "" { return v }
return def
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

func (h *BlogHandler) feed(w http.ResponseWriter, r *http.Request) {
    uid, _ := r.Context().Value(userIDKey).(string)
    var limit int64
    if q := r.URL.Query().Get("limit"); q != "" {
        if n, err := strconv.ParseInt(q, 10, 64); err == nil {
            limit = n
        }
    }
    followingURL := getEnv("FOLLOWING_API_URL", "http://following:8083")
    auth := r.Header.Get("Authorization")
    items, err := h.svc.ListFeed(r.Context(), uid, limit, followingURL, auth)
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



// comments

type commentReq struct {
Text string `json:"text"`
}


func (h *BlogHandler) addComment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	uid := r.Context().Value(userIDKey).(string)
	var in commentReq
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	c, err := h.svc.AddComment(r.Context(), id, uid, in.Text)
	if err != nil { 
		http.Error(w, err.Error(), http.StatusBadRequest); return 
	}
	writeJSON(w, http.StatusCreated, c)
}


func (h *BlogHandler) listComments(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	out, err := h.svc.ListComments(r.Context(), id, 100)
	if err != nil { 
		http.Error(w, err.Error(), http.StatusNotFound); return
    }
	writeJSON(w, http.StatusOK, out)
}


func (h *BlogHandler) updateComment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	cid := mux.Vars(r)["cid"]
	uid := r.Context().Value(userIDKey).(string)
	var in commentReq
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil { 
		http.Error(w, err.Error(), http.StatusBadRequest); return 
	}
	if err := h.svc.UpdateComment(r.Context(), id, cid, uid, in.Text); err != nil {
	http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	w.WriteHeader(http.StatusNoContent)
}


func (h *BlogHandler) deleteComment(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	cid := mux.Vars(r)["cid"]
	uid := r.Context().Value(userIDKey).(string)
	if err := h.svc.DeleteComment(r.Context(), id, cid, uid); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	w.WriteHeader(http.StatusNoContent)
}


// likes
func (h *BlogHandler) like(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	uid := r.Context().Value(userIDKey).(string)
	if err := h.svc.Like(r.Context(), id, uid); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	w.WriteHeader(http.StatusNoContent)
}


func (h *BlogHandler) unlike(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	uid := r.Context().Value(userIDKey).(string)
	if err := h.svc.Unlike(r.Context(), id, uid); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest); return
	}
	w.WriteHeader(http.StatusNoContent)
}


