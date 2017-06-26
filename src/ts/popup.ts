import {MessageType, Messenger} from "./support/messaging";
import * as $ from "jquery";

$(document).ready(() => {
    let playBtn = $('.btn-play');
    let prevBtn = $('.btn-prev');
    let nextBtn = $('.btn-next');
    let settingsBtn = $('.btn-settings');
    let prevNext = {prev: false, next: false};

    playBtn.click(() => {
        playBtn
            .toggleClass('btn-play').toggleClass('btn-pause');
        Messenger.sendToBackground({type: MessageType.PLAY_STOP, data: "void"}, () => {
        });
    });

    prevBtn.click(() => {
        if(prevNext.prev) {
            Messenger.sendToBackground({type: MessageType.PREVIOUS, data: "void"});
        }
    });

    nextBtn.click(() => {
        if(prevNext.next) {
            Messenger.sendToBackground({type: MessageType.NEXT, data: "void"});
        }
    });

    settingsBtn.click(() => {
        chrome.tabs.create({'url': chrome.extension.getURL('static/template/settings.html')}, () => {
        });
    });

    Messenger.sendToBackground({type: MessageType.IS_STARTED, data: "void"}, (started: boolean) => {
        if (started) {
            playBtn.removeClass("btn-play");
            playBtn.addClass("btn-pause");
        } else {
            playBtn.addClass("btn-play");
            playBtn.removeClass("btn-pause");
        }
    });

    Messenger.sendToBackground({type: MessageType.HAS_PREV_NEXT, data: "void"}, (data: any) => {
        prevNext = data;
        nextBtn.css("backgroundColor", data.next ? "whitesmoke" : "gray");
        prevBtn.css("backgroundColor", data.prev ? "whitesmoke" : "gray");
    });
});