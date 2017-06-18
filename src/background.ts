import {Stream, TwitchUser} from "./twitchdata";
import {UserData, UserSettings} from "./userdata";
import {MessageType} from "./messaging";
import {isEmptyObj} from "./helpers";
import {getFollows, getLiveFollowedStreams} from "./api";

let userData: UserData = new UserData();

const RECENTLY_OFFLINE_TIME_LIMIT = 300000;

let appData = {
    currentStream: null,
    started: false,
    recentlyEndedStreamNames: {}
};

chrome.browserAction.onClicked.addListener(function () {
    chrome.tabs.create({'url': chrome.extension.getURL('static/settings.html')}, function (tab) {
    });
});

chrome.runtime.onMessage.addListener(function (msg: any, sender, sendResponse) {
    switch (msg.type) {
        case MessageType.SET_TWITCH_USER_DATA:
            onUserDataReceived(<TwitchUser> msg.data);
            break;
        case MessageType.SET_USER_SETTINGS:
            setUserSettings(<UserSettings> msg.data);
            break;
        case MessageType.IS_STARTED:
            sendResponse(appData.started);
            break;
        case MessageType.GET_USER_DATA:
            getUserData().then((data) => sendResponse(data));
            break;
        case MessageType.GET_NEXT_STREAM:
            getNextStream(msg.data).then((stream) => sendResponse(stream));
            break;
    }
    return true;
});

function getNextStream(lastStreamId: number): Promise<Stream> {
    return new Promise((resolve, reject) => {
        let now = Date.now();

        appData.recentlyEndedStreamNames[lastStreamId] = now;
        getLiveFollowedStreams(userData).then((data) => {
            addLiveFollowedStreams(data);
            for (let i in userData.settings.priorityList) {
                let p = userData.settings.priorityList[i];
                if (userData.follows[p].live) {
                    if (streamRecentlyEnded(userData.follows[p].name, now)) {
                        continue;
                    }
                    appData.currentStream = userData.follows[p];
                    appData.started = true;
                    resolve(appData.currentStream);
                    return;
                }
            }
            reject();
        });
    });
}

function streamRecentlyEnded(streamName, now) {
    for (let stream in appData.recentlyEndedStreamNames) {
        if (stream === streamName) {
            if (appData.recentlyEndedStreamNames[stream] + RECENTLY_OFFLINE_TIME_LIMIT < now) {
                delete appData.recentlyEndedStreamNames[stream];
            } else {
                return true;
            }
        }
    }
    return false;
}

function getUserData(): Promise<UserData> {
    return new Promise((resolve, reject) => {
        if (userData.id) {
            resolve(userData);
        } else {
            loadUserSettings().then(() => resolve(userData));
        }
    });
}

function onUserDataReceived(user: TwitchUser) {
    return new Promise((resolve, reject) => {
        userData.id = user.id;
        userData.login = user.login;
        getFollows(userData)
            .then((userData) => loadUserSettings(userData)
                .then(() => getLiveFollowedStreams(userData).then((data) => {
                    addLiveFollowedStreams(data);
                    resolve(true);
                }))
            );
    });
}

function setUserSettings(settings: UserSettings) {
    userData.settings = settings;
    chrome.storage.local.set({'userData': userData}, () => {
    });
}

function loadUserSettings(data = null) {
    if (data) {
        userData = data;
    }
    return new Promise((resolve, reject) => {
        if (Object.keys(userData.settings.priorityList).length) {
            return;
        }
        chrome.storage.local.get('userData', (result) => {
            if (isEmptyObj(result)) {
                setDefaultSettings();
            } else {
                userData = result.userData;
            }
            resolve();
        });
    });
}

function setDefaultSettings() {
    userData.settings.priorityList = [];
    for (let id in userData.follows) {
        userData.settings.priorityList[Object.keys(userData.settings.priorityList).length] = +id;
    }
}

function addLiveFollowedStreams(streams) {
    for (let id in userData.follows) {
        userData.follows[id].live = false;
    }
    for (let stream of streams) {
        userData.follows[stream.channel._id].live = true;
    }
}