package service

import (
	"context"
	"errors"
	"net/url"
	"strings"
	"time"

	"stakeholders/model"
	"stakeholders/repo"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserService struct {
	repo      *repo.UserRepository // ostavljeno kako već koristite u timu
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

// 🔹 NEW: DTO za parcijalnu izmenu profila
type UpdateMeRequest struct {
	FirstName      *string `json:"first_name"`
	LastName       *string `json:"last_name"`
	ProfilePicture *string `json:"profile_picture"`
	Biography      *string `json:"biography"`
	Motto          *string `json:"motto"`
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
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

// 🔹 NEW: Vrati profil ulogovanog korisnika
func (s *UserService) GetMe(ctx context.Context, userID uuid.UUID) (model.ProfileDTO, error) {
	var u model.User
	if err := s.repo.GetByID(ctx, &u, userID); err != nil {
		return model.ProfileDTO{}, err
	}
	return u.ToProfileDTO(), nil
}

// 🔹 NEW: Parcijalna izmena sopstvenog profila
func (s *UserService) UpdateMe(ctx context.Context, userID uuid.UUID, req *UpdateMeRequest) (model.ProfileDTO, error) {
	// jednostavna validacija unosa
	if req.ProfilePicture != nil && strings.TrimSpace(*req.ProfilePicture) != "" {
		if _, err := url.ParseRequestURI(*req.ProfilePicture); err != nil {
			return model.ProfileDTO{}, errors.New("profile_picture must be a valid URL")
		}
	}
	if req.Motto != nil && len(*req.Motto) > 255 {
		return model.ProfileDTO{}, errors.New("motto max length is 255")
	}

	// samo polja koja su zaista poslata (pointer != nil)
	fields := map[string]any{}
	if req.FirstName != nil {
		fields["first_name"] = strings.TrimSpace(*req.FirstName)
	}
	if req.LastName != nil {
		fields["last_name"] = strings.TrimSpace(*req.LastName)
	}
	if req.ProfilePicture != nil {
		fields["profile_picture"] = strings.TrimSpace(*req.ProfilePicture)
	}
	if req.Biography != nil {
		fields["biography"] = strings.TrimSpace(*req.Biography)
	}
	if req.Motto != nil {
		fields["motto"] = strings.TrimSpace(*req.Motto)
	}

	if len(fields) > 0 {
		if err := s.repo.UpdateFields(ctx, userID, fields); err != nil {
			return model.ProfileDTO{}, err
		}
	}

	return s.GetMe(ctx, userID)
}
