FROM ghcr.io/linuxserver/baseimage-alpine:3.17

LABEL maintainer="causefx"

# Environment variables
ENV DISCORD_URL ''
ENV DISCORD_NOTIFICATION_TYPE ''
ENV SONARR_URL ''
ENV SONARR_KEY ''
ENV ACTION ''
ENV SEASON_ACTION ''
ENV CRON ''
ENV STARTUP ''
ENV MONITORED_IGNORE_TAG_ID ''
ENV UNMONITORED_IGNORE_TAG_ID ''

# Add local files
COPY ./ /app
WORKDIR /app

# Install packages
RUN apk add --no-cache \
	nodejs \
	npm \
	&& npm install

# Make script executable
RUN chmod a+x /app/SonarrChecker.sh

CMD ["/bin/bash","-c","/app/SonarrChecker.sh; /bin/bash"]
