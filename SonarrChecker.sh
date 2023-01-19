#!/usr/bin/with-contenv bash
echo 'Starting up script ...... lol... k thnx bai!'

echo '[---------- Checking for Discord Webhook ----------]'
if [[ -z ${DISCORD_URL} ]]; then
    echo 'NO DISCORD WEBHOOK SUPPLIED'
    WEBHOOK=''
else
    echo 'Discord Webhook found...'
    WEBHOOK="-d ${DISCORD_URL}"
fi

echo '[---------- Checking to see if Discord Notification type is set ----------]'
if [[ -z ${DISCORD_NOTIFICATION_TYPE} ]]; then
    echo 'No Discord Notification Type set'
    WEBHOOK_NOTIFICATION_TYPE="-t both"
else
    echo 'Setting Discord Notification Type...'
    WEBHOOK_NOTIFICATION_TYPE="-t ${DISCORD_NOTIFICATION_TYPE}"
fi

echo '[---------- Checking for Sonarr URL ----------]'
if [[ -z ${SONARR_URL} ]]; then
    echo 'NO SONARR URL SUPPLIED'
    exit 1
    SONARRURL=''
else
    echo 'Sonarr URL found...'
    SONARRURL="-u ${SONARR_URL}"
fi

echo '[---------- Checking for Sonarr API Key ----------]'
if [[ -z ${SONARR_KEY} ]]; then
    echo 'NO SONARR API KEY SUPPLIED'
    exit 1
    SONARRKEY=''
else
    echo 'Sonarr API Key found...'
    SONARRKEY="-k ${SONARR_KEY}"
fi

echo '[---------- Checking for Monitored Ignore Tag Id ----------]'
if [[ -z ${MONITORED_IGNORE_TAG_ID} ]]; then
    echo 'No Ignore Tag Id Supplied'
    MONITORED_IGNORE_TAG=''
else
    echo 'Tag Id found...'
    MONITORED_IGNORE_TAG="-m ${MONITORED_IGNORE_TAG_ID}"
fi

echo '[---------- Checking for Unmonitored Ignore Tag Id ----------]'
if [[ -z ${UNMONITORED_IGNORE_TAG_ID} ]]; then
    echo 'No Ignore Tag Id Supplied'
    UNMONITORED_IGNORE_TAG=''
else
    echo 'Tag Id found...'
    UNMONITORED_IGNORE_TAG="-n ${UNMONITORED_IGNORE_TAG_ID}"
fi

echo '[---------- Checking to see if we need to perform Sonarr Series Update ----------]'
if [[ ${ACTION} == 'true' ]]; then
    echo 'Performing Sonarr Series Update...'
    SETACTION='-a true'
else
    echo 'Skipping Sonarr Series Update...'
    SETACTION='-a false'
fi

echo '[---------- Checking to see if we need to perform Sonarr Series Season Update ----------]'
if [[ ${SEASON_ACTION} == 'true' ]]; then
    echo 'Performing Sonarr Series Season Update...'
    SETSEASONACTION='-s true'
else
    echo 'Skipping Sonarr Series Season Update...'
    SETSEASONACTION='-s false'
fi

echo '[---------- Checking for CRON ----------]'
if [[ -z ${CRON} ]]; then
    echo 'NO CRON SUPPLIED - USING DEFAULT CRON OF: 5 2,11 * * *'
    CRON='5 2,11 * * *'
else
    echo 'CRON found...'
fi

echo '[---------- Checking for run at startup ----------]'
if [[ ${STARTUP} == 'true' ]]; then
    echo 'Performing the startup scan now...'
    cd /app && node index ${SONARRURL} ${SONARRKEY} ${SETACTION} ${SETSEASONACTION} ${WEBHOOK} ${WEBHOOK_NOTIFICATION_TYPE} ${MONITORED_IGNORE_TAG} ${UNMONITORED_IGNORE_TAG}
else
    echo 'Skipping the startup scan..'
fi

echo '[---------- Setting up CRON Job ----------]'
echo "${CRON}    cd /app && node index ${SONARRURL} ${SONARRKEY} ${SETACTION} ${SETSEASONACTION} ${WEBHOOK} ${WEBHOOK_NOTIFICATION_TYPE} ${MONITORED_IGNORE_TAG} ${UNMONITORED_IGNORE_TAG}" > /etc/crontabs/root
echo 'CRON Job has been set...'
echo 'Starting the CRON Service now...'
crond -l 2 -f
