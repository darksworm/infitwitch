import {Message, MessageType} from "./messaging";
export class Logger {
    private static logColors = {BG: {SEND: '#3b5528', RECV: '#8bb8b3'}, TAB: {SEND: '#b1453b', RECV: '#e18c85'}};

    public static logMessage(protocol: string, message: Message) {
        if(message.type != MessageType.LOG) {
            let classifiers = protocol.split("][");
            let color = Logger.logColors[classifiers[0].substr(1)][classifiers[1].slice(0, -1)];
            console.log('%c' + protocol + " " + MessageType[message.type], 'color: white; background: ' + color + ';', message.data);
        }
    }
}