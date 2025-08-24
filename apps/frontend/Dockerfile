FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
RUN if [ -f package-lock.json ]; then npm ci; elif [ -f yarn.lock ]; then yarn install; elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i; else npm i; fi
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]