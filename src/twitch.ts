import * as $ from 'jquery'
import {MessageType, Messenger} from "./messaging";
import {addScript} from "./helpers";
import {TwitchUser} from "./twitchdata";

document.addEventListener(MessageType.CATCH_USER_DATA.toString(), (data:any) => {
    Messenger.send({type: MessageType.SET_TWITCH_USER_DATA, data: TwitchUser.fromAny(data.detail)});
});

addScript({
    textContent: 'window.Twitch.user().then(user => document.dispatchEvent(new CustomEvent(\''+MessageType.CATCH_USER_DATA.toString()+'\', {detail:user})));'
}, false);

$(document).ready(() => {
        let desa = $('<div style="background: red; width: 100px; position: absolute; top:0; left:0; z-index: 999; height: 100px;"></div>');
        desa.click(() => {
            getNextStream();
        });
        $(document.body).append(
            desa
        );

        Messenger.send({type: MessageType.IS_STARTED, data: true}, (isStarted:any) => {
            if (isStarted) {
                bindToIndicator();
            }
        });
    }
);

function getNextStream(lastStream = '') {
    Messenger.send({type: MessageType.GET_NEXT_STREAM, data: lastStream}, (stream) => {
        window.location.href = stream.url;
    });
}

function getLiveIndicator(): Promise<Node>{
    return new Promise<Node>((resolve, reject) => {
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
                if(mut.target.data) {
                    switch(mut.target.data.toLowerCase()) {
                        case "live" :
                            console.log("LIVE");
                            break;
                        case "offline":
                            console.log("offline");
                            getNextStream(window.location.pathname.slice(1));
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