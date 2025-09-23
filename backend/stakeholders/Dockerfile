# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

# Runtime stage
FROM alpine:latest
WORKDIR /app
RUN mkdir -p /app/uploads && chmod 755 /app/uploads
COPY --from=builder /app/app .
EXPOSE 8081
CMD ["./app"]