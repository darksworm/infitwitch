import {UserData} from "../data/localdata";
import {Stream} from "../data/twitchdata";
import * as $ from "jquery";
import {InfitwitchError} from "./infitwitcherror";

export class Api {
    private static FOLLOW_REQ_QUERY_LIMIT = 100;
    private static clientId = 'szf668t77136wvmtyzfrzmv5p73bnfn';

    public static getFollows(userData: UserData, offset = 0): Promise<UserData> {
        let followsAdded = Object.keys(userData.follows).length ? Object.keys(userData.follows).length : offset;
        return new Promise((resolve, reject) => $.ajax({
                url: 'https://api.twitch.tv/kraken/users/' + userData.login + '/follows/channels',
                method: 'GET',
                dataType: 'json',
                data: {
                    direction: 'asc',
                    sortby: 'created_at',
                    limit: Api.FOLLOW_REQ_QUERY_LIMIT,
                    offset: offset
                },
                headers: {
                    'Client-ID': Api.clientId,
                    'Authorization': undefined
                },
                timeout: 30000,
                success: (data) => {
                    if (data.error) {
                        reject(new InfitwitchError("Error!", Api.getErrorMessage()));
                    } else {
                        userData = Api.addFollows(data.follows, userData);
                        followsAdded += data.follows.length;
                        if (offset + followsAdded < data._total && Api.FOLLOW_REQ_QUERY_LIMIT < data._total) {
                            Api.getFollows(userData, offset + followsAdded + 1).then(() => resolve(userData));
                        } else {
                            resolve(userData);
                        }
                    }
                },
                error: (jqXHR, exception) => {
                    reject(new InfitwitchError("Error!", Api.getErrorMessage(jqXHR,exception)))
                }
            })
        );
    }

    public static addFollows(follows, userData): UserData {
        let stream: Stream;
        for (let follow of follows) {
            stream = new Stream();
            stream.id = follow.channel._id;
            stream.displayName = follow.channel.display_name;
            stream.name = follow.channel.name;
            stream.url = follow.channel.url;
            stream.logo = follow.channel.logo;
            stream.live = false;

            userData.follows[follow.channel._id] = stream;
        }
        return userData;
    }

    public static getLiveFollowedStreams(userData: UserData) {
        let implodedStreams = '';

        for (let id in userData.follows) {
            implodedStreams += userData.follows[id].name + ',';
        }
        implodedStreams.slice(0, -1);
        return new Promise((resolve, reject) => $.ajax({
                url: 'https://api.twitch.tv/kraken/streams?channel=' + implodedStreams,
                method: 'GET',
                dataType: 'json',
                data: undefined,
                headers: {
                    'Client-ID': Api.clientId,
                    'Authorization': undefined
                },
                timeout: 30000,
                success: (data) => {
                    if (data.error) {
                        reject(new InfitwitchError("Error!", Api.getErrorMessage()));
                    } else {
                        resolve(data.streams);
                    }
                },
                error: (jqXHR, exception) => {
                    reject(new InfitwitchError("Error!", Api.getErrorMessage(jqXHR, exception)));
                }
            })
        );
    }

    private static getErrorMessage(jqXHR?, exception?): string {
        if(!jqXHR && !exception) {
            return "Couldn't retrieve data from Twitch API."
        }
        let msg = 'Couldn\'t retrieve data from Twitch API.';

        if (jqXHR.status === 0) {
            msg = 'Couldn\'t connect to twitch API. Please verify your network connection!';
        }

        return msg;
    }
}