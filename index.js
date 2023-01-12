process.env.DEBUG = '*';

const { Webhook, MessageBuilder } = require('discord-webhook-node');
const url = require('url');
const debug = require('debug')('sonarrStatus');
const SonarrAPI = require('./lib/sonarr-api/lib/api.js');
const argv = require('minimist')(process.argv.slice(2));

const options = {
    "url": argv.u || false,
    "api": argv.k || false,
    "perform_action":    argv.a ? (argv.a == 'true' ? true : false) : false,
    "discord_webhook": argv.d || false
};

debug('Validating Options... Using options:');
debug(options);
if(!options.url) throw new Error("URL cannot be empty");
if(!options.api) throw new Error("API cannot be empty");
debug('Done Validating Options');
if(options.perform_action) debug('Action variable found - Will perform Update on Sonarr Series')
if(!options.perform_action) debug('Action variable not found - Will skip Update on Sonarr Series');
if(options.discord_webhook) debug('Discord variable found - Will send Discord messages')
if(!options.discord_webhook) debug('Discord variable not found - Will skip Discord messages');
const sonarrURL = qualifyURL(options.url, true);
const sonarr = new SonarrAPI({
    hostname: sonarrURL.host,
    apiKey: options.api,
    port: sonarrURL.port,
    urlBase: sonarrURL.path
});

let promise = Promise.resolve();
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
        if(series['monitored'][key]['status'] === 'ended' && series['monitored'][key]['statistics']['episodeCount'] === series['monitored'][key]['statistics']['episodeFileCount']){
            debug(series['monitored'][key]['title']);
            actions['unmonitor'].push(series['monitored'][key]);
            promise = promise
                .then(() => {
                    return new Promise((resolve) => {
                        let image = grabImage(series['monitored'][key]);
                        let msg = (options.perform_action) ? 'We have Unmonitored this series.' : 'We suggest you Unmonitor this series.';
                        setTimeout(function(){
                            resolve(
                                webhookShitSeries(series['monitored'][key]['title'], msg, image),
                                series['monitored'][key].monitored = false,
                                toggleSeries(series['monitored'][key]),
                                debug(msg + ' ... '+series['monitored'][key]['title'] + ' | Files/Eps: ' + series['monitored'][key]['statistics']['episodeFileCount'] + '/' + series['monitored'][key]['statistics']['episodeCount'])
                            );
                        }, options.perform_action ? 5000 : 1000);
                    })
                })
        }
    });
    debug('Unmonitored Series List');
    Object.keys(series['unmonitored']).forEach(function (key){
        if(series['unmonitored'][key]['status'] === 'continuing'){
            debug(series['unmonitored'][key]['title']);
            actions['monitor'].push(series['unmonitored'][key]);
            promise = promise
                .then(() => {
                    return new Promise((resolve) => {
                        let msg = (options.perform_action) ? 'We have Monitored this series.' : 'We suggest you Monitor this series.';
                        let image = grabImage(series['unmonitored'][key]);
                        setTimeout(function(){
                            resolve(
                                webhookShitSeries(series['unmonitored'][key]['title'], msg, image),
                                series['unmonitored'][key].monitored = true,
                                toggleSeries(series['unmonitored'][key]),
                                debug(msg + '... '+series['unmonitored'][key]['title'] + ' | Files/Eps: ' + series['unmonitored'][key]['statistics']['episodeFileCount'] + '/' + series['unmonitored'][key]['statistics']['episodeCount'])
                            );
                        }, options.perform_action ? 5000 : 1000);
                    })
                })
        }
    });
    promise = promise
        .then(() => {
            return new Promise((resolve) => {
                setTimeout(function(){
                    resolve(
                        debug('Script is Complete...Exiting'),
                        process.exit(0)
                    );
                }, 1000);
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
function webhookShitSeries(title, action, image){
    if(options.discord_webhook){
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
        sonarr.put("series", data).then(function (result) {
            debug(result.title + ' has been updated');
        }, function (err) {
            throw new Error("There was a error processing the request: " + err);
        })
    }
}