# Stage 1: Build the Next.js app
FROM ubuntu:24.04 AS builder

# Install Node.js and sendmail
RUN apt-get update \
    && apt-get install -y --fix-missing curl ca-certificates sendmail build-essential python3 make g++ \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Ensure native modules like better-sqlite3 are compiled against this Node version
ENV npm_config_build_from_source=true

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps \
    && npm rebuild better-sqlite3 --build-from-source

COPY . .
# Skip tests during Docker build to avoid native module ABI issues
ENV SKIP_TESTS=1
RUN npm run build

# Stage 2: Production image with pm2, nginx, and sendmail
FROM ubuntu:24.04

# Install Node.js, pm2, nginx, and sendmail
RUN apt-get update \
    && apt-get install -y --fix-missing curl ca-certificates sendmail \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs nginx \
    && npm install -g pm2 \
    && rm -rf /var/lib/apt/lists/*

# Set timezone to America/Toronto
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update \
    && apt-get install -y --fix-missing tzdata \
    && ln -snf /usr/share/zoneinfo/America/Toronto /etc/localtime \
    && echo "America/Toronto" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata

# Copy the Next.js build from the builder stage
WORKDIR /app
COPY --from=builder /app ./

# Remove the default Nginx configuration
RUN rm /etc/nginx/sites-available/default \
    && rm /etc/nginx/sites-enabled/default

# Copy the custom Nginx configuration
COPY ./default.conf /etc/nginx/sites-available/default
RUN ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the nginx port
EXPOSE 8072

# Start pm2 for Next.js and Nginx
CMD ["sh", "-c", "pm2 start npm --name 'nextjs' -- run start && nginx -g 'daemon off;'"]
