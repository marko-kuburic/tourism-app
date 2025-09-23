package service

import (
	"errors"

	"github.com/google/uuid"
	"purchase/model"
	"purchase/repo"
)

type CartService struct {
	Carts  *repo.CartRepo
	Tokens *repo.TokenRepo
	Tours  *TourClient
}

func NewCartService(cr *repo.CartRepo, tr *repo.TokenRepo, tc *TourClient) *CartService {
	return &CartService{Carts: cr, Tokens: tr, Tours: tc}
}

func (s *CartService) GetCart(userID string) (*model.ShoppingCart, int64, error) {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil { return nil, 0, err }
	var total int64
	for _, it := range c.Items { total += it.PriceCents }
	return c, total, nil
}

func (s *CartService) AddItem(userID, tourID, authHeader string) (*model.OrderItem, error) {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil { return nil, err }

	// povuci public info iz Tour servisa
	pub, err := s.Tours.PublicByID(tourID, authHeader)
	if err != nil { return nil, err }
	//if pub.Status != "PUBLISHED" {
	//	return nil, errors.New("tour is not purchasable")
	//}

	return s.Carts.AddItem(c.ID, tourID, pub.Name, pub.PriceCents)
}

func (s *CartService) RemoveItem(userID string, itemID uuid.UUID) error {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil { return err }
	return s.Carts.RemoveItem(c.ID, itemID)
}

func (s *CartService) Checkout(userID string) ([]model.PurchaseToken, error) {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil { return nil, err }
	if len(c.Items) == 0 { return nil, errors.New("cart is empty") }

	seen := map[string]bool{}
	var out []model.PurchaseToken
	for _, it := range c.Items {
		if seen[it.TourID] { continue }
		seen[it.TourID] = true
		pt, err := s.Tokens.Create(userID, it.TourID, uuid.NewString())
		if err != nil { return nil, err }
		out = append(out, *pt)
	}
	if err := s.Carts.MarkCheckedOut(c.ID); err != nil { return nil, err }
	return out, nil
}
