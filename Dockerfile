FROM node:13.12.0-alpine3.10
LABEL maintainer="Ruedos <info@ruedos.dev>"

RUN apk add --no-cache chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont

WORKDIR /usr/src/app
COPY . .
RUN npm install
CMD ["npm","start"]
