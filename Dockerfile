FROM nginx:alpine

RUN apk update && apk add --update git zip unzip curl openssh-client npm yarn nodejs=16.17.1-r0

RUN node -v &&\
	npm -v &&\
	yarn -v

EXPOSE 80 3000 4000
