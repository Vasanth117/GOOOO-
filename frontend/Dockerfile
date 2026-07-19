# Build stage
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
# Remove Windows package-lock.json to force npm to resolve Linux/Alpine dependencies for Vite/Rollup
RUN rm -f package-lock.json && npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Add custom nginx config if necessary, or just use default
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
