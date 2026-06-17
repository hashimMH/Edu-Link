FROM node:22-alpine
WORKDIR /app
RUN addgroup -g 1001 app && adduser -u 1001 -G app -D app
COPY edulink-backend/package.json edulink-backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY edulink-backend/ .
USER app
EXPOSE 8080
CMD node migrations/run.js && node src/index.js
