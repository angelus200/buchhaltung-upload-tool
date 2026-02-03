FROM node:20-alpine

# Install poppler-utils for PDF OCR (pdftoppm command)
RUN apk add --no-cache poppler-utils

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Clerk Publishable Key für Vite Build (zur Build-Zeit benötigt)
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY

# Lösche Vite Build Cache - erzwingt kompletten Neu-Build
RUN rm -rf node_modules/.vite node_modules/.cache .vite

RUN npm run build

EXPOSE 3000
ENV PORT=3000

CMD ["node", "dist/index.js"]
