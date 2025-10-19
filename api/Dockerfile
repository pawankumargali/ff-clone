FROM node:20.19.4

WORKDIR /home/app

COPY ./package.json ./package.json

RUN npm install yarn

RUN yarn install

COPY ./ ./

CMD ["yarn", "start"]
