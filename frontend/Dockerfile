# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm i
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_FOLLOWING_API_URL
ARG VITE_BLOG_API_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_FOLLOWING_API_URL=${VITE_FOLLOWING_API_URL}
ENV VITE_BLOG_API_URL=${VITE_BLOG_API_URL}
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]


