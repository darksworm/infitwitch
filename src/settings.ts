import * as $ from 'jquery';

$(document).ready(() => {
    goTurbo();
});

let streamersCont;
let userSettings;

function goTurbo() {
    streamersCont = $('#streams');
    updateUserData().then(() => populateStreams());
}

function updateUserData() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "getUserData", data: true}, (data) => {
            userSettings = data;
            resolve(data);
        });
    });
}

function populateStreams() {
    for(let priority in userSettings.settings.priorityList) {
        let sID = userSettings.settings.priorityList[priority];
        if(userSettings.follows[sID]) {
            createStreamElem(userSettings.follows[sID], priority);
        }
    }
    streamersCont.sortable().bind('sortupdate', function() {
        let newOrder = {};
        let i = 0;
        Array.from(streamersCont.children()).forEach((c:Node) => {
            newOrder[i++] = ($(c).data('id'));
            $(c.firstChild).text(i);
        });
        userSettings.settings.priorityList = newOrder;
        chrome.runtime.sendMessage({type: "setUserSettings", data: userSettings.settings}, () => {console.log(1)});
    });
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