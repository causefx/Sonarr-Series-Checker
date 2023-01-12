FROM ghcr.io/linuxserver/baseimage-alpine:3.16

LABEL maintainer="causefx"

# Add local files
COPY ./ /app
WORKDIR /app

# Install packages
RUN apk add --no-cache \
	nodejs \
	npm \
	&& npm install

CMD bash -x /app/SonarrChecker
