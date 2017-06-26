import {Stream} from "./twitchdata";

export class UserData {
    id: number = null;
    login: string = null;
    follows: Map<number, Stream> = new Map();
    settings: UserSettings = new UserSettings();
}

export class AppData {
    public currentStream: Stream = null;
    public started: boolean = false;
    public recentlyEndedStreams = {};
    public streamHistory: number[] = [];
    public shouldShowLoginMessage: boolean = false;
    public waitingForData: boolean = false;
    public firstRun: boolean = false;
}

export class UserSettings {
    priorityList: Map<number, number> = new Map();
}