package model

import (
	"time"

	"github.com/google/uuid"
)

type CartStatus string

const (
	CartOpen       CartStatus = "OPEN"
	CartCheckedOut CartStatus = "CHECKED_OUT"
)

type ShoppingCart struct {
	ID        uuid.UUID  `gorm:"type:char(36);primaryKey" json:"id"`
	UserID    string     `gorm:"type:char(36);index" json:"userId"`
	Status    CartStatus `gorm:"type:enum('OPEN','CHECKED_OUT');default:'OPEN'" json:"status"`
	Items     []OrderItem `gorm:"foreignKey:CartID" json:"items"`
	CreatedAt time.Time  `json:"createdAt"`
	UpdatedAt time.Time  `json:"updatedAt"`
}

type OrderItem struct {
	ID         uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	CartID     uuid.UUID `gorm:"type:char(36);index" json:"cartId"`
	TourID     string    `gorm:"type:char(36);index" json:"tourId"`
	TourName   string    `gorm:"size:200" json:"tourName"`
	PriceCents int64     `gorm:"not null" json:"priceCents"`
	CreatedAt  time.Time `json:"createdAt"`
}

type PurchaseToken struct {
	ID       uuid.UUID `gorm:"type:char(36);primaryKey" json:"id"`
	UserID   string    `gorm:"type:char(36);index" json:"userId"`
	TourID   string    `gorm:"type:char(36);index" json:"tourId"`
	Token    string    `gorm:"size:64;uniqueIndex" json:"token"`
	IssuedAt time.Time `json:"issuedAt"`
}
