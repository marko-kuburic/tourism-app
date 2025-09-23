package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/google/uuid"
	"gorm.io/gorm"

	"purchase/model"
	"purchase/repo"
	"purchase/service"
)

type CartHandler struct {
	svc *service.CartService
	db  *gorm.DB
}

func NewCartHandler(db *gorm.DB, tourBaseURL, jwtSecret string) *CartHandler {
	cr := repo.NewCartRepo(db)
	tr := repo.NewTokenRepo(db)
	tc := service.NewTourClient(tourBaseURL)
	return &CartHandler{
		svc: service.NewCartService(cr, tr, tc),
		db:  db,
	}
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func (h *CartHandler) GetCart(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	cart, total, err := h.svc.GetCart(userID)
	if err != nil { http.Error(w, err.Error(), 500); return }
	type resp struct {
		ID         string             `json:"id"`
		Items      []model.OrderItem  `json:"items"`
		TotalCents int64              `json:"totalCents"`
	}
	writeJSON(w, 200, resp{ID: cart.ID.String(), Items: cart.Items, TotalCents: total})
}

func (h *CartHandler) AddItem(w http.ResponseWriter, r *http.Request) {
	var body struct{ TourID string `json:"tourId"` }
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil { http.Error(w, "bad body", 400); return }
	if body.TourID == "" { http.Error(w, "tourId required", 400); return }

	item, err := h.svc.AddItem(GetUserID(r), body.TourID, GetAuthHeader(r))
	if err != nil { http.Error(w, err.Error(), 400); return }
	writeJSON(w, 200, item)
}

func (h *CartHandler) DeleteItem(w http.ResponseWriter, r *http.Request) {
	itemID, err := uuid.Parse(mux.Vars(r)["itemId"])
	if err != nil { http.Error(w, "bad id", 400); return }
	if err := h.svc.RemoveItem(GetUserID(r), itemID); err != nil { http.Error(w, err.Error(), 400); return }
	writeJSON(w, 200, map[string]any{"ok": true})
}

func (h *CartHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	tokens, err := h.svc.Checkout(GetUserID(r))
	if err != nil { http.Error(w, err.Error(), 400); return }
	writeJSON(w, 200, map[string]any{"tokens": tokens})
}

func (h *CartHandler) HasOwnership(w http.ResponseWriter, r *http.Request) {
	tourID := mux.Vars(r)["tourId"]
	var cnt int64
	if err := h.db.Model(&model.PurchaseToken{}).
		Where("user_id=? AND tour_id=?", GetUserID(r), tourID).Count(&cnt).Error; err != nil {
		http.Error(w, err.Error(), 500); return
	}
	writeJSON(w, 200, map[string]any{"owned": cnt > 0})
}

func (h *CartHandler) ListTokens(w http.ResponseWriter, r *http.Request) {
	var toks []model.PurchaseToken
	if err := h.db.Where("user_id=?", GetUserID(r)).Find(&toks).Error; err != nil {
		http.Error(w, err.Error(), 500); return
	}
	writeJSON(w, 200, map[string]any{"tokens": toks})
}
