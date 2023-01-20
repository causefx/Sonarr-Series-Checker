# Sonarr Series Checker

A basic script to check your Sonarr instance for any Series that are continuing, but are currently not monitored, or any Series that have ended, but are currently monitored. The script can then notify you via a Discord webhook of its findings and/or action the Series or Seasons that it finds for you. Action means to monitor or unmonitor the discovered Series or Seasons, depending on the state of the Series.

## Usage

### Docker

```bash
docker create \
  --name=sonarr-checker \
  -v /etc/localtime:/etc/localtime:ro \ # Needed so that the container matches the TZ of the Host for the cronjob
  -v /etc/localtime:/etc/timezone:ro \ # Needed so that the container matches the TZ of the Host for the cronjob
  -e SONARR_URL="" \
  -e SONARR_KEY="" \
  -e MONITORED_IGNORE_TAG_ID="" \
  -e UNMONITORED_IGNORE_TAG_ID="" \
  -e DISCORD_URL="" \
  -e DISCORD_NOTIFICATION_TYPE="both" \
  -e ACTION='false' \
  -e SEASON_ACTION='false' \
  -e STARTUP='false' \
  -e CRON="5 2,11 * * *" \
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
      - MONITORED_IGNORE_TAG_ID=""
      - UNMONITORED_IGNORE_TAG_ID=""
      - DISCORD_URL=""
      - DISCORD_NOTIFICATION_TYPE="both"
      - ACTION='false'
      - SEASON_ACTION='false'
      - STARTUP='false'
      - CRON=5 2,11 * * *"
    volumes:
      - "/etc/localtime:/etc/localtime:ro"
      - "/etc/localtime:/etc/timezone:ro"
```

### Environment Variables

| SONARR_URL | URL for your Sonarr instance |
| SONARR_KEY | API key for your Sonarr instance |
| MONITORED_IGNORE_TAG_ID | Optional; The Id of the Sonarr tag that you do not want the scanner to pickup for series that are monitored |
| UNMONITORED_IGNORE_TAG_ID | Optional; The Id of the Sonarr tag that you do not want the scanner to pickup for series that are unmonitored |
| DISCORD_URL | Optional; The Discord webhook URL you want notifications to be sent to |
| DISCORD_NOTIFICATION_TYPE | Optional; The type of change you want to be notified i.e. m/monitored = series changed to monitored; u/unmonitored = series changed to unmonitored; both |
| ACTION | Optional; Whether or not you want Sonarr Checker to action the discovered Series |
| SEASON_ACTION | Optional; Whether or not you want Sonarr Checker to action the discovered Series Seasons |
| STARTUP | Optional; Perform scan on Container startup |
| CRON | Optional; Specify when you want the scan to run via cronjob |