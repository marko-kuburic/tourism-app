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
	ID             uuid.UUID `json:"id" gorm:"type:char(36);primaryKey"`
	Username       string    `json:"username" gorm:"size:25;not null;uniqueIndex"`
	Password       string    `json:"-" gorm:"size:255;not null;column:user_password"`
	Email          string    `json:"email" gorm:"size:255;not null;uniqueIndex"`
	Role           Role      `json:"role" gorm:"type:enum('tourist','guide','admin');not null;default:'tourist'"`

	FirstName      string    `json:"first_name" gorm:"size:80"`
	LastName       string    `json:"last_name" gorm:"size:80"`
	ProfilePicture string    `json:"profile_picture" gorm:"size:512;column:profile_picture"`
	Biography      string    `json:"biography" gorm:"type:text;column:biography"`
	Motto          string    `json:"motto" gorm:"size:255;column:motto"`

	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
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

// DTO koji vraćaš iz /me
type ProfileDTO struct {
	ID             string `json:"id"`
	Username       string `json:"username"`
	Email          string `json:"email"`
	Role           Role   `json:"role"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	ProfilePicture string `json:"profile_picture"`
	Biography      string `json:"biography"`
	Motto          string `json:"motto"`
}

func (u *User) ToProfileDTO() ProfileDTO {
	return ProfileDTO{
		ID:             u.ID.String(),
		Username:       u.Username,
		Email:          u.Email,
		Role:           u.Role,
		FirstName:      u.FirstName,
		LastName:       u.LastName,
		ProfilePicture: u.ProfilePicture,
		Biography:      u.Biography,
		Motto:          u.Motto,
	}
}
