package service

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type TourClient struct {
	BaseURL string
	Client  *http.Client
}

func NewTourClient(base string) *TourClient {
	return &TourClient{
		BaseURL: base,
		Client:  &http.Client{Timeout: 5 * time.Second},
	}
}

// Minimalni public DTO (kakav očekujemo iz Tour servisa /tours/{id}/public)
type PublicTour struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	//Status     string `json:"status"`
	PriceCents int64  `json:"priceCents"`
}

func (tc *TourClient) PublicByID(tourID string, authHeader string) (*PublicTour, error) {
	req, _ := http.NewRequest("GET", fmt.Sprintf("%s/tours/%s/public", tc.BaseURL, tourID), nil)
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	resp, err := tc.Client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tour service %d", resp.StatusCode)
	}
	var t PublicTour
	return &t, json.NewDecoder(resp.Body).Decode(&t)
}
