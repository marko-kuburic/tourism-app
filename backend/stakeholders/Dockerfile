# Build stage
FROM golang:1.21-alpine AS builder

# Install protoc and protoc-gen-go plugins
RUN apk add --no-cache protobuf protobuf-dev
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.31.0
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

WORKDIR /app

# Copy stakeholder service files
COPY backend/stakeholders/go.mod backend/stakeholders/go.sum ./
RUN go mod download

# Copy proto files and stakeholder service code
COPY proto ./proto
COPY backend/stakeholders ./

# Generate protobuf files from proto
RUN mkdir -p pb
RUN protoc --go_out=./pb --go_opt=paths=source_relative \
    --go-grpc_out=./pb --go-grpc_opt=paths=source_relative \
    -I=./proto ./proto/stakeholder.proto

RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

# Runtime stage
FROM alpine:latest
WORKDIR /app
RUN mkdir -p /app/uploads && chmod 755 /app/uploads
COPY --from=builder /app/app .
EXPOSE 8081
CMD ["./app"]