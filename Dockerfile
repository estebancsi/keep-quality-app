# Stage 1: Build the Angular application
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache gettext

# Copy built artifacts
COPY --from=build /app/dist/keep-quality-app/browser /usr/share/nginx/html

# Copy Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy config template and entrypoint
COPY public/config.template.json /usr/share/nginx/html/config.template.json
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
