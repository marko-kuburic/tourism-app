FROM golang:1.22-alpine AS build
WORKDIR /app

# Kopiramo ceo kod pa pokrećemo 'go mod tidy' da izvuče sve dep-ove i napravi go.sum
COPY . .
# Ako go.mod ne postoji, inicijalizuj; ako postoji, ova komanda neće srušiti build
RUN go mod init purchase || true
RUN go mod tidy

# Build (staticki, radi na Alpine runtime-u)
ENV CGO_ENABLED=0
RUN go build -o purchase

FROM alpine:3.19
WORKDIR /app
COPY --from=build /app/purchase /app/purchase
EXPOSE 8085
CMD ["/app/purchase"]
