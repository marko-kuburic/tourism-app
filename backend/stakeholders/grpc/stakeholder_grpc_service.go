package grpc

import (
	"context"
	"log"
	"stakeholders/model"
	"stakeholders/pb"
	"stakeholders/service"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// StakeholderGrpcService implements the gRPC server for stakeholder operations
type StakeholderGrpcService struct {
	pb.UnimplementedStakeholderServiceServer
	userService *service.UserService
}

// NewStakeholderGrpcService creates a new gRPC service instance
func NewStakeholderGrpcService(userService *service.UserService) *StakeholderGrpcService {
	return &StakeholderGrpcService{
		userService: userService,
	}
}

// Login handles the gRPC login request
func (s *StakeholderGrpcService) Login(ctx context.Context, req *pb.LoginRequest) (*pb.LoginResponse, error) {
	log.Printf("[gRPC] Login request for email: %s", req.Email)

	// Validate input
	if req.Email == "" {
		return nil, status.Error(codes.InvalidArgument, "email is required")
	}
	if req.Password == "" {
		return nil, status.Error(codes.InvalidArgument, "password is required")
	}

	// Call the existing service layer
	user, token, err := s.userService.Login(ctx, &service.LoginRequest{
		Email:    req.Email,
		Password: req.Password,
	})
	if err != nil {
		log.Printf("[gRPC] Login failed: %v", err)
		if err.Error() == "invalid credentials" {
			return nil, status.Error(codes.Unauthenticated, "invalid credentials")
		}
		return nil, status.Error(codes.Internal, "login failed")
	}

	// Convert to protobuf response
	pbUser := modelUserToPbUser(user)
	
	log.Printf("[gRPC] Login successful for user: %s", user.ID)
	return &pb.LoginResponse{
		User:  pbUser,
		Token: token,
	}, nil
}

// GetProfile handles the gRPC get profile request
func (s *StakeholderGrpcService) GetProfile(ctx context.Context, req *pb.GetProfileRequest) (*pb.GetProfileResponse, error) {
	log.Printf("[gRPC] GetProfile request for user: %s", req.UserId)

	// Validate input
	if req.UserId == "" {
		return nil, status.Error(codes.InvalidArgument, "user_id is required")
	}

	// Parse UUID
	userID, err := uuid.Parse(req.UserId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid user_id format")
	}

	// Call the existing service layer
	profileDTO, err := s.userService.GetMe(ctx, userID)
	if err != nil {
		log.Printf("[gRPC] GetProfile failed: %v", err)
		return nil, status.Error(codes.NotFound, "user not found")
	}

	// Convert to protobuf response
	pbUser := profileDTOToPbUser(&profileDTO)
	
	log.Printf("[gRPC] GetProfile successful for user: %s", userID)
	return &pb.GetProfileResponse{
		User: pbUser,
	}, nil
}

// Helper function to convert model.User to pb.User
func modelUserToPbUser(user *model.User) *pb.User {
	if user == nil {
		return nil
	}
	
	return &pb.User{
		Id:             user.ID.String(),
		Username:       user.Username,
		Email:          user.Email,
		Role:           string(user.Role),
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		ProfilePicture: user.ProfilePicture,
		Biography:      user.Biography,
		Motto:          user.Motto,
	}
}

// Helper function to convert model.ProfileDTO to pb.User
func profileDTOToPbUser(profile *model.ProfileDTO) *pb.User {
	if profile == nil {
		return nil
	}
	
	return &pb.User{
		Id:             profile.ID,
		Username:       profile.Username,
		Email:          profile.Email,
		Role:           string(profile.Role),
		FirstName:      profile.FirstName,
		LastName:       profile.LastName,
		ProfilePicture: profile.ProfilePicture,
		Biography:      profile.Biography,
		Motto:          profile.Motto,
	}
}