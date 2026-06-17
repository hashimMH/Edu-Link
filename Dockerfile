FROM node:22-alpine
RUN apk add --no-cache libpq ca-certificates
WORKDIR /app
RUN addgroup -g 1001 app && adduser -u 1001 -G app -D app
COPY edulink-backend/package.json edulink-backend/package-lock.json* ./
RUN npm ci --omit=dev
COPY edulink-backend/ .
RUN mkdir -p /app/uploads/videos /app/uploads/certificates /app/uploads/avatars && chown -R app:app /app/uploads
USER app
EXPOSE 8080
CMD node migrations/run.js && node seeds/seed.js && node src/index.js
