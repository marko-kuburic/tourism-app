package service

import (
	"context"
	"errors"
	"fmt"
	"stakeholders/model"
	"stakeholders/repo"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidRole    = errors.New("invalid user role")
	ErrUsernameExists = errors.New("username already taken")
	ErrEmailExists    = errors.New("email already registered")
)

type UserService struct {
	repo repo.UserRepository
}

func NewUserService(repo repo.UserRepository) *UserService {
	return &UserService{repo: repo}
}

type RegisterRequest struct {
	Username       string
	Password       string
	Email          string
	Role           model.Role
	ProfilePicture string // Relative path
	Biography      string // Biography
	Motto          string // Motto/quote
}

func (s *UserService) Register(ctx context.Context, req *RegisterRequest) (*model.User, error) {
	if !model.IsValid(req.Role) {
		return nil, fmt.Errorf("%w: %s", ErrInvalidRole, req.Role)
	}

	if len(req.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters")
	}

	// Check for existing username
	if exists, err := s.repo.UsernameExists(ctx, req.Username); err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	} else if exists {
		return nil, fmt.Errorf("username already exists: %s", req.Username)
	}

	// Check for existing email
	if exists, err := s.repo.EmailExists(ctx, req.Email); err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	} else if exists {
		return nil, fmt.Errorf("email already registered: %s", req.Email)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := &model.User{
		Username:       req.Username,
		Password:       string(hashedPassword),
		Email:          req.Email,
		Role:           req.Role,
		ProfilePicture: req.ProfilePicture,
		Biography:      req.Biography,
		Motto:          req.Motto,
	}

	if err := s.repo.Create(ctx, user); err != nil {
		if errors.Is(err, repo.ErrUsernameTaken) {
			return nil, fmt.Errorf("%w: %s", ErrUsernameExists, req.Username)
		}
		if errors.Is(err, repo.ErrEmailTaken) {
			return nil, fmt.Errorf("%w: %s", ErrEmailExists, req.Email)
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return user, nil
}
