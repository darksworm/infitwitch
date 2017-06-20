import {UserSettings} from "./userdata";
import {TwitchUser} from "./twitchdata";
export enum MessageType {
    CATCH_USER_DATA, SET_TWITCH_USER_DATA, SET_USER_SETTINGS, IS_STARTED, GET_USER_DATA, GET_NEXT_STREAM
}

let messageTypeDataTypes: { [key: string]: string } = {};

messageTypeDataTypes[MessageType.CATCH_USER_DATA.toString()] = TwitchUser.name;
messageTypeDataTypes[MessageType.SET_TWITCH_USER_DATA.toString()] = TwitchUser.name;
messageTypeDataTypes[MessageType.SET_USER_SETTINGS.toString()] = UserSettings.name;
messageTypeDataTypes[MessageType.IS_STARTED.toString()] = Boolean.name;
messageTypeDataTypes[MessageType.GET_USER_DATA.toString()] = "void";
messageTypeDataTypes[MessageType.GET_NEXT_STREAM.toString()] = String.name;

export interface Message {
    type: MessageType;
    data: any;
}

export class Messenger {
    public static send(message: Message, responseCallback?: (response: any) => void): void {
        if (null == message || null == message.type || null == message.data) {
            throw new Error("Null message passed");
        } else {
            if (message.data.constructor.name == messageTypeDataTypes[message.type] || message.data == "void" && "void" == messageTypeDataTypes[message.type]) {
                chrome.runtime.sendMessage(message, responseCallback ? responseCallback : () => {
                });
            } else {
                throw new Error("Wrong data type, got: " + message.data.constructor.name + " expected: " + messageTypeDataTypes[message.type]);
            }
        }
    }
}