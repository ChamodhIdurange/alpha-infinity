# ALFA store: one container serving the React site, the API and the owner CMS.
#   docker build -t alfa-store .
#   docker run -d -p 8000:8000 -v alfa-data:/data --name alfa alfa-store
#   docker exec -it alfa node backend/dist/cli.js set-password
# Mount /data on persistent storage: it holds the SQLite catalogue and every upload.

FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci
COPY backend backend
COPY frontend frontend
RUN npm run build && npm prune --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    ALFA_DATA_DIR=/data/db \
    ALFA_UPLOAD_DIR=/data/uploads \
    TRUST_PROXY=1
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules node_modules
COPY --from=build /app/backend/package.json backend/
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/frontend/dist frontend/dist
RUN mkdir -p /data && chown node:node /data
USER node
VOLUME /data
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "backend/dist/server.js"]
