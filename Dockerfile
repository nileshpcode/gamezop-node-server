FROM node:10.16.3 as builder

ADD . /var/app/current
WORKDIR /var/app/current
RUN npm install
ENTRYPOINT node server.js
