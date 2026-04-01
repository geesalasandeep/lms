FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Build TypeScript
RUN npm run build || npx tsc

EXPOSE 3000

CMD ["node", "dist/index.js"]
