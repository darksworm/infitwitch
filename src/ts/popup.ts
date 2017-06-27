import {MessageType, Messenger} from "./utils/messaging";
import * as $ from "jquery";
import {PrevNext} from "./data/localdata";

$(document).ready(() => {
    let playBtn = $('.btn-play');
    let prevBtn = $('.btn-prev');
    let nextBtn = $('.btn-next');
    let settingsBtn = $('.btn-settings');
    let prevNext: PrevNext = {prev: false, next: false};

    onPrevNextReceived(prevNext);
    updatePrevNext();

    playBtn.click(() => {
        playBtn.toggleClass('btn-play').toggleClass('btn-pause');
        Messenger.sendToBackground({type: MessageType.PLAY_STOP, data: "void"});
        updatePrevNext();
    });

    prevBtn.click(() => {
        if (prevNext.prev) {
            Messenger.sendToBackground({type: MessageType.PREVIOUS, data: "void"});
            updatePrevNext();
        }
    });

    nextBtn.click(() => {
        if (prevNext.next) {
            Messenger.sendToBackground({type: MessageType.NEXT, data: "void"});
            updatePrevNext();
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

    function updatePrevNext() {
        Messenger.sendToBackground({type: MessageType.HAS_PREV_NEXT, data: "void"}, onPrevNextReceived);
    }

    function onPrevNextReceived(data: PrevNext) {
        prevNext = data;
        nextBtn.css("backgroundColor", data.next ? "whitesmoke" : "gray");
        prevBtn.css("backgroundColor", data.prev ? "whitesmoke" : "gray");
    }
});

