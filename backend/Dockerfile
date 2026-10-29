FROM node:26-alpine

WORKDIR /app

# Kopiera bara beroendefilerna först, så cachas npm ci mellan byggen
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Lyssna på alla nätverksgränssnitt inne i containern
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "dist/server.ts"]
