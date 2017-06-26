import {UserSettings} from "./userdata";
import {Stream, TwitchUser} from "./twitchdata";
import Tab = chrome.tabs.Tab;

export enum MessageType {
    CATCH_USER_DATA, SET_TWITCH_USER_DATA, SET_USER_SETTINGS, IS_STARTED, GET_USER_DATA, STREAM_ENDED,
    PLAY_STOP, PREVIOUS, NEXT, OPEN_STREAM, EXTRACT_TWITCH_USER, SET_SHOW_LOGIN_MESSAGE, SHOULD_SHOW_LOGIN_MESSAGE, HAS_PREV_NEXT
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
    [MessageType.HAS_PREV_NEXT, "void"]
]);

export interface Message {
    type: MessageType;
    data: any;
}

export class Messenger {
    private static _tabId: number = null;

    static set tabId(value: number) {
        this._tabId = value;
    }

    static get tabId(): number {
        return this._tabId;
    }

    public static sendToBackground(message: Message, responseCallback?: (response: any) => void): void {
        Messenger.checkMessage(message);
        chrome.runtime.sendMessage(message, responseCallback ? responseCallback : () => {
        });
    }

    private static checkMessage(message: Message) {
        if (null == message || null == message.type || null == message.data) {
            throw new Error("Null message passed");
        } else {
            if (!(message.data.constructor.name == MESSAGE_PARAMETER_TYPES.get(message.type) || message.data == "void" && "void" == MESSAGE_PARAMETER_TYPES.get(message.type))) {
                throw new Error("Wrong data type, got: " + message.data.constructor.name + " expected: " + MESSAGE_PARAMETER_TYPES.get(message.type));
            }
        }
    }

    public static sendToTab(message: Message, responseCallback?: (response: any) => void): void {
        Messenger.checkMessage(message);
        chrome.tabs.query({}, function (tabs: Tab[]) {
            let tabExists: boolean = false;
            for (let tab of tabs) {
                if (tab.id == Messenger.tabId) {
                    tabExists = true;
                    break;
                }
            }
            if (tabExists) {
                console.log("SEND:", MessageType[message.type], message.data);
                chrome.tabs.sendMessage(Messenger.tabId, message, responseCallback);
            }
        });
    }
}