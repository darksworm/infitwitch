import {MessageType, Messenger} from "./support/messaging";
import * as $ from "jquery";

$(document).ready(() => {
    let playBtn = $('.btn-play');
    let prevBtn = $('.btn-prev');
    let nextBtn = $('.btn-next');
    let settingsBtn = $('.btn-settings');

    playBtn.click(() => {
        Messenger.sendToBackground({type: MessageType.PLAY_PAUSE, data: "void"}, () => {
            $(playBtn)
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
});