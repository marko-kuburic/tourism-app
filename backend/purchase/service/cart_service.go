package service

import (
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"purchase/model"
	"purchase/repo"
)

// === CartService + ctor ======================================================

type CartService struct {
	Carts  *repo.CartRepo
	Tokens *repo.TokenRepo
	Tours  *TourClient
}

func NewCartService(cr *repo.CartRepo, tr *repo.TokenRepo, tc *TourClient) *CartService {
	return &CartService{Carts: cr, Tokens: tr, Tours: tc}
}

// === Basic korpa API (postojeća funkcionalnost) ==============================

func (s *CartService) GetCart(userID string) (*model.ShoppingCart, int64, error) {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil {
		return nil, 0, err
	}
	var total int64
	for _, it := range c.Items {
		total += it.PriceCents
	}
	return c, total, nil
}

func (s *CartService) AddItem(userID, tourID, authHeader string) (*model.OrderItem, error) {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil {
		return nil, err
	}

	// Provera preko Tour servisa (postojeći endpoint /tours/{id}/public)
	pub, err := s.Tours.PublicByID(tourID, authHeader)
	if err != nil {
		return nil, err
	}
	// Po potrebi validiraj status:
	// if pub.Status != "PUBLISHED" { return nil, errors.New("tour is not purchasable") }

	return s.Carts.AddItem(c.ID, tourID, pub.Name, pub.PriceCents)
}

func (s *CartService) RemoveItem(userID string, itemID uuid.UUID) error {
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil {
		return err
	}
	return s.Carts.RemoveItem(c.ID, itemID)
}

// === SAGA Checkout ===========================================================

// STEP 1: verifikuj sve ture u Tour servisu
// STEP 2: u jednoj DB transakciji kreiraj sve tokene i zatvori korpu
// COMPENSATION: rollback transakcije -> nema tokena, korpa ostaje OPEN
func (s *CartService) CheckoutWithAuth(userID, authHeader string) ([]model.PurchaseToken, error) {
	traceID := uuid.NewString()
	log.Printf("[SAGA][%s] START Checkout user=%s", traceID, userID)

	// 0) Korpa
	c, err := s.Carts.GetOrCreateOpen(userID)
	if err != nil {
		log.Printf("[SAGA][%s] ERROR getOrCreateCart err=%v", traceID, err)
		return nil, err
	}
	if len(c.Items) == 0 {
		log.Printf("[SAGA][%s] ABORT empty cart", traceID)
		return nil, errors.New("cart is empty")
	}

	// --- STEP 1: VERIFY_TOURS (Tour mikroservis) ---
	seen := map[string]bool{}
	var uniqTours []string
	for _, it := range c.Items {
		if !seen[it.TourID] {
			seen[it.TourID] = true
			uniqTours = append(uniqTours, it.TourID)
		}
	}
	log.Printf("[SAGA][%s] STEP=VERIFY_TOURS tours=%v", traceID, uniqTours)

	for _, tourID := range uniqTours {
		if _, err := s.Tours.PublicByID(tourID, authHeader); err != nil {
			log.Printf("[SAGA][%s] FAIL VERIFY_TOURS tour=%s err=%v", traceID, tourID, err)
			return nil, fmt.Errorf("tour %s not available: %w", tourID, err)
		}
	}

	// --- STEP 2: CREATE_TOKENS + MARK_CHECKED_OUT (lokalna transakcija) ---
	log.Printf("[SAGA][%s] STEP=CREATE_TOKENS begin TX", traceID)
	tx := s.Carts.DB.Begin()
	if tx.Error != nil {
		log.Printf("[SAGA][%s] ERROR beginTx err=%v", traceID, tx.Error)
		return nil, tx.Error
	}

	created := make([]model.PurchaseToken, 0, len(uniqTours))
	now := time.Now()

	for _, tourID := range uniqTours {
		t := model.PurchaseToken{
			ID:       uuid.New(),
			UserID:   userID,
			TourID:   tourID,
			Token:    uuid.NewString(),
			IssuedAt: now,
		}
		if err := tx.Create(&t).Error; err != nil {
			log.Printf("[SAGA][%s] FAIL CREATE_TOKEN tour=%s err=%v", traceID, tourID, err)
			if rbErr := tx.Rollback().Error; rbErr != nil {
				log.Printf("[SAGA][%s] ERROR rollbackAfterCreate err=%v", traceID, rbErr)
			}
			return nil, fmt.Errorf("failed to create token for tour %s: %w", tourID, err)
		}
		created = append(created, t)
	}
	log.Printf("[SAGA][%s] STEP=CREATE_TOKENS ok count=%d", traceID, len(created))

	log.Printf("[SAGA][%s] STEP=MARK_CHECKED_OUT cart=%s", traceID, c.ID.String())
	if err := tx.Model(&model.ShoppingCart{}).
		Where("id=?", c.ID).
		Update("status", model.CartCheckedOut).Error; err != nil {
		log.Printf("[SAGA][%s] FAIL MARK_CHECKED_OUT err=%v", traceID, err)
		if rbErr := tx.Rollback().Error; rbErr != nil {
			log.Printf("[SAGA][%s] ERROR rollbackAfterMark err=%v", traceID, rbErr)
		}
		return nil, fmt.Errorf("failed to mark cart checked out: %w", err)
	}

	if err := tx.Commit().Error; err != nil {
		log.Printf("[SAGA][%s] ERROR commitTx err=%v", traceID, err)
		return nil, err
	}

	log.Printf("[SAGA][%s] SUCCESS Checkout tokens=%d", traceID, len(created))
	return created, nil
}

// Wrapper radi kompatibilnosti sa postojećim pozivaocima
func (s *CartService) Checkout(userID string) ([]model.PurchaseToken, error) {
	return s.CheckoutWithAuth(userID, "")
}
