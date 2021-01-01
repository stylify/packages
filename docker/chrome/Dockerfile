FROM selenium/standalone-chrome
# User must be set to root if you want to install something inside the selenium image

USER root
# Install npm

RUN apt-get update && apt-get install -y gnupg2 &&\
	curl -sL https://deb.nodesource.com/setup_10.x | bash - &&\
	apt-get install -y nodejs build-essential &&\
	npm install -g npm@latest &&\
	npm install -g n  &&\
	n stable

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - &&\
	echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list &&\
	apt update && apt install yarn

RUN node -v && npm -v

# See https://github.com/nodejs/node-v0.x-archive/issues/3911#issuecomment-8956154
#RUN ln -s /usr/bin/nodejs /usr/bin/node
