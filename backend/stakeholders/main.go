package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"stakeholders/handler"
	"stakeholders/repo"
	"stakeholders/service"
	"strings"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	db := initializeDatabase()
	defer logDatabaseStatus(db)

	userRepo := repo.NewUserRepository(db)
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}
	userService := service.NewUserService(*userRepo, jwtSecret)
	userHandler := handler.NewUserHandler(userService)

	router := setupRouter(userHandler, jwtSecret)

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug:            true, // ukloniti u produkciji
	})

	handler := corsMiddleware.Handler(router)
	startServer(handler)
}

func initializeDatabase() *gorm.DB {
	// 1) Ako je DB_DSN postavljen, koristi ga direktno
	if dsn := os.Getenv("DB_DSN"); strings.TrimSpace(dsn) != "" {
		db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatal("Database connection failed: ", err)
		}
		log.Println("Database connection established (DB_DSN)")
		return db
	}

	// 2) Inače složi DSN iz DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME
	host := getenv("DB_HOST", "mysql")
	port := getenv("DB_PORT", "3306")
	user := getenv("DB_USER", "root")
	pass := getenv("DB_PASSWORD", "password")
	name := getenv("DB_NAME", "tourism")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port, name)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	log.Println("Database connection established (assembled DSN)")
	return db
}

func logDatabaseStatus(db *gorm.DB) {
	sqlDB, _ := db.DB()
	if err := sqlDB.Close(); err != nil {
		log.Println("Database connection closed improperly: ", err)
	} else {
		log.Println("Database connection closed properly")
	}
}

func setupRouter(userHandler *handler.UserHandler, jwtSecret string) *mux.Router {
	r := mux.NewRouter()
	r.Use(loggingMiddleware)

	// Static file server for uploaded images
	r.PathPrefix("/uploads/").Handler(http.StripPrefix("/uploads/", http.FileServer(http.Dir("/app/uploads/"))))

	// javne rute
	userHandler.RegisterRoutes(r) // /register, /login

	// zaštićene rute (/me GET/PUT) – zahtevaju Bearer JWT
	auth := r.NewRoute().Subrouter()
	auth.Use(jwtMiddleware(jwtSecret))
	// koristi metodu iz tvog handlera koja registruje /me rute
	if rp, ok := interface{}(userHandler).(interface {
		RegisterProtectedRoutes(*mux.Router)
	}); ok {
		rp.RegisterProtectedRoutes(auth)
	}

	return r
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func jwtMiddleware(jwtSecret string) mux.MiddlewareFunc {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header missing", http.StatusUnauthorized)
				return
			}
			if !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return []byte(jwtSecret), nil
			})
			if err != nil || !token.Valid {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), "user_id", claims["user_id"])
			ctx = context.WithValue(ctx, "email", claims["email"])
			ctx = context.WithValue(ctx, "role", claims["role"])
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func startServer(handler http.Handler) {
	port := ":8081"
	log.Printf("Server starting on %s", port)
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}

func getenv(k, def string) string {
	if v := os.Getenv(k); strings.TrimSpace(v) != "" {
		return v
	}
	return def
}
