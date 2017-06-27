import {Stream} from "./twitchdata";

export class UserData {
    id: number = undefined;
    login: string = undefined;
    follows: Map<number, Stream> = <Map<number, Stream>>{};
    settings: UserSettings = new UserSettings();
}

export class UserSettings {
    priorityList: Map<number, number> = <Map<number, number>>{};
}

export class AppData {
    public currentStream: Stream = undefined;
    public recentlyEndedStreams = {};
    public streamHistory: number[] = [];

    public flags: AppStateFlags = AppStateFlags.None;
}

export const enum AppStateFlags {
    None = 0,
    Running = 1 << 0,
    ShowLoginMessage = 1 << 1,
    WaitingForData = 1 << 2,
    FirstRun = 1 << 3
}

export class PrevNext {
    constructor(prev: boolean, next: boolean) {
        this.prev = prev;
        this.next = next;
    }

    prev: boolean;
    next: boolean;
}