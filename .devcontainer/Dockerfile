FROM node:16

RUN apt-get update && apt-get install -y --no-install-recommends git zip unzip curl openssh-client

RUN node -v &&\
	npm -v &&\
	yarn -v

EXPOSE 82
