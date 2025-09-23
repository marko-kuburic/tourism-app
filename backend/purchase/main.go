package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"purchase/handler"
	"purchase/model"

	"github.com/gorilla/mux"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func main() {
	dsn := getenv("DB_DSN", "root:password@tcp(purchase-mysql:3306)/purchasedb?parseTime=true&charset=utf8mb4&loc=Local")
	jwtSecret := mustGet("JWT_SECRET")
	tourBase := getenv("TOUR_BASE_URL", "http://tour:8084")

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil { log.Fatal(err) }
	if err := db.AutoMigrate(&model.ShoppingCart{}, &model.OrderItem{}, &model.PurchaseToken{}); err != nil {
		log.Fatal(err)
	}

	r := mux.NewRouter().StrictSlash(true)
	r.Use(cors)
	r.Use(handler.JWTMiddleware(jwtSecret))

	h := handler.NewCartHandler(db, tourBase, jwtSecret)
	r.HandleFunc("/cart", h.GetCart).Methods("GET", "OPTIONS")
	r.HandleFunc("/cart/items", h.AddItem).Methods("POST", "OPTIONS")
	r.HandleFunc("/cart/items/{itemId}", h.DeleteItem).Methods("DELETE", "OPTIONS")
	r.HandleFunc("/cart/checkout", h.Checkout).Methods("POST", "OPTIONS")

	r.HandleFunc("/ownership/tours/{tourId}", h.HasOwnership).Methods("GET", "OPTIONS")
	r.HandleFunc("/tokens", h.ListTokens).Methods("GET", "OPTIONS")

	log.Println("Purchase service on :8085")
	log.Fatal(http.ListenAndServe(":8085", r))
}

func getenv(k, def string) string { if v := strings.TrimSpace(os.Getenv(k)); v != "" { return v }; return def }
func mustGet(k string) string { v := strings.TrimSpace(os.Getenv(k)); if v=="" { log.Fatalf("%s not set", k) }; return v }

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
