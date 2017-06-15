$(document).ready(() => {
    goTurbo();
});

let streamersCont;
let userData;

function goTurbo() {
    streamersCont = $('#streams');
    updateUserData().then(() => populateStreams());
}

function updateUserData() {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({type: "getUserData", data: true}, (data) => {
            userData = data;
            resolve(data);
        });
    });
}

function populateStreams() {
    for(let priority in userData.settings.priorityList) {
        let sID = userData.settings.priorityList[priority];
        if(userData.follows[sID]) {
            createStreamElem(userData.follows[sID], priority);
        }
    }
    streamersCont.sortable().bind('sortupdate', function() {
        let newOrder = {};
        let i = 0;
        Array.from(streamersCont.children()).forEach((c) => {
            newOrder[i++] = ($(c).data('id'));
            $(c.firstChild).text(i);
        });
        userData.settings.priorityList = newOrder;
        chrome.runtime.sendMessage({type: "setUserSettings", data: userData.settings}, () => {console.log(1)});
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