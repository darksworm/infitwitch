import {Stream} from "./twitchdata";

export class UserData {
    id: number = null;
    login: string = null;
    follows: { [key: number]: Stream } = {};
    settings: UserSettings = new UserSettings();
}

export class UserSettings {
    priorityList: { [key: number]: number } = {};
}