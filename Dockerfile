FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

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
