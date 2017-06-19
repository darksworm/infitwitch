import * as $ from 'jquery'
import {MessageType, Messenger} from "./messaging";

$(document).ready(() => {
    goTurbo();
});

let streamersCont;
let userSettings;

function goTurbo() {
    streamersCont = $('#streams');
    updateUserData().then(() => {
        populateStreams();
    });
}

function updateUserData() {
    return new Promise((resolve, reject) => {
        Messenger.send({type: MessageType.GET_USER_DATA, data: "void"}, (data) => {
            userSettings = data;
            resolve(data);
        });
    });
}

function populateStreams() {
    // clear container
    streamersCont.innerHTML = '';

    // populate stream list
    Array.from(userSettings.settings.priorityList).forEach((streamID: number, priority: number) => {
        if (userSettings.follows[streamID]) {
            createStreamElem(userSettings.follows[streamID], priority);
        }
    });

    streamersCont.sortable({
        onDrop: onSortUpdate,
        cursorAt: { top: 0, left: 0 }
    });
}

function onSortUpdate(data) {
    console.log(data);
    let newOrder = {};
    let i = 0;

    Array.from(streamersCont.children()).map($).forEach((streamNode: JQuery) => {
        newOrder[i] = streamNode.data('id');
        streamNode.attr('data-position', i++);
        streamNode.children().eq(0).text(i);
    });

    // update priority list
    userSettings.settings.priorityList = newOrder;
    Messenger.send({type: MessageType.SET_USER_SETTINGS, data: userSettings.settings});
}

function createStreamElem(streamer, position) {
    let streamerCont = document.createElement('li');
    let numberCont = document.createElement('span');
    $(numberCont).text(+position + 1);

    let nameCont = document.createElement('span');
    $(nameCont).text(streamer.name);

    $(streamerCont)
        .addClass('streamer')
        .attr('data-position', position)
        .attr('data-id', streamer.id)
        .append(numberCont)
        .append(nameCont)
        .appendTo(streamersCont);
}