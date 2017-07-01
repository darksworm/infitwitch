import * as $ from "jquery";
import {Message, MessageType, Messenger} from "../utils/messaging";
import {addScript} from "../utils/helpers";
import {Stream, TwitchUser} from "../data/twitchdata";

let currentStream: Stream = Stream.fromName(window.location.pathname.slice(1));
let running: boolean = false;

document.addEventListener(MessageType[MessageType.CATCH_USER_DATA].toString(), onDataResponse);
document.addEventListener(MessageType[MessageType.PLAYER_CHANNEL_UPDATE].toString(), onChannelData);

function onDataResponse(data: any) {
    data = data.detail;
    if (data.status) {
        if (data.status == 401) {
            Messenger.sendToBackground({
                type: MessageType.SET_SHOW_LOGIN_MESSAGE,
                data: "void"
            }, () => {
                window.location.href = "https://www.twitch.tv/login";
            });
        } else {
            console.log("Something went horribly wrong...")
        }
    } else {
        Messenger.sendToBackground({
            type: MessageType.SET_TWITCH_USER_DATA,
            data: TwitchUser.fromAny(data)
        });
    }
}

function onChannelData(data: CustomEvent) {
    if(running) {
        if (data.detail.id != currentStream.name || data.detail.live === false) {
            getNextStream();
        } else if (!data.detail.theatre && data.detail.playerReadyState != 0) {
            openTheaterMode();
        }
    }
}

function getTwitchUserData() {
    addScript({
        textContent: 'window.Twitch.user()' +
        '.then(user => document.dispatchEvent(new CustomEvent(\'' + MessageType[MessageType.CATCH_USER_DATA].toString() + '\', {detail:user})))' +
        '.catch(err => document.dispatchEvent(new CustomEvent(\'' + MessageType[MessageType.CATCH_USER_DATA].toString() + '\', {detail:err})));'
    }, true);
}

$(document).ready(() => {
        Messenger.sendToBackground({type: MessageType.IS_STARTED, data: "void"}, (isStarted: any) => {
            running = isStarted;
            if (!isStarted) {
                return;
            }

            if (window.location.pathname == '/') {
                getTwitchUserData();
            } else {
                getPlayer().then(() => openTheaterMode());
            }

            addScript({
                textContent: 'let infitwitchInj = (() => {' +
                'try{' +
                'let channel = window.App.__container__.lookup("service:persistentPlayer").get("playerComponent.channel");' +
                'let theatre = window.App.__container__.lookup("service:persistentPlayer").get("playerComponent.player").theatre;' +
                'let readyState = window.App.__container__.lookup("service:persistentPlayer").get("playerComponent.player").getReadyState();' +
                'document.dispatchEvent(new CustomEvent(\'' + MessageType[MessageType.PLAYER_CHANNEL_UPDATE].toString() + '\', ' +
                '{detail:{id:channel.id, live:channel.playerIsLive, theatre: theatre, playerReadyState: readyState}}));' +
                '}catch(e){}setTimeout(infitwitchInj, 5000)' +
                '});' +
                'infitwitchInj();'
            }, false);
        });
    }
);

function getPlayer(): Promise<HTMLElement> {
    return new Promise<HTMLElement>((resolve, reject) => {
        let i = $('#player');
        if (i.length) {
            resolve(i[0]);
        } else {
            let r = (resolve) => {
                let i = $('#player');
                i.length ? resolve(i[0]) : setTimeout(r.bind(undefined, resolve), 550);
            };
            setTimeout(r.bind(undefined, resolve), 550);
        }
    });
}

function getNextStream() {
    Messenger.sendToBackground({type: MessageType.STREAM_ENDED, data: "void"});
}

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
    Messenger.logMessageInBackground('[TAB][RECV]', msg);
    switch (msg.type) {
        case MessageType.OPEN_STREAM:
            currentStream = msg.data;
            addScript({textContent: 'window.App.__container__.lookup("router:main").transitionTo("/" + "' + msg.data.name + '" + "");'}, true);
            addScript({textContent: 'window.App.__container__.lookup("service:persistentPlayer").get("playerComponent.player").play()'}, true);
            getPlayer().then(() => openTheaterMode());
            break;
        case MessageType.EXTRACT_TWITCH_USER:
            getTwitchUserData();
            break;
        case MessageType.PAUSE_STREAM:
            addScript({textContent: 'window.App.__container__.lookup("service:persistentPlayer").get("playerComponent.player").pause()'}, true);
            break;
    }
});

function openTheaterMode() {
    addScript({
        textContent: "App.__container__.lookup('service:persistentPlayer').playerComponent.player.theatre || window.Mousetrap.trigger('alt+t');"
    }, false);
}