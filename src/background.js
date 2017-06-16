let userData = {
    id: null,
    login: null,
    // followed streams by id
    follows: {},
    settings: {
        // streamer ids in order by priority
        priorityList: {}
    }
};

const FOLLOW_REQ_QUERY_LIMIT = 100;
const RECENTLY_OFFLINE_TIME_LIMIT = 300000;

let appData = {
    currentStream: null,
    started: false,
    recentlyEndedStreamNames: {}
};

chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({'url': chrome.extension.getURL('src/settings.html')}, function (tab) {

    });
});

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    switch (msg.type) {
        case "userData":
            onUserDataReceived(msg.data, true);
            break;
        case "setUserSettings":
            setUserSettings(msg.data);
            break;
        case "isStarted":
            sendResponse(appData.started);
            break;
        case "getUserData":
            sendResponse(userData);
            break;
        case "getNextStream":
            let now = Date.now();
            appData.recentlyEndedStreamNames[msg.data] = now;
            updateLiveFollowedStreams().then(() => {
                for (let i in userData.settings.priorityList) {
                    let p = userData.settings.priorityList[i];
                    if (userData.follows[p].live) {
                        if(streamRecentlyEnded(userData.follows[p].name, now)) {
                            continue;
                        }
                        appData.currentStream = userData.follows[p];
                        appData.started = true;
                        console.log("new stream:", appData.currentStream);
                        sendResponse(appData.currentStream);
                        return;
                    }
                }
                sendResponse(null);
            });
            break;
        case "streamOffline":
            updateLiveFollowedStreams().then(() => {
                for (let i in userData.follows) {
                    if (userData.follows[i].name === msg.data) {
                        userData.follows[i].live = false;
                    }
                }
                sendResponse(true);
            });
            break;
    }
    return true;
});

function streamRecentlyEnded(streamName, now) {
    for(let stream in appData.recentlyEndedStreamNames) {
        if(stream === streamName) {
            if(appData.recentlyEndedStreamNames[stream] + RECENTLY_OFFLINE_TIME_LIMIT < now) {
                delete appData.recentlyEndedStreamNames[stream];
            } else {
                return true;
            }
        }
    }
    return false;
}

function onUserDataReceived(user, updateLive) {
    return new Promise((resolve, reject) => {
        userData.id = user.id;
        userData.login = user.login;
        getFollows()
            .then(() => loadUserSettings()
                .then(() => updateLive ? updateLiveFollowedStreams().then(() => resolve(true)) : resolve(true))
            );
    });
}

function updateLiveFollowedStreams() {
    let implodedStreams = '';

    for (let id in userData.follows) {
        implodedStreams += userData.follows[id].name + ',';
    }
    implodedStreams.slice(0, -1);

    return new Promise((resolve, reject) => $.ajax({
            url: 'https://api.twitch.tv/kraken/streams?channel=' + implodedStreams,
            method: 'GET',
            dataType: 'json',
            data: undefined,
            headers: {
                'Client-ID': 'szf668t77136wvmtyzfrzmv5p73bnfn',
                'Authorization': undefined
            },
            timeout: 30000,
            success: (data) => {
                addLiveFollowedStreams(data.streams);
                console.log("GOT STREAMS");
                resolve();
            },
            error: ({status, responseJSON}) => reject({
                status,
                data: responseJSON
            })
        })
    );
}

function setUserSettings(settings) {
    userData.settings = settings;
    chrome.storage.local.set({'userSettings': settings}, () => {});
}

function loadUserSettings() {

    return new Promise((resolve, reject) => {
        if(Object.keys(userData.settings.priorityList).length) {
            return;
        }
        chrome.storage.local.get('userSettings', (result) => {
            if (isEmptyObj(result)) {
                setDefaultSettings();
            } else {
                userData.settings = result.userSettings;
            }
            resolve();
        });
    });
}

function setDefaultSettings() {
    userData.settings.priorityList = [];
    for (let id in userData.follows) {
        userData.settings.priorityList.push(id);
    }
}

function closure($this, fn, ...aargs) {
    if (typeof fn != 'function') {
        throw new Error('Closure function is not fun');
    }
    return function (...bargs) {
        $this = $this || this;
        return fn.apply($this, aargs.concat(bargs));
    };
}

function isEmptyObj(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

function addLiveFollowedStreams(streams) {
    for (let id in userData.follows) {
        userData.follows[id].live = false;
    }
    for (let stream of streams) {
        userData.follows[stream.channel._id].live = true;
    }
    console.log("ADDED STREAMS");
}

function addFollows(follows) {
    for (let follow of follows) {
        userData.follows[follow.channel._id] = {
            id: follow.channel._id,
            displayName: follow.channel.display_name,
            name: follow.channel.name,
            url: follow.channel.url,
            logo: follow.channel.logo,
            live: false
        };
    }
    console.log(Object.keys(userData.follows).length);
}

function getFollows(offset = 0) {
    let followsAdded = userData.follows.length ? userData.follows.length : offset;
    return new Promise((resolve, reject) => $.ajax({
            url: 'https://api.twitch.tv/kraken/users/' + userData.login + '/follows/channels',
            method: 'GET',
            dataType: 'json',
            data: {
                direction: 'asc',
                sortby: 'created_at',
                limit: FOLLOW_REQ_QUERY_LIMIT,
                offset: offset
            },
            headers: {
                'Client-ID': 'szf668t77136wvmtyzfrzmv5p73bnfn',
                'Authorization': undefined
            },
            timeout: 30000,
            success: (data) => {
                addFollows(data.follows);
                followsAdded += data.follows.length;
                console.log(data);
                if (offset + followsAdded < data._total && FOLLOW_REQ_QUERY_LIMIT < data._total) {
                    getFollows(offset + followsAdded + 1).then(() => resolve());
                } else {
                    resolve();
                }
            },
            error: ({status, responseJSON}) => reject({
                status,
                data: responseJSON
            })
        })
    );
}

function start() {

}