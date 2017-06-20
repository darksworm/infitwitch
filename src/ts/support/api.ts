import {UserData} from "./userdata";
import {Stream} from "./twitchdata";
import * as $ from "jquery";

const FOLLOW_REQ_QUERY_LIMIT = 100;
const CLIENT_ID = 'szf668t77136wvmtyzfrzmv5p73bnfn';

export function getFollows(userData: UserData, offset = 0): Promise<UserData> {
    let followsAdded = Object.keys(userData.follows).length ? Object.keys(userData.follows).length : offset;
    return new Promise((resolve, reject) => $.ajax({
            url: 'https://api.twitch.tv/kraken/users/' + userData.login + '/follows/channels',
            method: 'GET',
            dataType: 'json',
            data: {
                direction: 'asc',
                sortby: 'created_at',
                limit: FOLLOW_REQ_QUERY_LIMIT,
                offset: offset
            },
            headers: {
                'Client-ID': CLIENT_ID,
                'Authorization': undefined
            },
            timeout: 30000,
            success: (data) => {
                userData = addFollows(data.follows, userData);
                followsAdded += data.follows.length;
                if (offset + followsAdded < data._total && FOLLOW_REQ_QUERY_LIMIT < data._total) {
                    getFollows(userData, offset + followsAdded + 1).then(() => resolve(userData));
                } else {
                    resolve(userData);
                }
            },
            error: ({status, responseJSON}) => reject({
                status,
                data: responseJSON
            })
        })
    );
}

function addFollows(follows, userData): UserData {
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

export function getLiveFollowedStreams(userData: UserData) {
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
                'Client-ID': CLIENT_ID,
                'Authorization': undefined
            },
            timeout: 30000,
            success: (data) => {
                resolve(data.streams);
            },
            error: ({status, responseJSON}) => reject({
                status,
                data: responseJSON
            })
        })
    );
}