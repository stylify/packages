FROM nginx

RUN apt-get update && apt-get install -y --no-install-recommends git zip unzip curl npm openssh-client &&\
	apt remove cmdtest

RUN npm i -g n yarn &&\
	n 16.17.1

RUN node -v &&\
	npm -v &&\
	yarn -v

EXPOSE 80 3000 4000
