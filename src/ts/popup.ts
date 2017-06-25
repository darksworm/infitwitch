import {MessageType, Messenger} from "./support/messaging";
import * as $ from "jquery";

$(document).ready(() => {
    let playBtn = $('.btn-play');
    let prevBtn = $('.btn-prev');
    let nextBtn = $('.btn-next');
    let settingsBtn = $('.btn-settings');

    playBtn.click(() => {
        Messenger.sendToBackground({type: MessageType.PLAY_PAUSE, data: "void"}, () => {
            playBtn
                .toggleClass('btn-play')
                .toggleClass('btn-pause');
        });
    });

    prevBtn.click(() => {
        Messenger.sendToBackground({type: MessageType.PREVIOUS, data: "void"});
    });

    nextBtn.click(() => {
        Messenger.sendToBackground({type: MessageType.NEXT, data: "void"});
    });

    settingsBtn.click(() => {
        chrome.tabs.create({'url': chrome.extension.getURL('static/template/settings.html')}, () => {
        });
    });

    Messenger.sendToBackground({type:MessageType.IS_STARTED, data: "void"}, (started: boolean) => {
       if(started) {
           playBtn.removeClass("btn-play");
           playBtn.addClass("btn-pause");
       } else {
           playBtn.addClass("btn-play");
           playBtn.removeClass("btn-pause");
       }
    });
});