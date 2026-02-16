FROM node:20-alpine

# Cache Bust: Force clean build on Railway
ARG CACHE_BUST=20260216-1830

# Install poppler-utils for PDF OCR
RUN apk add --no-cache poppler-utils

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# WICHTIG: Clerk Key muss als Build-Argument UND als Variable in Railway gesetzt sein
# In Railway: Settings → Build → Build Arguments → VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Debug: Zeige ob der Key gesetzt ist (nur erste Zeichen)
RUN echo "VITE_CLERK_KEY starts with: ${VITE_CLERK_PUBLISHABLE_KEY:0:10}..."

# Cache löschen und neu bauen
RUN rm -rf node_modules/.vite node_modules/.cache .vite dist

RUN npm run build

# Debug: Zeige generierte JS-Dateien
RUN ls -la dist/public/assets/*.js || echo "No JS files found in dist/public/assets/"

EXPOSE 8080
ENV PORT=8080

CMD ["node", "dist/index.js"]
