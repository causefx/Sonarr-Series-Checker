FROM ghcr.io/linuxserver/baseimage-alpine:3.17

LABEL maintainer="causefx"

# Environment variables
ENV DISCORD_URL
ENV SONARR_URL
ENV SONARR_KEY
ENV ACTION
ENV CRON
ENV STARTUP

# Add local files
COPY ./ /app
WORKDIR /app

# Install packages
RUN apk add --no-cache \
	nodejs \
	npm \
	&& npm install

CMD ["/bin/bash","/app/SonarrChecker.sh"]
