import {Stream, TwitchUser} from "./support/twitchdata";
import {UserData, UserSettings} from "./support/userdata";
import {Message, MessageType, Messenger} from "./support/messaging";
import {isEmptyObj} from "./support/helpers";
import {Api} from "./support/api";
import Tab = chrome.tabs.Tab;

class AppData {
    public currentStream: Stream = null;
    public started: boolean = false;
    public recentlyEndedStreams = {};
    public streamHistory: number[] = [];
}

let userData: UserData = new UserData();

const RECENTLY_OFFLINE_TIME_LIMIT = 300000;

let appData = new AppData();

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
    console.log("GOT:", MessageType[msg.type], msg.data);
    switch (msg.type) {
        case MessageType.SET_TWITCH_USER_DATA:
            onUserDataReceived(<TwitchUser> msg.data).then(() => {
                openNextStream();
            });
            break;
        case MessageType.SET_USER_SETTINGS:
            setUserSettings(<UserSettings> msg.data);
            break;
        case MessageType.IS_STARTED:
            sendResponse(appData.started);
            break;
        case MessageType.GET_USER_DATA:
            getUserData().then((data) => sendResponse($.extend({}, data)));
            break;
        case MessageType.NEXT:
        case MessageType.STREAM_ENDED:
            let lastStreamId = msg.data == "void" ? appData.currentStream.id : msg.data;
            appData.streamHistory.push(lastStreamId);
            appData.recentlyEndedStreams[lastStreamId] = Date.now();
            openNextStream();
            break;
        case MessageType.PLAY_PAUSE:
            appData.started = !appData.started;
            if (appData.started) {
                start();
            } else {
                end();
            }
            break;
        case MessageType.PREVIOUS:
            let streamId = appData.streamHistory.pop();
            let lastStream = userData.follows[streamId];
            delete appData.recentlyEndedStreams[streamId];
            Messenger.sendToTab({
                type: MessageType.OPEN_STREAM,
                data: Stream.fromAny(lastStream)
            });
            break;
        default:
            throw new Error("Unimplemented message handler for message type: " + msg.type.toString());
    }
    return true;
});

function start() {
    if(Messenger.tabId == null) {
        chrome.tabs.create({url: "https://www.twitch.tv/"}, (tab: Tab) => {
            Messenger.tabId = tab.id;
            if(userData.id) {
                openNextStream();
            }
        });
    } else {
        openNextStream();
    }
}

function end() {
    chrome.tabs.remove(Messenger.tabId);
    Messenger.tabId = null;
    appData = new AppData();
}

function openNextStream() {
    getNextStream().then((stream: Stream) => {
        appData.currentStream = stream;
        Messenger.sendToTab({
            type: MessageType.OPEN_STREAM,
            data: stream
        });
    });
}

function getNextStream(): Promise<Stream> {
    return new Promise((resolve, reject) => {
        Api.getLiveFollowedStreams(userData).then((data) => {
            addLiveFollowedStreams(data);
            for (let priority in userData.settings.priorityList) {
                let stream = userData.follows[userData.settings.priorityList[priority]];
                if (stream.live && !streamRecentlyEnded(stream.id)) {
                    resolve(Stream.fromAny(userData.follows[userData.settings.priorityList[priority]]));
                    return;
                }
            }
            reject();
        });
    });
}

function streamRecentlyEnded(id: number) {
    let now = Date.now();
    for (let stream in appData.recentlyEndedStreams) {
        if (+stream === id) {
            if (appData.recentlyEndedStreams[stream] + RECENTLY_OFFLINE_TIME_LIMIT < now) {
                delete appData.recentlyEndedStreams[stream];
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
            console.log(userData);
            resolve(userData);
        } else {
            loadUserSettings().then(() => {
                console.log(userData);
                resolve(userData);
            });
        }
    });
}

function onUserDataReceived(user: TwitchUser) {
    return new Promise((resolve, reject) => {
        userData.id = user.id;
        userData.login = user.login;
        Api.getFollows(userData)
            .then((userData) => loadUserSettings(userData)
                .then(() => Api.getLiveFollowedStreams(userData).then((data) => {
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
    let i = 0;
    for (let id in userData.follows) {
        userData.settings.priorityList[i++] = +id;
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