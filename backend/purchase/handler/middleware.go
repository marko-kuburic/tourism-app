package handler

import (
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type ctxKey string

const (
	ctxUserID   ctxKey = "userId"
	ctxUserRole ctxKey = "role"
	ctxAuthHdr  ctxKey = "authHeader"
)

func JWTMiddleware(secret string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ah := r.Header.Get("Authorization")
			if !strings.HasPrefix(strings.ToLower(ah), "bearer ") {
				http.Error(w, "missing token", http.StatusUnauthorized)
				return
			}
			raw := strings.TrimSpace(ah[len("Bearer "):])

			token, err := jwt.Parse(raw, func(t *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})
			if err != nil || !token.Valid {
				http.Error(w, "invalid token", http.StatusUnauthorized)
				return
			}
			claims, _ := token.Claims.(jwt.MapClaims)
			role := ""
			if v, ok := claims["role"].(string); ok { role = v }
			userID := ""
			if v, ok := claims["sub"].(string); ok { userID = v }

			ctx := context.WithValue(r.Context(), ctxUserID, userID)
			ctx = context.WithValue(ctx, ctxUserRole, role)
			ctx = context.WithValue(ctx, ctxAuthHdr, ah) // prosledimo dalje Tour klijentu
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// Helpers
func GetUserID(r *http.Request) string { if v := r.Context().Value(ctxUserID); v != nil { return v.(string) }; return "" }
func GetRole(r *http.Request) string   { if v := r.Context().Value(ctxUserRole); v != nil { return v.(string) }; return "" }
func GetAuthHeader(r *http.Request) string { if v := r.Context().Value(ctxAuthHdr); v != nil { return v.(string) }; return "" }
