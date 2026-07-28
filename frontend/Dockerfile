FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=https://todo-backend-143058686948.asia-south1.run.app
ARG VITE_AGENT_BASE_URL=https://todo-agents-143058686948.asia-south1.run.app
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AGENT_BASE_URL=${VITE_AGENT_BASE_URL}

COPY package.json ./
RUN npm install

COPY index.html vite.config.ts tsconfig.json tailwind.config.cjs postcss.config.cjs ./
COPY public ./public
COPY src ./src

# Bake the frontend config into the image build so Vite sees the same values
# the runtime template will use inside nginx.
RUN printf 'VITE_API_BASE_URL=%s\nVITE_AGENT_BASE_URL=%s\n' \
    "$VITE_API_BASE_URL" \
    "$VITE_AGENT_BASE_URL" > .env.production \
    && npm run build

FROM nginx:1.27-alpine

ARG VITE_API_BASE_URL=https://todo-backend-143058686948.asia-south1.run.app
ARG VITE_AGENT_BASE_URL=https://todo-agents-143058686948.asia-south1.run.app
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_AGENT_BASE_URL=${VITE_AGENT_BASE_URL}

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.d/ /docker-entrypoint.d/
COPY public/runtime-config.template.js /usr/share/nginx/html/runtime-config.template.js
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
