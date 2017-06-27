export class Stream {
    id: number;
    displayName: string;
    name: string;
    url: string;
    logo: string;
    live: Boolean;

    static fromAny(data: any): Stream {
        let i = new Stream();
        i.id = data.id;
        i.displayName = data.displayName;
        i.name = data.name;
        i.url = data.url;
        i.logo = data.logo;
        i.live = data.live;

        return i;
    }

    static fromName(name) {
        let i = new Stream();
        i.name = name;
        return i;
    }
}

export class TwitchUser {
    chat_oauth_token: string;
    csrf_token: string;
    id: number;
    login: string;
    logo: string;
    name: string;

    static fromAny(data: any): TwitchUser {
        let i: TwitchUser = new TwitchUser();
        i.id = data.id;
        i.login = data.login;
        i.logo = data.logo;
        i.name = data.name;
        i.chat_oauth_token = data.chat_oauth_token;
        i.csrf_token = data.csrf_token;

        return i;
    }
}