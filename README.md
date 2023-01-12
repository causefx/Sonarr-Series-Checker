# Sonarr Series Checker

A basic script to check your Sonarr instance for any Series that are continuing, but are currently not monitored, or any Series that have ended, but are currently monitored. The script can then notify you via a Discord webhook of its findings and/or action the Series that it finds for you. Action means to monitor or unmonitor the discovered Series, depending on the state of the Series.

## Usage

### Docker

```bash
docker create \
  --name=sonarr-checker \
  -v /etc/localtime:/etc/localtime:ro \ # Needed so that the container matches the TZ of the Host for the cronjob
  -v /etc/localtime:/etc/timezone:ro \ # Needed so that the container matches the TZ of the Host for the cronjob
  -e SONARR_URL="" \ # The URL for your Sonarr instance
  -e SONARR_KEY="" \ # The API key for your Sonarr instance
  -e DISCORD_URL="" \ # Optional; The Discord webhook URL you want notifications to go to
  -e ACTION="false" \ # Optional; Whether or not you want Sonarr Checker to action the discovered Series
  -e STARTUP="false" \ # Optional; Perform scan on startup
  -e CRON="5 2,11 * * *" \ # Optional; Specify when you want the scan to run via cronjob
  ghcr.io/causefx/sonarrchecker
```

### Docker-Compose

```yaml
  sonarr-checker:
    container_name: sonarr-checker
    image: ghcr.io/causefx/sonarrchecker
    restart: on-failure
    environment:
      - SONARR_URL=""
      - SONARR_KEY=""
      - DISCORD_URL=""
      - ACTION="false"
      - STARTUP="false"
      - CRON=5 2,11 * * *"
    volumes:
      - "/etc/localtime:/etc/localtime:ro"
      - "/etc/localtime:/etc/timezone:ro"
```
