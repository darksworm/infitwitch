import * as $ from "jquery";
import {MessageType, Messenger} from "./support/messaging";
import {UserData, UserSettings} from "./support/userdata";

$(document).ready(() => {
    goTurbo();
});

let streamersCont;
let userData: UserData;

function goTurbo() {
    streamersCont = $('#streams');
    updateUserData().then(() => {
        populateStreams();
    });
}

function updateUserData() {
    return new Promise((resolve, reject) => {
        Messenger.send({type: MessageType.GET_USER_DATA, data: "void"}, (data) => {
            userData = data;
            resolve(data);
        });
    });
}

function populateStreams() {
    // clear container
    streamersCont.innerHTML = '';

    // populate stream list
    for (let priority in userData.settings.priorityList) {
        let streamID = userData.settings.priorityList[priority];
        if (userData.follows[streamID]) {
            createStreamElem(userData.follows[streamID], priority);
        }
    }

    streamersCont.sortable({
        onDrop: onSortUpdate,
        cursorAt: {top: 0, left: 0}
    });
}

function onSortUpdate(data) {
    let newOrder = {};
    let i = 0;

    Array.from(streamersCont.children()).map($).forEach((streamNode: JQuery) => {
        newOrder[i] = streamNode.data('id');
        streamNode.attr('data-position', i++);
        streamNode.children().eq(0).text(i);
    });

    // update priority list
    userData.settings.priorityList = <Map<number, number>>newOrder;
    saveSettings();
}

function saveSettings() {
    let settings: UserSettings = new UserSettings();
    settings.priorityList = userData.settings.priorityList;

    Messenger.send({type: MessageType.SET_USER_SETTINGS, data: settings});
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