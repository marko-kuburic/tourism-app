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
