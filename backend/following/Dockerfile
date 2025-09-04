FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN npm ci || npm i
COPY tsconfig.json ./
COPY src ./src
ENV PORT=8083
EXPOSE 8083
CMD ["npx", "tsx", "src/index.ts"]


