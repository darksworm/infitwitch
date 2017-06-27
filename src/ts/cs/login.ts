import {MessageType, Messenger} from "../utils/messaging";

$(document).ready(() => {
        Messenger.sendToBackground({type: MessageType.SHOULD_SHOW_LOGIN_MESSAGE, data: "void"}, (shouldShowMsg: any) => {
            if(shouldShowMsg) {
                alert("Please log in with your twitch account to use Infitwitch");
            }
        });
    }
);