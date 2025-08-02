FROM node:18-alpine

RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Create user and group with automatic ID assignment
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

CMD ["/app/run.sh"] 