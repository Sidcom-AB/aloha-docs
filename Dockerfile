FROM node:20-alpine

WORKDIR /app

# Metadata build args
ARG BUILD_DATE
ARG COMMIT_HASH
ARG BRANCH
ARG VERSION

# Add labels
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.revision="${COMMIT_HASH}"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.source="https://github.com/Sidcom-AB/aloha-docs"

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
