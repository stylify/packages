FROM nginx

RUN apt-get update && apt-get install -y --no-install-recommends python make g++ build-essential git zip unzip curl npm openssh-client && \
	apt-get remove -y cmdtest

RUN npm i -g n yarn && \
	n 18.17.1 && \
	yarn global add pnpm && \
	ln -sf /usr/local/n/versions/node/18.17.1/bin/node /usr/local/bin/node

RUN node -v && \
	npm -v

EXPOSE 80 3000 4000
