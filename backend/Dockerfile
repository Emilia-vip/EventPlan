FROM node:26-alpine AS deps

WORKDIR /app

# Bara produktionsberoenden till slutbilden
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:26-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY migrations ./migrations

# Kör inte som root
USER node
EXPOSE 3000

# Migreringar körs av ett eget Job (npm run migrate), inte vid start av varje pod
CMD ["node", "--import", "tsx", "src/server.ts"]
