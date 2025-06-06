FROM node:19.0.0-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/
COPY package-lock.json* /usr/src/app/
RUN npm install --include=dev

# Bundle app source
COPY . /usr/src/app

EXPOSE 3000

