package repo

import (
	"context"

	"tourism-blog/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type BlogRepo struct {
	col *mongo.Collection
}

func New(col *mongo.Collection) *BlogRepo { return &BlogRepo{col: col} }

func (r *BlogRepo) Insert(ctx context.Context, b model.Blog) error {
	_, err := r.col.InsertOne(ctx, b)
	return err
}

func (r *BlogRepo) Get(ctx context.Context, id string) (model.Blog, error) {
	var out model.Blog
	err := r.col.FindOne(ctx, bson.M{"_id": id}).Decode(&out)
	return out, err
}

func (r *BlogRepo) List(ctx context.Context, limit int64) ([]model.Blog, error) {
	opts := options.Find()
	if limit > 0 {
		opts.SetLimit(limit)
	}
	opts.SetSort(bson.D{{Key: "created_at", Value: -1}})

	cur, err := r.col.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var out []model.Blog
	for cur.Next(ctx) {
		var b model.Blog
		if err := cur.Decode(&b); err == nil {
			out = append(out, b)
		}
	}
	return out, cur.Err()
}

// kreira indeks na author_id + created_at (za listanje po autoru)
func (r *BlogRepo) EnsureIndexes(ctx context.Context) error {
	_, err := r.col.Indexes().CreateMany(ctx, []mongo.IndexModel{
		{Keys: bson.D{{Key: "author_id", Value: 1}, {Key: "created_at", Value: -1}}}},
	)
	return err
}
