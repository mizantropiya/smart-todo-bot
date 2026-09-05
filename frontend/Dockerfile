FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM deps AS development
COPY tsconfig*.json vite.config.ts eslint.config.mjs index.html ./
COPY src ./src
EXPOSE 5173
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 CMD ["node", "-e", "fetch('http://localhost:5173').then((r)=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
CMD ["npm", "run", "dev"]

FROM deps AS build
COPY tsconfig*.json vite.config.ts eslint.config.mjs index.html ./
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
