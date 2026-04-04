FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@9.15.9

COPY morning-mate/package.json morning-mate/pnpm-lock.yaml ./
COPY morning-mate/patches/ ./patches/

RUN pnpm install --no-frozen-lockfile

COPY morning-mate/ .

RUN pnpm run build

EXPOSE 8080

ENV PORT=8080
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
