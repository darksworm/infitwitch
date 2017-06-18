import * as $ from 'jquery';

document.addEventListener('userGet', (data:any) => {
    chrome.runtime.sendMessage({type: "userData", data: data.detail});
    console.log(data);
});
console.log(1111);
addScript({
    textContent: 'window.Twitch.user().then(user => document.dispatchEvent(new CustomEvent(\'userGet\', {detail:user}))); console.log(2222);'
}, false);

$(document).ready(() => {
        let desa = $('<div style="background: red; width: 100px; position: absolute; top:0; left:0; z-index: 999; height: 100px;"></div>');
        desa.click(() => {
            getNextStream();
        });
        $(document.body).append(
            desa
        );

        chrome.runtime.sendMessage({type: "isStarted", data: true}, (stream) => {
            if (stream) {
                bindToIndicator();
            }
        });
    }
);

function getNextStream(lastStream = null) {
    chrome.runtime.sendMessage({type: "getNextStream", data: lastStream}, (stream) => {
        console.log(stream);
        window.location.href = stream.url;
    });
}

function getLiveIndicator(): Promise<Node>{
    return new Promise<Node>((resolve, reject) => {
        let i = $('.player-streamstatus__label');
        if (i.length) {
            resolve(i[0]);
        } else {
            let r = (resolve) => {
                let i = $('.player-streamstatus__label');
                i.length ? resolve(i[0]) : setTimeout(r.bind(null, resolve), 550);
            };
            setTimeout(r.bind(null, resolve), 550);
        }
    });
}

function bindToIndicator() {
    getLiveIndicator().then((indicator) => {
        let observer = new MutationObserver(function (mutations, observer) {
            let mut: any;
            for (mut of mutations) {
                if(mut.target.data) {
                    switch(mut.target.data.toLowerCase()) {
                        case "live" :
                            console.log("LIVE");
                            break;
                        case "offline":
                            console.log("offline");
                            sendStreamOffline(window.location.pathname.slice(1));
                            break;
                    }
                }
            }
        });

        observer.observe(indicator, {
            characterData: true,
            subtree: true
        });

        openTheaterMode();
    });
}

function openTheaterMode() {
     addScript({
        textContent: "App.__container__.lookup('service:persistentPlayer').playerComponent.player.theatre || window.Mousetrap.trigger('alt+t');"
     }, false);
}

function sendStreamOffline(streamName) {
    chrome.runtime.sendMessage({type: "streamOffline", data: streamName}, () => {
        console.log(1);
        getNextStream(streamName);
    })
}

function addScript(template, silent) {
    if (silent === undefined) {
        silent = false;
    }

    let s = document.createElement("script");
    if (template.src) {
        s.src = template.src;
    }

    if (template.textContent) {
        s.textContent = template.textContent;
    }

    document.documentElement.appendChild(s);

    if (silent) {
        document.documentElement.removeChild(s);
    }
}