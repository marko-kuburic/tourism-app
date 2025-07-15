package service

import (
	"context"
	"errors"
	"stakeholders/model"
	"stakeholders/repo"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	repo      *repo.UserRepository
	jwtSecret string
}

type RegisterRequest struct {
	Username       string
	Password       string
	Email          string
	Role           model.Role
	ProfilePicture string
	Biography      string
	Motto          string
}

type LoginRequest struct {
	Email    string
	Password string
}

func NewUserService(repo repo.UserRepository, jwtSecret string) *UserService {
	return &UserService{repo: &repo, jwtSecret: jwtSecret}
}

func (s *UserService) Register(ctx context.Context, req *RegisterRequest) (*model.User, error) {
	if len(req.Password) < 8 {
		return nil, errors.New("password must be at least 8 characters long")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
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

	if err := user.Validate(); err != nil {
		return nil, err
	}

	usernameExists, err := s.repo.UsernameExists(ctx, req.Username)
	if err != nil {
		return nil, err
	}
	if usernameExists {
		return nil, repo.ErrUsernameTaken
	}

	emailExists, err := s.repo.EmailExists(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if emailExists {
		return nil, repo.ErrEmailTaken
	}

	if err := s.repo.Create(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *UserService) Login(ctx context.Context, req *LoginRequest) (*model.User, string, error) {
	var user model.User
	err := s.repo.GetByEmail(ctx, &user, req.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", errors.New("invalid credentials")
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return nil, "", errors.New("invalid credentials")
	}

	token, err := s.generateJWT(user)
	if err != nil {
		return nil, "", err
	}

	return &user, token, nil
}

func (s *UserService) generateJWT(user model.User) (string, error) {
	claims := jwt.MapClaims{
		"user_id": user.ID.String(),
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}