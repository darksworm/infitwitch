import {Stream, TwitchUser} from "./support/twitchdata";
import {UserData, UserSettings} from "./support/userdata";
import {Message, MessageType, Messenger} from "./support/messaging";
import {isEmptyObj} from "./support/helpers";
import {getFollows, getLiveFollowedStreams} from "./support/api";

let userData: UserData = new UserData();

const RECENTLY_OFFLINE_TIME_LIMIT = 300000;

let appData = {
    currentStream: null,
    started: false,
    recentlyEndedStreamNames: {}
};

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
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
        case MessageType.NEXT:
        case MessageType.STREAM_ENDED:
            appData.recentlyEndedStreamNames[msg.data] = Date.now();
            getNextStream().then((stream) => Messenger.sendToTab({type: MessageType.OPEN_STREAM, data:stream}));
            break;
        case MessageType.PLAY_PAUSE:
            appData.started = !appData.started;
            if(appData.started) {
                getNextStream().then((stream) => Messenger.sendToTab({
                    type: MessageType.OPEN_STREAM,
                    data: stream
                }));
            }
            break;
        case MessageType.PREVIOUS:
            // TODO
            break;
        default:
            throw new Error("Unimplemented message handler for message type: " + msg.type.toString());
    }
    return true;
});

function getNextStream(): Promise<Stream> {
    return new Promise((resolve, reject) => {
        getLiveFollowedStreams(userData).then((data) => {
            addLiveFollowedStreams(data);
            for (let priority in userData.settings.priorityList) {
                let stream: Stream = userData.follows[userData.settings.priorityList[priority]];
                if (stream.live) {
                    if (streamRecentlyEnded(stream.name)) {
                        continue;
                    }
                    appData.currentStream = stream;
                    appData.started = true;
                    resolve(appData.currentStream);
                    return;
                }
            }
            reject();
        });
    });
}

function streamRecentlyEnded(streamName) {
    let now = Date.now();
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
    userData.settings.priorityList = new Map();
    for (let id in userData.follows) {
        userData.settings.priorityList.set(Object.keys(userData.settings.priorityList).length, +id);
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