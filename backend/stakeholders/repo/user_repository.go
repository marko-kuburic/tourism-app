package repo

import (
	"context"
	"errors"
	"stakeholders/model"
	"strings"

	"gorm.io/gorm"
)

var (
	ErrUsernameTaken = errors.New("username already taken")
	ErrEmailTaken    = errors.New("email already registered")
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(ctx context.Context, user *model.User) error {
	result := r.db.WithContext(ctx).Create(user)
	if result.Error != nil {
		if isDuplicateEntryError(result.Error) {
			return handleDuplicateError(result.Error)
		}
		return result.Error
	}
	return nil
}

func isDuplicateEntryError(err error) bool {
	if err == nil {
		return false
	}

	// MySQL error format: "Error 1062 (23000): Duplicate entry ..."
	return strings.Contains(err.Error(), "Error 1062") ||
		strings.Contains(err.Error(), "Duplicate entry")
}

func handleDuplicateError(err error) error {
	errMsg := err.Error()

	switch {
	case strings.Contains(errMsg, "users.username"):
		return ErrUsernameTaken
	case strings.Contains(errMsg, "users.email"):
		return ErrEmailTaken
	default:
		return err
	}
}

func (r *UserRepository) UsernameExists(ctx context.Context, username string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.User{}).
		Where("username = ?", username).
		Count(&count).Error

	return count > 0, err
}

func (r *UserRepository) EmailExists(ctx context.Context, email string) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&model.User{}).
		Where("email = ?", email).
		Count(&count).Error

	return count > 0, err
}
