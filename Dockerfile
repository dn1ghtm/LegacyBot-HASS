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

RUN addgroup -g 1000 -S nodejs && \
    adduser -S nodejs -u 1000

RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js || exit 1

CMD ["node", "index.js"] 