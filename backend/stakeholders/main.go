package main

import (
	"log"
	"net/http"
	"os"
	"stakeholders/handler"
	"stakeholders/repo"
	"stakeholders/service"

	"github.com/gorilla/mux"
	"github.com/rs/cors" // Add this import
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	db := initializeDatabase()
	defer logDatabaseStatus(db)

	userRepo := repo.NewUserRepository(db)
	userService := service.NewUserService(*userRepo)
	userHandler := handler.NewUserHandler(userService)

	router := setupRouter(userHandler)

	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug:            true, // Remove in production
	})

	handler := corsMiddleware.Handler(router)

	startServer(handler)
}

func initializeDatabase() *gorm.DB {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "root:password@tcp(mysql:3306)/tourist_app?charset=utf8mb4&parseTime=True&loc=Local"
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Database connection failed: ", err)
	}
	log.Println("Database connection established")
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

func setupRouter(userHandler *handler.UserHandler) *mux.Router {
	router := mux.NewRouter()
	router.Use(loggingMiddleware)
	userHandler.RegisterRoutes(router)
	return router
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func startServer(handler http.Handler) {
	port := ":8081"
	log.Printf("Server starting on %s", port)
	if err := http.ListenAndServe(port, handler); err != nil {
		log.Fatal("Server failed to start: ", err)
	}
}
