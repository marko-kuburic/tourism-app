package repo

import (
	"errors"

	"github.com/google/uuid"
	"purchase/model"
	"gorm.io/gorm"
)

type CartRepo struct{ DB *gorm.DB }

func NewCartRepo(db *gorm.DB) *CartRepo { return &CartRepo{DB: db} }

func (r *CartRepo) GetOrCreateOpen(userID string) (*model.ShoppingCart, error) {
	var c model.ShoppingCart
	err := r.DB.Preload("Items").
		Where("user_id=? AND status='OPEN'", userID).
		First(&c).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		c = model.ShoppingCart{ID: uuid.New(), UserID: userID, Status: model.CartOpen}
		if err := r.DB.Create(&c).Error; err != nil { return nil, err }
		return &c, nil
	}
	return &c, err
}

func (r *CartRepo) AddItem(cartID uuid.UUID, tourID, tourName string, priceCents int64) (*model.OrderItem, error) {
	// zabrani duplikat iste ture u korpi
	var cnt int64
	r.DB.Model(&model.OrderItem{}).Where("cart_id=? AND tour_id=?", cartID, tourID).Count(&cnt)
	if cnt > 0 {
		return nil, errors.New("tour already in cart")
	}
	it := model.OrderItem{
		ID: uuid.New(), CartID: cartID, TourID: tourID, TourName: tourName, PriceCents: priceCents,
	}
	return &it, r.DB.Create(&it).Error
}

func (r *CartRepo) RemoveItem(cartID uuid.UUID, itemID uuid.UUID) error {
	return r.DB.Where("id=? AND cart_id=?", itemID, cartID).Delete(&model.OrderItem{}).Error
}

func (r *CartRepo) Load(cartID uuid.UUID) (*model.ShoppingCart, error) {
	var c model.ShoppingCart
	err := r.DB.Preload("Items").First(&c, "id=?", cartID).Error
	return &c, err
}

func (r *CartRepo) MarkCheckedOut(cartID uuid.UUID) error {
	return r.DB.Model(&model.ShoppingCart{}).Where("id=?", cartID).
		Update("status", model.CartCheckedOut).Error
}
