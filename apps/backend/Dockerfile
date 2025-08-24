FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; elif [ -f yarn.lock ]; then yarn install --production; elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --prod; else npm i --omit=dev; fi
COPY . .
EXPOSE 4000
CMD ["node", "server.js"]