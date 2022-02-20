FROM nginx

RUN apt-get update && apt-get install -y --no-install-recommends git curl openssh-client

RUN curl -sL https://deb.nodesource.com/setup_14.x | bash - && \
	apt-get update && apt-get install -y --no-install-recommends nodejs &&\
	npm install --global yarn &&\
	node -v &&\
	npm -v &&\
	yarn -v
