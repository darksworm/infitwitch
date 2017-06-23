import {UserSettings} from "./userdata";
import {Stream, TwitchUser} from "./twitchdata";
export enum MessageType {
    CATCH_USER_DATA, SET_TWITCH_USER_DATA, SET_USER_SETTINGS, IS_STARTED, GET_USER_DATA, STREAM_ENDED,
    PLAY_PAUSE, PREVIOUS, NEXT, OPEN_STREAM
}

let messageTypeDataTypes: { [key: string]: string } = {};

messageTypeDataTypes[MessageType.CATCH_USER_DATA.toString()] = TwitchUser.name;
messageTypeDataTypes[MessageType.SET_TWITCH_USER_DATA.toString()] = TwitchUser.name;
messageTypeDataTypes[MessageType.SET_USER_SETTINGS.toString()] = UserSettings.name;
messageTypeDataTypes[MessageType.IS_STARTED.toString()] = Boolean.name;
messageTypeDataTypes[MessageType.GET_USER_DATA.toString()] = "void";
messageTypeDataTypes[MessageType.PLAY_PAUSE.toString()] = "void";
messageTypeDataTypes[MessageType.PREVIOUS.toString()] = "void";
messageTypeDataTypes[MessageType.NEXT.toString()] = "void";
messageTypeDataTypes[MessageType.STREAM_ENDED.toString()] = String.name;
messageTypeDataTypes[MessageType.OPEN_STREAM.toString()] = Stream.name;

export interface Message {
    type: MessageType;
    data: any;
}

export class Messenger {
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
        chrome.tabs.query({active: true, url:"https://www.twitch.tv/*"}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, message, responseCallback);
        });
    }
}