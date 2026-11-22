FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install only runtime dependencies. npm ci uses the committed lockfile
# so every build is reproducible.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# The actual port comes from the PORT environment variable at runtime.
EXPOSE 5001

CMD ["node", "src/server.js"]
