import {MessageType, Messenger} from "./support/messaging";

$(document).ready(() => {
        Messenger.sendToBackground({type: MessageType.SHOULD_SHOW_LOGIN_MESSAGE, data: "void"}, (shouldShowMsg: any) => {
            alert("Please log in with your twitch account to use Infitwitch");
        });
    }
);