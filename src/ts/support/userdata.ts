import {Stream} from "./twitchdata";

export class UserData {
    id: number = null;
    login: string = null;
    follows: Map<number, Stream> = new Map();
    settings: UserSettings = new UserSettings();
}

export class UserSettings {
    priorityList: Map<number, number> = new Map();
}