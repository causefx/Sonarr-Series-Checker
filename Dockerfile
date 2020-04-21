FROM lsiobase/alpine:3.10

MAINTAINER yomama

# Add local files
COPY ./ /app
WORKDIR /app

# Install packages
RUN apk add --no-cache \
	nodejs-npm \
	nodejs-current \
	&& npm install

CMD sh /app/sonarrChecker