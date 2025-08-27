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
}
