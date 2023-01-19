process.env.DEBUG = '*';

const { Webhook, MessageBuilder } = require('discord-webhook-node');
const url = require('url');
const debug = require('debug')('sonarrStatus');
const SonarrAPI = require('./lib/sonarr-api/lib/api.js');
const argv = require('minimist')(process.argv.slice(2));

const options = {
    "url": argv.u || false,
    "api": argv.k || false,
    "perform_action":    argv.a ? ((argv.a === 'true' || argv.a === true)) : false,
    "season_action":    argv.s ? ((argv.s === 'true' || argv.s === true)) : false,
    "discord_webhook": argv.d || false,
    "discord_notification_type": argv.t || 'both',
    "monitored_ignore_tag": argv.m || null,
    "unmonitored_ignore_tag": argv.n || null
};

debug('Validating Options... Using options:');
// Check Notification Type
options.discord_notification_type = options.discord_notification_type.toLowerCase();
switch (options.discord_notification_type){
    case 'u':
    case 'unmonitored':
        options.discord_notification_type = 'unmonitored';
        break;
    case 'm':
    case 'monitored':
        options.discord_notification_type = 'monitored';
        break;
    default:
        options.discord_notification_type = 'both';
}

// Check Ignore Ids
if(options.monitored_ignore_tag !== null){
    options.monitored_ignore_tag = parseInt(options.monitored_ignore_tag);
    if(isNaN(options.monitored_ignore_tag)){
        options.monitored_ignore_tag = null
    }
}
if(options.unmonitored_ignore_tag !== null){
    options.unmonitored_ignore_tag = parseInt(options.unmonitored_ignore_tag);
    if(isNaN(options.unmonitored_ignore_tag)){
        options.unmonitored_ignore_tag = null
    }
}
debug(options);

if(!options.url) throw new Error("URL cannot be empty");
if(!options.api) throw new Error("API cannot be empty");

debug('Done Validating Options');
if(options.perform_action) debug('Action variable found - Will perform Update on Sonarr Series');
if(!options.perform_action) debug('Action variable not found - Will skip Update on Sonarr Series');
if(options.season_action) debug('Season Action variable found - Will perform Update on Sonarr Series Seasons');
if(!options.season_action) debug('Season Action variable not found - Will skip Update on Sonarr Series Seasons');
debug('Notification type set as: ' + options.discord_notification_type);
if(options.discord_webhook) debug('Discord variable found - Will send Discord messages');
if(!options.discord_webhook) debug('Discord variable not found - Will skip Discord messages');

const sonarrURL = qualifyURL(options.url, true);
const sonarr = new SonarrAPI({
    hostname: sonarrURL.host,
    apiKey: options.api,
    port: sonarrURL.port,
    urlBase: sonarrURL.path
});
let promise = Promise.resolve();
// list Sonarr Tags
sonarr.get("tag").then(function (result) {
    debug('Listing Sonarr Tags...')
    debug(result);
});
// get Sonarr Series
sonarr.get("series").then(function (result) {
    let series = {
        'monitored': [],
        'unmonitored': []
    };
    let actions = {
        'monitor': [],
        'unmonitor': []
    };
    Object.keys(result).forEach(function (key){
        if(result[key]['monitored'] === true){
            series['monitored'].push(result[key]);
        }else if(result[key]['monitored'] === false){
            series['unmonitored'].push(result[key]);
        }
    });
    debug('Monitored Series List');
    Object.keys(series['monitored']).forEach(function (key){
        if(series['monitored'][key]['status'] === 'ended' && series['monitored'][key]['statistics']['episodeCount'] != 0 && series['monitored'][key]['statistics']['episodeCount'] === series['monitored'][key]['statistics']['episodeFileCount']){
            debug(series['monitored'][key]['title']);
            actions['unmonitor'].push(series['monitored'][key]);
            if(options.monitored_ignore_tag === null || !series['monitored'][key]['tags'].includes(options.monitored_ignore_tag)){
                promise = promise
                    .then(() => {
                        return new Promise((resolve) => {
                            let image = grabImage(series['monitored'][key]);
                            let msg = (options.perform_action) ? 'This Series is no longer being Monitored' : 'It is suggested that you Unmonitor this Series';
                            setTimeout(function(){
                                resolve(
                                    webhookShitSeries('unmonitored', series['monitored'][key]['title'], msg, image),
                                    series['monitored'][key].monitored = false,
                                    toggleSeries(series['monitored'][key]),
                                    debug(msg + ' ... '+series['monitored'][key]['title'] + ' | Files/Eps: ' + series['monitored'][key]['statistics']['episodeFileCount'] + '/' + series['monitored'][key]['statistics']['episodeCount'])
                                );
                            }, options.perform_action ? 5000 : 1000);
                        })
                    })
            }else{
                debug('This Series is on the ignored tag list');
            }
        }
    });
    debug('Unmonitored Series List');
    Object.keys(series['unmonitored']).forEach(function (key){
        if(series['unmonitored'][key]['status'] === 'continuing'){
            debug(series['unmonitored'][key]['title']);
            actions['monitor'].push(series['unmonitored'][key]);
            if(options.unmonitored_ignore_tag === null || !series['unmonitored'][key]['tags'].includes(options.unmonitored_ignore_tag)) {
                promise = promise
                    .then(() => {
                        return new Promise((resolve) => {
                            let msg = (options.perform_action) ? 'This Series is now being Monitored' : 'It is suggested that you Monitor this series';
                            let image = grabImage(series['unmonitored'][key]);
                            setTimeout(function () {
                                resolve(
                                    webhookShitSeries('monitored', series['unmonitored'][key]['title'], msg, image),
                                    series['unmonitored'][key].monitored = true,
                                    toggleSeries(series['unmonitored'][key]),
                                    debug(msg + '... ' + series['unmonitored'][key]['title'] + ' | Files/Eps: ' + series['unmonitored'][key]['statistics']['episodeFileCount'] + '/' + series['unmonitored'][key]['statistics']['episodeCount'])
                                );
                            }, options.perform_action ? 5000 : 1000);
                        })
                    })
            }else{
                debug('This Series is on the ignored tag list');
            }
        }
    });
    promise = promise
        .then(() => {
            return new Promise((resolve) => {
                setTimeout(function(){
                    resolve(
                        debug('Scan is now complete... Exiting'),
                        process.exit(0)
                    );
                }, 2500);
            })
        })
}).catch(function (err) {
    throw new Error("There was a error processing the request: " + err);
});

function grabImage(array){
    let image = null;
    if(typeof array.images === 'object'){
        array.images.forEach(function(item){
            if(image == null && item.coverType === 'poster'){
                image = item.remoteUrl;
            }
        });
    }
    return image;
}
// Qualify URL
function qualifyURL(addr, obj = false)
{
    // Get Digest
    addr = url.parse(addr);
    // http/https
    let protocol = addr.protocol == null ? 'http' : addr.protocol;
    // Host
    let host = (addr.hostname !== null ? addr.hostname : '');
    // Port
    let port = (addr.port !== null ? ':' + addr.port : '');
    // Path
    let path = (addr.path !== null ? addr.path.replace(/\/$/, "") : '');
    // Query
    let query = (addr.query !== null ? '?' + addr.query : '');
    // Output
    let object = {
        'scheme': protocol + '//',
        'host': host,
        'port': port.replace(':', ''),
        'path': path,
        'query': query
    }
    return (obj) ? object : protocol + '//' + host + port + path + query;
}
function webhookShitSeries(type, title, action, image){
    if(options.discord_webhook && (options.discord_notification_type === 'both' || options.discord_notification_type === type)){
        const hook = new Webhook(options.discord_webhook);
        let embed = new MessageBuilder()
            .setTitle(title)
            .setAuthor('Sonarr Series Checker')
            .setColor(7785669)
            .setThumbnail(image)
            .setDescription(action)
            .setTimestamp();
        hook.send(embed);
    }
}
function toggleSeries(data){
    if(options.perform_action){
        if(options.season_action){
            data['seasons'].forEach(function(season, index){
                season.monitored = data.monitored;
                data['seasons'][index] = season;
            });
        }
        sonarr.put("series", data).then(function (result) {
            debug(result.title + ' has been updated');
        }, function (err) {
            throw new Error("There was a error processing the request: " + err);
        })
    }
}
