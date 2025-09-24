package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gorilla/mux"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"tourism-blog/handler"
	"tourism-blog/repo"
	"tourism-blog/service"
)

func main() {
	// Mongo config
	uri := getenv("MONGO_URI", "mongodb://mongodb:27017")
	dbName := getenv("MONGO_DB", "tourism")
	colName := getenv("MONGO_COLLECTION", "blogs")

	// Mongo client
	client, err := mongo.Connect(context.Background(), options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatalf("mongo connect: %v", err)
	}
	defer func() { _ = client.Disconnect(context.Background()) }()

	col := client.Database(dbName).Collection(colName)

	// repo + indexi
	r := repo.New(col)
	if err := r.EnsureIndexes(context.Background()); err != nil {
		log.Printf("warn: ensure indexes: %v", err)
	}

	// service + handler
	svc := service.New(r)
	h := handler.New(svc)

	// Router
	rtr := mux.NewRouter().StrictSlash(true)
	rtr.Use(cors)
	rtr.Use(logging)

	// public health (bez auth-a)
	rtr.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}).Methods(http.MethodGet)

	// Register all routes (handler internally decides which need auth)
	h.RegisterRoutes(rtr)

	addr := ":8080"
	log.Println("Blog (Mongo) service listening on", addr)
	log.Fatal(http.ListenAndServe(addr, rtr))
}

func logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func getenv(k, def string) string {
	if v := os.Getenv(k); strings.TrimSpace(v) != "" {
		return v
	}
	return def
}

func mustGet(k string) string {
	v := os.Getenv(k)
	if strings.TrimSpace(v) == "" {
		log.Fatalf("%s not set", k)
	}
	return v
}


func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Dozvoli frontend na 3000 (po potrebi dodaj i 127.0.0.1:3000)
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, PATCH, OPTIONS")

		// Preflight odmah završavamo
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}