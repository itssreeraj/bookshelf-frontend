# --- Stage 1: Build the React Application ---
FROM node:22-alpine AS build
WORKDIR /app

# Limit Node's heap so Vite build doesn't crash the 1GB RAM instance
ENV NODE_OPTIONS="--max-old-space-size=512"

# Leverage Docker cache for npm dependencies
COPY package*.json ./
RUN npm ci

# Copy application source code and build the dist directory
COPY . .
RUN npm run build

# --- Stage 2: Serve with Nginx ---
FROM nginx:alpine

# Remove default static files
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx routing and API proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]