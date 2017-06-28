import {MessageType, Messenger} from "./utils/messaging";
import * as $ from "jquery";
import {PrevNext} from "./data/localdata";
import {InfitwitchError} from "./utils/infitwitcherror";

$(document).ready(() => {
    let playBtn = $('.btn-play');
    let prevBtn = $('.btn-prev');
    let nextBtn = $('.btn-next');
    let settingsBtn = $('.btn-settings');
    let errorCont = $('#error-cont');
    let prevNext: PrevNext = {prev: false, next: false};

    onPrevNextReceived(prevNext);
    updatePrevNext();

    Messenger.sendToBackground({type: MessageType.GET_ERRORS, data: "void"}, onErrors);

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

    function onErrors(data: InfitwitchError[]) {
        if (data && data.length) {
            for (let error of data) {
                newErrorElem(error);
            }
            errorCont.show();
        } else {
            errorCont.hide();
        }
    }

    function dismissError(error: InfitwitchError) {
        Messenger.sendToBackground({type: MessageType.DISMISS_ERROR, data: InfitwitchError.fromAny(error)}, (success) => {
            if (success) {
                $('.error[data-id="' + error.time +'"]').remove();
            }
        });
    }

    function newErrorElem(error: InfitwitchError) {
        let errorElem = document.createElement('div');
        let message = document.createElement('div');
        let desc = document.createElement('div');
        let time = document.createElement('div');
        let dismiss = document.createElement('div');

        $(message)
            .addClass('message')
            .text(error.message);
        $(desc)
            .addClass('desc')
            .text(error.details);

        $(time)
            .addClass('time')
            .text(new Date(error.time).toLocaleTimeString());

        $(dismiss)
            .addClass('dismiss')
            .text('✕')
            .click(() => dismissError(error));

        $(errorElem)
            .attr('data-id', error.time)
            .addClass('error')
            .append(message)
            .append(desc)
            .append(time)
            .append(dismiss)
            .appendTo(errorCont);
    }
});

