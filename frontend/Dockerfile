# Steg 1: bygg appen
FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite bäddar in dessa värden vid bygget, så de måste skickas in med --build-arg
ARG VITE_API_URL
ARG VITE_CDN_URL
RUN npm run build

# Steg 2: servera de färdiga filerna med Nginx
FROM nginxinc/nginx-unprivileged:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Kör som icke-root på port 8080 (unprivileged-imagen)
EXPOSE 8080
