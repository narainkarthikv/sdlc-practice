FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_AGENT_BASE_URL=/agents
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_AGENT_BASE_URL=${VITE_AGENT_BASE_URL}

COPY package.json ./
RUN npm install

COPY index.html vite.config.ts tsconfig.json tailwind.config.cjs postcss.config.cjs ./
COPY public ./public
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

ARG API_BASE_URL=https://todo-backend-143058686948.asia-south1.run.app
ARG AGENT_BASE_URL=https://todo-agents-143058686948.asia-south1.run.app
ENV API_BASE_URL=${API_BASE_URL} \
    AGENT_BASE_URL=${AGENT_BASE_URL} \
    BACKEND_SERVICE_URL=${API_BASE_URL} \
    AGENTS_SERVICE_URL=${AGENT_BASE_URL}

COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs
EXPOSE 8080

CMD ["node", "server.mjs"]
