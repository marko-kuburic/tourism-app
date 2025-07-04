package model

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Role string

const (
	RoleTourist Role = "tourist"
	RoleGuide   Role = "guide"
	RoleAdmin   Role = "admin"
)

type User struct {
	ID             uuid.UUID `gorm:"type:char(36);primaryKey"`
	Username       string    `gorm:"size:25;not null"`
	Password       string    `gorm:"size:255;not null;column:user_password"`
	Email          string    `gorm:"size:255;unique;not null"`
	Role           Role      `gorm:"type:ENUM('tourist','guide','admin');not null"`
	ProfilePicture string    `gorm:"size:255;column:profile_picture"` // Relative path
	Biography      string    `gorm:"type:text;column:biography"`      // Biography
	Motto          string    `gorm:"size:255;column:motto"`           // Motto/quote
	CreatedAt      time.Time `gorm:"autoCreateTime"`
	UpdatedAt      time.Time `gorm:"autoUpdateTime"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	u.ID = uuid.New()
	return nil
}

func IsValid(r Role) bool {
	switch r {
	case RoleTourist, RoleGuide, RoleAdmin:
		return true
	}
	return false
}

func (u *User) Validate() error {
	if u.Username == "" {
		return errors.New("username cannot be empty")
	}
	if u.Email == "" {
		return errors.New("email cannot be empty")
	}
	if u.Password == "" {
		return errors.New("password cannot be empty")
	}
	if !IsValid(u.Role) {
		return errors.New("invalid role")
	}
	return nil
}
