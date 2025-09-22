# gateway/Dockerfile
FROM node:20-alpine

# Set working dir
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Copy app source
COPY index.js ./

# Optional: add proto volume inside container path /proto (via compose bind)
# COPY ../proto ./proto   # ako želiš kopirati umesto volume mount-a

ENV PORT=8080
EXPOSE 8080

CMD ["npm", "start"]
