document.addEventListener('userGet', (data) => chrome.runtime.sendMessage({type: "userData", data: data.detail}));
addScript({
    textContent: 'window.Twitch.user().then(user => document.dispatchEvent(new CustomEvent(\'userGet\', {detail:user})));'
}, true);

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
        window.location.href = stream.url;
    });
}

function getLiveIndicator() {
    return new Promise((resolve, reject) => {
        let i = $('.player-streamstatus__label');
        if (i.length) {
            resolve(i[0]);
        } else {
            let r = (resolve) => {
                let i = $('.player-streamstatus__label');
                i.length ? resolve(i[0]) : setTimeout(r.bind(null, resolve), 5000);
            };
            setTimeout(r.bind(null, resolve), 5000);
        }
    });
}

function bindToIndicator() {
    getLiveIndicator().then((indicator) => {
        console.log(indicator);
        MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

        let observer = new MutationObserver(function (mutations, observer) {
            console.log("MUT", mutations);
            for (let mut of mutations) {
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
    });
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