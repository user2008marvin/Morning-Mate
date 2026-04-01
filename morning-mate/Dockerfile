FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --no-frozen-lockfile

COPY . .

RUN pnpm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
