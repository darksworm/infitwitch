import * as $ from "jquery";
import {MessageType, Messenger} from "./utils/messaging";
import {UserData, UserSettings} from "./data/localdata";
import OnDragEventHandler = JQuerySortable.OnDragEventHandler;
import id = chrome.runtime.id;

$(document).ready(() => {
    goTurbo();
});

let streamersCont;
let userData: UserData;
let filterInput;

function goTurbo() {
    streamersCont = $('#streams');
    filterInput = $('#filter');
    filterInput.keyup(filterData);
    getUserData().then(() => {
        populateStreams();
    });
}

function filterData() {
    let str = filterInput.val();
    streamersCont.children().show();
    if (str.length) {
        streamersCont
            .children()
            .filter((idx, el) => {
                return $(el).children().eq(1).text().indexOf(str) == -1
            })
            .hide();
    }
}

function getUserData() {
    return new Promise((resolve, reject) => {
        Messenger.sendToBackground({type: MessageType.GET_USER_DATA, data: "void"}, (data) => {
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
        onDragStart: onDragStart,
        vertical: true,
        onDrag: onDrag
    });

}

function onDrag($item?: JQuery, position?: any, _super?: OnDragEventHandler, event?: Event) {
    $item.css({
        'position': 'absolute',
        'left': position.left - ($item.outerWidth() / 2),
        'top': position.top - ($item.outerHeight() / 2),
        'width': streamersCont.outerWidth(),
        'height': 'auto',
        'border': '2px solid #DC3522',
        'background-color': '#374140'
    });
}

function onDragStart(elem) {
    resetElem(elem);
    $(elem).css('z-index', '9999');
    filterInput.val('');
    filterData();
}

function resetElem(elem) {
    $(elem).css({
        'position': 'relative',
        'left': 'auto',
        'top': 'auto',
        'width': 'auto',
        'height': 'auto',
        'border': 'none',
        'z-index': '1'
    });
}

function onSortUpdate(data) {
    let newOrder = {};
    let i = 0;

    resetElem(data);

    Array.from(streamersCont.children()).map($).forEach((streamNode: JQuery) => {
        newOrder[i] = streamNode.data('id');
        // position will be array index and increment i to display it on numberCont
        streamNode.attr('data-position', i++);
        // first child = numberCont (span which contains priority)
        streamNode.children().eq(0).text(i);
        // remove margins
        streamNode.css('marginTop', '0');
    });

    // update priority list
    userData.settings.priorityList = <Map<number, number>>newOrder;
    saveSettings();
}

function saveSettings() {
    let settings: UserSettings = new UserSettings();
    settings.priorityList = userData.settings.priorityList;

    Messenger.sendToBackground({type: MessageType.SET_USER_SETTINGS, data: settings});
}

function createStreamElem(streamer, position) {
    let streamerCont = document.createElement('li');
    let numberCont = document.createElement('span');
    $(numberCont).text(+position + 1).addClass('position');

    let nameCont = document.createElement('span');
    $(nameCont).text(streamer.name).addClass('name');

    $(streamerCont)
        .addClass('streamer')
        .attr('data-position', position)
        .attr('data-id', streamer.id)
        .append(numberCont)
        .append(nameCont)
        .appendTo(streamersCont);
}