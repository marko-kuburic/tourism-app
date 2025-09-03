package service

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/yuin/goldmark"
	"tourism-blog/model"
	"tourism-blog/repo"
)

type CreateBlogDTO struct {
	Title         string   `json:"title"`
	DescriptionMD string   `json:"description_md"`
	Images        []string `json:"images"`
}

type BlogService struct{ r *repo.BlogRepo }

func New(r *repo.BlogRepo) *BlogService { return &BlogService{r: r} }

func (s *BlogService) Create(ctx context.Context, authorID string, dto CreateBlogDTO) (model.Blog, error) {
	if strings.TrimSpace(dto.Title) == "" || strings.TrimSpace(dto.DescriptionMD) == "" {
		return model.Blog{}, errors.New("title and description_md are required")
	}

	var buf bytes.Buffer
	if err := goldmark.Convert([]byte(dto.DescriptionMD), &buf); err != nil {
		return model.Blog{}, err
	}

	b := model.Blog{
		ID:              uuid.New().String(),
		AuthorID:        authorID,
		Title:           strings.TrimSpace(dto.Title),
		DescriptionMD:   dto.DescriptionMD,
		DescriptionHTML: buf.String(),
		Images:          filterNonEmpty(dto.Images),
		CreatedAt:       time.Now(),
		Likes: []string{},
		Comments: []model.Comment{},
	}

	if err := s.r.Insert(ctx, b); err != nil {
		return model.Blog{}, err
	}
	return b, nil
}

func (s *BlogService) Get(ctx context.Context, id string) (model.Blog, error)  { return s.r.Get(ctx, id) }
func (s *BlogService) List(ctx context.Context, limit int64) ([]model.Blog, error) {
	return s.r.List(ctx, limit)
}

func filterNonEmpty(in []string) []string {
	out := make([]string, 0, len(in))
	for _, u := range in {
		u = strings.TrimSpace(u)
		if u != "" { out = append(out, u) }
	}
	return out
}





// Comments
func (s *BlogService) AddComment(ctx context.Context, blogID, authorID, text string) (model.Comment, error) {
	text = strings.TrimSpace(text)
	if text == "" { 
		return model.Comment{}, errors.New("text is required")
	}
	c := model.Comment{
		ID: uuid.NewString(), AuthorID: authorID, Text: text,
		CreatedAt: time.Now().UTC(), UpdatedAt: time.Now().UTC(),
	}
	if err := s.r.AddComment(ctx, blogID, c); err != nil { 
		return model.Comment{}, err 
	}
	return c, nil
}


func (s *BlogService) UpdateComment(ctx context.Context, blogID, commentID, authorID, newText string) error {
	newText = strings.TrimSpace(newText)
	if newText == "" { 
		return errors.New("text is required") 
	}
	return s.r.UpdateComment(ctx, blogID, commentID, authorID, newText, time.Now().UTC())
}


func (s *BlogService) DeleteComment(ctx context.Context, blogID, commentID, authorID string) error {
	return s.r.DeleteComment(ctx, blogID, commentID, authorID)
}


func (s *BlogService) ListComments(ctx context.Context, blogID string, limit int64) ([]model.Comment, error) {
	return s.r.ListComments(ctx, blogID, limit)
}


// Likes
func (s *BlogService) Like(ctx context.Context, blogID, userID string) error {
	_, err := s.r.AddLike(ctx, blogID, userID)
	return err
}


func (s *BlogService) Unlike(ctx context.Context, blogID, userID string) error {
	return s.r.RemoveLike(ctx, blogID, userID)
}


func (s *BlogService) CountLikes(ctx context.Context, blogID string) (int, error) {
	return s.r.CountLikes(ctx, blogID)
}


// helpers
func mdToHTML(md string) (string, error) {
	var buf bytes.Buffer
	if err := goldmark.Convert([]byte(md), &buf); err != nil {
		return "", err
	}
	return buf.String(), nil
}





