FROM node:22-alpine

WORKDIR /app

# Install deps first for layer caching
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy source
COPY backend/src ./src

EXPOSE 3001

CMD ["node", "src/index.js"]
