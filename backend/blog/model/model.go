package model

import "time"

type Blog struct {
	ID              string    `json:"id" bson:"_id"`                // koristimo UUID string kao _id
	AuthorID        string    `json:"author_id" bson:"author_id"`   // UUID iz JWT-a
	Title           string    `json:"title" bson:"title"`
	DescriptionMD   string    `json:"description_md" bson:"description_md"`
	DescriptionHTML string    `json:"description_html" bson:"description_html"`
	Images          []string  `json:"images,omitempty" bson:"images,omitempty"`
	CreatedAt       time.Time `json:"created_at" bson:"created_at"`

	Likes []string `json:"likes,omitempty" bson:"likes,omitempty"`
	Comments []Comment `json:"comments,omitempty" bson:"comments,omitempty"`
}


type Comment struct {
ID string `json:"id" bson:"id"`
AuthorID string `json:"author_id" bson:"author_id"`
Text string `json:"text" bson:"text"`
CreatedAt time.Time `json:"created_at" bson:"created_at"`
UpdatedAt time.Time `json:"updated_at" bson:"updated_at"`
}
