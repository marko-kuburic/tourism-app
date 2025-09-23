package repo

import (
	"time"

	"github.com/google/uuid"
	"purchase/model"
	"gorm.io/gorm"
)

type TokenRepo struct{ DB *gorm.DB }

func NewTokenRepo(db *gorm.DB) *TokenRepo { return &TokenRepo{DB: db} }

func (r *TokenRepo) Create(userID, tourID, token string) (*model.PurchaseToken, error) {
	t := model.PurchaseToken{ID: uuid.New(), UserID: userID, TourID: tourID, Token: token, IssuedAt: time.Now()}
	return &t, r.DB.Create(&t).Error
}

func (r *TokenRepo) HasOwnership(userID, tourID string) (bool, error) {
	var cnt int64
	if err := r.DB.Model(&model.PurchaseToken{}).
		Where("user_id=? AND tour_id=?", userID, tourID).Count(&cnt).Error; err != nil {
		return false, err
	}
	return cnt > 0, nil
}

func (r *TokenRepo) ListForUser(userID string) ([]model.PurchaseToken, error) {
	var toks []model.PurchaseToken
	err := r.DB.Where("user_id=?", userID).Find(&toks).Error
	return toks, err
}
