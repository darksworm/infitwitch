import {Stream, TwitchUser} from "./data/twitchdata";
import {AppData, AppStateFlags, PrevNext, UserData, UserSettings} from "./data/localdata";
import {Message, MessageType, Messenger} from "./utils/messaging";
import {createTab, isEmptyObj} from "./utils/helpers";
import {Api} from "./utils/api";
import {InfitwitchError} from "./utils/infitwitcherror";
import {Logger} from "./utils/logger";
import Tab = chrome.tabs.Tab;

let userData: UserData = new UserData();

const RECENTLY_OFFLINE_TIME_LIMIT = 300000;

let appData = new AppData();
let errors: InfitwitchError[] = [];

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
    Logger.logMessage('[BG][RECV]', msg);
    switch (msg.type) {
        case MessageType.GET_ERRORS:
            sendResponse(errors);
            break;

        case MessageType.DISMISS_ERROR:
            sendResponse(dismissError(msg.data));
            break;

        case MessageType.SET_TWITCH_USER_DATA:
            onUserDataReceived(<TwitchUser> msg.data).then(() => handleReceivedData());
            break;

        case MessageType.SET_USER_SETTINGS:
            setUserSettings(<UserSettings> msg.data);
            break;

        case MessageType.IS_STARTED:
            sendResponse(appData.flags & AppStateFlags.Running);
            break;

        case MessageType.GET_USER_DATA:
            getUserData().then((data) =>
                sendResponse(data)
            );
            break;

        case MessageType.NEXT:
        case MessageType.STREAM_ENDED:
            let lastStreamId = msg.data == "void" ? appData.currentStream.id : msg.data;
            appData.streamHistory.push(lastStreamId);
            appData.recentlyEndedStreams[lastStreamId] = Date.now();
            openNextStream();
            break;

        case MessageType.PLAY_STOP:
            // flip started bit, returns new bit value
            if (appData.flags ^= AppStateFlags.Running) {
                userData.id ? start() : loadUserSettings().then(() => start());
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

        case MessageType.SET_SHOW_LOGIN_MESSAGE:
            appData.flags |= AppStateFlags.ShowLoginMessage | AppStateFlags.WaitingForData;
            sendResponse(true);
            break;

        case MessageType.SHOULD_SHOW_LOGIN_MESSAGE:
            sendResponse(appData.flags & AppStateFlags.ShowLoginMessage);
            appData.flags &= ~AppStateFlags.ShowLoginMessage;
            break;

        case MessageType.HAS_PREV_NEXT:
            getHasNextStream()
                .then((next) => {
                        let started = !!(appData.flags & AppStateFlags.Running);
                        try {
                            sendResponse(new PrevNext(!!appData.streamHistory.length && started, next && started))
                        } catch (e) {
                            /**
                             * When changing active tab, the popup will get closed, so an exception will be thrown
                             * when we cannot send the response to it as it no longer exists.
                             * This however doesn't seem to catch the exception in firefox
                             */
                        }
                    }
                );
            break;

        case MessageType.CLEAR_DATA:
            chrome.storage.local.clear(() => {
                let error = chrome.runtime.lastError;
                if (error) {
                    console.error(error);
                    sendResponse(false);
                } else {
                    end();
                    userData = new UserData();
                    sendResponse(true);
                }
            });
            break;

        case MessageType.GET_APP_DATA:
            sendResponse(appData);
            break;

        case MessageType.LOG:
            Logger.logMessage(msg.data.protocol, msg.data.message);
            break;

        default:
            throw new Error("Unimplemented message handler for message type: " + msg.type.toString());
    }
    return true;
});

function onApiError(data: InfitwitchError) {
    errors.push(data);

    appData.flags &= ~AppStateFlags.Running;

    chrome.browserAction.setBadgeBackgroundColor({color: [220, 53, 34, 255]});
    chrome.browserAction.setBadgeText({text: errors.length.toString()});
}

function dismissError(error: InfitwitchError) {
    for (let i in errors) {
        if (errors[i].time == error.time) {
            delete errors[i];
            chrome.browserAction.setBadgeText({text: errors.length ? errors.length.toString() : ""});
            return true;
        }
    }
    return false;
}

function handleReceivedData() {
    if (appData.flags & AppStateFlags.WaitingForData) {
        chrome.tabs.create({'url': chrome.extension.getURL('static/template/settings.html?new')}, (tab: Tab) => {
            let f = ((tabId) => {
                if (tabId == tab.id) {
                    openNextStream();
                    chrome.tabs.onRemoved.removeListener(f);
                }
            });

            chrome.tabs.onRemoved.addListener(f);
            appData.flags &= ~AppStateFlags.WaitingForData;
        });
    }
}

function start() {
    if (!userData.id) {
        appData.flags |= AppStateFlags.WaitingForData;
    }
    if (Messenger.tabId == undefined) {
        if (userData.id) {
            // if we already have user data go straight to top priority stream
            getNextStream().then((stream: Stream) => {
                getTab(stream.url).then((tab: Tab) => {
                    Messenger.tabId = tab.id;
                    appData.currentStream = stream;
                    Messenger.sendToTab({type: MessageType.OPEN_STREAM, data: stream});
                })
            });
        } else {
            // if there is no user data, open "/" on twitch so getTwitchUserData executes
            getTab().then((tab: Tab) => {
                Messenger.tabId = tab.id;
                Messenger.sendToTab({type: MessageType.EXTRACT_TWITCH_USER, data: "void"});
            });
        }
    } else {
        if (userData.id) {
            openNextStream();
        } else {
            Messenger.sendToTab({type: MessageType.EXTRACT_TWITCH_USER, data: "void"});
        }
    }
}

function getTab(url: string = "https://www.twitch.tv"): Promise<Tab> {
    return createTab(!!(appData.flags & AppStateFlags.FirstRun), url)
}

function end() {
    Messenger.sendToTab({
        type: MessageType.PAUSE_STREAM,
        data: "void"
    });
    appData = new AppData();
}

function openNextStream() {
    getNextStream().then((stream: Stream) => {
        appData.currentStream = stream;
        Messenger.sendToTab({
            type: MessageType.OPEN_STREAM,
            data: stream
        });
        appData.flags &= ~AppStateFlags.FirstRun;
    });
}

function getNextStream(): Promise<Stream> {
    return new Promise((resolve, reject) => {
        Api.getLiveFollowedStreams(userData).then((data) => {
            addLiveFollowedStreams(data);
            for (let priority in userData.settings.priorityList) {
                let stream = userData.follows[userData.settings.priorityList[priority]];
                if (stream.live && !isStreamRecentlyEnded(stream.id)) {
                    resolve(Stream.fromAny(userData.follows[userData.settings.priorityList[priority]]));
                    return;
                }
            }
            reject();
        }).catch((error) => {
            onApiError(error);
            reject();
        });
    });
}

function getHasNextStream(): Promise<boolean> {
    return new Promise((resolve) => {
        getNextStream().then(() => {
            resolve(true);
        }).catch(e => resolve(false));
    });
}

function isStreamRecentlyEnded(id: number): boolean {
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
    return new Promise((resolve) => {
        if (userData.id) {
            resolve(userData);
        } else {
            loadUserSettings().then((userData) => {
                resolve(userData);
            });
        }
    });
}

function onUserDataReceived(user: TwitchUser) {
    return new Promise((resolve, reject) => {
        if (!user) {
            resolve(true);
            return;
        }
        userData.id = user.id;
        userData.login = user.login;

        Api.getFollows(userData).then((userData) => {
            loadUserSettings(userData).then(() =>
                resolve(true)
            )
        }).catch((error) => {
            userData = new UserData();
            onApiError(error);
            reject();
        });
    });
}

function setUserSettings(settings: UserSettings) {
    userData.settings = settings;
    chrome.storage.local.set({'userData': userData}, () => {
        console.log("SAVED USER SETTINGS:", userData);
    });
}

function loadUserSettings(data = undefined) {
    if (data) {
        userData = data;
    }
    return new Promise((resolve) => {
        if (Object.keys(userData.settings.priorityList).length) {
            return;
        }
        chrome.storage.local.get('userData', (result) => {
            if (isEmptyObj(result)) {
                console.log("SETTING DEFAULT SETTINGS");
                setDefaultSettings();
            } else {
                console.log("LOADED USER SETTINGS FROM LOCAL STORAGE:", result.userData);
                userData = result.userData;
            }
            resolve(userData);
        });
    });
}

function setDefaultSettings() {
    userData.settings.priorityList = <Map<number, number>>{};
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

/**
 * Add FirstRun flag after installed
 * When first starting, if a twitch tab exists, we force it to reload,
 * to inject the twitch.ts content script
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason == "install") {
        appData.flags |= AppStateFlags.FirstRun;
    }
});

// when running stop when used tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId == Messenger.tabId) {
        appData.flags &= ~AppStateFlags.Running;
        Messenger.tabId = undefined;
    }
});
