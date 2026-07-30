FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ARG VITE_AGENT_BASE_URL=/agents
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AGENT_BASE_URL=${VITE_AGENT_BASE_URL}

COPY package.json ./
RUN npm install

COPY index.html vite.config.ts tsconfig.json tailwind.config.cjs postcss.config.cjs ./
COPY public ./public
COPY src ./src

# Bake the frontend config into the image build so Vite sees the same values
# the runtime config script will serve through the Cloud Run frontend.
RUN printf 'VITE_API_BASE_URL=%s\nVITE_AGENT_BASE_URL=%s\n' \
    "$VITE_API_BASE_URL" \
    "$VITE_AGENT_BASE_URL" > .env.production \
    && npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/dist ./dist
COPY server.mjs ./server.mjs
EXPOSE 8080

CMD ["node", "server.mjs"]
