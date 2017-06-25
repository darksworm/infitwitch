import {UserSettings} from "./userdata";
import {Stream, TwitchUser} from "./twitchdata";
import Tab = chrome.tabs.Tab;

export enum MessageType {
    CATCH_USER_DATA, SET_TWITCH_USER_DATA, SET_USER_SETTINGS, IS_STARTED, GET_USER_DATA, STREAM_ENDED,
    PLAY_PAUSE, PREVIOUS, NEXT, OPEN_STREAM, EXTRACT_TWITCH_USER
}

let messageTypeDataTypes: { [key: string]: string } = {};

messageTypeDataTypes[MessageType.SET_TWITCH_USER_DATA.toString()] = TwitchUser.name;
messageTypeDataTypes[MessageType.SET_USER_SETTINGS.toString()] = UserSettings.name;
messageTypeDataTypes[MessageType.CATCH_USER_DATA.toString()] = TwitchUser.name;
messageTypeDataTypes[MessageType.EXTRACT_TWITCH_USER.toString()] = "void";
messageTypeDataTypes[MessageType.STREAM_ENDED.toString()] = String.name;
messageTypeDataTypes[MessageType.OPEN_STREAM.toString()] = Stream.name;
messageTypeDataTypes[MessageType.GET_USER_DATA.toString()] = "void";
messageTypeDataTypes[MessageType.PLAY_PAUSE.toString()] = "void";
messageTypeDataTypes[MessageType.IS_STARTED.toString()] = "void";
messageTypeDataTypes[MessageType.PREVIOUS.toString()] = "void";
messageTypeDataTypes[MessageType.NEXT.toString()] = "void";

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
            if (!(message.data.constructor.name == messageTypeDataTypes[message.type] || message.data == "void" && "void" == messageTypeDataTypes[message.type])) {
                throw new Error("Wrong data type, got: " + message.data.constructor.name + " expected: " + messageTypeDataTypes[message.type]);
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