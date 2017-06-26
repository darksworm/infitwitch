import * as $ from "jquery";
import {Message, MessageType, Messenger} from "./support/messaging";
import {addScript} from "./support/helpers";
import {Stream, TwitchUser} from "./support/twitchdata";

let currentStream: Stream = null;

document.addEventListener(MessageType.CATCH_USER_DATA.toString(), onDataResponse);

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
            console.log("sometingwong")
        }
    } else {
        Messenger.sendToBackground({
            type: MessageType.SET_TWITCH_USER_DATA,
            data: TwitchUser.fromAny(data)
        });
    }
}

function getTwitchUserData() {
    addScript({
        textContent: 'window.Twitch.user()' +
        '.then(user => document.dispatchEvent(new CustomEvent(\'' + MessageType.CATCH_USER_DATA.toString() + '\', {detail:user})))' +
        '.catch(err => document.dispatchEvent(new CustomEvent(\'' + MessageType.CATCH_USER_DATA.toString() + '\', {detail:err})));'
    }, true);
}

$(document).ready(() => {
        Messenger.sendToBackground({type: MessageType.IS_STARTED, data: "void"}, (isStarted: any) => {
            if (!isStarted) {
                return;
            }

            bindToIndicator();
            if (window.location.pathname == '/') {
                getTwitchUserData();
            }
        });
    }
);

function getNextStream() {
    Messenger.sendToBackground({type: MessageType.STREAM_ENDED, data: currentStream.id});
}

chrome.runtime.onMessage.addListener(function (msg: Message, sender, sendResponse) {
    switch (msg.type) {
        case MessageType.OPEN_STREAM:
            currentStream = msg.data;
            window.location.href = msg.data.url;
            break;
        case MessageType.EXTRACT_TWITCH_USER:
            getTwitchUserData();
            break;
    }
});

function getLiveIndicator(): Promise<HTMLElement> {
    return new Promise<HTMLElement>((resolve, reject) => {
        let i = $('.player-streamstatus__label');
        if (i.length) {
            resolve(i[0]);
        } else {
            let r = (resolve) => {
                let i = $('.player-streamstatus__label');
                i.length ? resolve(i[0]) : setTimeout(r.bind(null, resolve), 550);
            };
            setTimeout(r.bind(null, resolve), 550);
        }
    });
}

function bindToIndicator() {
    getLiveIndicator().then((indicator) => {
        let observer = new MutationObserver(function (mutations, observer) {
            let mut: any;
            for (mut of mutations) {
                if (mut.target.data) {
                    switch (mut.target.data.toLowerCase()) {
                        case "live" :
                            console.log("LIVE");
                            break;
                        case "offline":
                            console.log("offline");
                            getNextStream();
                            break;
                    }
                }
            }
        });

        observer.observe(indicator, {
            characterData: true,
            subtree: true
        });

        openTheaterMode();
    });
}

function openTheaterMode() {
    addScript({
        textContent: "App.__container__.lookup('service:persistentPlayer').playerComponent.player.theatre || window.Mousetrap.trigger('alt+t');"
    }, false);
}