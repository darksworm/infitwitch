import {AppData, AppStateFlags, UserSettings} from "../data/localdata";
import {Stream, TwitchUser} from "../data/twitchdata";
import {InfitwitchError} from "./infitwitcherror";
import {createTab} from "./helpers";
import Tab = chrome.tabs.Tab;
import {Logger} from "./logger";

export enum MessageType {
    CATCH_USER_DATA, SET_TWITCH_USER_DATA, SET_USER_SETTINGS, IS_STARTED, GET_USER_DATA, STREAM_ENDED, CLEAR_DATA,
    PLAYER_CHANNEL_UPDATE, PLAY_STOP, PREVIOUS, NEXT, OPEN_STREAM, EXTRACT_TWITCH_USER, SET_SHOW_LOGIN_MESSAGE,
    SHOULD_SHOW_LOGIN_MESSAGE, HAS_PREV_NEXT, GET_ERRORS, DISMISS_ERROR, PAUSE_STREAM, GET_APP_DATA, LOG
}

const MESSAGE_PARAMETER_TYPES: Map<MessageType, string> = new Map<MessageType, string>([
    [MessageType.SET_TWITCH_USER_DATA, TwitchUser.name],
    [MessageType.SET_USER_SETTINGS, UserSettings.name],
    [MessageType.CATCH_USER_DATA, TwitchUser.name],
    [MessageType.EXTRACT_TWITCH_USER, "void"],
    [MessageType.STREAM_ENDED, String.name],
    [MessageType.OPEN_STREAM, Stream.name],
    [MessageType.GET_USER_DATA, "void"],
    [MessageType.PLAY_STOP, "void"],
    [MessageType.IS_STARTED, "void"],
    [MessageType.PREVIOUS, "void"],
    [MessageType.NEXT, "void"],
    [MessageType.SET_SHOW_LOGIN_MESSAGE, "void"],
    [MessageType.SHOULD_SHOW_LOGIN_MESSAGE, "void"],
    [MessageType.HAS_PREV_NEXT, "void"],
    [MessageType.CLEAR_DATA, "void"],
    [MessageType.GET_ERRORS, "void"],
    [MessageType.DISMISS_ERROR, InfitwitchError.name],
    [MessageType.PAUSE_STREAM, "void"],
    [MessageType.GET_APP_DATA, "void"],
    [MessageType.LOG, "Object"]
]);

export interface Message {
    type: MessageType;
    data: any;
}

export class Messenger {
    private static _tabId: number = undefined;

    static set tabId(value: number) {
        this._tabId = value;
    }

    static get tabId(): number {
        return this._tabId;
    }

    public static logMessageInBackground(protocol, message) {
        chrome.runtime.sendMessage({type: MessageType.LOG, data: {protocol: protocol, message: message}}, () => {});
    }

    public static sendToBackground(message: Message, responseCallback?: (response: any) => void): void {
        Messenger.logMessageInBackground('[BG][SEND]', message);
        Messenger.checkMessage(message);
        chrome.runtime.sendMessage(message, responseCallback ? responseCallback : () => {
        });
    }

    private static checkMessage(message: Message, protocol?: string) {
        if (undefined == message || undefined == message.type || undefined == message.data) {
            throw new Error("Null message passed");
        } else {
            if (!(message.data.constructor.name == MESSAGE_PARAMETER_TYPES.get(message.type) || message.data == "void" && "void" == MESSAGE_PARAMETER_TYPES.get(message.type))) {
                throw new Error("Wrong data type for " + MessageType[message.type] + ", got: " + message.data.constructor.name + " expected: " + MESSAGE_PARAMETER_TYPES.get(message.type));
            }
        }
        if(protocol) {
            Logger.logMessage(protocol, message);
        }
    }

    public static sendToTab(message: Message, responseCallback?: (response: any) => void): void {
        if (Messenger.tabId == undefined) {
            Messenger.conjureTabAndSend(message, responseCallback);
        } else {
            chrome.tabs.query({}, function (tabs: Tab[]) {
                // if tab exists, send message to it
                for (let tab of tabs) {
                    if (tab.id == Messenger.tabId) {
                        Messenger._sendToTab(message, responseCallback);
                        return;
                    }
                }

                // if tab does not exist try to create a new one
                Messenger.conjureTabAndSend(message, responseCallback);
            });
        }
    }

    private static conjureTabAndSend(message: Message, responseCallback?: (response: any) => void) {
        Messenger.sendToBackground({type: MessageType.GET_APP_DATA, data: "void"}, (data: AppData) => {
            let promise;
            let firstRun = !!(data.flags & AppStateFlags.FirstRun);
            if (data.currentStream !== undefined) {
                promise = createTab(firstRun, data.currentStream.url);
            } else {
                promise = createTab(firstRun, "https://www.twitch.tv");
            }
            promise.then((tab: Tab) => {
                Messenger.tabId = tab.id;
                Messenger._sendToTab(message, responseCallback);
            })
        });
    }

    private static _sendToTab(message: Message, responseCallback?: (response: any) => void) {
        Messenger.checkMessage(message, "[TAB][SEND]");
        chrome.tabs.sendMessage(Messenger.tabId, message, responseCallback);
    }
}