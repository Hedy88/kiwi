FROM node:20

COPY . /app
WORKDIR /app

RUN apt update
RUN npm install --verbose
RUN npm run build

ENTRYPOINT ["node", "./dist/index.js"]

