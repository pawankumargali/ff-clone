FROM node:20.19.4

WORKDIR /home/app

COPY package.json yarn.lock ./

RUN npm install yarn

RUN yarn install --frozen-lockfile

COPY . .

RUN npx prisma generate \
 && mkdir -p node_modules/.prisma/client \
 && cp -r generated/prisma/. node_modules/.prisma/client/

RUN yarn build

RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]

CMD ["yarn", "start"]
