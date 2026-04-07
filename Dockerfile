FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm install --build-from-source=sqlite3

COPY . .

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/app/data
ENV DATABASE_DIR=/app/data/database
ENV DATABASE_PATH=/app/data/database/real_estate.db
ENV CAPTURES_DIR=/app/data/captures

EXPOSE 3000

CMD ["node", "server/app.js"]
