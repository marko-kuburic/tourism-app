package repo

import (
	"context"
	"errors"
	"time"

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
		{Keys: bson.D{{Key: "author_id", Value: 1}, {Key: "created_at", Value: -1}}},
		{Keys: bson.D{{Key: "comments.id", Value: 1}}},
})
	return err
}



	// --- Comments ---


func (r *BlogRepo) AddComment(ctx context.Context, blogID string, c model.Comment) error {
	res, err := r.col.UpdateByID(ctx, blogID, bson.M{"$push": bson.M{"comments": c}})
	if err != nil { 
		return err 
	}
	if res.MatchedCount == 0 { 
		return mongo.ErrNoDocuments 
	}
	return nil
}


func (r *BlogRepo) UpdateComment(ctx context.Context, blogID, commentID, authorID, newText string, now time.Time) error {
	filter := bson.M{
		"_id": blogID,
		"comments": bson.M{"$elemMatch": bson.M{"id": commentID, "author_id": authorID}},
	}
	update := bson.M{
		"$set": bson.M{
			"comments.$.text": newText,
			"comments.$.updated_at": now,
		},
	}
	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil { 
		return err 
	}
	if res.MatchedCount == 0 { 
		return errors.New("comment not found or not owned by user") 
	}
	return nil
}


func (r *BlogRepo) DeleteComment(ctx context.Context, blogID, commentID, authorID string) error {
	filter := bson.M{ "_id": blogID }
	update := bson.M{ "$pull": bson.M{ "comments": bson.M{ "id": commentID, "author_id": authorID } } }
	res, err := r.col.UpdateOne(ctx, filter, update)
	if err != nil { 
		return err 
	}
	if res.ModifiedCount == 0 { 
		return errors.New("comment not found or not owned by user") 
	}
	return nil
}


func (r *BlogRepo) ListComments(ctx context.Context, blogID string, limit int64) ([]model.Comment, error) {
	var b model.Blog
	err := r.col.FindOne(ctx, bson.M{"_id": blogID}, options.FindOne().SetProjection(bson.M{"comments": 1, "_id": 0})).Decode(&b)
	if err != nil { 
		return nil, err 
	}
	comments := b.Comments
	if limit > 0 && int64(len(comments)) > limit {
		comments = comments[:limit]
	}
	return comments, nil
}

// --- Likes ---


func (r *BlogRepo) AddLike(ctx context.Context, blogID, userID string) (added bool, err error) {
	res, err := r.col.UpdateByID(ctx, blogID, bson.M{"$addToSet": bson.M{"likes": userID}})
	if err != nil { 
		return false, err 
	}
	if res.MatchedCount == 0 { 
		return false, mongo.ErrNoDocuments 
	}
	return true, nil
}


func (r *BlogRepo) RemoveLike(ctx context.Context, blogID, userID string) error {
	res, err := r.col.UpdateByID(ctx, blogID, bson.M{"$pull": bson.M{"likes": userID}})
	if err != nil { 
		return err 
	}
	if res.MatchedCount == 0 { 
		return mongo.ErrNoDocuments 
	}
	return nil
}


func (r *BlogRepo) CountLikes(ctx context.Context, blogID string) (int, error) {
	var b model.Blog
	if err := r.col.FindOne(ctx, bson.M{"_id": blogID}, options.FindOne().SetProjection(bson.M{"likes":1,"_id":0})).Decode(&b); err != nil {
		return 0, err
	}
	return len(b.Likes), nil
}



