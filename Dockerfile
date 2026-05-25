# ============================================
# Production-ready Dockerfile for Eleventy
# Optimized for EasyPanel deployment
# ============================================

# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install dependencies
# Using npm install instead of npm ci to generate package-lock.json if missing
RUN npm install --prefer-offline --no-audit

# Copy all source files
COPY . .

# Build the static site
RUN npm run build

# ============================================
# Stage 2: Production stage with nginx
FROM nginx:1.27-alpine AS production

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/_site /usr/share/nginx/html

# Ensure proper permissions for static files
RUN chmod -R 755 /usr/share/nginx/html

# Expose standard HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
