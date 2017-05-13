document.addEventListener('userGet', (data) => chrome.runtime.sendMessage({type: "userData", data: data.detail}));
addScript({
    textContent: 'window.Twitch.user().then(user => document.dispatchEvent(new CustomEvent(\'userGet\', {detail:user})));'
}, true);

$(document).ready(() => {
        let desa = $('<div style="background: red; width: 100px; position: absolute; top:0; left:0; z-index: 999; height: 100px;"></div>');
        desa.click(() => {
            console.log(111);
            chrome.runtime.sendMessage({type: "getNextStream", data: true}, (stream) => {
                console.log(stream);
                window.location.href = stream.url;
            });
        });
        $(document.body).append(
            desa
        )
    }
);

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
